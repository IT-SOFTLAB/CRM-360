import React, { useState, useEffect, useMemo } from "react";
import {
    X,
    Pencil,
    Trash2,
    ListFilter,
    Search,
} from "lucide-react";
import { useCRM } from "../../context/CRMContext";
import { customerService } from "../../services/customer.service";
import api from "../../services/api";

const CustomerView = () => {
    const { customers, user, setCustomers, addToast } = useCRM();
    const userRole = (user?.role || '').toUpperCase().replace(/[\s_]+/g, '_');
    const isManager = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    const [teams, setTeams] = useState<any[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | 'my' | 'team'>('all');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [showCustomerDrawer, setShowCustomerDrawer] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [minDealValue, setMinDealValue] = useState("");
    const [maxDealValue, setMaxDealValue] = useState("");

    // Load Sales Teams to resolve member names
    useEffect(() => {
        if (isManager) {
            api.get('/salesteam')
                .then(res => setTeams(res.data))
                .catch(err => console.warn('Failed loading teams in customers', err));
        }
    }, [isManager]);

    // Compile team member names dynamically
    const managedTeamMemberNames = useMemo(() => {
        if (!isManager || !user) return [];
        let myTeams = teams;
        if (userRole === 'ADMIN') {
            myTeams = teams.filter(t => t.leaderId === user?.id || t.leader?.email === user?.email);
        }
        const memberNames = new Set<string>();
        myTeams.forEach(t => {
            if (t.leader?.name) memberNames.add(t.leader.name);
            if (t.members) {
                t.members.forEach((m: any) => {
                    if (m.name) memberNames.add(m.name);
                });
            }
        });
        return Array.from(memberNames);
    }, [teams, user, userRole, isManager]);

    // Filtered list of customers
    const filteredCustomers = useMemo(() => {
        let list = customers;

        if (isManager) {
            if (activeFilter === 'my') {
                list = customers.filter(c => c.assignedSalesperson === user?.name);
            } else if (activeFilter === 'team') {
                list = customers.filter(c => managedTeamMemberNames.includes(c.assignedSalesperson));
            }
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter(c => 
                (c.customerName || '').toLowerCase().includes(query) ||
                (c.company || '').toLowerCase().includes(query) ||
                (c.email || '').toLowerCase().includes(query)
            );
        }

        if (minDealValue.trim()) {
            const min = parseFloat(minDealValue);
            if (!isNaN(min)) {
                list = list.filter(c => (c.dealValue || 0) >= min);
            }
        }

        if (maxDealValue.trim()) {
            const max = parseFloat(maxDealValue);
            if (!isNaN(max)) {
                list = list.filter(c => (c.dealValue || 0) <= max);
            }
        }

        return list;
    }, [customers, activeFilter, user, isManager, managedTeamMemberNames, searchQuery, minDealValue, maxDealValue]);

    return (
        <div className="space-y-6">
            {/* Unified Compact Control Bar */}
            <div className="bg-card border border-border-crm rounded-2xl p-2.5 shadow-xs text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Left side: Search & Deal Range */}
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
                            <input
                                type="text"
                                placeholder="Search client, company or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 text-txt-primary text-xs focus:outline-none focus:border-primary transition"
                            />
                            <div className="absolute left-2.5 top-2 text-slate-400">
                                <Search className="w-3.5 h-3.5" />
                            </div>
                        </div>

                        {/* Min Deal Value */}
                        <div className="w-28 sm:w-32">
                            <input
                                type="number"
                                placeholder="Min ₹"
                                value={minDealValue}
                                onChange={(e) => setMinDealValue(e.target.value)}
                                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-800 text-txt-primary text-xs focus:outline-none focus:border-primary transition"
                            />
                        </div>

                        {/* Max Deal Value */}
                        <div className="w-28 sm:w-32">
                            <input
                                type="number"
                                placeholder="Max ₹"
                                value={maxDealValue}
                                onChange={(e) => setMaxDealValue(e.target.value)}
                                className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-800 text-txt-primary text-xs focus:outline-none focus:border-primary transition"
                            />
                        </div>

                        {/* Clear Button */}
                        {(searchQuery || minDealValue || maxDealValue) && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setMinDealValue("");
                                    setMaxDealValue("");
                                }}
                                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Right side: Manager Filter Pills */}
                    {isManager && (
                        <div className="flex items-center space-x-1.5 shrink-0">
                            {[
                                { id: 'all', label: 'All Clients' },
                                { id: 'my', label: 'My Clients' },
                                { id: 'team', label: 'Team Clients' }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setActiveFilter(f.id as any)}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition cursor-pointer shadow-xs ${
                                        activeFilter === f.id
                                            ? 'bg-primary text-white border-primary/50'
                                            : 'bg-card text-txt-secondary border-border-crm hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* {!isManager && (
                <div className="bg-card border border-border-crm rounded-2xl p-4 flex items-center space-x-2 text-txt-secondary select-none shadow-xs">
                    <span className="font-bold text-xs">Viewing Clients Assigned To You ({filteredCustomers.length} clients)</span>
                </div>
            )} */}

            <div>
                {/* <h2 className="text-xl font-bold text-txt-primary mb-4">Clients</h2> */}

                <div className="bg-card border border-border-crm rounded-2xl shadow-xs overflow-hidden">

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-bg-main border-b border-black  text-xs font-bold text-txt-black uppercase tracking-wider select-none">
                                    <th className="px-8 py-5">Client</th>
                                    <th className="px-8 py-5">Company</th>
                                    <th className="px-8 py-5">Email</th>
                                    <th className="px-8 py-5">Phone</th>
                                    <th className="px-8 py-5">Salesperson</th>
                                    <th className="px-8 py-5">Deal Value</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-crm text-sm">
                            {filteredCustomers.map((customer: any) => (
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
                                            title="Edit Client"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>

                                        {/* Delete Button */}
                                        <button

                                            onClick={async () => {

                                                if (!window.confirm("Delete this client?")) return;

                                                try {

                                                    await customerService.deleteCustomer(customer.id);

                                                    alert("Client deleted");

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
                            {filteredCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-slate-400">
                                        No clients found matching current filter query.
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
                                                        setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? selectedCustomer : c));
                                                        setShowCustomerDrawer(false);
                                                        addToast('success', 'Client updated successfully');
                                                    } catch (err) {
                                                        console.error(err);
                                                        addToast('error', 'Failed to update client');
                                                    }
                                                }}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl cursor-pointer font-semibold transition"
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
    </div>
    );
};

export default CustomerView;