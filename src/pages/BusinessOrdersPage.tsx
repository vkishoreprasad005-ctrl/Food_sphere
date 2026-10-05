import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import {
  Utensils,
  Clock,
  CheckCircle,
  PackageCheck,
  XCircle,
  Search,
  Store,
  Bike,
  UtensilsCrossed,
  Phone,
  Mail,
  AlertCircle,
} from 'lucide-react';

export const BusinessOrdersPage: React.FC = () => {
  const { business, user } = useAuth();
  const { showToast } = useToast();
  const { lastEvent } = useRealtime();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    const res = await apiRequest<Order[]>('/api/tenant/orders');
    if (res.data) {
      setOrders(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [business?.id]);

  useEffect(() => {
    if (lastEvent && (lastEvent.type === 'ORDER_CREATED' || lastEvent.type === 'ORDER_UPDATED')) {
      fetchOrders();
    }
  }, [lastEvent]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const res = await apiRequest(`/api/tenant/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.data) {
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
      }
      showToast(`Order #${orderId} marked as ${newStatus}`, 'success');
    } else {
      showToast(res.error || 'Failed to update order status', 'error');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== 'all' && o.orderStatus !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-amber-500" />
            Kitchen Order Management System (KDS)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time pipeline for <strong className="text-white">{business?.businessName}</strong>. Update statuses to notify customers instantly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Total Orders:</span>
          <span className="font-bold text-white bg-zinc-800 px-3 py-1 rounded-xl text-xs">
            {orders.length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'CONFIRMED', label: 'Confirmed' },
            { id: 'PREPARING', label: 'Kitchen Prep' },
            { id: 'READY', label: 'Ready' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order ID or customer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Orders Table & Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-zinc-900/50 rounded-2xl animate-pulse border border-zinc-800" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800">
          <Utensils className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-zinc-200">No Orders Found</h3>
          <p className="text-xs text-zinc-400 mt-1">Try changing your status filters or search query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all shadow-md space-y-4"
            >
              {/* Row Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-black text-white text-base">#{order.id}</span>
                  <StatusBadge status={order.orderStatus} />
                  <span className="text-xs text-zinc-400 font-medium px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 capitalize flex items-center gap-1">
                    {order.orderType === 'dine_in' && <UtensilsCrossed className="w-3 h-3 text-amber-400" />}
                    {order.orderType === 'takeaway' && <Store className="w-3 h-3 text-emerald-400" />}
                    {order.orderType === 'delivery' && <Bike className="w-3 h-3 text-sky-400" />}
                    {order.orderType.replace('_', ' ')}
                    {order.tableNumber && ` (${order.tableNumber})`}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>•</span>
                  <span>Paid: <strong className="text-emerald-400 uppercase">{order.paymentStatus}</strong></span>
                </div>
              </div>

              {/* Items & Customer Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Customer Details (4 cols) */}
                <div className="md:col-span-4 text-xs space-y-1">
                  <div className="font-bold text-zinc-200">{order.customerName}</div>
                  <div className="text-zinc-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {order.customerEmail}
                  </div>
                  {order.customerPhone && (
                    <div className="text-zinc-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {order.customerPhone}
                    </div>
                  )}
                  {order.deliveryAddress && (
                    <div className="text-amber-400/90 text-[11px] truncate">
                      📍 {order.deliveryAddress}
                    </div>
                  )}
                </div>

                {/* Items Summary (5 cols) */}
                <div className="md:col-span-5 text-xs space-y-1">
                  <div className="font-semibold text-zinc-300">Items Ordered:</div>
                  <div className="text-zinc-400 line-clamp-2">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </div>
                  {order.notes && (
                    <div className="text-[11px] text-amber-300/80 italic mt-0.5">
                      Notes: "{order.notes}"
                    </div>
                  )}
                </div>

                {/* Total & Action (3 cols) */}
                <div className="md:col-span-3 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                  <div className="text-base font-black text-amber-400">
                    ${order.total.toFixed(2)}
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Status Action Buttons Bar */}
              <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-500 font-medium">Quick Status Progression:</span>

                <div className="flex flex-wrap items-center gap-2">
                  {order.orderStatus === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Accept Order
                    </button>
                  )}

                  {(order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED') && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Utensils className="w-3.5 h-3.5" /> Start Kitchen Prep
                    </button>
                  )}

                  {order.orderStatus === 'PREPARING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'READY')}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <PackageCheck className="w-3.5 h-3.5" /> Mark Ready
                    </button>
                  )}

                  {order.orderStatus === 'READY' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Complete & Fulfill
                    </button>
                  )}

                  {order.orderStatus !== 'COMPLETED' && order.orderStatus !== 'CANCELLED' && (
                    <button
                      onClick={() => {
                        if (confirm(`Cancel order #${order.id}?`)) {
                          handleUpdateStatus(order.id, 'CANCELLED');
                        }
                      }}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.id} Breakdown`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <div className="font-bold text-zinc-100 text-sm">{selectedOrder.customerName}</div>
                <div className="text-zinc-400">{selectedOrder.customerEmail} • {selectedOrder.customerPhone}</div>
              </div>
              <StatusBadge status={selectedOrder.orderStatus} />
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-zinc-200">Line Items</h4>
              {selectedOrder.items.map((i, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-zinc-800/50">
                  <div>
                    <span className="font-medium text-zinc-100">{i.quantity}x {i.name}</span>
                    {i.specialInstructions && (
                      <div className="text-[10px] text-zinc-400 italic">"{i.specialInstructions}"</div>
                    )}
                  </div>
                  <span className="font-bold text-zinc-200">${(i.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 space-y-1 text-zinc-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${selectedOrder.tax.toFixed(2)}</span>
              </div>
              {selectedOrder.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>${selectedOrder.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-white text-sm pt-2 border-t border-zinc-800">
                <span>Total Amount</span>
                <span className="text-amber-400">${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-zinc-800 text-zinc-200 font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
