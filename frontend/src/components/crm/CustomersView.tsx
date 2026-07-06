import React, { useState } from "react";
import {
    X,
    Pencil,
    Trash2,
} from "lucide-react";
import { useCRM } from "../../context/CRMContext";
import { customerService } from "../../services/customer.service";
const CustomerView = () => {
    const { customers } = useCRM();

    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [showCustomerDrawer, setShowCustomerDrawer] = useState(false);

    return (
        <div>
            <h2 className="text-xl font-bold text-txt-primary mb-4">Customers</h2>

            <div className="bg-card border border-border-crm rounded-2xl shadow-xs overflow-hidden">

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-main border-b border-border-crm text-sm font-bold text-txt-secondary uppercase tracking-wider select-none">
                                <th className="px-8 py-5">Customer</th>
                                <th className="px-8 py-5">Company</th>
                                <th className="px-8 py-5">Email</th>
                                <th className="px-8 py-5">Phone</th>
                                <th className="px-8 py-5">Salesperson</th>
                                <th className="px-8 py-5">Deal Value</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-crm text-sm">
                            {customers.map((customer: any) => (
                                <tr
                                    key={customer.id}
                                    onClick={() => { setSelectedCustomer(customer); setShowCustomerDrawer(true); }}
                                    className="hover:bg-slate-50 transition cursor-pointer text-txt-primary"
                                >
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-txt-primary">
                                            {customer.customerName}
                                        </div>
                                        <div className="text-xs text-txt-secondary">{customer.email}</div>
                                    </td>
                                    <td className="px-8 py-5 font-semibold text-txt-primary">{customer.company}</td>
                                    <td className="px-8 py-5 font-semibold text-primary">{customer.email}</td>
                                    <td className="px-8 py-5 text-txt-secondary">{customer.phone}</td>
                                    <td className="px-8 py-5 font-semibold text-txt-primary">{customer.assignedSalesperson || 'Unassigned'}</td>
                                    <td className="px-8 py-5">
                                        <span className="px-2.5 py-1 rounded-md text-xs font-bold border bg-emerald-50 border-emerald-200 text-success">
                                            ₹ {customer.dealValue}
                                        </span>
                                    </td>
                                    <td
                                        className="px-8 py-5 text-right flex justify-end gap-3"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Edit Button */}
                                        <button
                                            onClick={() => {
                                                setSelectedCustomer(customer);
                                                setShowCustomerDrawer(true);
                                            }}
                                            className="text-blue-500 hover:text-blue-700 p-1 transition cursor-pointer"
                                            title="Edit Customer"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>

                                        {/* Delete Button */}
                                        <button

                                            onClick={async () => {

                                                if (!window.confirm("Delete this customer?")) return;

                                                try {

                                                    await customerService.deleteCustomer(customer.id);

                                                    alert("Customer deleted");

                                                    window.location.reload();

                                                }

                                                catch (err) {

                                                    console.log(err);

                                                    alert("Delete Failed");

                                                }

                                            }}

                                            className="text-red-500 hover:text-red-700 p-1 transition"

                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-slate-400">
                                        No customers found matching current filter query.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Sliding Customer Detail Drawer */}
                {
                    showCustomerDrawer && selectedCustomer && (
                        <div className="fixed inset-0 z-50 flex justify-end">
                            <div onClick={() => setShowCustomerDrawer(false)} className="absolute inset-0 bg-black/30 backdrop-blur-xs"></div>
                            <div className="relative w-120 max-w-full bg-card h-full shadow-2xl border-l border-border-crm p-6 flex flex-col z-10 text-txt-primary">

                                <div className="flex justify-between items-center pb-4 border-b border-border-crm shrink-0">
                                    <h3 className="font-bold text-sm tracking-tight text-txt-primary">Customer Detailed Timeline</h3>
                                    <button onClick={() => setShowCustomerDrawer(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                                        <X className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto py-4 space-y-6">

                                    {/* Header profile details */}
                                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-1">
                                        <input
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={selectedCustomer.customerName}
                                            onChange={(e) =>
                                                setSelectedCustomer({
                                                    ...selectedCustomer,
                                                    customerName: e.target.value
                                                })
                                            }
                                        />
                                        <input
                                            className="w-full border rounded-lg px-3 py-2"
                                            value={selectedCustomer.company}
                                            onChange={(e) =>
                                                setSelectedCustomer({
                                                    ...selectedCustomer,
                                                    company: e.target.value
                                                })
                                            }
                                        />
                                        <div className="flex flex-wrap gap-1 mt-2 px-3">
                                            <span className="bg-emerald-50 text-success border border-emerald-100 text-[10px] px-2 py-0.5 rounded font-semibold">
                                                ₹ {selectedCustomer.dealValue}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Contact stats */}
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <p className="text-slate-400 font-semibold uppercase text-[10px]">Email</p>
                                            <input
                                                className="w-full border rounded-lg px-3 py-2"
                                                value={selectedCustomer.email}
                                                onChange={(e) =>
                                                    setSelectedCustomer({
                                                        ...selectedCustomer,
                                                        email: e.target.value
                                                    })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-semibold uppercase text-[10px]">Phone</p>
                                            <input
                                                className="w-full border rounded-lg px-3 py-2"
                                                value={selectedCustomer.phone}
                                                onChange={(e) =>
                                                    setSelectedCustomer({
                                                        ...selectedCustomer,
                                                        phone: e.target.value
                                                    })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <p className="text-slate-400 font-semibold uppercase text-[10px]">Assigned Salesperson</p>
                                            <input
                                                className="w-full border rounded-lg px-3 py-2"
                                                value={selectedCustomer.assignedSalesperson}
                                                onChange={(e) =>
                                                    setSelectedCustomer({
                                                        ...selectedCustomer,
                                                        assignedSalesperson: e.target.value
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="border-t border-border-crm pt-4">
    <button
        onClick={async () => {
            try {
                await customerService.updateCustomer(selectedCustomer.id, selectedCustomer);

                alert("Customer Updated");
                window.location.reload();
            } catch (err) {
                console.log(err);
                alert("Update Failed");
            }
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl"
    >
        Save Changes
    </button>
</div>
                                        <div>
                                            <p className="text-slate-400 font-semibold uppercase text-[10px]">Opportunity ID</p>
                                            <p className="font-medium text-txt-primary mt-0.5">{selectedCustomer.opportunityId}</p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )
                }

            </div>
</div>
    );
};

export default CustomerView;