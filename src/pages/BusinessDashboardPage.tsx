import React, { useState, useEffect } from 'react';
import { BusinessAnalytics, Order, Reservation } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CalendarDays,
  Users,
  TrendingUp,
  ArrowRight,
  Flame,
  CheckCircle2,
  Store,
  Layers,
} from 'lucide-react';

interface BusinessDashboardPageProps {
  onNavigate: (view: string, params?: any) => void;
}

export const BusinessDashboardPage: React.FC<BusinessDashboardPageProps> = ({ onNavigate }) => {
  const { business, user } = useAuth();
  const { lastEvent } = useRealtime();

  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const [analyticsRes, ordersRes, resRes] = await Promise.all([
      apiRequest<BusinessAnalytics>('/api/tenant/analytics'),
      apiRequest<Order[]>('/api/tenant/orders'),
      apiRequest<Reservation[]>('/api/tenant/reservations'),
    ]);

    if (analyticsRes.data) setAnalytics(analyticsRes.data);
    if (ordersRes.data) setRecentOrders(ordersRes.data.slice(0, 5));
    if (resRes.data) setRecentReservations(resRes.data.slice(0, 4));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [business?.id]);

  // Re-fetch automatically upon real-time events
  useEffect(() => {
    if (lastEvent) {
      fetchDashboardData();
    }
  }, [lastEvent]);

  if (isLoading && !analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-zinc-400 text-sm">Aggregating isolated tenant metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">{business?.businessName}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Tenant Active
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Logged in as <strong className="text-zinc-200">{user?.name}</strong> ({user?.role.replace('_', ' ')}) • Tenant ID:{' '}
            <code className="text-amber-400 font-mono text-[11px]">{business?.id}</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('business_orders')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Live Kitchen Board</span>
          </button>
          <button
            onClick={() => onNavigate('business_public', { slug: business?.slug })}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <span>Customer View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1 */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Total Net Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2">
              ${analytics.totalRevenue.toFixed(2)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Avg Order Value: ${analytics.averageOrderValue.toFixed(2)}
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Active / Total Orders</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {analytics.pendingOrders} <span className="text-sm font-normal text-zinc-500">/ {analytics.totalOrders} total</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 font-medium">
              {analytics.completedOrders} orders fulfilled
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Table Reservations</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {analytics.totalReservations}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Bookings on file</div>
          </div>

          {/* Card 4 */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Unique Customers</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {analytics.totalCustomers}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">Belonging to this tenant</div>
          </div>
        </div>
      )}

      {/* Revenue Trend & Popular Items Row */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart (2 cols) */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Daily Revenue Trend</h3>
                <p className="text-xs text-zinc-400">Calculated from actual database orders over past 7 days</p>
              </div>
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>

            {/* Custom Bar Visualization */}
            <div className="pt-6">
              <div className="h-44 flex items-end justify-between gap-3 px-2">
                {analytics.revenueByDay.map(day => {
                  const maxAmt = Math.max(...analytics.revenueByDay.map(d => d.amount), 50);
                  const heightPercent = Math.max(12, Math.round((day.amount / maxAmt) * 100));

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

          {/* Popular Menu Items (1 col) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Top Ordered Items</h3>
                <p className="text-xs text-zinc-400">Ranked by order count</p>
              </div>
              <Flame className="w-5 h-5 text-orange-400" />
            </div>

            <div className="space-y-3 pt-2">
              {analytics.popularItems.length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-500">No sales recorded yet</div>
              ) : (
                analytics.popularItems.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-zinc-200 truncate">{item.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-white">{item.quantity} sold</div>
                      <div className="text-[10px] text-amber-400">${item.revenue.toFixed(2)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders & Reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Recent Incoming Orders</h3>
            <button
              onClick={() => onNavigate('business_orders')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500">No orders placed yet</div>
            ) : (
              recentOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => onNavigate('business_orders')}
                  className="p-3 bg-zinc-950/60 hover:bg-zinc-800/60 border border-zinc-800/80 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">#{order.id}</span>
                      <span className="text-zinc-400">{order.customerName}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {order.items.length} items • {order.orderType.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="text-right">
                    <StatusBadge status={order.orderStatus} size="sm" />
                    <div className="font-black text-amber-400 mt-1">${order.total.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Reservations */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Table Reservations</h3>
            <button
              onClick={() => onNavigate('business_reservations')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>Manage Tables</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentReservations.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-500">No reservations currently</div>
            ) : (
              recentReservations.map(res => (
                <div
                  key={res.id}
                  onClick={() => onNavigate('business_reservations')}
                  className="p-3 bg-zinc-950/60 hover:bg-zinc-800/60 border border-zinc-800/80 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{res.customerName}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {res.date} at {res.time} • {res.partySize} Guests
                      {res.tableNumber && ` (${res.tableNumber})`}
                    </div>
                  </div>

                  <div>
                    <StatusBadge status={res.status} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
