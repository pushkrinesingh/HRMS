import PDFDocument from "pdfkit";

/**
 * Format currency using "Rs." prefix with thousands separators and 2 decimal places.
 * Helvetica in PDFKit does not support the rupee symbol (₹).
 * Example: 45000 -> "Rs. 45,000.00"
 */
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  const parts = num.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `Rs. ${parts.join(".")}`;
};

/**
 * Sanitizes an employee's name for safe usage in Content-Disposition filename.
 * Lowercases, replaces spaces with hyphens, and strips special characters.
 */
export const sanitizeFilenamePart = (name) => {
  if (!name || typeof name !== "string") return "employee";
  const sanitized = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return sanitized || "employee";
};

/**
 * Generates an A4 payslip PDF and streams it directly to the response.
 *
 * @param {Object} payslip - Populated payslip mongoose document
 * @param {import("express").Response} res - Express response object
 */
export const generatePayslipPdf = (payslip, res) => {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[(payslip.month || 1) - 1] || "Month";
  const mm = String(payslip.month || 1).padStart(2, "0");
  const yyyy = payslip.year || new Date().getFullYear();

  const employeeUser = payslip.employee?.user;
  const employeeName = employeeUser?.name || "Employee";
  const department = payslip.employee?.department || "N/A";
  const designation = payslip.employee?.designation || "N/A";
  const email = employeeUser?.email || "N/A";

  const sanitizedName = sanitizeFilenamePart(employeeName);
  const filename = `payslip-${sanitizedName}-${mm}-${yyyy}.pdf`;

  // Set response headers before streaming
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  // Create A4 PDF document (595.28 x 841.89 points) with 50pt margins
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    info: {
      Title: `Payslip - ${employeeName} - ${monthName} ${yyyy}`,
      Author: "HRMS",
    },
  });

  // Pipe to response stream
  doc.pipe(res);

  // Layout constants
  const leftX = 50;
  const rightX = 545;
  const printableWidth = rightX - leftX; // 495

  // 1. Header
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#111111")
    .text("HRMS", leftX, 50);

  doc
    .font("Helvetica")
    .fontSize(13)
    .fillColor("#444444")
    .text(`Payslip for ${monthName} ${yyyy}`, leftX, 78);

  // Header Divider
  doc
    .moveTo(leftX, 105)
    .lineTo(rightX, 105)
    .strokeColor("#cccccc")
    .lineWidth(1)
    .stroke();

  // 2. Employee Details Block
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#555555")
    .text("EMPLOYEE DETAILS", leftX, 120);

  const empCol1X = leftX;
  const empVal1X = leftX + 100;
  const empCol2X = leftX + 260;
  const empVal2X = leftX + 350;

  // Row 1
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333").text("Name:", empCol1X, 138);
  doc.font("Helvetica").fontSize(10).fillColor("#111111").text(employeeName, empVal1X, 138, { width: 150 });

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333").text("Designation:", empCol2X, 138);
  doc.font("Helvetica").fontSize(10).fillColor("#111111").text(designation, empVal2X, 138, { width: 140 });

  // Row 2
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333").text("Department:", empCol1X, 158);
  doc.font("Helvetica").fontSize(10).fillColor("#111111").text(department, empVal1X, 158, { width: 150 });

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#333333").text("Email:", empCol2X, 158);
  doc.font("Helvetica").fontSize(10).fillColor("#111111").text(email, empVal2X, 158, { width: 140 });

  // Employee Divider
  doc
    .moveTo(leftX, 185)
    .lineTo(rightX, 185)
    .strokeColor("#cccccc")
    .lineWidth(1)
    .stroke();

  // 3. Earnings & Deductions Tables (Side-by-Side)
  const earningsX = leftX;
  const earningsWidth = 235;
  const deductionsX = leftX + 260;
  const deductionsWidth = 235;

  // Table Headers
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#222222")
    .text("EARNINGS", earningsX, 202)
    .text("AMOUNT", earningsX + 115, 202, { width: 120, align: "right" });

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#222222")
    .text("DEDUCTIONS", deductionsX, 202)
    .text("AMOUNT", deductionsX + 115, 202, { width: 120, align: "right" });

  // Sub-header divider lines
  doc
    .moveTo(earningsX, 220)
    .lineTo(earningsX + earningsWidth, 220)
    .strokeColor("#d5d5d5")
    .lineWidth(1)
    .stroke();

  doc
    .moveTo(deductionsX, 220)
    .lineTo(deductionsX + deductionsWidth, 220)
    .strokeColor("#d5d5d5")
    .lineWidth(1)
    .stroke();

  // Row: Basic & PF
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#333333")
    .text("Basic", earningsX, 232)
    .text(formatCurrency(payslip.basic), earningsX + 115, 232, { width: 120, align: "right" });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#333333")
    .text("PF Deduction", deductionsX, 232)
    .text(formatCurrency(payslip.pfDeduction), deductionsX + 115, 232, { width: 120, align: "right" });

  // Row: HRA & Tax
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#333333")
    .text("HRA", earningsX, 252)
    .text(formatCurrency(payslip.hra), earningsX + 115, 252, { width: 120, align: "right" });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#333333")
    .text("Tax Deduction", deductionsX, 252)
    .text(formatCurrency(payslip.taxDeduction), deductionsX + 115, 252, { width: 120, align: "right" });

  // Row: Allowances & Empty right cell
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#333333")
    .text("Allowances", earningsX, 272)
    .text(formatCurrency(payslip.allowances), earningsX + 115, 272, { width: 120, align: "right" });

  // Divider above totals
  doc
    .moveTo(earningsX, 298)
    .lineTo(earningsX + earningsWidth, 298)
    .strokeColor("#d5d5d5")
    .lineWidth(1)
    .stroke();

  doc
    .moveTo(deductionsX, 298)
    .lineTo(deductionsX + deductionsWidth, 298)
    .strokeColor("#d5d5d5")
    .lineWidth(1)
    .stroke();

  // Totals Row: Gross Pay & Total Deductions
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#111111")
    .text("Gross Pay", earningsX, 308)
    .text(formatCurrency(payslip.grossPay), earningsX + 115, 308, { width: 120, align: "right" });

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#111111")
    .text("Total Deductions", deductionsX, 308)
    .text(formatCurrency(payslip.totalDeductions), deductionsX + 115, 308, { width: 120, align: "right" });

  // Divider below tables
  doc
    .moveTo(leftX, 335)
    .lineTo(rightX, 335)
    .strokeColor("#cccccc")
    .lineWidth(1)
    .stroke();

  // 4. Highlighted Net Pay Box
  const netPayBoxY = 355;
  const netPayBoxHeight = 44;

  doc
    .rect(leftX, netPayBoxY, printableWidth, netPayBoxHeight)
    .strokeColor("#b0b0b0")
    .lineWidth(1)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#111111")
    .text("Net Pay", leftX + 16, netPayBoxY + 15);

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#111111")
    .text(formatCurrency(payslip.netPay), leftX + 250, netPayBoxY + 14, {
      width: printableWidth - 266,
      align: "right",
    });

  // 5. Footer
  const genDateStr = payslip.generatedAt
    ? new Date(payslip.generatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  doc
    .moveTo(leftX, 750)
    .lineTo(rightX, 750)
    .strokeColor("#e0e0e0")
    .lineWidth(0.5)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#777777")
    .text(
      `Generated on ${genDateStr}. This is a system-generated payslip.`,
      leftX,
      762,
      { width: printableWidth, align: "center" }
    );

  // Finalize PDF
  doc.end();
};
