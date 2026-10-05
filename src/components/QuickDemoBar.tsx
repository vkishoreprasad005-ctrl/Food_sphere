import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { ShieldCheck, Store, UserCheck, RefreshCw, ChefHat, Coffee, Database, ChevronDown } from 'lucide-react';
import { apiRequest } from '../services/api.ts';

export const QuickDemoBar: React.FC = () => {
  const { user, business, quickLogin, refreshAuth } = useAuth();
  const { showToast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleReset = async () => {
    if (!confirm('Reset sample database to fresh seed state (The Artisanal Fork + Sweet Harmony Bakery)?')) {
      return;
    }
    setIsResetting(true);
    const res = await apiRequest('/api/seed/reset', { method: 'POST' });
    setIsResetting(false);
    if (res.data) {
      showToast('Database reset to initial demo seeds', 'success');
      await refreshAuth();
      window.location.reload();
    } else {
      showToast('Failed to reset database', 'error');
    }
  };

  const handleSwitch = async (roleKey: 'admin' | 'owner_1' | 'staff_1' | 'owner_2' | 'staff_2' | 'customer') => {
    await quickLogin(roleKey);
    showToast(`Switched account persona`, 'info');
  };

  return (
    <aside aria-label="Demo mode control" className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-amber-500/20 px-3 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold tracking-wide uppercase text-[10px]">
            <Database className="w-3 h-3" /> Multi-Tenant Demo Mode
          </span>
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
            <span>Active Persona:</span>
            {user ? (
              <span className="font-medium text-zinc-100 flex items-center gap-1">
                {user.role === 'platform_admin' && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
                {user.role === 'business_owner' && <ChefHat className="w-3.5 h-3.5 text-emerald-400" />}
                {user.role === 'staff' && <Store className="w-3.5 h-3.5 text-blue-400" />}
                {user.role === 'customer' && <UserCheck className="w-3.5 h-3.5 text-purple-400" />}
                {user.name} ({user.role.replace('_', ' ')})
                {business && (
                  <span className="text-zinc-400 font-normal">
                    — <strong className="text-amber-300">{business.businessName}</strong>
                  </span>
                )}
              </span>
            ) : (
              <span className="text-zinc-400 italic">Guest Visitor</span>
            )}
          </div>
        </div>

        {/* Persona quick switch buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-zinc-400 hidden md:inline text-[11px]">Quick Switch:</span>

          <button
            onClick={() => handleSwitch('admin')}
            title="Platform Superadmin (System-wide metrics and business oversight)"
            className={`px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
              user?.role === 'platform_admin'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <ShieldCheck className="w-3 h-3" /> Admin
          </button>

          <button
            onClick={() => handleSwitch('owner_1')}
            title="Chef Marco Rossi (Owner - The Artisanal Fork Bistro)"
            className={`px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
              user?.email === 'owner@artisanalfork.com'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <ChefHat className="w-3 h-3" /> Fork Owner
          </button>

          <button
            onClick={() => handleSwitch('staff_1')}
            title="Elena Rostova (Kitchen Staff - The Artisanal Fork)"
            className={`px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
              user?.email === 'staff@artisanalfork.com'
                ? 'bg-blue-500 text-zinc-950 font-bold shadow-sm'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <Store className="w-3 h-3" /> Fork Staff
          </button>

          <button
            onClick={() => handleSwitch('owner_2')}
            title="Chloe Laurent (Owner - Sweet Harmony Bakery & Cafe)"
            className={`px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
              user?.email === 'owner@sweetharmony.com'
                ? 'bg-rose-500 text-zinc-950 font-bold shadow-sm'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <Coffee className="w-3 h-3" /> Bakery Owner
          </button>

          <button
            onClick={() => handleSwitch('customer')}
            title="Sarah Jenkins (Customer - Orders food and reserves tables)"
            className={`px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
              user?.role === 'customer'
                ? 'bg-purple-500 text-white font-bold shadow-sm'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <UserCheck className="w-3 h-3" /> Customer
          </button>

          <button
            onClick={handleReset}
            disabled={isResetting}
            title="Reset simulated cloud database to clean seed data"
            className="px-2 py-1 rounded-md font-medium bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 border border-zinc-700 transition-colors flex items-center gap-1 ml-1"
          >
            <RefreshCw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset DB</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
