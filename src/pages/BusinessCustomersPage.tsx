import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Users, Search, Mail, Phone, Calendar, DollarSign, ShoppingBag, ShieldCheck } from 'lucide-react';

interface TenantCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
}

export const BusinessCustomersPage: React.FC = () => {
  const { business } = useAuth();
  const [customers, setCustomers] = useState<TenantCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const res = await apiRequest<TenantCustomer[]>('/api/tenant/customers');
      if (res.data) {
        setCustomers(res.data);
      }
      setIsLoading(false);
    }
    load();
  }, [business?.id]);

  const filtered = customers.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            Customer Directory & Spending
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Showing only guests who have ordered from <strong className="text-white">{business?.businessName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Tenant Isolated
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer name, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <span className="text-xs text-zinc-400">
          {customers.length} {customers.length === 1 ? 'Customer' : 'Customers'} on record
        </span>
      </div>

      {/* Customers Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-zinc-900/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800">
          <Users className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-zinc-200">No Customers Found</h3>
          <p className="text-xs text-zinc-400 mt-1">Guests will appear here automatically when orders are placed.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Contact Details</th>
                  <th className="px-6 py-4 text-center">Orders Placed</th>
                  <th className="px-6 py-4 text-right">Lifetime Spend</th>
                  <th className="px-6 py-4 text-right">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.map(cust => (
                  <tr key={cust.email} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">
                      {cust.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      <div>{cust.email}</div>
                      <div className="text-zinc-500 text-[11px]">{cust.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-zinc-800 px-2 py-0.5 rounded font-semibold text-zinc-200">
                        {cust.orderCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-amber-400">
                      ${cust.totalSpent.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-400">
                      {new Date(cust.lastOrderDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
