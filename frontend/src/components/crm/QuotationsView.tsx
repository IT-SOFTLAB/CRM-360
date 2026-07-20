import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, X, ListFilter, User, MapPin, Calendar, Percent, FileText, Mail, Phone, Trash2 } from "lucide-react";
import api from '@/services/api';

interface QuotationsViewProps {
  quotations: any[];
  opportunities: any[];
  user: any;
  onApproveReject: (id: string, status: string) => void;
  onCreateQuotation: (data: any) => void;
  onUpdateQuotation: (id: string, data: any) => void;
  showQuoteModal: boolean;
  setShowQuoteModal: (show: boolean) => void;
  companyBranding: any;
}

export default function QuotationsView({
  quotations,
  opportunities,
  user,
  onApproveReject,
  onCreateQuotation,
  onUpdateQuotation,
  showQuoteModal,
  setShowQuoteModal,
  companyBranding,
}: QuotationsViewProps) {

  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [editingQuote, setEditingQuote] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'my' | 'team'>('all');

  const userRole = (user?.role || '').toUpperCase().replace(/[\s_]+/g, '_');
  const isManager = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // Address parsing helper
  const parseAddressStr = (addr: string) => {
    const parts = addr ? addr.split(", ") : [];
    const street = parts[0] || "";
    const city = parts[1] || "";
    const state = parts[2] || "";
    const countryZip = parts[3] || "";
    
    const countryParts = countryZip ? countryZip.split(" - ") : [];
    const country = countryParts[0] || "";
    const zip = countryParts[1] || "";

    return { street, city, state, country, zip };
  };

  // Sub-states for edit form addresses
  const [billingStreet, setBillingStreet] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [billingZip, setBillingZip] = useState("");

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");
  const [shippingZip, setShippingZip] = useState("");

  const [taxType, setTaxType] = useState("intrastate");
  const [manualCgstPercent, setManualCgstPercent] = useState<string>("9");
  const [manualSgstPercent, setManualSgstPercent] = useState<string>("9");
  const [manualIgstPercent, setManualIgstPercent] = useState<string>("0");
  const preventAutoTax = useRef(false);

  // Load Sales Teams
  useEffect(() => {
    if (isManager) {
      api.get('/salesteam')
        .then(res => setTeams(res.data))
        .catch(err => console.warn('Failed loading teams in quotes', err));
    }
  }, [isManager]);

  // Restrict Standard Salespeople to their own quotes
  useEffect(() => {
    if (!isManager) {
      setActiveFilter('my');
    }
  }, [isManager]);

  // Compile team member names dynamically
  const managedTeamMemberNames = useMemo(() => {
    if (!isManager) return [user?.name];
    
    let myTeams = teams;
    if (userRole === 'ADMIN') {
      myTeams = teams.filter(t => t.leaderId === user?.id || t.leader?.email === user?.email);
    }
    
    const names = new Set<string>();
    if (user?.name) names.add(user.name);
    
    myTeams.forEach(t => {
      if (t.leader?.name) names.add(t.leader.name);
      (t.members || []).forEach((m: any) => {
        if (m.name) names.add(m.name);
      });
    });
    
    return Array.from(names);
  }, [teams, user, userRole, isManager]);

  // Filter Quotations in real-time
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      if (!isManager) {
        return q.salesperson === user?.name;
      }
      if (activeFilter === 'my') {
        return q.salesperson === user?.name;
      }
      if (activeFilter === 'team') {
        return managedTeamMemberNames.includes(q.salesperson);
      }
      return true; // 'all'
    });
  }, [quotations, activeFilter, user, isManager, managedTeamMemberNames]);

  // Quote Form State
  const [quoteForm, setQuoteForm] = useState({
    customerName: "",
    company: "",
    opportunityId: "",
    email: "",
    phone: "",
    gstin: "",
    salesperson: "",
    quotationDate: "",
    expirationDate: "",
    paymentTerms: "Immediate Payment",
    currency: "INR",
    termsConditions: "",
    internalNotes: "",
    subtotal: 0,
    tax: 0,
    discountPercent: 0,
    total: 0,
    items: [
      {
        product: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        tax: 18,
        discount: 0,
        subtotal: 0,
      },
    ],
  });

  // Calculations for edit modal in real-time
  const calculatedSubtotal = quoteForm.items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discount) || 0;
    return sum + (qty * price * (1 - disc / 100));
  }, 0);

  const calculatedDiscount = calculatedSubtotal * (Number(quoteForm.discountPercent) || 0) / 100;
  const calculatedTaxable = calculatedSubtotal - calculatedDiscount;

  const formCgstPercent = Number(manualCgstPercent) || 0;
  const formSgstPercent = Number(manualSgstPercent) || 0;
  const formIgstPercent = Number(manualIgstPercent) || 0;

  const formCgst = Number((calculatedTaxable * (formCgstPercent / 100)).toFixed(2));
  const formSgst = Number((calculatedTaxable * (formSgstPercent / 100)).toFixed(2));
  const formIgst = Number((calculatedTaxable * (formIgstPercent / 100)).toFixed(2));
  const formTaxAmount = Number((formCgst + formSgst + formIgst).toFixed(2));

  const rawFormGrandTotal = calculatedTaxable + formTaxAmount + Number(quoteForm.items[0] ? 500 : 0) + Number(quoteForm.items[0] ? 250 : 0);
  const roundedGrandTotal = Math.round(rawFormGrandTotal);

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
    if (preventAutoTax.current) {
      preventAutoTax.current = false;
      return;
    }

    let cgstAmount = 0;
    let sgstAmount = 0;

    quoteForm.items.forEach(item => {
      const lineTaxable = (Number(item.quantity) * Number(item.unitPrice) * (1 - Number(item.discount) / 100)) * (1 - (Number(quoteForm.discountPercent) || 0) / 100);
      const taxRate = Number(item.tax) || 0;
      cgstAmount += lineTaxable * (taxRate / 2 / 100);
      sgstAmount += lineTaxable * (taxRate / 2 / 100);
    });

    if (calculatedTaxable > 0) {
      setManualCgstPercent(((cgstAmount / calculatedTaxable) * 100).toFixed(2));
      setManualSgstPercent(((sgstAmount / calculatedTaxable) * 100).toFixed(2));
    } else {
      setManualCgstPercent("9.00");
      setManualSgstPercent("9.00");
    }
    setManualIgstPercent("0.00");
  }, [quoteForm.items, quoteForm.discountPercent]);

  // Form Submit (Create or Update)
  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const billingAddressStr = `${billingStreet}, ${billingCity}, ${billingState}, ${billingCountry} - ${billingZip}`;
    const shippingAddressStr = sameAsBilling
      ? billingAddressStr
      : `${shippingStreet}, ${shippingCity}, ${shippingState}, ${shippingCountry} - ${shippingZip}`;

    const rawGrandTotal = calculatedTaxable + formTaxAmount + Number(quoteForm.items[0] ? 500 : 0) + Number(quoteForm.items[0] ? 250 : 0); // shipping/other charges
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOffVal = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

    const payload = {
      customerNameSnapshot: quoteForm.customerName,
      customerCompanyNameSnapshot: quoteForm.company,
      opportunityId: quoteForm.opportunityId,
      customerEmailSnapshot: quoteForm.email,
      customerPhoneSnapshot: quoteForm.phone,
      customerGstinSnapshot: "",
      salesperson: quoteForm.salesperson,
      quotationDate: quoteForm.quotationDate,
      expirationDate: quoteForm.expirationDate,
      paymentTerms: quoteForm.paymentTerms,
      currency: quoteForm.currency,
      termsConditions: quoteForm.termsConditions,
      internalNotes: quoteForm.internalNotes,
      subtotal: calculatedSubtotal,
      tax: formTaxAmount,
      total: roundedGrandTotal,
      billingAddressSnapshot: billingAddressStr,
      shippingAddressSnapshot: shippingAddressStr,
      discountPercent: Number(quoteForm.discountPercent),
      cgst: formCgst,
      sgst: formSgst,
      igst: formIgst,
      shippingCharge: 500, // mock standard
      otherCharges: 250,   // mock standard
      roundOff: roundOffVal,
      items: quoteForm.items.map(item => ({
        product: item.product || "",
        description: item.description || "",
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        tax: Number(item.tax),
        discount: Number(item.discount || 0),
        subtotal: Number(item.quantity) * Number(item.unitPrice) * (1 - Number(item.discount || 0) / 100)
      })),
    };

    if (editingQuote) {
      onUpdateQuotation(editingQuote.id, payload);
    } else {
      onCreateQuotation(payload);
    }

    setQuoteForm({
      customerName: "",
      company: "",
      opportunityId: "",
      email: "",
      phone: "",
      gstin: "",
      salesperson: "",
      quotationDate: "",
      expirationDate: "",
      paymentTerms: "Immediate Payment",
      currency: "INR",
      termsConditions: "",
      internalNotes: "",
      subtotal: 0,
      tax: 0,
      discountPercent: 0,
      total: 0,
      items: [
        {
          product: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          tax: 18,
          discount: 0,
          subtotal: 0,
        },
      ],
    });
    setManualCgstPercent("0");
    setManualSgstPercent("0");
    setManualIgstPercent("0");
    setEditingQuote(null);
    setShowQuoteModal(false);
  };

  const handleEdit = (quote: any) => {
    setEditingQuote(quote);

    // Parse addresses
    const bAddr = parseAddressStr(quote.billingAddressSnapshot || "");
    setBillingStreet(bAddr.street || quote.billingAddressSnapshot || "");
    setBillingCity(bAddr.city || "");
    setBillingState(bAddr.state || "");
    setBillingCountry(bAddr.country || "");
    setBillingZip(bAddr.zip || "");

    const sAddr = parseAddressStr(quote.shippingAddressSnapshot || "");
    setShippingStreet(sAddr.street || quote.shippingAddressSnapshot || "");
    setShippingCity(sAddr.city || "");
    setShippingState(sAddr.state || "");
    setShippingCountry(sAddr.country || "");
    setShippingZip(sAddr.zip || "");
    
    setSameAsBilling(quote.billingAddressSnapshot === quote.shippingAddressSnapshot);
    setTaxType(quote.igst > 0 ? "interstate" : "intrastate");
    const taxable = (quote.subtotal || 0) - ((quote.subtotal || 0) * (quote.discountPercent || 0) / 100);
    if (taxable > 0) {
      setManualCgstPercent(((quote.cgst || 0) / taxable * 100).toFixed(2));
      setManualSgstPercent(((quote.sgst || 0) / taxable * 100).toFixed(2));
      setManualIgstPercent(((quote.igst || 0) / taxable * 100).toFixed(2));
    } else {
      setManualCgstPercent("0.00");
      setManualSgstPercent("0.00");
      setManualIgstPercent("0.00");
    }

    setQuoteForm({
      customerName: quote.customerNameSnapshot || "",
      company: quote.customerCompanyNameSnapshot || "",
      opportunityId: quote.opportunityId || "",
      email: quote.customerEmailSnapshot || "",
      phone: quote.customerPhoneSnapshot || "",
      gstin: quote.customerGstinSnapshot || "",
      salesperson: quote.salesperson || "",
      quotationDate: quote.quotationDate ? quote.quotationDate.slice(0, 16) : "",
      expirationDate: quote.expirationDate ? quote.expirationDate.slice(0, 10) : "",
      paymentTerms: quote.paymentTerms || "Immediate Payment",
      currency: quote.currency || "INR",
      termsConditions: quote.termsConditions || "",
      internalNotes: quote.internalNotes || "",
      subtotal: quote.subtotal || 0,
      tax: quote.tax || 0,
      discountPercent: quote.discountPercent || 0,
      total: quote.total || 0,
      items: quote.items && quote.items.length > 0 ? quote.items.map((item: any) => ({
        product: item.product || "",
        description: item.description || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        tax: item.tax,
        discount: item.discount,
        subtotal: item.subtotal
      })) : [
        {
          product: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          tax: 18,
          discount: 0,
          subtotal: 0
        }
      ]
    });
    setShowQuoteModal(true);
  };

 const handleSend = async (quote: any) => {
  try {
    await api.post(`/quotations/${quote.id}/send`);

    alert("Quotation sent successfully!");

    onApproveReject(quote.id, "Sent");
  } catch (err: any) {
    console.error(err);

    alert(
      err?.response?.data?.message ||
      "Failed to send quotation."
    );
  }
};

  const handlePrint = (quote: any) => {
    setSelectedQuote(quote);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this quotation?")) {
      api.delete(`/quotations/${id}`)
        .then(() => {
          alert("Quotation Deleted");
          window.location.reload();
        })
        .catch(err => alert("Failed to delete quotation: " + err.message));
    }
  };

  const handleConfirm = (id: string) => {
    onApproveReject(id, "Confirmed");
  };

  const handleCancel = (id: string) => {
    onApproveReject(id, "Cancelled");
  };

  const getCurrencySymbol = (curr: string) => {
    if (curr === "USD") return "$";
    if (curr === "EUR") return "€";
    return "₹";
  };

  const formatQuotationDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month} ${year} ${hours}:${minutes} ${ampm}`;
  };

  const formatQuotationDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 print:hidden">
        {/* Manager Filter Header */}
      {isManager && (
        <div className="flex justify-between items-center bg-card border border-border-crm rounded-2xl p-2.5 shadow-xs text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="bg-primary/10 p-2 rounded-xl text-primary border border-primary/20">
              <ListFilter className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-txt-secondary">Quotation Filters</h4>
              <p className="text-[10px] text-txt-secondary mt-0.5">Filter quotations list by individual salesperson or team workload</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Quotations' },
              { id: 'my', label: 'My Quotations' },
              { id: 'team', label: 'Team Quotations' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer shadow-xs ${
                  activeFilter === f.id
                    ? 'bg-primary text-white border-primary/50'
                    : 'bg-card text-txt-secondary border-border-crm hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* {!isManager && (
        <div className="bg-card border border-border-crm rounded-2xl p-4 flex items-center space-x-2 text-txt-secondary select-none shadow-xs">
          <span className="font-bold text-xs">Viewing Quotations Assigned To You ({filteredQuotations.length} quotes)</span>
        </div>
      )} */}

      <div className="bg-card border border-border-crm rounded-2xl shadow-xs overflow-hidden text-xs">
        {/* ===================== Quotations Table ===================== */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-bg-main border-b border-black  text-xs font-bold text-black uppercase tracking-wider select-none">
                <th className="px-6 py-4 text-left">Quotation No.</th>
                <th className="px-6 py-4 text-left">Client</th>
                <th className="px-6 py-4 text-left">Company</th>
                <th className="px-6 py-4 text-left">Quotation Date</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.length > 0 ? (
                filteredQuotations.map((quote: any) => (
                  <tr
                    key={quote.id}
                    className="border-b border-border-crm hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedQuote(quote)}
                  >
                    <td className="px-6 py-4 font-bold text-primary">{quote.quotationNumber || "-"}</td>
                    <td className="px-6 py-4">{quote.customerNameSnapshot || "-"}</td>
                    <td className="px-6 py-4">{quote.customerCompanyNameSnapshot || "-"}</td>
                    <td className="px-6 py-4">{quote.quotationDate ? new Date(quote.quotationDate).toLocaleDateString() : "-"}</td>
                    <td className="px-6 py-4 text-right font-bold">
                      {getCurrencySymbol(quote.currency || "INR")}{Number(quote.total || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider
                          ${quote.status === "Draft"
                            ? "bg-gray-100 text-gray-700 border border-gray-200"
                            : quote.status === "Sent"
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : quote.status === "Confirmed"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors duration-150"
                        >
                          View
                        </button>
                        {quote.status === "Draft" && (
                          <>
                            <button
                              onClick={() => handleEdit(quote)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/50 cursor-pointer transition-colors duration-150"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleSend(quote)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50 cursor-pointer transition-colors duration-150"
                            >
                              Send
                            </button>
                            <button
                              onClick={() => handlePrint(quote)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 cursor-pointer transition-colors duration-150"
                            >
                              Print
                            </button>
                            <button
                              onClick={() => handleDelete(quote.id)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 cursor-pointer transition-colors duration-150"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {quote.status === "Sent" && (
                          <>
                            <button
                              onClick={() => handleSend(quote)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50 cursor-pointer transition-colors duration-150"
                            >
                              Resend
                            </button>
                            <button
                              onClick={() => handlePrint(quote)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 cursor-pointer transition-colors duration-150"
                            >
                              Print
                            </button>
                            <button
                              onClick={() => handleConfirm(quote.id)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 hover:bg-green-100 text-green-700 border border-green-200/50 cursor-pointer transition-colors duration-150"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleCancel(quote.id)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/50 cursor-pointer transition-colors duration-150"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {quote.status === "Confirmed" && (
                          <button
                            onClick={() => handlePrint(quote)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 cursor-pointer transition-colors duration-150"
                          >
                            Print
                          </button>
                        )}
                        {quote.status === "Cancelled" && (
                          <button
                            onClick={() => handlePrint(quote)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50 cursor-pointer transition-colors duration-150"
                          >
                            Print
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    No Quotations Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* ===================== Quotation Details Modal (High-Fidelity) ===================== */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:bg-white print:p-0 print:absolute print:inset-0 print:block">
          <style>{`
            @media print {
              @page {
                size: auto;
                margin: 0;
              }
              body {
                padding: 0.6cm !important;
                background-color: white !important;
              }
              html, body {
                height: auto !important;
                overflow: visible !important;
              }
            }
          `}</style>
          <div className="bg-card rounded-2xl shadow-2xl w-[1300px] max-w-[98%] h-[95vh] flex flex-col text-txt-primary border border-border-crm overflow-hidden print:w-full print:max-w-full print:h-auto print:shadow-none print:border-none print:bg-white print:overflow-visible">
            
            {/* Top Header Actions Bar (Image 2) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-crm px-6 py-4 bg-slate-50/50 shrink-0 gap-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Quotation</p>
                <div className="flex items-center gap-3.5 mt-1">
                  <h2 className="text-xl font-extrabold text-txt-primary tracking-tight">
                    {selectedQuote.quotationNumber}
                  </h2>
                  <span
                    className={`px-3 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                      ${selectedQuote.status === "Draft"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : selectedQuote.status === "Sent"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : selectedQuote.status === "Confirmed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                  >
                    {selectedQuote.status}
                  </span>
                </div>
              </div>

              {/* Middle Metadata */}
              <div className="flex flex-wrap gap-4 text-xs text-txt-secondary md:mx-auto">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Quotation Date: <b>{formatQuotationDate(selectedQuote.quotationDate)}</b></span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Valid Till: <b>{formatQuotationDate(selectedQuote.expirationDate)}</b></span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                  <span>Currency: <b>{selectedQuote.currency || "INR"}</b></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={() => handleSend(selectedQuote)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Send by Outlook
                </button>
                {/* <button
                  onClick={() => window.print()}
                  className="bg-white hover:bg-slate-50 text-txt-primary border border-border-crm font-semibold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Preview PDF
                </button> */}
                {/* <button
                  onClick={() => window.print()}
                  className="bg-white hover:bg-slate-50 text-txt-primary border border-border-crm font-semibold text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-xs animate-pulse"
                >
                  Download PDF
                </button> */}
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="p-1 hover:bg-slate-200 rounded-lg cursor-pointer ml-1.5 transition"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* High-Fidelity Invoice Body Grid (Image 1) */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs bg-slate-50/20 print:overflow-y-visible print:h-auto print:p-0 print:grid print:grid-cols-2 print:gap-3 lg:space-y-0">
              
              {/* 1. Customer Information (Read-only Snapshot values) */}
              <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs space-y-4 print:break-inside-avoid lg:col-span-1 print:col-span-1">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg border border-indigo-100">
                    <User className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-txt-primary">Customer Information</h3>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Customer Name</span>
                    <span className="font-bold text-txt-primary">{selectedQuote.customerNameSnapshot || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Company Name</span>
                    <span className="font-medium text-txt-primary">{selectedQuote.customerCompanyNameSnapshot || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Email</span>
                    <span className="text-primary font-medium hover:underline">
                      <a href={`mailto:${selectedQuote.customerEmailSnapshot}`}>{selectedQuote.customerEmailSnapshot || "-"}</a>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Phone</span>
                    <span className="font-medium text-txt-primary">{selectedQuote.customerPhoneSnapshot || "-"}</span>
                  </div>
                </div>
              </div>

              {/* 2. Address Snapshots */}
              <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs space-y-4 print:break-inside-avoid lg:col-span-1 print:col-span-1">
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
                      {(selectedQuote.billingAddressSnapshot || "-").split(", ").join("\n")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[10px] text-indigo-600 uppercase tracking-wider mb-2">Shipping Address</h4>
                    <p className="leading-relaxed font-medium text-txt-primary whitespace-pre-line">
                      {(selectedQuote.shippingAddressSnapshot || "-").split(", ").join("\n")}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Quotation Details */}
              <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs space-y-4 print:break-inside-avoid lg:col-span-1 print:col-span-1">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg border border-indigo-100">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-txt-primary">Quotation Details</h3>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Quotation Number</span>
                    <span className="font-extrabold text-txt-primary">{selectedQuote.quotationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Quotation Date</span>
                    <span className="font-medium text-txt-primary">{formatQuotationDateTime(selectedQuote.quotationDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Valid Till</span>
                    <span className="font-medium text-txt-primary">{formatQuotationDate(selectedQuote.expirationDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Currency</span>
                    <span className="font-bold text-txt-primary">{selectedQuote.currency || "INR"}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-50 pt-2">
                    <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Status</span>
                    <span className="font-extrabold text-amber-600 uppercase tracking-wide">{selectedQuote.status}</span>
                  </div>
                </div>
              </div>

              {/* 4. Pricing Summary Card */}
              <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs flex flex-col space-y-4 print:break-inside-avoid lg:col-span-1 print:col-span-1">
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
                      {getCurrencySymbol(selectedQuote.currency || "INR")}{Number(selectedQuote.subtotal || 0).toLocaleString()}
                    </span>
                  </div>

                  {selectedQuote.discountPercent > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-semibold border-b border-dashed border-slate-100 pb-2">
                      <span>Discount ({selectedQuote.discountPercent.toFixed(2)}%)</span>
                      <span>
                        -{getCurrencySymbol(selectedQuote.currency || "INR")}{Number((selectedQuote.subtotal || 0) * selectedQuote.discountPercent / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center font-bold text-txt-primary">
                    <span>Taxable Amount</span>
                    <span>
                      {getCurrencySymbol(selectedQuote.currency || "INR")}{Number((selectedQuote.subtotal || 0) - ((selectedQuote.subtotal || 0) * (selectedQuote.discountPercent || 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {selectedQuote.cgst > 0 && (
                    <div className="flex justify-between items-center">
                      <span>CGST (9%)</span>
                      <span>{getCurrencySymbol(selectedQuote.currency || "INR")}{Number(selectedQuote.cgst).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {selectedQuote.sgst > 0 && (
                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-2">
                      <span>SGST (9%)</span>
                      <span>{getCurrencySymbol(selectedQuote.currency || "INR")}{Number(selectedQuote.sgst).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {selectedQuote.igst > 0 && (
                    <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-2">
                      <span>IGST (18%)</span>
                      <span>{getCurrencySymbol(selectedQuote.currency || "INR")}{Number(selectedQuote.igst).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span>Tax Amount</span>
                    <span className="font-semibold text-txt-primary">
                      {getCurrencySymbol(selectedQuote.currency || "INR")}{Number(selectedQuote.tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Shipping Charge</span>
                    <span className="font-semibold text-txt-primary">
                      {getCurrencySymbol(selectedQuote.currency || "INR")}{Number(selectedQuote.shippingCharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span>Other Charges</span>
                    <span className="font-semibold text-txt-primary">
                      {getCurrencySymbol(selectedQuote.currency || "INR")}{Number(selectedQuote.otherCharges || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500 border-b border-slate-200 pb-2">
                    <span>Round Off</span>
                    <span className="font-semibold">
                      {selectedQuote.roundOff > 0 ? "+" : ""}{getCurrencySymbol(selectedQuote.currency || "INR")}{Number(selectedQuote.roundOff || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-extrabold text-indigo-700 bg-indigo-50/70 rounded-xl p-3 border border-indigo-100/50">
                    <span className="uppercase tracking-wider">Grand Total</span>
                    <span>
                      {getCurrencySymbol(selectedQuote.currency || "INR")}{Number(selectedQuote.total || selectedQuote.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Products List (colSpan 2) */}
              <div className="lg:col-span-2 bg-card border border-border-crm rounded-2xl p-5 shadow-xs flex flex-col space-y-4 print:col-span-2">
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
                      {selectedQuote.items && selectedQuote.items.length > 0 ? (
                        selectedQuote.items.map((item: any, idx: number) => {
                          const discRate = Number(item.discount || 0);
                          const amtVal = (Number(item.quantity) * Number(item.unitPrice)) * (1 - discRate / 100);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 print:break-inside-avoid">
                              <td className="px-4 py-3 text-center text-slate-455">{idx + 1}</td>
                              <td className="px-4 py-3 font-semibold">{item.product || "-"}</td>
                              <td className="px-4 py-3 text-slate-500">{item.description || "-"}</td>
                              <td className="px-4 py-3 text-center font-medium">{Number(item.quantity).toFixed(2)}</td>
                              <td className="px-4 py-3 text-center">
                                {getCurrencySymbol(selectedQuote.currency || "INR")}{Number(item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-center font-medium">{discRate > 0 ? `${discRate}%` : "0.00"}</td>
                              <td className="px-4 py-3 text-center">{item.tax}%</td>
                              <td className="px-4 py-3 text-right font-bold">
                                {getCurrencySymbol(selectedQuote.currency || "INR")}{amtVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs space-y-2 font-mono print:break-inside-avoid lg:col-span-2 print:col-span-1">
                <h4 className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Terms & Conditions</h4>
                <p className="text-txt-primary leading-relaxed whitespace-pre-wrap">{selectedQuote.termsConditions || "Standard terms apply."}</p>
              </div>

              {/* 7. Internal Notes Card */}
              <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs space-y-2 print:break-inside-avoid lg:col-span-1 print:col-span-1">
                <h4 className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider">Internal Notes</h4>
                <p className="text-txt-primary leading-relaxed whitespace-pre-wrap">{selectedQuote.internalNotes || "No internal comments."}</p>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-border-crm px-6 py-4 flex justify-end gap-3 shrink-0 bg-slate-50/50 print:hidden">
              <button
                onClick={() => setSelectedQuote(null)}
                className="border border-border-crm rounded-xl px-5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => handlePrint(selectedQuote)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2 transition cursor-pointer text-xs font-semibold shadow-sm"
              >
                Print Quotation
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================== Edit Quote Modal ===================== */}
      {showQuoteModal && editingQuote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border-crm rounded-2xl shadow-2xl w-[1300px] max-w-[98%] h-[95vh] flex flex-col text-txt-primary">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border-crm px-6 py-4 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-txt-primary tracking-tight">Edit Quotation Draft</h2>
                <p className="text-xs text-txt-secondary mt-0.5">Modify the quotation details and line items</p>
              </div>
              <button
                onClick={() => {
                  setEditingQuote(null);
                  setShowQuoteModal(false);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleQuoteSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-slate-50/50">
              
              {/* Row 1: Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Customer Info */}
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
                        required
                        className="crm-input"
                        value={quoteForm.customerName}
                        onChange={(e) => setQuoteForm({ ...quoteForm, customerName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Company Name</label>
                      <input
                        required
                        className="crm-input"
                        value={quoteForm.company}
                        onChange={(e) => setQuoteForm({ ...quoteForm, company: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Email</label>
                        <input
                          type="email"
                          required
                          className="crm-input"
                          value={quoteForm.email}
                          onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Phone</label>
                        <input
                          required
                          className="crm-input"
                          value={quoteForm.phone}
                          onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Addresses */}
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
                    <div className="space-y-2">
                      <h4 className="font-bold text-[10px] text-indigo-600 uppercase tracking-wider mb-2">Billing Address</h4>
                      <input placeholder="Street" className="crm-input" value={billingStreet} onChange={(e) => setBillingStreet(e.target.value)} />
                      <input placeholder="City" className="crm-input" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} />
                      <input placeholder="State" className="crm-input" value={billingState} onChange={(e) => setBillingState(e.target.value)} />
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Country" className="crm-input" value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)} />
                        <input placeholder="Zip" className="crm-input" value={billingZip} onChange={(e) => setBillingZip(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[10px] text-indigo-600 uppercase tracking-wider mb-2">Shipping Address</h4>
                      <input placeholder="Street" disabled={sameAsBilling} className={`crm-input ${sameAsBilling ? "bg-slate-50" : ""}`} value={shippingStreet} onChange={(e) => setShippingStreet(e.target.value)} />
                      <input placeholder="City" disabled={sameAsBilling} className={`crm-input ${sameAsBilling ? "bg-slate-50" : ""}`} value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} />
                      <input placeholder="State" disabled={sameAsBilling} className={`crm-input ${sameAsBilling ? "bg-slate-50" : ""}`} value={shippingState} onChange={(e) => setShippingState(e.target.value)} />
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Country" disabled={sameAsBilling} className={`crm-input ${sameAsBilling ? "bg-slate-50" : ""}`} value={shippingCountry} onChange={(e) => setShippingCountry(e.target.value)} />
                        <input placeholder="Zip" disabled={sameAsBilling} className={`crm-input ${sameAsBilling ? "bg-slate-50" : ""}`} value={shippingZip} onChange={(e) => setShippingZip(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Details */}
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
                      <input className="crm-input bg-slate-50 text-slate-450 font-bold" value={editingQuote.quotationNumber} readOnly />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Salesperson</label>
                      <input className="crm-input" value={quoteForm.salesperson} onChange={(e) => setQuoteForm({ ...quoteForm, salesperson: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Quotation Date</label>
                      <input type="datetime-local" className="crm-input" value={quoteForm.quotationDate} onChange={(e) => setQuoteForm({ ...quoteForm, quotationDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Valid Till</label>
                      <input type="date" className="crm-input" value={quoteForm.expirationDate} onChange={(e) => setQuoteForm({ ...quoteForm, expirationDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Payment Terms</label>
                      <select
                        className="crm-input"
                        value={["Immediate Payment", "15 Days", "30 Days", "45 Days"].includes(quoteForm.paymentTerms) ? quoteForm.paymentTerms : "Other"}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "Other") {
                            setQuoteForm({ ...quoteForm, paymentTerms: "" });
                          } else {
                            setQuoteForm({ ...quoteForm, paymentTerms: val });
                          }
                        }}
                      >
                        <option value="Immediate Payment">Immediate Payment</option>
                        <option value="15 Days">15 Days</option>
                        <option value="30 Days">30 Days</option>
                        <option value="45 Days">45 Days</option>
                        <option value="Other">Other (Custom)</option>
                      </select>
                      {!["Immediate Payment", "15 Days", "30 Days", "45 Days"].includes(quoteForm.paymentTerms) && (
                        <input
                          type="text"
                          className="crm-input mt-2"
                          placeholder="Enter custom payment terms..."
                          value={quoteForm.paymentTerms}
                          onChange={(e) => setQuoteForm({ ...quoteForm, paymentTerms: e.target.value })}
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Currency</label>
                      <select
                        className="crm-input"
                        value={["INR", "USD", "EUR"].includes(quoteForm.currency) ? quoteForm.currency : "Other"}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "Other") {
                            setQuoteForm({ ...quoteForm, currency: "" });
                          } else {
                            setQuoteForm({ ...quoteForm, currency: val });
                          }
                        }}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="Other">Other (Custom)</option>
                      </select>
                      {!["INR", "USD", "EUR"].includes(quoteForm.currency) && (
                        <input
                          type="text"
                          className="crm-input mt-2"
                          placeholder="Enter custom currency (e.g. GBP)..."
                          value={quoteForm.currency}
                          onChange={(e) => setQuoteForm({ ...quoteForm, currency: e.target.value })}
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1 uppercase text-[9px] tracking-wider">Tax Split Rates (%) </label>
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

              {/* Row 2: Dynamic Items & summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Products Table Card */}
                <div className="lg:col-span-2 bg-card border border-border-crm rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-sm text-txt-primary">Products / Services</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const copy = [...quoteForm.items];
                        copy.push({ product: "", description: "", quantity: 1, unitPrice: 0, tax: 18, discount: 0, subtotal: 0 });
                        setQuoteForm({ ...quoteForm, items: copy });
                      }}
                      className="border border-indigo-500 hover:bg-indigo-50 text-indigo-600 font-bold px-4 py-1.5 rounded-xl transition cursor-pointer text-xs"
                    >
                      + Add Product / Service
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-border-crm text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                          <th className="px-3 py-2.5 text-center">#</th>
                          <th className="px-3 py-2.5">Product</th>
                          <th className="px-3 py-2.5">Description</th>
                          <th className="px-3 py-2.5 w-16 text-center">Qty</th>
                          <th className="px-3 py-2.5 w-24 text-center">Unit Price</th>
                          <th className="px-3 py-2.5 w-16 text-center">Discount %</th>
                          <th className="px-3 py-2.5 w-20 text-center">Tax (%)</th>
                          <th className="px-3 py-2.5 w-24 text-right">Amount</th>
                          <th className="px-3 py-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-crm">
                        {quoteForm.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-center text-slate-400">{index + 1}</td>
                            <td className="px-2 py-2">
                              <input
                                required
                                className="w-full border rounded-lg px-2 py-1"
                                value={item.product}
                                onChange={(e) => {
                                  const copy = [...quoteForm.items];
                                  copy[index].product = e.target.value;
                                  setQuoteForm({ ...quoteForm, items: copy });
                                }}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                className="w-full border rounded-lg px-2 py-1"
                                value={item.description}
                                onChange={(e) => {
                                  const copy = [...quoteForm.items];
                                  copy[index].description = e.target.value;
                                  setQuoteForm({ ...quoteForm, items: copy });
                                }}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number" required min="1"
                                className="w-full border rounded-lg px-1.5 py-1 text-center"
                                value={item.quantity}
                                onChange={(e) => {
                                  const copy = [...quoteForm.items];
                                  copy[index].quantity = Number(e.target.value);
                                  copy[index].subtotal = copy[index].quantity * copy[index].unitPrice * (1 - (copy[index].discount || 0) / 100);
                                  setQuoteForm({ ...quoteForm, items: copy });
                                }}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number" required min="0"
                                className="w-full border rounded-lg px-1.5 py-1 text-center"
                                value={item.unitPrice}
                                onChange={(e) => {
                                  const copy = [...quoteForm.items];
                                  copy[index].unitPrice = Number(e.target.value);
                                  copy[index].subtotal = copy[index].quantity * copy[index].unitPrice * (1 - (copy[index].discount || 0) / 100);
                                  setQuoteForm({ ...quoteForm, items: copy });
                                }}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number" min="0" max="100"
                                className="w-full border rounded-lg px-1.5 py-1 text-center"
                                value={item.discount}
                                onChange={(e) => {
                                  const copy = [...quoteForm.items];
                                  copy[index].discount = Number(e.target.value);
                                  copy[index].subtotal = copy[index].quantity * copy[index].unitPrice * (1 - (copy[index].discount || 0) / 100);
                                  setQuoteForm({ ...quoteForm, items: copy });
                                }}
                              />
                            </td>
                            <td className="px-2 py-2">
                              <select
                                className="w-full border rounded-lg px-1 py-1 text-center"
                                value={[18, 12, 5, 0].includes(Number(item.tax)) ? Number(item.tax) : "Other"}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const copy = [...quoteForm.items];
                                  if (val === "Other") {
                                    copy[index].tax = 28;
                                  } else {
                                    copy[index].tax = Number(val);
                                  }
                                  setQuoteForm({ ...quoteForm, items: copy });
                                }}
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
                                  onChange={(e) => {
                                    const copy = [...quoteForm.items];
                                    copy[index].tax = e.target.value === "" ? 0 : Number(e.target.value);
                                    setQuoteForm({ ...quoteForm, items: copy });
                                  }}
                                  className="w-full border rounded-lg px-1 py-1 mt-1 text-center focus:outline-none text-xs"
                                />
                              )}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-txt-primary">
                              {getCurrencySymbol(quoteForm.currency)}{item.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (quoteForm.items.length <= 1) return;
                                  const copy = [...quoteForm.items];
                                  copy.splice(index, 1);
                                  setQuoteForm({ ...quoteForm, items: copy });
                                }}
                                disabled={quoteForm.items.length <= 1}
                                className="text-rose-500 hover:bg-slate-100 p-1 rounded-lg"
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
                    <h3 className="font-extrabold text-sm text-txt-primary">Pricing Summary</h3>
                  </div>
                  <div className="space-y-2.5 text-txt-secondary">
                    <div className="flex justify-between items-center">
                      <span>Subtotal</span>
                      <span className="font-bold text-txt-primary">{getCurrencySymbol(quoteForm.currency)}{calculatedSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Discount (%)</span>
                      <input
                        type="number"
                        className="crm-input text-right w-24 py-0.5 px-1.5"
                        value={quoteForm.discountPercent}
                        onChange={(e) => setQuoteForm({ ...quoteForm, discountPercent: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex justify-between items-center text-rose-600 font-semibold border-b border-dashed border-slate-100 pb-2">
                      <span>Discount Amt</span>
                      <span>-{getCurrencySymbol(quoteForm.currency)}{calculatedDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-txt-primary">
                      <span>Taxable Amount</span>
                      <span>{getCurrencySymbol(quoteForm.currency)}{calculatedTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    {(formCgst > 0 || formSgst > 0 || formIgst === 0) && (
                      <>
                        <div className="flex justify-between items-center">
                          <span>CGST ({formCgstPercent}%)</span>
                          <span>{getCurrencySymbol(quoteForm.currency)}{formCgst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-2">
                          <span>SGST ({formSgstPercent}%)</span>
                          <span>{getCurrencySymbol(quoteForm.currency)}{formSgst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </>
                    )}
                    {formIgst > 0 && (
                      <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-2">
                        <span>IGST ({formIgstPercent}%)</span>
                        <span>{getCurrencySymbol(quoteForm.currency)}{formIgst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span>Tax Amount</span>
                      <span className="font-semibold text-txt-primary">{getCurrencySymbol(quoteForm.currency)}{formTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-extrabold text-indigo-700 bg-indigo-50/70 rounded-xl p-3 border border-indigo-100/50">
                      <span className="uppercase tracking-wider">Grand Total</span>
                      <span>{getCurrencySymbol(quoteForm.currency)}{roundedGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Row 3: Notes & Terms */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs space-y-2">
                  <label className="block text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">Terms & Conditions</label>
                  <textarea rows={4} className="crm-input text-xs font-mono" value={quoteForm.termsConditions} onChange={(e) => setQuoteForm({ ...quoteForm, termsConditions: e.target.value })} />
                </div>
                <div className="bg-card border border-border-crm rounded-2xl p-5 shadow-xs space-y-2">
                  <label className="block text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">Internal Notes</label>
                  <textarea rows={4} className="crm-input text-xs" value={quoteForm.internalNotes} onChange={(e) => setQuoteForm({ ...quoteForm, internalNotes: e.target.value })} />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border-crm shrink-0 text-xs bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => {
                    setEditingQuote(null);
                    setShowQuoteModal(false);
                  }}
                  className="px-5 py-2 border border-border-crm rounded-xl hover:bg-slate-100 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary hover:bg-indigo-700 text-white rounded-xl shadow cursor-pointer font-semibold"
                >
                  Update Quotation
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}