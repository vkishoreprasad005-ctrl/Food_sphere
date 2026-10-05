import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import {
  Cloud,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  ChefHat,
  Coffee,
  Store,
  UserCheck,
} from 'lucide-react';

interface LoginPageProps {
  onNavigate: (view: string, params?: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, quickLogin, isLoading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      showToast('Welcome back to FoodSphere!', 'success');
      // Navigation happens dynamically based on role in App.tsx
      onNavigate('home');
    } else {
      showToast(res.error || 'Invalid credentials', 'error');
    }
  };

  const handleQuick = async (roleKey: 'admin' | 'owner_1' | 'staff_1' | 'owner_2' | 'staff_2' | 'customer') => {
    await quickLogin(roleKey);
    showToast('Signed in via quick demo credentials', 'success');
    if (roleKey === 'admin') onNavigate('admin_dashboard');
    else if (roleKey === 'owner_1' || roleKey === 'owner_2') onNavigate('business_dashboard');
    else if (roleKey === 'staff_1' || roleKey === 'staff_2') onNavigate('business_orders');
    else onNavigate('explore');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* Brand header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-amber-500/20 mx-auto">
          <Cloud className="w-6 h-6 fill-current" />
        </div>
        <h1 className="text-2xl font-black text-white">Sign In to FoodSphere</h1>
        <p className="text-xs text-zinc-400">
          Enter your credentials or use a 1-click demo account below.
        </p>
      </div>

      {/* Main Login Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-medium mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@foodbusiness.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-400">
            Don't have an account yet?{' '}
            <button
              onClick={() => onNavigate('register')}
              className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
            >
              Register here
            </button>
          </p>
        </div>
      </div>

      {/* 1-Click Demo Accounts Box */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
            1-Click Demo Credentials
          </span>
          <span className="text-[10px] text-amber-400 font-mono">Academic Instant Login</span>
        </div>

        <div className="space-y-2 text-xs">
          <button
            onClick={() => handleQuick('admin')}
            className="w-full p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <div>
                <div className="font-bold text-white">Platform Super Admin</div>
                <div className="text-[10px] text-zinc-500">admin@foodsphere.io • admin123</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" />
          </button>

          <button
            onClick={() => handleQuick('owner_1')}
            className="w-full p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <ChefHat className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-bold text-white">The Artisanal Fork Owner (Tenant A)</div>
                <div className="text-[10px] text-zinc-500">owner@artisanalfork.com • password123</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </button>

          <button
            onClick={() => handleQuick('owner_2')}
            className="w-full p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <Coffee className="w-4 h-4 text-rose-400" />
              <div>
                <div className="font-bold text-white">Sweet Harmony Bakery Owner (Tenant B)</div>
                <div className="text-[10px] text-zinc-500">owner@sweetharmony.com • password123</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-rose-400 transition-colors" />
          </button>

          <button
            onClick={() => handleQuick('customer')}
            className="w-full p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-purple-400" />
              <div>
                <div className="font-bold text-white">Customer Account (Sarah Jenkins)</div>
                <div className="text-[10px] text-zinc-500">customer@example.com • customer123</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
