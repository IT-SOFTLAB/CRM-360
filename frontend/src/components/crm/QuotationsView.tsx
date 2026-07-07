import React, { useState, useEffect, useMemo } from "react";
import { Plus, X, ListFilter } from "lucide-react";
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

  // Load Sales Teams to resolve member names
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

  const [quoteForm, setQuoteForm] = useState({
    customerName: "",
    company: "",
    opportunityId: "",

    email: "",
    phone: "",
    salesperson: "",

    quotationDate: "",
    expirationDate: "",

    paymentTerms: "",
    currency: "INR",

    notes: "",

    subtotal: 0,
    tax: 0,
discount: 0,
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

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subtotal = quoteForm.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );
    const taxPercent = Number(quoteForm.tax) || 0;
    const taxAmount = (subtotal * taxPercent) / 100;
    const discountPercent = Number(quoteForm.discount) || 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const total = subtotal + taxAmount - discountAmount;

    if (editingQuote) {
      const payload = {
        customerName: quoteForm.customerName,
        company: quoteForm.company,
        opportunityId: quoteForm.opportunityId,
        email: quoteForm.email,
        phone: quoteForm.phone,
        salesperson: quoteForm.salesperson,
        quotationDate: quoteForm.quotationDate,
        expirationDate: quoteForm.expirationDate,
        paymentTerms: quoteForm.paymentTerms,
        currency: quoteForm.currency,
        notes: quoteForm.notes,
        subtotal,
        tax: taxAmount,
        total,
        items: quoteForm.items.map(item => ({
          product: item.product || "",
          description: item.description || "",
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          tax: taxPercent,
          discount: Number(item.discount || 0),
          subtotal: Number(item.quantity) * Number(item.unitPrice)
        })),
      };
      onUpdateQuotation(editingQuote.id, payload);
    } else {
      const payload = {
        ...quoteForm,
        subtotal,
        tax: taxAmount,
        total,
        items: quoteForm.items.map(item => ({
          ...item,
          tax: taxPercent
        }))
      };
      onCreateQuotation(payload);
    }

    setQuoteForm({
      customerName: "",
      company: "",
      opportunityId: "",
      email: "",
      phone: "",
      salesperson: "",
      quotationDate: "",
      expirationDate: "",
      paymentTerms: "Immediate Payment",
      currency: "INR",
      notes: "",
      subtotal: 0,
      tax: 18,
      discount: 0,
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
    setEditingQuote(null);
    setShowQuoteModal(false);
  };

  const handleEdit = (quote: any) => {
    setEditingQuote(quote);
    setQuoteForm({
      customerName: quote.customerName || "",
      company: quote.company || "",
      opportunityId: quote.opportunityId || "",
      email: quote.email || "",
      phone: quote.phone || "",
      salesperson: quote.salesperson || "",
      quotationDate: quote.quotationDate ? quote.quotationDate.slice(0, 10) : "",
      expirationDate: quote.expirationDate ? quote.expirationDate.slice(0, 10) : "",
      paymentTerms: quote.paymentTerms || "Immediate Payment",
      currency: quote.currency || "INR",
      notes: quote.notes || "",
      subtotal: quote.subtotal || 0,
      tax: quote.items?.[0]?.tax !== undefined ? quote.items[0].tax : 18,
      discount: quote.items?.[0]?.discount !== undefined ? quote.items[0].discount : 0,
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
    const handleSend = (quote: any) => {
      onApproveReject(quote.id, "Sent");
    };

    const handlePrint = (quote: any) => {
      setSelectedQuote(quote);

      setTimeout(() => {
        window.print();
      }, 200);
    };

    const handleDelete = (id: string) => {
      if (confirm("Delete this quotation?")) {
        // call delete quotation api
      }
    };

    const handleConfirm = (id: string) => {
      onApproveReject(id, "Confirmed");
    };

    const handleCancel = (id: string) => {
      onApproveReject(id, "Cancelled");
    };

    const handleInvoice = (quote: any) => {
      console.log("Create Invoice", quote);
    };
    return (
      <div className="space-y-6">
        {/* Manager Filter Header */}
        {isManager && (
          <div className="bg-card border border-border-crm rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm shrink-0 text-txt-primary">
            <div className="flex items-center space-x-2.5">
              <div className="bg-primary/10 p-2 rounded-xl text-primary border border-primary/20">
                <ListFilter className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-txt-secondary">Manager Quotation Filters</h4>
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
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer shadow-sm ${
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

        {!isManager && (
          <div className="bg-card border border-border-crm rounded-2xl p-4 flex items-center space-x-2 text-txt-secondary select-none shadow-sm">
            <span className="font-bold text-xs">Viewing Quotations Assigned To You ({filteredQuotations.length} quotes)</span>
          </div>
        )}

        <div className="bg-card border border-border-crm rounded-2xl shadow-xs overflow-hidden text-xs">
          {/* ===================== Quotations Table ===================== */}
  
          <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="bg-bg-main border-b border-border-crm text-xs uppercase font-bold text-txt-secondary">

                <th className="px-6 py-4 text-left">
                  Quotation No.
                </th>

                <th className="px-6 py-4 text-left">
                  Customer
                </th>

                <th className="px-6 py-4 text-left">
                  Company
                </th>

                <th className="px-6 py-4 text-left">
                  Quotation Date
                </th>

                <th className="px-6 py-4 text-right">
                  Total
                </th>

                <th className="px-6 py-4 text-center">
                  Status
                </th>

                <th className="px-6 py-4 text-center">
                  Actions
                </th>

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

                    <td className="px-6 py-4 font-bold text-primary">
                      {quote.quotationNumber || "-"}
                    </td>

                    <td className="px-6 py-4">
                      {quote.customerName || "-"}
                    </td>

                    <td className="px-6 py-4">
                      {quote.company || "-"}
                    </td>

                    <td className="px-6 py-4">
                      {quote.quotationDate
                        ? new Date(
                          quote.quotationDate
                        ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-6 py-4 text-right font-bold">

                      ₹{Number(
                        quote.total || quote.grandTotal || 0
                      ).toLocaleString()}

                    </td>

                    <td className="px-6 py-4 text-center">

                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold

    ${quote.status === "Draft"
                            ? "bg-gray-100 text-gray-700"

                            : quote.status === "Sent"
                              ? "bg-blue-100 text-blue-700"

                              : quote.status === "Confirmed"
                                ? "bg-green-100 text-green-700"

                                : "bg-red-100 text-red-700"
                          }`}
                      >
                        {quote.status}
                      </span>

                    </td>

                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-wrap gap-2 justify-center">

                        {/* Always */}

                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="px-3 py-1 rounded bg-slate-200"
                        >
                          View
                        </button>

                        {quote.status === "Draft" && (
                          <>
                            <button
                              onClick={() => handleEdit(quote)}
                              className="px-3 py-1 rounded bg-blue-500 text-white"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleSend(quote)}
                              className="px-3 py-1 rounded bg-purple-600 text-white"
                            >
                              Send
                            </button>

                            <button
                              onClick={() => handlePrint(quote)}
                              className="px-3 py-1 rounded bg-green-600 text-white"
                            >
                              Print
                            </button>

                            <button
                              onClick={() => handleDelete(quote.id)}
                              className="px-3 py-1 rounded bg-red-600 text-white"
                            >
                              Delete
                            </button>
                          </>
                        )}

                        {quote.status === "Sent" && (
                          <>
                            <button
                              onClick={() => handleSend(quote)}
                              className="px-3 py-1 rounded bg-purple-600 text-white"
                            >
                              Resend
                            </button>

                            <button
                              onClick={() => handlePrint(quote)}
                              className="px-3 py-1 rounded bg-green-600 text-white"
                            >
                              Print
                            </button>

                            <button
                              onClick={() => handleConfirm(quote.id)}
                              className="px-3 py-1 rounded bg-emerald-600 text-white"
                            >
                              Confirm
                            </button>

                            <button
                              onClick={() => handleCancel(quote.id)}
                              className="px-3 py-1 rounded bg-red-600 text-white"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {quote.status === "Confirmed" && (
                          <>
                            <button
                              onClick={() => handlePrint(quote)}
                              className="px-3 py-1 rounded bg-green-600 text-white"
                            >
                              Print
                            </button>
                          </>
                        )}

                        {quote.status === "Cancelled" && (
                          <button
                            onClick={() => handlePrint(quote)}
                            className="px-3 py-1 rounded bg-green-600 text-white"
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

                  <td
                    colSpan={7}
                    className="text-center py-12 text-slate-400"
                  >

                    No Quotations Found

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>
        {/* ===================== Quotation Details Modal ===================== */}

        {selectedQuote && (

          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-5 z-50">

            <div className="bg-card rounded-2xl shadow-2xl w-[950px] max-w-[95%] max-h-[90vh] overflow-y-auto">

              {/* Header */}

              <div className="flex justify-between items-center border-b border-border-crm p-6">

                <div>

                  <h2 className="text-2xl font-bold text-primary">
                    Quotation Details
                  </h2>

                  <p className="text-sm text-txt-secondary mt-1">
                    Quotation No :
                    <b className="ml-2">
                      {selectedQuote.quotationNumber}
                    </b>
                  </p>

                </div>

                <button
                  onClick={() => setSelectedQuote(null)}
                  className="hover:bg-slate-100 rounded-lg p-2"
                >
                  <X className="w-5 h-5" />
                </button>

              </div>

              {/* Customer + Quotation Details */}

              <div className="grid grid-cols-2 gap-8 p-6 border-b border-border-crm">

                <div>

                  <h3 className="font-bold text-lg mb-4">
                    Customer Information
                  </h3>

                  <div className="space-y-2">

                    <p>
                      <b>Customer :</b> {selectedQuote.customerName || "-"}
                    </p>

                    <p>
                      <b>Company :</b> {selectedQuote.company || "-"}
                    </p>

                    <p>
                      <b>Email :</b> {selectedQuote.email || "-"}
                    </p>

                    <p>
                      <b>Phone :</b> {selectedQuote.phone || "-"}
                    </p>

                  </div>

                </div>

                <div>

                  <h3 className="font-bold text-lg mb-4">
                    Quotation Information
                  </h3>

                  <div className="space-y-2">

                    <p>
                      <b>Salesperson :</b> {selectedQuote.salesperson || "-"}
                    </p>

                    <p>
                      <b>Quotation Date :</b>{" "}
                      {selectedQuote.quotationDate
                        ? new Date(
                          selectedQuote.quotationDate
                        ).toLocaleDateString()
                        : "-"}
                    </p>

                    <p>
                      <b>Expiry Date :</b>{" "}
                      {selectedQuote.expirationDate
                        ? new Date(
                          selectedQuote.expirationDate
                        ).toLocaleDateString()
                        : "-"}
                    </p>

                    <p>
                      <b>Currency :</b>{" "}
                      {selectedQuote.currency || "INR"}
                    </p>

                    <p>

                      <b>Status :</b>

                      <span
                        className={`ml-2 px-3 py-1 rounded-full text-xs font-bold

${selectedQuote.status === "Draft"
                            ? "bg-gray-100 text-gray-700"

                            : selectedQuote.status === "Sent"
                              ? "bg-blue-100 text-blue-700"

                              : selectedQuote.status === "Confirmed"
                                ? "bg-green-100 text-green-700"

                                : "bg-red-100 text-red-700"

                          }`}
                      >

                        {selectedQuote.status}

                      </span>

                    </p>

                  </div>

                </div>

              </div>

              {/* Payment Information */}

              <div className="grid grid-cols-2 gap-8 p-6 border-b border-border-crm">

                <div>

                  <h3 className="font-bold text-lg mb-4">
                    Payment Details
                  </h3>

                  <div className="space-y-2">

                    <p>
                      <b>Payment Terms :</b>{" "}
                      {selectedQuote.paymentTerms || "-"}
                    </p>

                    <p>
                      <b>Currency :</b>{" "}
                      {selectedQuote.currency || "INR"}
                    </p>

                  </div>

                </div>

                <div>

                  <h3 className="font-bold text-lg mb-4">
                    Notes
                  </h3>

                  <div className="bg-slate-50 rounded-lg p-4 min-h-[80px]">

                    {selectedQuote.notes
                      ? selectedQuote.notes
                      : "No Notes"}

                  </div>

                </div>

              </div>
              {/* ================= Products ================= */}

              <div className="p-6">

                <h3 className="text-lg font-bold mb-4">
                  Products
                </h3>

                <div className="border border-border-crm rounded-xl overflow-hidden">

                  <table className="w-full">

                    <thead className="bg-bg-main">

                      <tr>

                        <th className="p-3 text-left">
                          Product
                        </th>

                        <th className="p-3 text-left">
                          Description
                        </th>

                        <th className="p-3 text-center">
                          Qty
                        </th>

                        <th className="p-3 text-center">
                          Unit Price
                        </th>

                        <th className="p-3 text-center">
                          Tax %
                        </th>

                        <th className="p-3 text-center">
                          Discount %
                        </th>

                        <th className="p-3 text-right">
                          Subtotal
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {selectedQuote.items &&
                        selectedQuote.items.length > 0 ? (

                        selectedQuote.items.map(
                          (item: any, index: number) => (

                            <tr
                              key={index}
                              className="border-t border-border-crm"
                            >

                              <td className="p-3 font-semibold">
                                {item.product || "-"}
                              </td>

                              <td className="p-3">
                                {item.description || "-"}
                              </td>

                              <td className="p-3 text-center">
                                {item.quantity}
                              </td>

                              <td className="p-3 text-center">
                                ₹{" "}
                                {Number(
                                  item.unitPrice || 0
                                ).toLocaleString()}
                              </td>

                              <td className="p-3 text-center">
                                {item.tax}%
                              </td>

                              <td className="p-3 text-center">
                                {item.discount}%
                              </td>

                              <td className="p-3 text-right font-bold">
                                ₹{" "}
                                {Number(
                                  item.subtotal || 0
                                ).toLocaleString()}
                              </td>

                            </tr>

                          )
                        )

                      ) : (

                        <tr>

                          <td
                            colSpan={7}
                            className="text-center py-6 text-slate-400"
                          >

                            No Products Added

                          </td>

                        </tr>

                      )}

                    </tbody>

                  </table>

                </div>

              </div>

              {/* ================= Totals ================= */}

              <div className="border-t border-border-crm p-6">

                <div className="flex justify-end">

                  <div className="w-80 space-y-3">

                    <div className="flex justify-between">

                      <span className="text-txt-secondary">
                        Subtotal
                      </span>

                      <span className="font-semibold">

                        ₹{" "}
                        {Number(
                          selectedQuote.subtotal || 0
                        ).toLocaleString()}

                      </span>

                    </div>

                    <div className="flex justify-between">

                      <span className="text-txt-secondary">
                        Tax
                      </span>

                      <span className="font-semibold">

                        ₹{" "}
                        {Number(
                          selectedQuote.tax || 0
                        ).toLocaleString()}

                      </span>

                    </div>

                    <div className="flex justify-between">

                      <span className="text-txt-secondary">
                        Grand Total
                      </span>

                      <span className="font-bold text-primary text-lg">

                        ₹{" "}
                        {Number(
                          selectedQuote.total || selectedQuote.grandTotal || 0
                        ).toLocaleString()}

                      </span>

                    </div>

                  </div>

                </div>

              </div>

              {/* ================= Footer ================= */}

              <div className="border-t border-border-crm p-6 flex justify-end gap-3">

                <button
                  onClick={() => setSelectedQuote(null)}
                  className="border border-border-crm rounded-xl px-6 py-2 hover:bg-slate-50"
                >

                  Close

                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-primary text-white rounded-xl px-6 py-2 hover:bg-primary-hover"
                >

                  Print Quotation

                </button>

              </div>

            </div>

          </div>

        )}
        {/* ================= Create Quote Modal ================= */}

        {showQuoteModal && (

          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border-crm rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col text-txt-primary">
              <h2 className="text-lg font-bold mb-4 shrink-0">
                {editingQuote ? "Update Quotation Draft" : "Generate Quotation"}
              </h2>

              <form
                onSubmit={handleQuoteSubmit}
                className="space-y-4 overflow-y-auto pr-1 flex-1"
              >
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block mb-1 font-semibold text-slate-450 uppercase text-[10px]">Customer Name</label>
                    <input
                      type="text" required
                      value={quoteForm.customerName}
                      onChange={(e) => setQuoteForm({ ...quoteForm, customerName: e.target.value })}
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-slate-450 uppercase text-[10px]">Company</label>
                    <input
                      type="text" required
                      value={quoteForm.company}
                      onChange={(e) => setQuoteForm({ ...quoteForm, company: e.target.value })}
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block mb-1 font-semibold text-slate-450 uppercase text-[10px]">Email</label>
                    <input
                      type="email"
                      value={quoteForm.email}
                      onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-slate-450 uppercase text-[10px]">Phone</label>
                    <input
                      type="text"
                      value={quoteForm.phone}
                      onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block mb-1 font-semibold text-slate-450 uppercase text-[10px]">Salesperson</label>
                    <input
                      type="text"
                      value={quoteForm.salesperson}
                      onChange={(e) => setQuoteForm({ ...quoteForm, salesperson: e.target.value })}
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-slate-450 uppercase text-[10px]">Expiration Date</label>
                    <input
                      type="date"
                      value={quoteForm.expirationDate}
                      onChange={(e) => setQuoteForm({ ...quoteForm, expirationDate: e.target.value })}
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block mb-1 font-semibold text-slate-450 uppercase text-[10px]">Payment Terms</label>
                    <select
                      value={quoteForm.paymentTerms}
                      onChange={(e) => setQuoteForm({ ...quoteForm, paymentTerms: e.target.value })}
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                    >
                      <option value="Immediate Payment">Immediate Payment</option>
                      <option value="15 Days">15 Days</option>
                      <option value="30 Days">30 Days</option>
                      <option value="45 Days">45 Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-slate-450 uppercase text-[10px]">Currency</label>
                    <select
                      value={quoteForm.currency}
                      onChange={(e) => setQuoteForm({ ...quoteForm, currency: e.target.value })}
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block mb-1 font-semibold text-slate-450 uppercase text-[10px]">Tax %</label>
                    <input
                      type="number" min="0" max="100"
                      value={quoteForm.tax}
                      onChange={(e) => setQuoteForm({ ...quoteForm, tax: Number(e.target.value) })}
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold text-slate-450 uppercase text-[10px]">Discount %</label>
                    <input
                      type="number" min="0" max="100"
                      value={quoteForm.discount}
                      onChange={(e) => setQuoteForm({ ...quoteForm, discount: Number(e.target.value) })}
                      className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block mb-1 font-semibold text-slate-450 uppercase text-[10px]">Internal Notes</label>
                  <textarea
                    rows={2}
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                    className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                  />
                </div>

                {/* Product details editor */}
                <div className="border-t border-border-crm pt-3 mt-1 text-xs">
                  <h4 className="font-bold text-[11px] text-txt-primary mb-3 uppercase tracking-wider">Product Item details</h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block mb-1 font-semibold text-slate-455 uppercase text-[10px]">Product Name</label>
                      <input
                        type="text" required
                        value={quoteForm.items[0]?.product || ""}
                        onChange={(e) => {
                          const copy = [...quoteForm.items];
                          if (!copy[0]) copy[0] = { product: "", description: "", quantity: 1, unitPrice: 0, tax: 18, discount: 0, subtotal: 0 };
                          copy[0].product = e.target.value;
                          setQuoteForm({ ...quoteForm, items: copy });
                        }}
                        className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold text-slate-455 uppercase text-[10px]">Description</label>
                      <input
                        type="text"
                        value={quoteForm.items[0]?.description || ""}
                        onChange={(e) => {
                          const copy = [...quoteForm.items];
                          if (!copy[0]) copy[0] = { product: "", description: "", quantity: 1, unitPrice: 0, tax: 18, discount: 0, subtotal: 0 };
                          copy[0].description = e.target.value;
                          setQuoteForm({ ...quoteForm, items: copy });
                        }}
                        className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-semibold text-slate-455 uppercase text-[10px]">Quantity</label>
                      <input
                        type="number" required min="1"
                        value={quoteForm.items[0]?.quantity || 1}
                        onChange={(e) => {
                          const copy = [...quoteForm.items];
                          if (!copy[0]) copy[0] = { product: "", description: "", quantity: 1, unitPrice: 0, tax: 18, discount: 0, subtotal: 0 };
                          copy[0].quantity = Number(e.target.value);
                          setQuoteForm({ ...quoteForm, items: copy });
                        }}
                        className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold text-slate-455 uppercase text-[10px]">Unit Price (₹)</label>
                      <input
                        type="number" required min="0"
                        value={quoteForm.items[0]?.unitPrice || 0}
                        onChange={(e) => {
                          const copy = [...quoteForm.items];
                          if (!copy[0]) copy[0] = { product: "", description: "", quantity: 1, unitPrice: 0, tax: 18, discount: 0, subtotal: 0 };
                          copy[0].unitPrice = Number(e.target.value);
                          setQuoteForm({ ...quoteForm, items: copy });
                        }}
                        className="w-full border border-border-crm bg-bg-main dark:bg-slate-900 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-crm shrink-0 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(false)}
                    className="px-5 py-2 border border-border-crm rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl shadow cursor-pointer font-semibold"
                  >
                    {editingQuote ? "Update Quotation" : "Create Quotation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
      </div>

    );

  }