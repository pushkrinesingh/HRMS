import mongoose from "mongoose";
import SalaryStructure from "../models/SalaryStructure.js";
import Payslip from "../models/Payslip.js";
import Employee from "../models/Employee.js";
import { generatePayslipPdf } from "../utils/generatePayslipPdf.js";

/**
 * Upsert salary structure for an employee (Admin only).
 * Body: { employeeId, basic, hra, allowances, pfPercent, taxPercent }
 */
export const upsertSalaryStructure = async (req, res) => {
  const { employeeId, basic, hra, allowances, pfPercent, taxPercent } = req.body;

  if (!employeeId || basic === undefined || basic === null || hra === undefined || hra === null) {
    return res.status(400).json({
      success: false,
      message: "employeeId, basic, and hra are required fields",
    });
  }

  const numBasic = Number(basic);
  const numHra = Number(hra);
  const numAllowances = allowances !== undefined && allowances !== null ? Number(allowances) : 0;
  const numPfPercent = pfPercent !== undefined && pfPercent !== null ? Number(pfPercent) : 12;
  const numTaxPercent = taxPercent !== undefined && taxPercent !== null ? Number(taxPercent) : 10;

  if (isNaN(numBasic) || numBasic < 0) {
    return res.status(400).json({
      success: false,
      message: "Basic salary must be a non-negative number",
    });
  }

  if (isNaN(numHra) || numHra < 0) {
    return res.status(400).json({
      success: false,
      message: "HRA must be a non-negative number",
    });
  }

  if (isNaN(numAllowances) || numAllowances < 0) {
    return res.status(400).json({
      success: false,
      message: "Allowances must be a non-negative number",
    });
  }

  if (isNaN(numPfPercent) || numPfPercent < 0 || numPfPercent > 100) {
    return res.status(400).json({
      success: false,
      message: "PF percentage must be between 0 and 100",
    });
  }

  if (isNaN(numTaxPercent) || numTaxPercent < 0 || numTaxPercent > 100) {
    return res.status(400).json({
      success: false,
      message: "Tax percentage must be between 0 and 100",
    });
  }

  const session = await mongoose.startSession();

  try {
    let resultStructure = null;
    let isCreated = false;

    await session.withTransaction(async () => {
      const employee = await Employee.findOne({ _id: employeeId, isActive: true })
        .session(session)
        .select("-__v");

      if (!employee) {
        const error = new Error("Active employee record not found");
        error.status = 404;
        throw error;
      }

      let existingStructure = await SalaryStructure.findOne({ employee: employeeId }).session(session);

      if (existingStructure) {
        existingStructure.basic = numBasic;
        existingStructure.hra = numHra;
        existingStructure.allowances = numAllowances;
        existingStructure.pfPercent = numPfPercent;
        existingStructure.taxPercent = numTaxPercent;
        existingStructure.updatedBy = req.user?.id || null;

        await existingStructure.save({ session });
        resultStructure = existingStructure;
      } else {
        const [newStructure] = await SalaryStructure.create(
          [
            {
              employee: employeeId,
              basic: numBasic,
              hra: numHra,
              allowances: numAllowances,
              pfPercent: numPfPercent,
              taxPercent: numTaxPercent,
              createdBy: req.user?.id || null,
            },
          ],
          { session }
        );
        resultStructure = newStructure;
        isCreated = true;
      }

      // Synchronize basic and hra on Employee model for consistency
      await Employee.findByIdAndUpdate(
        employeeId,
        {
          salary: {
            basic: numBasic,
            hra: numHra,
          },
          updatedBy: req.user?.id || null,
        },
        { session }
      );
    });

    const populatedStructure = await SalaryStructure.findById(resultStructure._id)
      .select("-__v")
      .populate({
        path: "employee",
        select: "user department designation manager",
        populate: { path: "user", select: "name email role" },
      });

    return res.status(isCreated ? 201 : 200).json({
      success: true,
      message: isCreated
        ? "Salary structure created successfully"
        : "Salary structure updated successfully",
      data: populatedStructure,
    });
  } catch (error) {
    const statusCode =
      error.name === "ValidationError" || error.name === "CastError"
        ? 400
        : error.status || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  } finally {
    await session.endSession();
  }
};

/**
 * Get salary structure (Consolidated query-param reader).
 * - No params -> Logged-in user's own salary structure
 * - ?employeeId=<id> -> Admin only, view any employee's salary structure
 */
export const getSalaryStructure = async (req, res) => {
  const { employeeId } = req.query;

  try {
    let targetEmployeeId;

    if (employeeId) {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Admin access required to view other employees' salary structures",
        });
      }
      targetEmployeeId = employeeId;
    } else {
      if (!req.employee) {
        return res.status(200).json({
          success: true,
          data: null,
        });
      }
      targetEmployeeId = req.employee._id;
    }

    const structure = await SalaryStructure.findOne({ employee: targetEmployeeId })
      .select("-__v")
      .populate({
        path: "employee",
        select: "user department designation manager",
        populate: { path: "user", select: "name email role" },
      });

    if (!structure) {
      if (employeeId) {
        return res.status(404).json({
          success: false,
          message: "Salary structure not found for this employee",
        });
      }
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      data: structure,
    });
  } catch (error) {
    const statusCode =
      error.name === "ValidationError" || error.name === "CastError"
        ? 400
        : error.status || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * Core payslip generation logic for a month/year.
 * Shared by both the monthly cron job and the manual admin trigger.
 * Note: Tax calculation is a simplified flat-rate model (taxPercent of grossPay), not real tax-slab logic.
 *
 * @param {Object} options
 * @param {number} [options.month] Month (1-12), defaults to current month
 * @param {number} [options.year] Year (e.g. 2026), defaults to current year
 * @returns {Promise<{month: number, year: number, totalEligible: number, generated: number, skipped: number}>}
 */
export const generatePayslips = async ({ month, year } = {}) => {
  const now = new Date();
  const targetMonth = month !== undefined && month !== null ? Number(month) : now.getMonth() + 1;
  const targetYear = year !== undefined && year !== null ? Number(year) : now.getFullYear();

  if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
    const error = new Error("Invalid month: must be between 1 and 12");
    error.status = 400;
    throw error;
  }

  if (isNaN(targetYear) || targetYear < 2000) {
    const error = new Error("Invalid year: must be a valid 4-digit year");
    error.status = 400;
    throw error;
  }

  // Iterate over all active Employees who have a SalaryStructure
  const activeEmployees = await Employee.find({ isActive: true }).select("_id");
  const activeEmpIds = activeEmployees.map((e) => e._id);

  const salaryStructures = await SalaryStructure.find({
    employee: { $in: activeEmpIds },
  }).select("-__v");

  // Check already generated payslips for this period to skip duplicates
  const existingPayslips = await Payslip.find({
    month: targetMonth,
    year: targetYear,
    employee: { $in: activeEmpIds },
  }).select("employee");

  const existingEmpIdSet = new Set(existingPayslips.map((p) => p.employee.toString()));

  let generatedCount = 0;
  let skippedCount = 0;

  for (const structure of salaryStructures) {
    const empIdStr = structure.employee.toString();

    if (existingEmpIdSet.has(empIdStr)) {
      skippedCount++;
      continue;
    }

    const basic = structure.basic;
    const hra = structure.hra;
    const allowances = structure.allowances || 0;
    const pfPercent = structure.pfPercent ?? 12;
    const taxPercent = structure.taxPercent ?? 10;

    // Snapshot calculations (2 decimal precision)
    const grossPay = Number((basic + hra + allowances).toFixed(2));
    const pfDeduction = Number(((basic * pfPercent) / 100).toFixed(2));
    const taxDeduction = Number(((grossPay * taxPercent) / 100).toFixed(2));
    const totalDeductions = Number((pfDeduction + taxDeduction).toFixed(2));
    const netPay = Number((grossPay - totalDeductions).toFixed(2));

    try {
      await Payslip.create({
        employee: structure.employee,
        month: targetMonth,
        year: targetYear,
        basic,
        hra,
        allowances,
        grossPay,
        pfDeduction,
        taxDeduction,
        totalDeductions,
        netPay,
      });

      existingEmpIdSet.add(empIdStr);
      generatedCount++;
    } catch (createErr) {
      if (createErr.code === 11000) {
        skippedCount++;
      } else {
        console.error(
          `[Payroll] Failed to generate payslip for employee ${structure.employee}:`,
          createErr.message
        );
        skippedCount++;
      }
    }
  }

  const summary = {
    month: targetMonth,
    year: targetYear,
    totalEligible: salaryStructures.length,
    generated: generatedCount,
    skipped: skippedCount,
  };

  console.log(
    `[Payroll] Payslip generation for ${targetMonth}/${targetYear} completed: ${generatedCount} generated, ${skippedCount} skipped (Total eligible: ${salaryStructures.length})`
  );

  return summary;
};

/**
 * Manual/testing trigger for payslip generation (Admin only).
 * POST /api/payroll/generate
 * Optional Body: { month, year } - defaults to current month/year if omitted.
 */
export const triggerPayslipGeneration = async (req, res) => {
  const { month, year } = req.body || {};

  try {
    const summary = await generatePayslips({ month, year });

    return res.status(200).json({
      success: true,
      message: "Payslip generation process completed",
      data: summary,
    });
  } catch (error) {
    const statusCode =
      error.name === "ValidationError" || error.name === "CastError"
        ? 400
        : error.status || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * Consolidated query-param reader for payslips.
 * GET /api/payroll/payslips
 * - No params -> Logged-in user's own payslip history (most recent first)
 * - ?id=<payslipId> -> Specific payslip by ID (Admin sees any; employee/manager sees only their own; 403 otherwise; no manager team access)
 * - ?id=<payslipId>&format=pdf -> Download payslip as A4 PDF document
 * - ?employeeId=<id> -> Admin only, view specific employee's full payslip history
 * - ?month=X&year=Y -> Optionally filter by period
 */
export const getPayslips = async (req, res) => {
  const { id, employeeId, month, year, format } = req.query;

  // Validate format query param: PDF export requires payslip id
  if (format === "pdf" && !id) {
    return res.status(400).json({
      success: false,
      message: "Payslip id is required for PDF download.",
    });
  }

  try {
    // Case 1: Specific payslip by ID
    if (id) {
      const payslip = await Payslip.findById(id)
        .select("-__v")
        .populate({
          path: "employee",
          select: "user department designation manager",
          populate: { path: "user", select: "name email role" },
        });

      if (!payslip) {
        return res.status(404).json({
          success: false,
          message: "Payslip not found",
        });
      }

      const isAdmin = req.user?.role === "admin";
      const payslipEmpId = payslip.employee?._id?.toString() || payslip.employee?.toString();

      if (!isAdmin) {
        if (!req.employee || req.employee._id.toString() !== payslipEmpId) {
          return res.status(403).json({
            success: false,
            message: "Not authorized to view this payslip",
          });
        }
      }

      if (format === "pdf") {
        return generatePayslipPdf(payslip, res);
      }

      return res.status(200).json({
        success: true,
        data: payslip,
      });
    }

    // Case 2: Query payslips history / list
    let targetEmployeeId;

    if (employeeId) {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Admin access required to view other employees' payslips",
        });
      }
      targetEmployeeId = employeeId;
    } else {
      if (!req.employee) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }
      targetEmployeeId = req.employee._id;
    }

    const queryFilter = { employee: targetEmployeeId };

    if (month !== undefined && month !== "") {
      const m = Number(month);
      if (isNaN(m) || m < 1 || m > 12) {
        return res.status(400).json({
          success: false,
          message: "Month must be between 1 and 12",
        });
      }
      queryFilter.month = m;
    }

    if (year !== undefined && year !== "") {
      const y = Number(year);
      if (isNaN(y) || y < 2000) {
        return res.status(400).json({
          success: false,
          message: "Year must be a valid 4-digit year",
        });
      }
      queryFilter.year = y;
    }

    const payslips = await Payslip.find(queryFilter)
      .select("-__v")
      .sort({ year: -1, month: -1, createdAt: -1 })
      .populate({
        path: "employee",
        select: "user department designation manager",
        populate: { path: "user", select: "name email role" },
      });

    return res.status(200).json({
      success: true,
      data: payslips,
    });
  } catch (error) {
    const statusCode =
      error.name === "ValidationError" || error.name === "CastError"
        ? 400
        : error.status || 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
