import React, { useState, useEffect } from 'react';
import { PlatformStats, Business, User } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  ShieldCheck,
  Store,
  DollarSign,
  Users,
  ShoppingBag,
  CalendarCheck,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { showToast } = useToast();

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [businesses, setBusinesses] = useState<(Business & { ownerName: string; ownerEmail: string })[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'businesses' | 'users'>('businesses');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAdminData = async () => {
    setIsLoading(true);
    const [statsRes, bizRes, usersRes] = await Promise.all([
      apiRequest<PlatformStats>('/api/admin/stats'),
      apiRequest<(Business & { ownerName: string; ownerEmail: string })[]>('/api/admin/businesses'),
      apiRequest<any[]>('/api/admin/users'),
    ]);

    if (statsRes.data) setStats(statsRes.data);
    if (bizRes.data) setBusinesses(bizRes.data);
    if (usersRes.data) setUsers(usersRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleStatus = async (bizId: string, currentStatus: string, bizName: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'suspend';

    if (!confirm(`Are you sure you want to ${action} ${bizName}?`)) return;

    const res = await apiRequest(`/api/admin/businesses/${bizId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.data) {
      setBusinesses(prev =>
        prev.map(b => (b.id === bizId ? { ...b, status: newStatus } : b))
      );
      showToast(`${bizName} has been ${newStatus}`, 'success');
      // refresh stats
      const statsRes = await apiRequest<PlatformStats>('/api/admin/stats');
      if (statsRes.data) setStats(statsRes.data);
    } else {
      showToast(res.error || 'Failed to update business status', 'error');
    }
  };

  const filteredBusinesses = businesses.filter(b => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      b.businessName.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      b.ownerName.toLowerCase().includes(q) ||
      b.ownerEmail.toLowerCase().includes(q)
    );
  });

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-black text-white">Platform Administration Console</h1>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
              Root Level
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Global multi-tenant governance, business verification, and cross-tenant user auditing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('businesses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'businesses'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            Registered Businesses ({businesses.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            All Accounts ({users.length})
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <span className="text-xs font-semibold text-zinc-400">Total Food Businesses</span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.totalBusinesses}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">
              {stats.activeBusinesses} active across platform
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <span className="text-xs font-semibold text-zinc-400">Platform GMV Processed</span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              ${stats.platformGMV.toFixed(2)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Sum of all tenant sales</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <span className="text-xs font-semibold text-zinc-400">Total Orders Handled</span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.totalOrders}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Processed across tenants</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <span className="text-xs font-semibold text-zinc-400">Platform Registered Users</span>
            <div className="text-2xl font-black text-purple-400 mt-1">
              {stats.totalUsers}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Admins, Owners, Staff, Guests</div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="flex justify-between items-center bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'businesses' ? 'Search eatery, slug, owner...' : 'Search user name, email, role...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* TAB 1: BUSINESSES */}
      {activeTab === 'businesses' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Food Business</th>
                  <th className="px-6 py-4">Business Owner</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredBusinesses.map(biz => (
                  <tr key={biz.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={biz.logo}
                          alt={biz.businessName}
                          className="w-9 h-9 rounded-lg object-cover border border-zinc-700"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{biz.businessName}</div>
                          <div className="text-[10px] font-mono text-amber-400/80">slug: {biz.slug}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-zinc-300">
                      <div className="font-semibold text-zinc-200">{biz.ownerName}</div>
                      <div className="text-zinc-500 text-[11px]">{biz.ownerEmail}</div>
                    </td>

                    <td className="px-6 py-4 capitalize text-zinc-300">
                      {biz.businessType.replace('_', ' ')}
                    </td>

                    <td className="px-6 py-4 text-zinc-400 text-[11px] max-w-xs truncate">
                      {biz.address}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={biz.status} size="sm" />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(biz.id, biz.status, biz.businessName)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          biz.status === 'active'
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {biz.status === 'active' ? 'Suspend Business' : 'Activate Business'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Assigned Tenant</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2.5">
                      <img
                        src={u.profileImage}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover border border-zinc-700"
                      />
                      <span>{u.name}</span>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-mono text-[11px]">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] uppercase">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">
                      {u.businessName}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={u.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-400">
                      {new Date(u.createdAt).toLocaleDateString()}
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
