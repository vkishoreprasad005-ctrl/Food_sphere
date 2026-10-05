import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { useRealtime } from '../context/RealtimeContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Truck,
  Store,
  ChevronLeft,
  ArrowRight,
  Flame,
  AlertTriangle,
} from 'lucide-react';

interface OrderDetailPageProps {
  orderId: string;
  onNavigate: (view: string, params?: any) => void;
}

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({ orderId, onNavigate }) => {
  const [order, setOrder] = useState<Order & { businessName?: string; businessLogo?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { lastEvent } = useRealtime();
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchOrder = async () => {
    const res = await apiRequest<Order & { businessName?: string; businessLogo?: string }>(`/api/orders/${orderId}`);
    if (res.data) {
      setOrder(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // Auto-refresh when real-time event updates this order
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'ORDER_UPDATED' && lastEvent.payload?.id === orderId) {
      setOrder(prev => (prev ? { ...prev, ...lastEvent.payload } : lastEvent.payload));
      showToast(`Status updated: ${lastEvent.payload.orderStatus}`, 'info');
    }
  }, [lastEvent, orderId]);

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-zinc-400 text-sm">Tracking order #{orderId}...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-zinc-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Order Not Found</h2>
        <p className="text-xs text-zinc-400">Could not locate order #{orderId}.</p>
        <button
          onClick={() => onNavigate('explore')}
          className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-xl text-xs"
        >
          Explore Eateries
        </button>
      </div>
    );
  }

  const steps: { key: OrderStatus; label: string; icon: any; desc: string }[] = [
    { key: 'PENDING', label: 'Received', icon: Clock, desc: 'Order transmitted to restaurant cloud KDS' },
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2, desc: 'Host accepted and confirmed order' },
    { key: 'PREPARING', label: 'In Kitchen', icon: ChefHat, desc: 'Chefs are currently preparing your food' },
    { key: 'READY', label: 'Ready', icon: PackageCheck, desc: order.orderType === 'delivery' ? 'Driver is on the way' : 'Ready for pickup or table service' },
    { key: 'COMPLETED', label: 'Completed', icon: Store, desc: 'Order fulfilled and enjoyed!' },
  ];

  const getStepIndex = (st: OrderStatus) => {
    if (st === 'CANCELLED') return -1;
    return steps.findIndex(s => s.key === st);
  };

  const currentStepIdx = getStepIndex(order.orderStatus);

  // Quick staff simulator to test Flow 2 directly from the demo interface!
  const handleSimulateStatus = async (newStatus: OrderStatus) => {
    const res = await apiRequest(`/api/tenant/orders/${order.id}/status?tenantId=${order.tenantId}`, {
      method: 'PATCH',
      headers: {
        'x-tenant-id': order.tenantId,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.data) {
      setOrder(res.data);
      showToast(`Order #${order.id} status changed to ${newStatus}`, 'success');
    } else {
      showToast(res.error || 'Failed to update order status', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('customer_orders')}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">Order #{order.id}</h1>
              <StatusBadge status={order.orderStatus} />
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Placed from <strong className="text-amber-400">{order.businessName || 'Food Business'}</strong> on{' '}
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Real-Time Sync:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live SSE Stream
          </span>
        </div>
      </div>

      {/* Visual Pipeline Stepper */}
      {order.orderStatus === 'CANCELLED' ? (
        <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center space-y-2">
          <h2 className="text-lg font-bold text-rose-400">This Order Was Cancelled</h2>
          <p className="text-xs text-zinc-300">
            If a refund is applicable, it will be automatically credited to your original payment method.
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-6">
            Live Fulfillment Pipeline
          </h2>

          <div className="relative">
            {/* Progress line */}
            <div className="hidden sm:block absolute top-6 left-6 right-6 h-1 bg-zinc-800 rounded-full z-0">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-700 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, (currentStepIdx / (steps.length - 1)) * 100))}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2 relative z-10">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.key} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-300 ${
                        isCurrent
                          ? 'bg-amber-500 text-zinc-950 ring-4 ring-amber-500/20 shadow-lg shadow-amber-500/30 animate-pulse'
                          : isPassed
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold ${
                          isCurrent ? 'text-amber-400' : isPassed ? 'text-zinc-200' : 'text-zinc-500'
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-snug mt-0.5 line-clamp-2">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Simulator bar for testing Flow 2 (Staff updates status -> customer sees updated status instantly) */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800/80 p-5 rounded-2xl border border-amber-500/30 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-amber-400" /> Academic Flow 2 Quick-Verification Controller
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Simulate kitchen staff advancing this order's status to test real-time SSE progress update without logging out:
            </p>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            Current: <strong className="text-white">{order.orderStatus}</strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as OrderStatus[]).map(st => (
            <button
              key={st}
              onClick={() => handleSimulateStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                order.orderStatus === st
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              Set to {st}
            </button>
          ))}
        </div>
      </div>

      {/* Order Details & Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Items list */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-zinc-800 pb-3">Dishes Ordered</h2>

          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover border border-zinc-800"
                    />
                  )}
                  <div>
                    <span className="font-semibold text-zinc-200">
                      {item.quantity}x {item.name}
                    </span>
                    {item.specialInstructions && (
                      <div className="text-[10px] text-amber-300/80 italic">"{item.specialInstructions}"</div>
                    )}
                  </div>
                </div>
                <span className="font-bold text-zinc-200">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-800 space-y-1.5 text-xs text-zinc-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-zinc-200">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="text-zinc-200">${order.tax.toFixed(2)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="text-zinc-200">${order.deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-zinc-800">
              <span>Total Paid</span>
              <span className="text-amber-400">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right: Dining info & payment */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-white border-b border-zinc-800 pb-3">Delivery & Dining Information</h2>

          <div className="space-y-3">
            <div>
              <span className="text-zinc-400 block text-[11px]">Dining Preference</span>
              <span className="font-semibold text-zinc-200 capitalize">
                {order.orderType.replace('_', ' ')}
                {order.tableNumber && ` (${order.tableNumber})`}
              </span>
            </div>

            {order.deliveryAddress && (
              <div>
                <span className="text-zinc-400 block text-[11px]">Delivery Address</span>
                <span className="text-zinc-200">{order.deliveryAddress}</span>
              </div>
            )}

            <div>
              <span className="text-zinc-400 block text-[11px]">Customer Contact</span>
              <span className="font-semibold text-zinc-200">{order.customerName}</span>
              <div className="text-zinc-400">{order.customerEmail}</div>
              {order.customerPhone && <div className="text-zinc-400">{order.customerPhone}</div>}
            </div>

            <div>
              <span className="text-zinc-400 block text-[11px]">Payment Method & Status</span>
              <span className="capitalize font-semibold text-zinc-200">
                {order.paymentMethod} — {order.paymentStatus.toUpperCase()}
              </span>
            </div>

            {order.notes && (
              <div>
                <span className="text-zinc-400 block text-[11px]">Kitchen Notes</span>
                <span className="italic text-zinc-300">"{order.notes}"</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
