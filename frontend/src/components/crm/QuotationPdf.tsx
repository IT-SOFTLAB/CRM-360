import React, { forwardRef } from "react";
import {
  Calendar,
  User,
  MapPin,
  Percent,
  FileText,
} from "lucide-react";
interface QuotationPdfProps {
  quotation: any;
  companyBranding?: any;
}
const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    default:
      return "₹";
  }
};

const formatQuotationDate = (dateStr: string) => {
  if (!dateStr) return "-";

  const d = new Date(dateStr);

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatQuotationDateTime = (dateStr: string) => {
  if (!dateStr) return "-";

  const d = new Date(dateStr);

  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
const QuotationPdf = forwardRef<HTMLDivElement, QuotationPdfProps>(
({ quotation, companyBranding }, ref) => {

if (!quotation) return null;

return (

<div
  ref={ref}
  style={{
    width: "794px",
    minHeight: "1123px",
    background: "#ffffff",
    color: "#000000",
    padding: "32px",
    boxSizing: "border-box",
  }}
>

{/* Everything else goes here */}
   {/* Top Header Actions Bar (Image 2) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-crm px-6 py-4 bg-slate-50/50 shrink-0 gap-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Quotation</p>
                <div className="flex items-center gap-3.5 mt-1">
                  <h2 className="text-xl font-extrabold text-txt-primary tracking-tight">
                    {quotation.quotationNumber}
                  </h2>
                  <span
                    className={`px-3 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                      ${quotation.status === "Draft"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : quotation.status === "Sent"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : quotation.status === "Confirmed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                  >
                    {quotation.status}
                  </span>
                </div>
              </div>

              {/* Middle Metadata */}
              <div className="flex flex-wrap gap-4 text-xs text-txt-secondary md:mx-auto">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Quotation Date: <b>{formatQuotationDate(quotation.quotationDate)}</b></span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Valid Till: <b>{formatQuotationDate(quotation.expirationDate)}</b></span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                  <span>Currency: <b>{quotation.currency || "INR"}</b></span>
                </div>
              </div>

              {/* Action Buttons */}
            
            </div>

            {/* High-Fidelity Invoice Body Grid (Image 1) */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs bg-slate-50/20 print:overflow-y-visible print:h-auto print:p-0 print:grid print:grid-cols-2 print:gap-3 lg:space-y-0">
              
              {/* 1. Customer Information (Read-only Snapshot values) */}
              <div className="bg-white border border-border-crm rounded-2xl p-5 shadow-xs space-y-4 print:break-inside-avoid lg:col-span-1 print:col-span-1">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg border border-indigo-100">
                    <User className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-txt-primary">Customer Information</h3>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Customer Name</span>
                    <span className="font-bold text-txt-primary">{quotation.customerNameSnapshot || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Company Name</span>
                    <span className="font-medium text-txt-primary">{quotation.customerCompanyNameSnapshot || "-"}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider shrink-0">Email</span>
                    <span className="text-primary font-medium hover:underline text-right break-all">
                      <a href={`mailto:${quotation.customerEmailSnapshot}`}>{quotation.customerEmailSnapshot || "-"}</a>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Phone</span>
                    <span className="font-medium text-txt-primary">{quotation.customerPhoneSnapshot || "-"}</span>
                  </div>
                </div>
              </div>

              {/* 2. Address Snapshots */}
              <div className="bg-white border border-border-crm rounded-2xl p-5 shadow-xs space-y-4 print:break-inside-avoid lg:col-span-1 print:col-span-1">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg border border-indigo-100">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-txt-primary">Addresses</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-extrabold text-[10px] text-indigo-600 uppercase tracking-wider mb-2">Billing Address</h4>
                    <p className="leading-relaxed font-medium text-txt-primary whitespace-pre-line">
                      {(quotation.billingAddressSnapshot || "-").split(", ").join("\n")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[10px] text-indigo-600 uppercase tracking-wider mb-2">Shipping Address</h4>
                    <p className="leading-relaxed font-medium text-txt-primary whitespace-pre-line">
                      {(quotation.shippingAddressSnapshot || "-").split(", ").join("\n")}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Quotation Details */}
              <div className="bg-white border border-border-crm rounded-2xl p-5 shadow-xs space-y-4 print:break-inside-avoid lg:col-span-1 print:col-span-1">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg border border-indigo-100">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-txt-primary">Quotation Details</h3>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Quotation Number</span>
                    <span className="font-extrabold text-txt-primary">{quotation.quotationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Quotation Date</span>
                    <span className="font-medium text-txt-primary">{formatQuotationDateTime(quotation.quotationDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Valid Till</span>
                    <span className="font-medium text-txt-primary">{formatQuotationDate(quotation.expirationDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Currency</span>
                    <span className="font-bold text-txt-primary">{quotation.currency || "INR"}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-50 pt-2">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Status</span>
                    <span className="font-extrabold text-amber-600 uppercase tracking-wide">{quotation.status}</span>
                  </div>
                </div>
              </div>

              {/* 4. Pricing Summary Card */}
              <div className="bg-white border border-border-crm rounded-2xl p-5 shadow-xs flex flex-col space-y-4 print:break-inside-avoid lg:col-span-1 print:col-span-1">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg border border-indigo-100">
                    <Percent className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-txt-primary">Pricing Summary</h3>
                </div>

                <div className="space-y-2.5 text-txt-secondary">
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span className="font-bold text-txt-primary">
                      {getCurrencySymbol(quotation.currency || "INR")}{Number(quotation.subtotal || 0).toLocaleString()}
                    </span>
                  </div>

                  {quotation.discountPercent > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-semibold border-b border-dashed border-slate-100 pb-2">
                      <span>Discount ({quotation.discountPercent.toFixed(2)}%)</span>
                      <span>
                        -{getCurrencySymbol(quotation.currency || "INR")}{Number((quotation.subtotal || 0) * quotation.discountPercent / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center font-bold text-txt-primary">
                    <span>Taxable Amount</span>
                    <span>
                      {getCurrencySymbol(quotation.currency || "INR")}{Number((quotation.subtotal || 0) - ((quotation.subtotal || 0) * (quotation.discountPercent || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {quotation.cgst > 0 && (
                    <div className="flex justify-between items-center">
                      <span>CGST (9%)</span>
                      <span>{getCurrencySymbol(quotation.currency || "INR")}{Number(quotation.cgst).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {quotation.sgst > 0 && (
                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-2">
                      <span>SGST (9%)</span>
                      <span>{getCurrencySymbol(quotation.currency || "INR")}{Number(quotation.sgst).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {quotation.igst > 0 && (
                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-2">
                      <span>IGST (18%)</span>
                      <span>{getCurrencySymbol(quotation.currency || "INR")}{Number(quotation.igst).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span>Tax Amount</span>
                    <span className="font-semibold text-txt-primary">
                      {getCurrencySymbol(quotation.currency || "INR")}{Number(quotation.tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Shipping Charge</span>
                    <span className="font-semibold text-txt-primary">
                      {getCurrencySymbol(quotation.currency || "INR")}{Number(quotation.shippingCharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span>Other Charges</span>
                    <span className="font-semibold text-txt-primary">
                      {getCurrencySymbol(quotation.currency || "INR")}{Number(quotation.otherCharges || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500 border-b border-slate-200 pb-2">
                    <span>Round Off</span>
                    <span className="font-semibold">
                      {quotation.roundOff > 0 ? "+" : ""}{getCurrencySymbol(quotation.currency || "INR")}{Number(quotation.roundOff || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-extrabold text-indigo-700 bg-indigo-50/70 rounded-xl p-3 border border-indigo-100/50">
                    <span className="uppercase tracking-wider">Grand Total</span>
                    <span>
                      {getCurrencySymbol(quotation.currency || "INR")}{Number(quotation.total || quotation.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Products List (colSpan 2) */}
              <div className="lg:col-span-2 bg-white border border-border-crm rounded-2xl p-5 shadow-xs flex flex-col space-y-4 print:col-span-2">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg border border-indigo-100">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-txt-primary">Products / Services</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-border-crm text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                        <th className="px-4 py-2.5 w-10 text-center">#</th>
                        <th className="px-4 py-2.5">Product / Service</th>
                        <th className="px-4 py-2.5">Description</th>
                        <th className="px-4 py-2.5 w-16 text-center">Qty</th>
                        <th className="px-4 py-2.5 w-24 text-center">Unit Price</th>
                        <th className="px-4 py-2.5 w-16 text-center">Discount %</th>
                        <th className="px-4 py-2.5 w-20 text-center">Tax (%)</th>
                        <th className="px-4 py-2.5 w-24 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-crm text-txt-primary">
                      {quotation.items && quotation.items.length > 0 ? (
                       quotation.items.map((item: any, idx: number) => {
                          const discRate = Number(item.discount || 0);
                          const amtVal = (Number(item.quantity) * Number(item.unitPrice)) * (1 - discRate / 100);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 print:break-inside-avoid">
                              <td className="px-4 py-3 text-center text-slate-455">{idx + 1}</td>
                              <td className="px-4 py-3 font-semibold">{item.product || "-"}</td>
                              <td className="px-4 py-3 text-slate-500">{item.description || "-"}</td>
                              <td className="px-4 py-3 text-center font-medium">{Number(item.quantity).toFixed(2)}</td>
                              <td className="px-4 py-3 text-center">
                                {getCurrencySymbol(quotation.currency || "INR")}{Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-center font-medium">{discRate > 0 ? `${discRate}%` : "0.00"}</td>
                              <td className="px-4 py-3 text-center">{item.tax}%</td>
                              <td className="px-4 py-3 text-right font-bold">
                                {getCurrencySymbol(quotation.currency || "INR")}{amtVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-400">No products configured</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6. Terms & Conditions Card */}
              <div className="bg-white border border-border-crm rounded-2xl p-5 shadow-xs space-y-2 font-mono print:break-inside-avoid lg:col-span-2 print:col-span-1">
                <h4 className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Terms & Conditions</h4>
                <p className="text-txt-primary leading-relaxed whitespace-pre-wrap">{quotation.termsConditions || "Standard terms apply."}</p>
              </div>

              {/* 7. Internal Notes Card */}
              <div className="bg-white border border-border-crm rounded-2xl p-5 shadow-xs space-y-2 print:break-inside-avoid lg:col-span-1 print:col-span-1">
                <h4 className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Internal Notes</h4>
                <p className="text-txt-primary leading-relaxed whitespace-pre-wrap">{quotation.internalNotes || "No internal comments."}</p>
              </div>

            </div>

</div>

);

});

QuotationPdf.displayName = "QuotationPdf";

export default QuotationPdf;