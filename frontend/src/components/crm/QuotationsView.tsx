import React, { useState } from "react";
import { Plus, X } from "lucide-react";

interface QuotationsViewProps {
  quotations: any[];
  opportunities: any[];
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
  onApproveReject,
  onCreateQuotation,
  onUpdateQuotation,
  showQuoteModal,
  setShowQuoteModal,
  companyBranding,
}: QuotationsViewProps) {

  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [editingQuote, setEditingQuote] = useState<any>(null);
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
    console.log(quoteForm);

    if (editingQuote) {

      const subtotal = quoteForm.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      const tax =
        subtotal * 18 / 100;

      const total =
        subtotal + tax;

      const payload = {
        customerName: quoteForm.customerName,
        company: quoteForm.company,
        opportunityId: quoteForm.opportunityId,
        subtotal,
        tax,
        total,
        items: quoteForm.items.map(item => ({
          product: "",
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          tax: item.tax,
          discount: item.discount,
        })),
      };
      console.log(quoteForm);
      onUpdateQuotation(editingQuote.id, payload);

    }
    else {

      onCreateQuotation(quoteForm);

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

      quotationDate: quote.quotationDate
        ? quote.quotationDate.slice(0, 10)
        : "",

      expirationDate: quote.expirationDate
        ? quote.expirationDate.slice(0, 10)
        : "",

      paymentTerms: quote.paymentTerms || "",
      currency: quote.currency || "INR",

      notes: quote.notes || "",

      subtotal: quote.subtotal || 0,
      tax: quote.tax || 0,
      discount: quote.discount || 0,
      total: quote.total || 0,

      items:
        quote.items.map((item: any) => ({

          product: item.product,

          description: item.description,

          quantity: item.quantity,

          unitPrice: item.unitPrice,

          tax: item.tax,

          discount: item.discount,

          subtotal: item.subtotal

        }))
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

              {quotations.length > 0 ? (

                quotations.map((quote: any) => (

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
                        quote.grandTotal || 0
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

                            <button
                              onClick={() => handleInvoice(quote)}
                              className="px-3 py-1 rounded bg-indigo-600 text-white"
                            >
                              Create Invoice
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
                          selectedQuote.grandTotal || 0
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

            <div className="bg-card border border-border-crm rounded-2xl shadow-2xl p-6 max-w-md w-full">

              <h2 className="text-xl font-bold mb-5">
                Generate Quotation
              </h2>

              <form
                onSubmit={handleQuoteSubmit}
                className="space-y-4"
              >

                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Customer Name
                  </label>

                  <input
                    type="text"
                    required
                    value={quoteForm.customerName}
                    onChange={(e) =>
                      setQuoteForm({
                        ...quoteForm,
                        customerName: e.target.value,
                      })
                    }
                    className="w-full border border-border-crm rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Company
                  </label>

                  <input
                    type="text"
                    required
                    value={quoteForm.company}
                    onChange={(e) =>
                      setQuoteForm({
                        ...quoteForm,
                        company: e.target.value,
                      })
                    }
                    className="w-full border border-border-crm rounded-lg p-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">

                  <div>

                    <label className="block mb-1 text-sm font-medium">
                      Tax %
                    </label>

                    <input
                      type="number"
                      value={quoteForm.tax}
                      onChange={(e) =>
                        setQuoteForm({
                          ...quoteForm,
                         tax: Number(e.target.value),
                        })
                      }
                      className="w-full border border-border-crm rounded-lg p-2"
                    />

                  </div>

                  <div>

                    <label className="block mb-1 text-sm font-medium">
                      Discount
                    </label>

                    <input
                      type="number"
                      value={quoteForm.discount}
                      onChange={(e) =>
                        setQuoteForm({
                          ...quoteForm,
                          discount: Number(e.target.value),
                        })
                      }
                      className="w-full border border-border-crm rounded-lg p-2"
                    />

                  </div>

                </div>

                <div className="flex justify-end gap-3 pt-4">

                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(false)}
                    className="px-5 py-2 border border-border-crm rounded-lg hover:bg-slate-100"
                  >

                    Cancel

                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                  >


                    {editingQuote ? "Update Quotation" : "Create Quotation"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </div>

    );

  }