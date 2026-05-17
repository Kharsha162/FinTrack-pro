import express from "express";
import PDFDocument from "pdfkit";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/calculate", authenticate, async (req, res) => {
  // Mock tax calculation endpoint if needed for UI before PDF
  // Logic duplicated in report for now
  try {
      const { income, age, deductions } = req.body;
      const taxData = calculateTax(Number(income), Number(age), Number(deductions));
      res.json(taxData);
  } catch (error) {
      res.status(500).json({ error: "Calculation failed" });
  }
});

router.post("/report", authenticate, async (req, res) => {
  try {
    const { income, age, deductions } = req.body;
    const user = req.user;

    const taxData = calculateTax(Number(income), Number(age), Number(deductions));

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=tax-report-${new Date().getFullYear()}.pdf`);
    
    // Pipe to response
    doc.pipe(res);

    // --- PDF Content ---

    // Header
    doc.fontSize(20).text("FinTrack Pro", { align: "center" });
    doc.fontSize(12).text("Income Tax Report (India)", { align: "center" });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // User Details
    doc.fontSize(10).text(`Name: ${user.name || "User"}`, { align: "left" });
    doc.text(`Email: ${user.email}`, { align: "left" });
    doc.text(`Financial Year: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, { align: "left" });
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, { align: "left" });
    doc.moveDown();

    // Summary Table
    const summaryTop = doc.y;
    doc.fontSize(14).text("Income Summary", { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10);
    drawRow(doc, "Gross Annual Income", `Rs. ${taxData.grossIncome.toLocaleString("en-IN")}`);
    drawRow(doc, "Total Deductions", `Rs. ${taxData.totalDeductions.toLocaleString("en-IN")}`);
    drawRow(doc, "Taxable Income", `Rs. ${taxData.taxableIncome.toLocaleString("en-IN")}`, true);
    
    doc.moveDown();

    // Tax Breakdown
    doc.fontSize(14).text("Tax Calculation (New Regime)", { underline: true });
    doc.moveDown(0.5);
    
    // Table Header
    const tableTop = doc.y;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Slab Range", 50, tableTop);
    doc.text("Rate", 300, tableTop);
    doc.text("Amount", 450, tableTop);
    doc.font("Helvetica");
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Slabs
    taxData.slabs.forEach(slab => {
        const y = doc.y;
        doc.text(slab.range, 50, y);
        doc.text(slab.rate, 300, y);
        doc.text(`Rs. ${slab.amount.toLocaleString("en-IN")}`, 450, y);
        doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Final Tax
    doc.fontSize(12).font("Helvetica-Bold");
    drawRow(doc, "Total Tax Payable", `Rs. ${taxData.taxPayable.toLocaleString("en-IN")}`);
    drawRow(doc, "Effective Tax Rate", `${taxData.effectiveRate}%`);
    
    doc.moveDown(2);
    
    // Disclaimer
    doc.fontSize(8).font("Helvetica-Oblique").text(
        "Disclaimer: This report is an estimate based on the information provided. It is not an official tax document. Please consult a qualified tax professional for official filing.",
        { align: "center", color: "grey" }
    );

    doc.end();

  } catch (err) {
    console.error("PDF Gen Error:", err);
    // If headers already sent (pipe), stream error handled by express, but better to log
    if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF" });
    }
  }
});

function drawRow(doc, label, value, bold = false) {
    const y = doc.y;
    if (bold) doc.font("Helvetica-Bold");
    doc.text(label, 50, y);
    doc.text(value, 350, y, { align: "right", width: 150 }); // Align value to right
    if (bold) doc.font("Helvetica");
    doc.moveDown(0.5);
}

function calculateTax(income, age, deductions) {
    // Simplified New Regime Slabs (FY 2023-24+)
    // 0-3L: Nil
    // 3-6L: 5%
    // 6-9L: 10%
    // 9-12L: 15%
    // 12-15L: 20%
    // >15L: 30%
    
    const grossIncome = income;
    const totalDeductions = deductions; // Note: New regime has fewer deductions, but allowing input for flexibility
    let taxableIncome = Math.max(0, grossIncome - totalDeductions);
    
    let tax = 0;
    const slabs = [];
    
    let remaining = taxableIncome;
    
    // Slab 1: 0-3L
    if (remaining > 0) {
        const taxable = Math.min(remaining, 300000);
        slabs.push({ range: "0 - 3,00,000", rate: "Nil", amount: 0 });
        remaining -= taxable;
    }
    
    // Slab 2: 3L-6L
    if (remaining > 0) {
        const taxable = Math.min(remaining, 300000);
        const slabTax = taxable * 0.05;
        tax += slabTax;
        slabs.push({ range: "3,00,001 - 6,00,000", rate: "5%", amount: slabTax });
        remaining -= taxable;
    }
    
    // Slab 3: 6L-9L
    if (remaining > 0) {
        const taxable = Math.min(remaining, 300000);
        const slabTax = taxable * 0.10;
        tax += slabTax;
        slabs.push({ range: "6,00,001 - 9,00,000", rate: "10%", amount: slabTax });
        remaining -= taxable;
    }
    
    // Slab 4: 9L-12L
    if (remaining > 0) {
        const taxable = Math.min(remaining, 300000);
        const slabTax = taxable * 0.15;
        tax += slabTax;
        slabs.push({ range: "9,00,001 - 12,00,000", rate: "15%", amount: slabTax });
        remaining -= taxable;
    }

    // Slab 5: 12L-15L
    if (remaining > 0) {
        const taxable = Math.min(remaining, 300000);
        const slabTax = taxable * 0.20;
        tax += slabTax;
        slabs.push({ range: "12,00,001 - 15,00,000", rate: "20%", amount: slabTax });
        remaining -= taxable;
    }
    
    // Slab 6: >15L
    if (remaining > 0) {
        const slabTax = remaining * 0.30;
        tax += slabTax;
        slabs.push({ range: "> 15,00,000", rate: "30%", amount: slabTax });
    }
    
    // Rebate u/s 87A (New Regime limit 7L)
    if (taxableIncome <= 700000) {
        tax = 0; // Full rebate
    }
    
    // Cess (4%)
    const cess = tax * 0.04;
    const finalTax = tax + cess;
    
    return {
        grossIncome,
        totalDeductions,
        taxableIncome,
        slabs,
        taxPayable: Math.round(finalTax),
        effectiveRate: grossIncome > 0 ? ((finalTax / grossIncome) * 100).toFixed(2) : "0.00"
    };
}

export default router;
