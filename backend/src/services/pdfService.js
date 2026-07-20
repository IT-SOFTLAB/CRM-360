const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

//====================================================
// THEME (mirrors QuotationPdf.tsx)
//====================================================

const COLORS = {
  indigo600: "#4f46e5",
  indigo700: "#4338ca",
  indigoBg: "#eef2ff",
  indigoBorder: "#e0e7ff",

  slate900: "#0f172a", // txt-primary
  slate500: "#64748b", // txt-secondary
  slate400: "#94a3b8",
  slate200: "#e2e8f0", // border-crm
  slate100: "#f1f5f9",
  slate50: "#f8fafc",

  rose600: "#e11d48",
  emerald700: "#047857",
  emerald50: "#ecfdf5",
  emeraldBorder: "#a7f3d0",

  amber700: "#b45309",
  amber50: "#fffbeb",
  amberBorder: "#fde68a",

  blue700: "#1d4ed8",
  blue50: "#eff6ff",
  blueBorder: "#bfdbfe",

  rose700: "#be123c",
  rose50: "#fff1f2",
  roseBorder: "#fecdd3",

  white: "#ffffff",
};

function getStatusColors(status) {
  switch (status) {
    case "Draft":
      return { bg: COLORS.amber50, text: COLORS.amber700, border: COLORS.amberBorder };
    case "Sent":
      return { bg: COLORS.blue50, text: COLORS.blue700, border: COLORS.blueBorder };
    case "Confirmed":
      return { bg: COLORS.emerald50, text: COLORS.emerald700, border: COLORS.emeraldBorder };
    default:
      return { bg: COLORS.rose50, text: COLORS.rose700, border: COLORS.roseBorder };
  }
}

// NOTE: PDFKit's built-in Helvetica fonts use an encoding that does not
// contain a glyph for the Indian Rupee sign (U+20B9). Rendering it directly
// produces the broken/garbled character seen in exports. "Rs. " renders
// correctly with the standard fonts and is used instead. $ and € are part
// of the standard WinAnsi set and render fine.
function getCurrencyPrefix(currency) {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "\u20AC";
    case "INR":
    default:
      return "Rs. ";
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function money(value, currency) {
  const n = Number(value || 0);
  return `${getCurrencyPrefix(currency)}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

//====================================================
// LAYOUT CONSTANTS
//====================================================

const PAGE_MARGIN = 32;
const PAGE_WIDTH = 595.28; // A4
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const GUTTER = 12;

const CARD_PAD_X = 14;
const CARD_PAD_TOP = 12;
const CARD_PAD_BOTTOM = 14;
const CARD_HEADER_BLOCK = 38; // icon box (20) + gap (8) + spacing after divider (10)
const CARD_CONTENT_OFFSET = CARD_PAD_TOP + CARD_HEADER_BLOCK; // y-offset from card top to first content row

//====================================================
// LOW-LEVEL DRAW HELPERS
//====================================================

/** Ensures there's enough room left on the page, otherwise adds a new page. */
function ensureSpace(doc, neededHeight) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + neededHeight > bottom) {
    doc.addPage();
  }
}

/** Draws a white rounded-corner card with a light border. */
function drawCardShell(doc, x, y, width, height) {
  doc.roundedRect(x, y, width, height, 10).fillColor(COLORS.white).fill();
  doc
    .roundedRect(x, y, width, height, 10)
    .lineWidth(1)
    .strokeColor(COLORS.slate200)
    .stroke();
}

/** Draws a small colored square "icon" placeholder + card title, with a divider line beneath. */
function drawCardHeader(doc, x, y, width, title) {
  const boxSize = 20;

  doc.roundedRect(x, y, boxSize, boxSize, 5).fillColor(COLORS.indigoBg).fill();
  doc
    .roundedRect(x, y, boxSize, boxSize, 5)
    .lineWidth(0.75)
    .strokeColor(COLORS.indigoBorder)
    .stroke();

  doc
    .fontSize(9)
    .fillColor(COLORS.indigo700)
    .font("Helvetica-Bold")
    .text(title.charAt(0).toUpperCase(), x, y + 5.5, { width: boxSize, align: "center" });

  doc
    .fontSize(11)
    .fillColor(COLORS.slate900)
    .font("Helvetica-Bold")
    .text(title, x + boxSize + 8, y + 4, { width: width - boxSize - 8 });

  const dividerY = y + boxSize + 8;
  doc
    .moveTo(x, dividerY)
    .lineTo(x + width, dividerY)
    .lineWidth(0.75)
    .strokeColor(COLORS.slate100)
    .stroke();

  return dividerY + 10; // y position where content should start
}

const LABEL_WIDTH_RATIO = 0.4;
const ROW_VPAD = 6; // vertical padding below each row's tallest line

/**
 * A row is "stacked" (label on its own line, value on a full-width line below)
 * when the value is too wide to sit beside the label on one line — this is
 * what long emails, long addresses-in-a-line, etc. need to avoid wrapping
 * mid-word into the row underneath. Short values keep the compact
 * label-left/value-right layout.
 */
function shouldStackRow(doc, width, value, opts = {}) {
  const { bold = true } = opts;
  const labelWidth = width * LABEL_WIDTH_RATIO;
  const valueWidth = width - labelWidth - 6;
  doc.fontSize(9).font(bold ? "Helvetica-Bold" : "Helvetica");
  const singleLineWidth = doc.widthOfString(String(value));
  return singleLineWidth > valueWidth;
}

/** Computes the height a key/value row will occupy, without drawing anything. */
function measureKeyValueRow(doc, width, label, value, opts = {}) {
  const { bold = true } = opts;
  const stacked = shouldStackRow(doc, width, value, opts);

  if (stacked) {
    doc.fontSize(7).font("Helvetica-Bold");
    const labelHeight = doc.heightOfString(String(label).toUpperCase(), { width });
    doc.fontSize(9).font(bold ? "Helvetica-Bold" : "Helvetica");
    const valueHeight = doc.heightOfString(String(value), { width, align: "left" });
    return labelHeight + 3 + valueHeight + ROW_VPAD;
  }

  const labelWidth = width * LABEL_WIDTH_RATIO;
  const valueWidth = width - labelWidth - 6;

  doc.fontSize(7).font("Helvetica-Bold");
  const labelHeight = doc.heightOfString(String(label).toUpperCase(), { width: labelWidth });

  doc.fontSize(9).font(bold ? "Helvetica-Bold" : "Helvetica");
  const valueHeight = doc.heightOfString(String(value), { width: valueWidth, align: "right" });

  return Math.max(labelHeight, valueHeight, 10) + ROW_VPAD;
}

/** Draws a label/value row. Auto-stacks onto two lines when the value is too long to fit beside the label. */
function drawKeyValueRow(doc, x, y, width, label, value, opts = {}) {
  const { valueColor = COLORS.slate900, bold = true } = opts;
  const stacked = shouldStackRow(doc, width, value, opts);
  const rowHeight = measureKeyValueRow(doc, width, label, value, opts);

  if (stacked) {
    doc
      .fontSize(7)
      .font("Helvetica-Bold")
      .fillColor(COLORS.slate400)
      .text(String(label).toUpperCase(), x, y, { width, characterSpacing: 0.3 });

    doc.fontSize(7).font("Helvetica-Bold");
    const labelHeight = doc.heightOfString(String(label).toUpperCase(), { width });

    doc
      .fontSize(9)
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fillColor(valueColor)
      .text(String(value), x, y + labelHeight + 3, { width, align: "left" });

    return y + rowHeight;
  }

  const labelWidth = width * LABEL_WIDTH_RATIO;
  const valueWidth = width - labelWidth - 6;

  doc
    .fontSize(7)
    .font("Helvetica-Bold")
    .fillColor(COLORS.slate400)
    .text(String(label).toUpperCase(), x, y, { width: labelWidth, characterSpacing: 0.3 });

  doc
    .fontSize(9)
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fillColor(valueColor)
    .text(String(value), x + labelWidth + 6, y, { width: valueWidth, align: "right" });

  return y + rowHeight;
}

function sumRowHeights(doc, width, rows) {
  return rows.reduce((total, r) => total + measureKeyValueRow(doc, width, r.label, r.value, r), 0);
}

function drawDivider(doc, x, y, width, dashed = false) {
  if (dashed) doc.dash(2, { space: 2 });
  doc
    .moveTo(x, y)
    .lineTo(x + width, y)
    .lineWidth(0.75)
    .strokeColor(COLORS.slate100)
    .stroke();
  if (dashed) doc.undash();
}

//====================================================
// MAIN GENERATOR
//====================================================

async function generateQuotationPDF(quotation) {
  return new Promise((resolve, reject) => {
    try {
      const uploadDir = path.join(__dirname, "../uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const pdfPath = path.join(uploadDir, `${quotation.quotationNumber}.pdf`);

      const doc = new PDFDocument({
        size: "A4",
        margin: PAGE_MARGIN,
        bufferPages: true,
      });

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      const currency = quotation.currency || "INR";
      const status = quotation.status || "Draft";
      const statusColors = getStatusColors(status);

      const leftX = PAGE_MARGIN;
      const colWidth = (CONTENT_WIDTH - GUTTER) / 2;
      const rightX = PAGE_MARGIN + colWidth + GUTTER;

      //------------------------------------------------
      // TOP HEADER (quotation number + meta only)
      //------------------------------------------------

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(COLORS.slate400)
        .text("QUOTATION", PAGE_MARGIN, PAGE_MARGIN, { characterSpacing: 0.5 });

      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor(COLORS.slate900)
        .text(quotation.quotationNumber, PAGE_MARGIN, PAGE_MARGIN + 14);

      // Meta row: dates + currency
      const metaY = PAGE_MARGIN + 42;
      doc
        .fontSize(8.5)
        .font("Helvetica")
        .fillColor(COLORS.slate500)
        .text(
          `Quotation Date: ${formatDate(quotation.quotationDate)}      Valid Till: ${formatDate(
            quotation.expirationDate
          )}      Currency: ${currency}`,
          PAGE_MARGIN,
          metaY
        );

      doc
        .moveTo(PAGE_MARGIN, metaY + 18)
        .lineTo(PAGE_WIDTH - PAGE_MARGIN, metaY + 18)
        .lineWidth(1)
        .strokeColor(COLORS.slate200)
        .stroke();

      doc.y = metaY + 30;

      //------------------------------------------------
      // ROW 1: CUSTOMER INFO (left) | ADDRESSES (right)
      //------------------------------------------------

      const customerRows = [
        { label: "Customer Name", value: quotation.customerNameSnapshot || "-" },
        { label: "Company Name", value: quotation.customerCompanyNameSnapshot || "-" },
        { label: "Email", value: quotation.customerEmailSnapshot || "-", color: COLORS.indigo600 },
        { label: "Phone", value: quotation.customerPhoneSnapshot || "-" },
      ];
      const customerContentWidth = colWidth - CARD_PAD_X * 2;
      const customerContentHeight = sumRowHeights(doc, customerContentWidth, customerRows);
      const customerCardHeight = CARD_CONTENT_OFFSET + customerContentHeight + CARD_PAD_BOTTOM;

      const addrColWidth = (colWidth - CARD_PAD_X * 2 - 10) / 2;
      doc.fontSize(8).font("Helvetica");
      const billingHeight = doc.heightOfString(quotation.billingAddressSnapshot || "-", { width: addrColWidth });
      const shippingHeight = doc.heightOfString(quotation.shippingAddressSnapshot || "-", { width: addrColWidth });
      const addressContentHeight = 12 + Math.max(billingHeight, shippingHeight);
      const addressCardHeight = CARD_CONTENT_OFFSET + addressContentHeight + CARD_PAD_BOTTOM;

      const row1Height = Math.max(customerCardHeight, addressCardHeight);
      ensureSpace(doc, row1Height + 10);
      const row1Top = doc.y;

      // -- Customer Info card --
      drawCardShell(doc, leftX, row1Top, colWidth, row1Height);
      let cy = drawCardHeader(doc, leftX + CARD_PAD_X, row1Top + CARD_PAD_TOP, customerContentWidth, "Customer Information");
      customerRows.forEach((r) => {
        cy = drawKeyValueRow(doc, leftX + CARD_PAD_X, cy, customerContentWidth, r.label, r.value, {
          valueColor: r.color,
        });
      });

      // -- Addresses card --
      drawCardShell(doc, rightX, row1Top, colWidth, row1Height);
      let ay = drawCardHeader(doc, rightX + CARD_PAD_X, row1Top + CARD_PAD_TOP, colWidth - CARD_PAD_X * 2, "Addresses");

      doc
        .fontSize(7)
        .font("Helvetica-Bold")
        .fillColor(COLORS.indigo600)
        .text("BILLING ADDRESS", rightX + CARD_PAD_X, ay, { width: addrColWidth, characterSpacing: 0.3 });
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(COLORS.slate900)
        .text(quotation.billingAddressSnapshot || "-", rightX + CARD_PAD_X, ay + 12, {
          width: addrColWidth,
          lineGap: 1.5,
        });

      doc
        .fontSize(7)
        .font("Helvetica-Bold")
        .fillColor(COLORS.indigo600)
        .text("SHIPPING ADDRESS", rightX + CARD_PAD_X + addrColWidth + 10, ay, {
          width: addrColWidth,
          characterSpacing: 0.3,
        });
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(COLORS.slate900)
        .text(quotation.shippingAddressSnapshot || "-", rightX + CARD_PAD_X + addrColWidth + 10, ay + 12, {
          width: addrColWidth,
          lineGap: 1.5,
        });

      doc.y = row1Top + row1Height + 12;

      //------------------------------------------------
      // ROW 2: QUOTATION DETAILS (left) | PRICING SUMMARY (right)
      //------------------------------------------------

      const detailsRows = [
        { label: "Quotation Number", value: quotation.quotationNumber },
        { label: "Quotation Date", value: formatDateTime(quotation.quotationDate) },
        { label: "Valid Till", value: formatDate(quotation.expirationDate) },
        { label: "Currency", value: currency },
      ];
      const detailsContentWidth = colWidth - CARD_PAD_X * 2;
      const detailsContentHeight =
        sumRowHeights(doc, detailsContentWidth, detailsRows) +
        8 + // divider spacing
        measureKeyValueRow(doc, detailsContentWidth, "Status", status);
      const detailsCardHeight = CARD_CONTENT_OFFSET + detailsContentHeight + CARD_PAD_BOTTOM;

      // Build pricing rows list (mirrors the conditional rendering in QuotationPdf.tsx)
      const pw = colWidth - CARD_PAD_X * 2;
      const discountAmt = ((quotation.subtotal || 0) * (quotation.discountPercent || 0)) / 100;
      const taxable = (quotation.subtotal || 0) - discountAmt;
      const roundOffVal = Number(quotation.roundOff || 0);

      const pricingRows = [{ label: "Subtotal", value: money(quotation.subtotal, currency) }];
      if (quotation.discountPercent > 0) {
        pricingRows.push({
          label: `Discount (${Number(quotation.discountPercent).toFixed(2)}%)`,
          value: `-${money(discountAmt, currency)}`,
          color: COLORS.rose600,
        });
      }
      pricingRows.push({ label: "Taxable Amount", value: money(taxable, currency) });
      if (quotation.cgst > 0) pricingRows.push({ label: "CGST (9%)", value: money(quotation.cgst, currency), bold: false });
      if (quotation.sgst > 0) pricingRows.push({ label: "SGST (9%)", value: money(quotation.sgst, currency), bold: false });
      if (quotation.igst > 0) pricingRows.push({ label: "IGST (18%)", value: money(quotation.igst, currency), bold: false });
      pricingRows.push({ label: "Tax Amount", value: money(quotation.tax, currency) });
      pricingRows.push({ label: "Shipping Charge", value: money(quotation.shippingCharge, currency) });
      pricingRows.push({ label: "Other Charges", value: money(quotation.otherCharges, currency) });
      pricingRows.push({
        label: "Round Off",
        value: `${roundOffVal > 0 ? "+" : ""}${getCurrencyPrefix(currency)}${roundOffVal.toFixed(2)}`,
        color: COLORS.slate500,
        bold: false,
      });

      const pricingRowsHeight = sumRowHeights(doc, pw, pricingRows);
      const grandTotalBlockHeight = 30; // block + spacing above it
      const pricingContentHeight = pricingRowsHeight + grandTotalBlockHeight;
      const pricingCardHeight = CARD_CONTENT_OFFSET + pricingContentHeight + CARD_PAD_BOTTOM;

      const row2Height = Math.max(detailsCardHeight, pricingCardHeight);
      ensureSpace(doc, row2Height + 10);
      const row2Top = doc.y;

      // -- Quotation Details card --
      drawCardShell(doc, leftX, row2Top, colWidth, row2Height);
      let dy = drawCardHeader(doc, leftX + CARD_PAD_X, row2Top + CARD_PAD_TOP, detailsContentWidth, "Quotation Details");
      detailsRows.forEach((r) => {
        dy = drawKeyValueRow(doc, leftX + CARD_PAD_X, dy, detailsContentWidth, r.label, r.value);
      });
      drawDivider(doc, leftX + CARD_PAD_X, dy, detailsContentWidth);
      dy = drawKeyValueRow(doc, leftX + CARD_PAD_X, dy + 8, detailsContentWidth, "Status", status, {
        valueColor: statusColors.text,
      });

      // -- Pricing Summary card --
      drawCardShell(doc, rightX, row2Top, colWidth, row2Height);
      let py = drawCardHeader(doc, rightX + CARD_PAD_X, row2Top + CARD_PAD_TOP, pw, "Pricing Summary");

      pricingRows.forEach((r, idx) => {
        py = drawKeyValueRow(doc, rightX + CARD_PAD_X, py, pw, r.label, r.value, {
          valueColor: r.color,
          bold: r.bold !== false,
        });
        // subtle divider after the discount row and after the tax block, mirroring the card design
        if (r.label.startsWith("Discount") || r.label === "Shipping Charge" || r.label === "Other Charges") {
          drawDivider(doc, rightX + CARD_PAD_X, py - 3, pw, true);
          py += 3;
        }
      });

      // Grand total highlighted block
      const gtY = py + 4;
      const gtHeight = 26;
      doc.roundedRect(rightX + CARD_PAD_X, gtY, pw, gtHeight, 6).fillColor(COLORS.indigoBg).fill();
      doc
        .fontSize(8)
        .font("Helvetica-Bold")
        .fillColor(COLORS.indigo700)
        .text("GRAND TOTAL", rightX + CARD_PAD_X + 10, gtY + 8, { characterSpacing: 0.3 });
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(COLORS.indigo700)
        .text(money(quotation.total || quotation.grandTotal, currency), rightX + CARD_PAD_X, gtY + 7, {
          width: pw - 10,
          align: "right",
        });

      doc.y = row2Top + row2Height + 12;

      //------------------------------------------------
      // PRODUCTS / SERVICES TABLE (full width)
      //------------------------------------------------

      const items = quotation.items || [];
      const rowHeight = 20;
      const tableHeaderHeight = 20;
      const tableCardHeight = CARD_CONTENT_OFFSET + tableHeaderHeight + Math.max(items.length, 1) * rowHeight + CARD_PAD_BOTTOM;

      ensureSpace(doc, Math.min(tableCardHeight, 260) + 10);
      const tableTop = doc.y;

      drawCardShell(doc, leftX, tableTop, CONTENT_WIDTH, tableCardHeight);
      let ty = drawCardHeader(doc, leftX + CARD_PAD_X, tableTop + CARD_PAD_TOP, CONTENT_WIDTH - CARD_PAD_X * 2, "Products / Services");

      const tableX = leftX + CARD_PAD_X;
      const tableWidth = CONTENT_WIDTH - CARD_PAD_X * 2;

      // Column layout (widths sum to tableWidth)
      const cols = [
        { key: "#", label: "#", width: tableWidth * 0.04, align: "center" },
        { key: "product", label: "Product / Service", width: tableWidth * 0.22, align: "left" },
        { key: "description", label: "Description", width: tableWidth * 0.22, align: "left" },
        { key: "qty", label: "Qty", width: tableWidth * 0.08, align: "center" },
        { key: "unitPrice", label: "Unit Price", width: tableWidth * 0.14, align: "center" },
        { key: "discount", label: "Disc %", width: tableWidth * 0.1, align: "center" },
        { key: "tax", label: "Tax %", width: tableWidth * 0.08, align: "center" },
        { key: "amount", label: "Amount", width: tableWidth * 0.12, align: "right" },
      ];

      // Header row background
      doc.rect(tableX, ty, tableWidth, tableHeaderHeight).fillColor(COLORS.slate50).fill();

      let colX = tableX;
      doc.fontSize(7).font("Helvetica-Bold").fillColor(COLORS.slate400);
      cols.forEach((col) => {
        doc.text(col.label.toUpperCase(), colX + 4, ty + 6, {
          width: col.width - 8,
          align: col.align,
          characterSpacing: 0.2,
        });
        colX += col.width;
      });

      let rowY = ty + tableHeaderHeight;

      if (items.length === 0) {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(COLORS.slate400)
          .text("No products configured", tableX, rowY + 8, { width: tableWidth, align: "center" });
        rowY += rowHeight;
      } else {
        items.forEach((item, idx) => {
          const discRate = Number(item.discount || 0);
          const amtVal = Number(item.quantity || 0) * Number(item.unitPrice || 0) * (1 - discRate / 100);

          if (idx % 2 === 1) {
            doc.rect(tableX, rowY, tableWidth, rowHeight).fillColor(COLORS.slate50).fill();
          }

          colX = tableX;
          const cellValues = [
            String(idx + 1),
            item.product || "-",
            item.description || "-",
            Number(item.quantity || 0).toFixed(2),
            money(item.unitPrice, currency),
            discRate > 0 ? `${discRate}%` : "0.00",
            `${item.tax || 0}%`,
            money(amtVal, currency),
          ];

          cols.forEach((col, i) => {
            doc
              .fontSize(8)
              .font(col.key === "product" || col.key === "amount" ? "Helvetica-Bold" : "Helvetica")
              .fillColor(COLORS.slate900)
              .text(cellValues[i], colX + 4, rowY + 5, {
                width: col.width - 8,
                align: col.align,
                ellipsis: true,
              });
            colX += col.width;
          });

          doc
            .moveTo(tableX, rowY + rowHeight)
            .lineTo(tableX + tableWidth, rowY + rowHeight)
            .lineWidth(0.5)
            .strokeColor(COLORS.slate100)
            .stroke();

          rowY += rowHeight;
        });
      }

      doc.y = tableTop + tableCardHeight + 12;

      //------------------------------------------------
      // TERMS & CONDITIONS + INTERNAL NOTES
      //------------------------------------------------

      const termsText = quotation.termsConditions || "Standard terms apply.";
      const notesText = quotation.internalNotes || "No internal comments.";

      doc.fontSize(8).font("Helvetica");
      const termsTextHeight = doc.heightOfString(termsText, { width: colWidth - CARD_PAD_X * 2, lineGap: 2 });
      const notesTextHeight = doc.heightOfString(notesText, { width: colWidth - CARD_PAD_X * 2, lineGap: 2 });

      const termsCardHeight = CARD_CONTENT_OFFSET + termsTextHeight + CARD_PAD_BOTTOM;
      const notesCardHeight = CARD_CONTENT_OFFSET + notesTextHeight + CARD_PAD_BOTTOM;
      const row3Height = Math.max(termsCardHeight, notesCardHeight);

      ensureSpace(doc, row3Height + 10);
      const row3Top = doc.y;

      drawCardShell(doc, leftX, row3Top, colWidth, row3Height);
      let tcY = drawCardHeader(doc, leftX + CARD_PAD_X, row3Top + CARD_PAD_TOP, colWidth - CARD_PAD_X * 2, "Terms & Conditions");
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(COLORS.slate900)
        .text(termsText, leftX + CARD_PAD_X, tcY, { width: colWidth - CARD_PAD_X * 2, lineGap: 2 });

      drawCardShell(doc, rightX, row3Top, colWidth, row3Height);
      let inY = drawCardHeader(doc, rightX + CARD_PAD_X, row3Top + CARD_PAD_TOP, colWidth - CARD_PAD_X * 2, "Internal Notes");
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(COLORS.slate900)
        .text(notesText, rightX + CARD_PAD_X, inY, { width: colWidth - CARD_PAD_X * 2, lineGap: 2 });

      doc.y = row3Top + row3Height + 20;

      //------------------------------------------------
      // FOOTER
      //------------------------------------------------

      ensureSpace(doc, 30);
      doc
        .fontSize(9)
        .font("Helvetica-Oblique")
        .fillColor(COLORS.slate400)
        .text("Thank you for your business.", PAGE_MARGIN, doc.y, {
          width: CONTENT_WIDTH,
          align: "center",
        });

      doc.end();

      stream.on("finish", () => resolve(pdfPath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateQuotationPDF,
};