import cron from "node-cron";
import { generatePayslips } from "../controllers/payrollController.js";

/**
 * Initializes the automated monthly payroll cron job.
 * Runs at 02:00 AM on the 1st day of every month ('0 2 1 * *').
 * Generates payslips for the previous month (after the month has concluded).
 */
export const initPayrollCron = () => {
  cron.schedule("0 2 1 * *", async () => {
    console.log("[Payroll Cron] Starting scheduled monthly payslip generation...");
    try {
      const now = new Date();
      // Calculate previous month and year
      let prevMonth = now.getMonth(); // 0 is January -> previous month is 12 (Dec)
      let prevYear = now.getFullYear();

      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }

      console.log(`[Payroll Cron] Target generation period: ${prevMonth}/${prevYear}`);
      const summary = await generatePayslips({ month: prevMonth, year: prevYear });
      console.log("[Payroll Cron] Scheduled generation completed:", summary);
    } catch (error) {
      console.error("[Payroll Cron] Error during scheduled monthly payslip generation:", error);
    }
  });

  console.log("[Payroll Cron] Monthly payroll cron job registered (schedule: 0 2 1 * *)");
};
