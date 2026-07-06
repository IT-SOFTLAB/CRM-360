import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { quotationService } from "../../services/quotation.service";

interface Props {

  opportunity: any;

  onClose: () => void;

}


export default function QuotationForm({ opportunity,

  onClose }: Props) {
  const [items, setItems] = useState([
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
  const [form, setForm] = useState({
    customerName: opportunity?.customerName || "",
    companyName: opportunity?.company || "",
    salesperson: opportunity?.assignedSalesperson || "",
    quotationDate: new Date().toISOString().split("T")[0],
    expirationDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString().split("T")[0],
    paymentTerms: "Immediate Payment",
    currency: "INR",
    notes: "",

  });
  const calculateItemSubtotal = (item: any) => {

    const price = Number(item.unitPrice) || 0;
    const qty = Number(item.quantity) || 0;
    const discount = Number(item.discount) || 0;
    const tax = Number(item.tax) || 0;

    const amount = price * qty;

    const discountAmount = amount * discount / 100;

    const taxable = amount - discountAmount;

    return taxable + (taxable * tax / 100);

  };
  const subtotal = items.reduce((sum, item) => {

    return sum + (Number(item.unitPrice) * Number(item.quantity));

  }, 0);

  const tax = items.reduce((sum, item) => {

    const amount = Number(item.unitPrice) * Number(item.quantity);

    return sum + ((amount * Number(item.tax)) / 100);

  }, 0);

  const total = subtotal + tax;

  const saveQuotation = async () => {

    try {

      const quotation = {

        quotationNumber: "QT-" + Date.now(),

        opportunityId: opportunity.id,

        customerId: opportunity.customerId || opportunity.id,

        customerName: form.customerName,

        company: form.companyName,

        email: opportunity.email,

        phone: opportunity.phone,

        salesperson: form.salesperson,

        quotationDate: form.quotationDate,

        expirationDate: form.expirationDate,

        paymentTerms: form.paymentTerms,

        currency: form.currency,

        notes: form.notes,

        subtotal,

        tax,

        total,

        items

      };


console.log(form);
console.log(quotation);
      await quotationService.createQuotation(quotation);

      alert("Quotation Saved Successfully");

      onClose();

    }

    catch (err: any) {

      console.log("ERROR:", err);

      console.log(err.response);

      console.log(err.response?.data);

      alert("Unable to Save");

    }

  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-5">
      <div className="bg-card rounded-2xl shadow-2xl w-[1200px] max-w-[98%] h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center border-b border-border-crm px-8 py-5">
          <div>
            <h2 className="text-2xl font-bold text-txt-primary">
              New Quotation
            </h2>

            <p className="text-sm text-txt-secondary mt-1">
              Create a quotation for this opportunity
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="px-4 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300 text-xs font-bold">
              Draft
            </span>

            <button
              onClick={onClose}
              className="hover:bg-slate-100 rounded-lg p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* Customer Information */}
          <div className="bg-bg-main border border-border-crm rounded-xl p-6">
            <h3 className="text-lg font-bold mb-5 text-txt-primary">
              Customer Information
            </h3>

            <div className="grid grid-cols-2 gap-5">

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-2">
                  Customer
                </label>

                <input
                  className="crm-input bg-slate-100"
                  value={form.customerName}
                  readOnly
                  onChange={(e) =>
                    setForm({
                      ...form,
                      customerName: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-2">
                  Company Name
                </label>

                <input
                  className="crm-input"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      customerName: e.target.value,
                    })
                  }
                />
              </div>


              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-2">
                  Salesperson
                </label>

                <input
                  className="crm-input"
                  value={form.salesperson}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      salesperson: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-2">
                  Quotation Date
                </label>

                <input
                  type="date"
                  className="crm-input"
                  value={form.quotationDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quotationDate: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-2">
                  Expiration Date
                </label>

                <input
                  type="date"
                  className="crm-input"
                  value={form.expirationDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      expirationDate: new Date(
                        Date.now() + 30 * 24 * 60 * 60 * 1000
                      ).toISOString().split("T")[0],
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-2">
                  Payment Terms
                </label>

                <select
                  className="crm-input"
                  value={form.paymentTerms}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paymentTerms: e.target.value,
                    })
                  }
                >
                  <option>Immediate Payment</option>
                  <option>15 Days</option>
                  <option>30 Days</option>
                  <option>45 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-txt-secondary mb-2">
                  Currency
                </label>

                <select
                  className="crm-input"
                  value={form.currency}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      currency: e.target.value,
                    })
                  }
                >
                  <option>INR</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>



            </div>
          </div>

          {/* Products */}
          <div>

            <div className="flex justify-between items-center mb-4">

              <h3 className="text-lg font-bold text-txt-primary">
                Products
              </h3>

              <button className="bg-primary hover:bg-primary-hover text-white rounded-lg px-4 py-2 flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" />
                Add Product
              </button>

            </div>

            <div className="border border-border-crm rounded-xl overflow-hidden">

              <table className="w-full">

                <thead className="bg-bg-main border-b border-border-crm">

                  <tr className="text-sm font-semibold text-txt-secondary">

                    <th className="p-4 text-left">Product</th>

                    <th className="p-4 text-left">Description</th>

                    <th className="p-4 text-center">Qty</th>

                    <th className="p-4 text-center">Unit Price</th>

                    <th className="p-4 text-center">Tax %</th>

                    <th className="p-4 text-center">Discount %</th>

                    <th className="p-4 text-right">Subtotal</th>

                  </tr>

                </thead>

                <tbody>

                  <tr>

                    <td className="p-3">
                      <input
                        value={items[0].product}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[0].product = e.target.value;
                          setItems(copy);
                        }}
                        className="crm-input"
                      />
                    </td>

                    <td className="p-3">
                      <input
                        value={items[0].description}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[0].description = e.target.value;
                          setItems(copy);
                        }}
                        className="crm-input"
                      />
                    </td>

                    <td className="p-3">
                      <input
                        type="number"
                        value={items[0].quantity}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[0].quantity = Number(e.target.value);
                          copy[0].subtotal = calculateItemSubtotal(copy[0]);
                          setItems(copy);
                        }}
                        className="crm-input text-center"
                      />
                    </td>

                    <td className="p-3">
                      <input
                        type="number"
                        value={items[0].unitPrice}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[0].unitPrice = Number(e.target.value);
                          copy[0].subtotal = calculateItemSubtotal(copy[0]);
                          setItems(copy);
                        }}
                        className="crm-input text-center"
                      />
                    </td>

                    <td className="p-3">
                      <input
                        type="number"
                        value={items[0].tax}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[0].tax = Number(e.target.value);
                          copy[0].subtotal = calculateItemSubtotal(copy[0]);
                          setItems(copy);
                        }}
                        className="crm-input text-center"
                      />
                    </td>

                    <td className="p-3">
                      <input
                        type="number"
                        value={items[0].discount}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[0].discount = Number(e.target.value);
                          copy[0].subtotal = calculateItemSubtotal(copy[0]);
                          setItems(copy);
                        }}
                        className="crm-input text-center"
                      />
                    </td>

                    <td className="p-3 text-right font-bold text-success">
                      ₹ {items[0].subtotal.toFixed(2)}
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

          {/* Notes */}

          <div>

            <label className="block text-sm font-semibold mb-3 text-txt-primary">
              Internal Notes
            </label>

            <textarea
              rows={5}
              className="crm-input"
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes: e.target.value,
                })
              }
            />

          </div>

          {/* Totals */}

          <div className="flex justify-end">

            <div className="w-80 border border-border-crm rounded-xl p-6 bg-bg-main">

              <div className="flex justify-between mb-3">

                <span>Subtotal</span>

                <span>₹ {subtotal.toFixed(2)}</span>

              </div>

              <div className="flex justify-between mb-3">

                <span>Tax</span>

                <span>₹ {tax.toFixed(2)}</span>

              </div>

              <hr className="my-4" />

              <div className="flex justify-between text-lg font-bold">

                <span>Total</span>

                <span>₹ {total.toFixed(2)}</span>

              </div>

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="border-t border-border-crm px-8 py-5 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="border border-border-crm px-6 py-2 rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Discard
          </button>

          <button
            onClick={saveQuotation}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-xl cursor-pointer"
          >
            Save Draft
          </button>

        </div>

      </div>
    </div>
  );
}