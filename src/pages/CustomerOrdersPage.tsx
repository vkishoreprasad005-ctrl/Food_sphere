import React, { useState, useEffect } from 'react';
import { Order } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { ShoppingBag, ArrowRight, Clock, Store } from 'lucide-react';

interface CustomerOrdersPageProps {
  onNavigate: (view: string, params?: any) => void;
}

export const CustomerOrdersPage: React.FC<CustomerOrdersPageProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const res = await apiRequest<Order[]>('/api/orders/my-orders');
      if (res.data) {
        setOrders(res.data);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Orders</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Track active food orders and view past receipts across all FoodSphere eateries.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-zinc-900/50 rounded-2xl animate-pulse border border-zinc-800" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800 space-y-4">
          <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto" />
          <h2 className="text-base font-semibold text-zinc-200">No Orders Yet</h2>
          <p className="text-xs text-zinc-400">Discover gourmet eateries and order delicious meals today.</p>
          <button
            onClick={() => onNavigate('explore')}
            className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-xl text-xs"
          >
            Explore Menus
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white text-base">#{order.id}</span>
                  <StatusBadge status={order.orderStatus} />
                  <span className="text-xs text-zinc-400 capitalize bg-zinc-800/80 px-2 py-0.5 rounded">
                    {order.orderType.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>{order.items.length} items</span>
                </div>
                <div className="text-xs text-zinc-300 line-clamp-1 pt-1">
                  {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Total</div>
                  <div className="text-base font-black text-amber-400">${order.total.toFixed(2)}</div>
                </div>

                <button
                  onClick={() => onNavigate('customer_order_detail', { id: order.id })}
                  className="px-4 py-2 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Live Tracker</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
