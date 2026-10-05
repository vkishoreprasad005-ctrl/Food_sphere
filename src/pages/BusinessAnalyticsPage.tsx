import React, { useState, useEffect } from 'react';
import { BusinessAnalytics } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  PieChart,
  Flame,
  UtensilsCrossed,
  Bike,
  Store,
  Calendar,
} from 'lucide-react';

export const BusinessAnalyticsPage: React.FC = () => {
  const { business } = useAuth();
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const res = await apiRequest<BusinessAnalytics>('/api/tenant/analytics');
      if (res.data) {
        setAnalytics(res.data);
      }
      setIsLoading(false);
    }
    load();
  }, [business?.id]);

  if (isLoading || !analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-zinc-400 text-sm">Computing real database analytics for this tenant...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            Revenue & Performance Analytics
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time business intelligence calculated for <strong className="text-white">{business?.businessName}</strong>.
          </p>
        </div>

        <div className="text-xs text-zinc-400 font-mono">
          Last Synced: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-zinc-400">Total Net GMV</span>
          <div className="text-2xl font-black text-amber-400 mt-1">
            ${analytics.totalRevenue.toFixed(2)}
          </div>
          <span className="text-[11px] text-zinc-500">From paid orders</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-zinc-400">Average Ticket Size</span>
          <div className="text-2xl font-black text-white mt-1">
            ${analytics.averageOrderValue.toFixed(2)}
          </div>
          <span className="text-[11px] text-emerald-400">Per paying customer</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-zinc-400">Completed Volume</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {analytics.completedOrders}
          </div>
          <span className="text-[11px] text-zinc-500">Out of {analytics.totalOrders} total</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-zinc-400">Customer Base</span>
          <div className="text-2xl font-black text-purple-400 mt-1">
            {analytics.totalCustomers}
          </div>
          <span className="text-[11px] text-zinc-500">Registered buyers</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue 7-Day Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Daily Revenue Trend ($)</h2>
              <p className="text-xs text-zinc-400">Actual sales by calendar date</p>
            </div>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>

          <div className="pt-6">
            <div className="h-48 flex items-end justify-between gap-3 px-2">
              {analytics.revenueByDay.map(day => {
                const maxAmt = Math.max(...analytics.revenueByDay.map(d => d.amount), 50);
                const heightPercent = Math.max(10, Math.round((day.amount / maxAmt) * 100));

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-amber-400 font-mono">
                      ${day.amount}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg transition-all group-hover:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                      {day.date.split('-').slice(1).join('/')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Fulfillment Types */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Dining Channel Breakdown</h2>
              <p className="text-xs text-zinc-400">Dine-in vs Takeout vs Delivery</p>
            </div>
            <PieChart className="w-5 h-5 text-sky-400" />
          </div>

          <div className="pt-4 space-y-4">
            {analytics.orderTypeDistribution.map(item => {
              const totalOrders = Math.max(analytics.totalOrders, 1);
              const percent = Math.round((item.count / totalOrders) * 100);

              return (
                <div key={item.type} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-zinc-300 capitalize flex items-center gap-1.5">
                      {item.type === 'dine_in' && <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />}
                      {item.type === 'takeaway' && <Store className="w-3.5 h-3.5 text-emerald-400" />}
                      {item.type === 'delivery' && <Bike className="w-3.5 h-3.5 text-sky-400" />}
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className="font-bold text-white">{item.count} orders ({percent}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.type === 'dine_in'
                          ? 'bg-amber-500'
                          : item.type === 'takeaway'
                          ? 'bg-emerald-500'
                          : 'bg-sky-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white">Order Pipeline Distribution</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {analytics.orderStatusBreakdown.map(st => (
              <div key={st.status} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs">
                <span className="text-[10px] text-zinc-500 block">{st.status}</span>
                <span className="text-lg font-black text-zinc-100">{st.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Dishes Ranking */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" /> Top Selling Dishes
            </h2>
            <span className="text-xs text-zinc-500">Gross Sales</span>
          </div>

          <div className="space-y-3">
            {analytics.popularItems.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between gap-3 text-xs py-1 border-b border-zinc-800/50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-zinc-200 truncate">{item.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-white">{item.quantity} sold</div>
                  <div className="text-[10px] text-amber-400 font-mono">${item.revenue.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
