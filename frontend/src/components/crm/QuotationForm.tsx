import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, User, MapPin, Calendar, Percent, FileText } from "lucide-react";
import { quotationService } from "../../services/quotation.service";

interface Props {
  opportunity: any;
  onClose: () => void;
}

export default function QuotationForm({ opportunity, onClose }: Props) {
  // Dynamic line items state
  const [items, setItems] = useState<any[]>([
    {
      product: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      tax: 18,
      discount: 0,
      subtotal: 0
    }
  ]);

  // Form states
  const [form, setForm] = useState({
    customerName: opportunity?.customerName || "",
    companyName: opportunity?.company || "",
    email: opportunity?.email || "",
    phone: opportunity?.phone || "",
    gstin: "",
    salesperson: opportunity?.assignedSalesperson || "",
    quotationDate: new Date().toISOString().split("T")[0] + "T10:30",
    expirationDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    paymentTerms: "Immediate Payment",
    currency: "INR",
    taxType: "intrastate", // intrastate (CGST + SGST) or interstate (IGST)
    termsConditions: "• Quotation valid for 15 days from the date of issue.\n• GST will be charged as per applicable rates.\n• Payment terms: 100% advance.\n• Delivery within 5-7 business days after payment.\n• This is a system generated quotation.",
    internalNotes: ""
  });

  // Billing address sub-states
  const [billingStreet, setBillingStreet] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [billingZip, setBillingZip] = useState("");

  // Shipping address sub-states
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingStreet, setShippingStreet] = useState("22 MG Road");
  const [shippingCity, setShippingCity] = useState("Indore");
  const [shippingState, setShippingState] = useState("Madhya Pradesh");
  const [shippingCountry, setShippingCountry] = useState("India");
  const [shippingZip, setShippingZip] = useState("452001");

  // Pricing summary states
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState(10);
  const [shippingCharge, setShippingCharge] = useState(500);
  const [otherCharges, setOtherCharges] = useState(250);

  // Manual GST percentage states
  const [manualCgstPercent, setManualCgstPercent] = useState<string>("9");
  const [manualSgstPercent, setManualSgstPercent] = useState<string>("9");
  const [manualIgstPercent, setManualIgstPercent] = useState<string>("0");

  // Sync shipping address fields if checkbox is active
  useEffect(() => {
    if (sameAsBilling) {
      setShippingStreet(billingStreet);
      setShippingCity(billingCity);
      setShippingState(billingState);
      setShippingCountry(billingCountry);
      setShippingZip(billingZip);
    }
  }, [sameAsBilling, billingStreet, billingCity, billingState, billingCountry, billingZip]);

  // Auto-calculate default tax percentages when items change
  useEffect(() => {
    let cgstVal = 0;
    let sgstVal = 0;

    items.forEach(item => {
      const lineTaxable = (Number(item.quantity) * Number(item.unitPrice) * (1 - Number(item.discount) / 100)) * (1 - Number(globalDiscountPercent) / 100);
      const taxRate = Number(item.tax) || 0;
      // Default to intrastate split
      cgstVal += lineTaxable * (taxRate / 2 / 100);
      sgstVal += lineTaxable * (taxRate / 2 / 100);
    });

    const calculatedTaxable = items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const disc = Number(item.discount) || 0;
      return sum + (qty * price * (1 - disc / 100));
    }, 0) * (1 - Number(globalDiscountPercent) / 100);

    if (calculatedTaxable > 0) {
      setManualCgstPercent(((cgstVal / calculatedTaxable) * 100).toFixed(2));
      setManualSgstPercent(((sgstVal / calculatedTaxable) * 100).toFixed(2));
    } else {
      setManualCgstPercent("9.00");
      setManualSgstPercent("9.00");
    }
    setManualIgstPercent("0.00");
  }, [items, globalDiscountPercent]);

  // Add Product row
  const addProductRow = () => {
    setItems([
      ...items,
      {
        product: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        tax: 18,
        discount: 0,
        subtotal: 0
      }
    ]);
  };

  // Remove Product row
  const removeProductRow = (index: number) => {
    if (items.length <= 1) return;
    const copy = [...items];
    copy.splice(index, 1);
    setItems(copy);
  };

  // Update item input values
  const updateItemField = (index: number, field: string, value: any) => {
    const copy = [...items];
    copy[index][field] = value;

    // Recalculate line subtotal (taxable amount before global discount)
    const qty = Number(copy[index].quantity) || 0;
    const price = Number(copy[index].unitPrice) || 0;
    const disc = Number(copy[index].discount) || 0;
    copy[index].subtotal = qty * price * (1 - disc / 100);

    setItems(copy);
  };

  // Calculation helpers
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discount) || 0;
    return sum + (qty * price * (1 - disc / 100));
  }, 0);

  const discountAmount = subtotal * (Number(globalDiscountPercent) / 100);
  const taxableAmount = subtotal - discountAmount;

  // Calculate tax amounts based on manually entered percentages
  const cgstPercent = Number(manualCgstPercent) || 0;
  const sgstPercent = Number(manualSgstPercent) || 0;
  const igstPercent = Number(manualIgstPercent) || 0;

  const cgst = Number((taxableAmount * (cgstPercent / 100)).toFixed(2));
  const sgst = Number((taxableAmount * (sgstPercent / 100)).toFixed(2));
  const igst = Number((taxableAmount * (igstPercent / 100)).toFixed(2));
  const taxAmount = Number((cgst + sgst + igst).toFixed(2));

  const rawGrandTotal = taxableAmount + taxAmount + Number(shippingCharge || 0) + Number(otherCharges || 0);
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOffVal = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));
  const grandTotal = roundedGrandTotal;

  const getCurrencySymbol = () => {
    if (form.currency === "USD") return "$";
    if (form.currency === "EUR") return "€";
    return "₹";
  };

  // Save Quotation Draft
  const saveQuotation = async () => {
    if (!form.customerName || !form.companyName) {
      alert("Customer Name and Company Name are required.");
      return;
    }

    try {
      const billingAddressStr = `${billingStreet}, ${billingCity}, ${billingState}, ${billingCountry} - ${billingZip}`;
      const shippingAddressStr = sameAsBilling
        ? billingAddressStr
        : `${shippingStreet}, ${shippingCity}, ${shippingState}, ${shippingCountry} - ${shippingZip}`;

      const quotation = {
        quotationNumber: "QT-" + new Date().getFullYear() + "-" + String(Math.floor(10000 + Math.random() * 90000)),
        opportunityId: opportunity.id,
        customerId: opportunity.customerId || opportunity.id,
        customerNameSnapshot: form.customerName,
        customerCompanyNameSnapshot: form.companyName,
        customerEmailSnapshot: form.email,
        customerPhoneSnapshot: form.phone,
        salesperson: form.salesperson,
        quotationDate: form.quotationDate,
        expirationDate: form.expirationDate,
        paymentTerms: form.paymentTerms,
        currency: form.currency,
        subtotal,
        tax: taxAmount,
        total: grandTotal,
        items: items.map(item => ({
          product: item.product || "(No Product Name)",
          description: item.description || "",
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice || 0),
          tax: Number(item.tax || 0),
          discount: Number(item.discount || 0),
          subtotal: Number(item.subtotal || 0)
        })),
        customerGstinSnapshot: "",
        billingAddressSnapshot: billingAddressStr,
        shippingAddressSnapshot: shippingAddressStr,
        discountPercent: Number(globalDiscountPercent),
        cgst,
        sgst,
        igst,
        shippingCharge: Number(shippingCharge),
        otherCharges: Number(otherCharges),
        roundOff: roundOffVal,
        termsConditions: form.termsConditions,
        internalNotes: form.internalNotes
      };

      await quotationService.createQuotation(quotation);
      alert("Quotation Saved Successfully as Draft");
      onClose();
    } catch (err: any) {
      console.error("Save Quotation Error:", err);
      alert("Unable to Save Quotation: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-[1300px] max-w-[98%] h-[95vh] flex flex-col text-txt-primary">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-border-crm px-6 py-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-txt-primary tracking-tight">New Quotation</h2>
            <p className="text-xs text-txt-secondary mt-0.5">Create a quotation for this opportunity</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold uppercase tracking-wider">
              Draft
            </span>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-slate-50/50">
          {/* Row 1: Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Customer Information */}
            <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg border border-indigo-100">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-txt-primary">Customer Information</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Customer Name</label>
                  <input
                    className="crm-input bg-slate-50"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Company Name</label>
                  <input
                    className="crm-input"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Email</label>
                    <input
                      type="email"
                      className="crm-input"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Phone</label>
                    <input
                      className="crm-input"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Addresses */}
            <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg border border-indigo-100">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-txt-primary">Addresses</h3>
                </div>
                <label className="flex items-center gap-1.5 text-slate-500 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsBilling}
                    onChange={(e) => setSameAsBilling(e.target.checked)}
                    className="rounded text-primary border-slate-300"
                  />
                  <span>Same Shipping</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Billing Address */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[10px] text-indigo-600 uppercase tracking-wider mb-2">Billing Address</h4>
                  <input
                    placeholder="Street"
                    className="crm-input"
                    value={billingStreet}
                    onChange={(e) => setBillingStreet(e.target.value)}
                  />
                  <input
                    placeholder="City"
                    className="crm-input"
                    value={billingCity}
                    onChange={(e) => setBillingCity(e.target.value)}
                  />
                  <input
                    placeholder="State"
                    className="crm-input"
                    value={billingState}
                    onChange={(e) => setBillingState(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Country"
                      className="crm-input"
                      value={billingCountry}
                      onChange={(e) => setBillingCountry(e.target.value)}
                    />
                    <input
                      placeholder="Zip"
                      className="crm-input"
                      value={billingZip}
                      onChange={(e) => setBillingZip(e.target.value)}
                    />
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[10px] text-indigo-600 uppercase tracking-wider mb-2">Shipping Address</h4>
                  <input
                    placeholder="Street"
                    className={`crm-input ${sameAsBilling ? "bg-slate-50 text-slate-400" : ""}`}
                    disabled={sameAsBilling}
                    value={shippingStreet}
                    onChange={(e) => setShippingStreet(e.target.value)}
                  />
                  <input
                    placeholder="City"
                    className={`crm-input ${sameAsBilling ? "bg-slate-50 text-slate-400" : ""}`}
                    disabled={sameAsBilling}
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                  />
                  <input
                    placeholder="State"
                    className={`crm-input ${sameAsBilling ? "bg-slate-50 text-slate-400" : ""}`}
                    disabled={sameAsBilling}
                    value={shippingState}
                    onChange={(e) => setShippingState(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Country"
                      className={`crm-input ${sameAsBilling ? "bg-slate-50 text-slate-400" : ""}`}
                      disabled={sameAsBilling}
                      value={shippingCountry}
                      onChange={(e) => setShippingCountry(e.target.value)}
                    />
                    <input
                      placeholder="Zip"
                      className={`crm-input ${sameAsBilling ? "bg-slate-50 text-slate-400" : ""}`}
                      disabled={sameAsBilling}
                      value={shippingZip}
                      onChange={(e) => setShippingZip(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Quotation Details */}
            <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg border border-indigo-100">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-txt-primary">Quotation Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Quotation Number</label>
                  <input
                    className="crm-input bg-slate-50 text-slate-450 font-bold"
                    value="[Draft Auto-Generated]"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Salesperson</label>
                  <input
                    className="crm-input"
                    value={form.salesperson}
                    onChange={(e) => setForm({ ...form, salesperson: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Quotation Date</label>
                  <input
                    type="datetime-local"
                    className="crm-input"
                    value={form.quotationDate}
                    onChange={(e) => setForm({ ...form, quotationDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Valid Till</label>
                  <input
                    type="date"
                    className="crm-input"
                    value={form.expirationDate}
                    onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Payment Terms</label>
                  <select
                    className="crm-input"
                    value={["Immediate Payment", "15 Days", "30 Days", "45 Days"].includes(form.paymentTerms) ? form.paymentTerms : "Other"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Other") {
                        setForm({ ...form, paymentTerms: "" });
                      } else {
                        setForm({ ...form, paymentTerms: val });
                      }
                    }}
                  >
                    <option value="Immediate Payment">Immediate Payment</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="45 Days">45 Days</option>
                    <option value="Other">Other (Custom)</option>
                  </select>
                  {!["Immediate Payment", "15 Days", "30 Days", "45 Days"].includes(form.paymentTerms) && (
                    <input
                      type="text"
                      className="crm-input mt-2"
                      placeholder="Enter custom payment terms..."
                      value={form.paymentTerms}
                      onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Currency</label>
                  <select
                    className="crm-input"
                    value={["INR", "USD", "EUR"].includes(form.currency) ? form.currency : "Other"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Other") {
                        setForm({ ...form, currency: "" });
                      } else {
                        setForm({ ...form, currency: val });
                      }
                    }}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="Other">Other (Custom)</option>
                  </select>
                  {!["INR", "USD", "EUR"].includes(form.currency) && (
                    <input
                      type="text"
                      className="crm-input mt-2"
                      placeholder="Enter custom currency (e.g. GBP)..."
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Tax Split Rates (%)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[9px] tracking-wider">CGST (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="CGST %"
                      className="crm-input"
                      value={manualCgstPercent}
                      onChange={(e) => setManualCgstPercent(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[9px] tracking-wider">SGST (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="SGST %"
                      className="crm-input"
                      value={manualSgstPercent}
                      onChange={(e) => setManualSgstPercent(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 text-[9px] tracking-wider">IGST (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="IGST %"
                      className="crm-input"
                      value={manualIgstPercent}
                      onChange={(e) => setManualIgstPercent(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Items + Summary split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Table Card (colSpan 2) */}
            <div className="lg:col-span-2 bg-card border border-border-crm rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg border border-indigo-100">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-txt-primary">Products / Services</h3>
                </div>
                <button
                  type="button"
                  onClick={addProductRow}
                  className="border border-indigo-500 hover:bg-indigo-50 text-indigo-600 font-bold px-4 py-1.5 rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Product / Service
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border-crm text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                      <th className="px-3 py-2.5 w-10 text-center">#</th>
                      <th className="px-3 py-2.5">Product / Service</th>
                      <th className="px-3 py-2.5">Description</th>
                      <th className="px-3 py-2.5 w-16 text-center">Qty</th>
                      <th className="px-3 py-2.5 w-24 text-center">Unit Price</th>
                      <th className="px-3 py-2.5 w-16 text-center">Discount %</th>
                      <th className="px-3 py-2.5 w-20 text-center">Tax (%)</th>
                      <th className="px-3 py-2.5 w-24 text-right">Amount</th>
                      <th className="px-3 py-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-crm">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 text-center text-slate-400 font-medium">{index + 1}</td>
                        <td className="px-2 py-2">
                          <input
                            required
                            placeholder="Product name..."
                            value={item.product}
                            onChange={(e) => updateItemField(index, "product", e.target.value)}
                            className="w-full border rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-400"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            placeholder="Optional desc..."
                            value={item.description}
                            onChange={(e) => updateItemField(index, "description", e.target.value)}
                            className="w-full border rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-400"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            required
                            min="0.01"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => updateItemField(index, "quantity", Number(e.target.value))}
                            className="w-full border rounded-lg px-1.5 py-1 text-center focus:outline-none focus:border-indigo-400"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            required
                            min="0"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) => updateItemField(index, "unitPrice", Number(e.target.value))}
                            className="w-full border rounded-lg px-1.5 py-1 text-center focus:outline-none focus:border-indigo-400"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) => updateItemField(index, "discount", Number(e.target.value))}
                            className="w-full border rounded-lg px-1.5 py-1 text-center focus:outline-none focus:border-indigo-400"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={[18, 12, 5, 0].includes(Number(item.tax)) ? Number(item.tax) : "Other"}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "Other") {
                                updateItemField(index, "tax", 28);
                              } else {
                                updateItemField(index, "tax", Number(val));
                              }
                            }}
                            className="w-full border rounded-lg px-1 py-1 text-center focus:outline-none focus:border-indigo-400"
                          >
                            <option value="18">18%</option>
                            <option value="12">12%</option>
                            <option value="5">5%</option>
                            <option value="0">0%</option>
                            <option value="Other">Other</option>
                          </select>
                          {![18, 12, 5, 0].includes(Number(item.tax)) && (
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Tax %"
                              value={item.tax || ""}
                              onChange={(e) => updateItemField(index, "tax", e.target.value === "" ? 0 : Number(e.target.value))}
                              className="w-full border rounded-lg px-1 py-1 mt-1 text-center focus:outline-none focus:border-indigo-400 text-xs"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-txt-primary">
                          {getCurrencySymbol()}{item.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeProductRow(index)}
                            disabled={items.length <= 1}
                            className={`p-1 hover:bg-slate-100 rounded-lg cursor-pointer ${items.length <= 1 ? "opacity-35 cursor-not-allowed" : "text-rose-500"}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pricing Summary Card */}
            <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg border border-indigo-100">
                  <Percent className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-txt-primary">Pricing Summary</h3>
              </div>

              <div className="space-y-2.5 text-xs text-txt-secondary">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-bold text-txt-primary">{getCurrencySymbol()}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center gap-3">
                  <span>Discount (%)</span>
                  <div className="flex items-center gap-1.5 w-24">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="crm-input text-right py-0.5 px-1.5"
                      value={globalDiscountPercent}
                      onChange={(e) => setGlobalDiscountPercent(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-rose-600 font-semibold border-b border-dashed border-slate-100 pb-2">
                  <span>Discount Amt ({globalDiscountPercent}%)</span>
                  <span>-{getCurrencySymbol()}{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center font-bold text-txt-primary">
                  <span>Taxable Amount</span>
                  <span>{getCurrencySymbol()}{taxableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {(cgst > 0 || sgst > 0 || igst === 0) && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>CGST ({cgstPercent}%)</span>
                      <span>{getCurrencySymbol()}{cgst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-2">
                      <span>SGST ({sgstPercent}%)</span>
                      <span>{getCurrencySymbol()}{sgst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )}
                {igst > 0 && (
                  <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-2">
                    <span>IGST ({igstPercent}%)</span>
                    <span>{getCurrencySymbol()}{igst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Tax Amount</span>
                  <span className="font-semibold text-txt-primary">{getCurrencySymbol()}{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center gap-3">
                  <span>Shipping Charge</span>
                  <input
                    type="number"
                    min="0"
                    className="crm-input text-right w-24 py-0.5 px-1.5"
                    value={shippingCharge}
                    onChange={(e) => setShippingCharge(Number(e.target.value))}
                  />
                </div>

                <div className="flex justify-between items-center gap-3 border-b border-slate-100 pb-2">
                  <span>Other Charges</span>
                  <input
                    type="number"
                    min="0"
                    className="crm-input text-right w-24 py-0.5 px-1.5"
                    value={otherCharges}
                    onChange={(e) => setOtherCharges(Number(e.target.value))}
                  />
                </div>

                <div className="flex justify-between items-center text-slate-500 border-b border-slate-150 pb-2">
                  <span>Round Off</span>
                  <span className="font-semibold">{roundOffVal > 0 ? "+" : ""}{getCurrencySymbol()}{roundOffVal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-extrabold text-indigo-700 bg-indigo-50/70 rounded-xl p-3 border border-indigo-100/50">
                  <span className="uppercase tracking-wider">Grand Total</span>
                  <span>{getCurrencySymbol()}{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Bottom Notes Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs space-y-2">
              <label className="block text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">Terms & Conditions</label>
              <textarea
                rows={4}
                className="crm-input text-xs leading-relaxed font-mono"
                value={form.termsConditions}
                onChange={(e) => setForm({ ...form, termsConditions: e.target.value })}
              />
            </div>
            <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs space-y-2">
              <label className="block text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">Notes</label>
              <textarea
                rows={4}
                className="crm-input text-xs leading-relaxed"
                placeholder="Enter notes..."
                value={form.internalNotes}
                onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border-crm px-6 py-4 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="border border-border-crm px-5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs font-semibold"
          >
            Discard
          </button>
          <button
            onClick={saveQuotation}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl transition cursor-pointer text-xs font-semibold shadow-sm"
          >
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );
}