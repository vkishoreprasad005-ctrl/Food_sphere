import React, { useState } from 'react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { apiRequest } from '../services/api.ts';
import {
  CreditCard,
  UtensilsCrossed,
  Bike,
  Store,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';

interface CheckoutPageProps {
  onNavigate: (view: string, params?: any) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const {
    items,
    business,
    subtotal,
    tax,
    deliveryFee,
    total,
    orderType,
    setOrderType,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState(user?.name || 'Sarah Jenkins');
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'customer@example.com');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '+1 (555) 321-9876');

  const [tableNumber, setTableNumber] = useState('Table 3');
  const [deliveryAddress, setDeliveryAddress] = useState('450 Mission St, Apt 18B, San Francisco, CA');
  const [orderNotes, setOrderNotes] = useState('');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>('stripe');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  const [isProcessing, setIsProcessing] = useState(false);

  if (items.length === 0 || !business) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <Store className="w-12 h-12 text-zinc-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Your Cart is Empty</h2>
        <p className="text-xs text-zinc-400">Add delicious items to your cart before proceeding to checkout.</p>
        <button
          onClick={() => onNavigate('explore')}
          className="px-5 py-2.5 bg-amber-500 text-zinc-950 font-bold rounded-xl text-xs"
        >
          Explore Eateries
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail) {
      showToast('Name and email are required to place order', 'error');
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      showToast('Delivery address is required for delivery orders', 'error');
      return;
    }

    setIsProcessing(true);

    // Call checkout backend API
    const res = await apiRequest<{ id: string }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        tenantId: business.id,
        items: items.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          specialInstructions: i.specialInstructions,
        })),
        orderType,
        tableNumber: orderType === 'dine_in' ? tableNumber : undefined,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
        notes: orderNotes,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
      }),
    });

    setIsProcessing(false);

    if (res.data) {
      const createdId = res.data.id;
      showToast(`Order #${createdId} placed successfully!`, 'success');
      clearCart();
      // Redirect to live order tracking page
      onNavigate('customer_order_detail', { id: createdId });
    } else {
      showToast(res.error || 'Failed to place order', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('business_public', { slug: business.slug })}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Complete Your Order</h1>
          <p className="text-xs text-zinc-400">
            Ordering from <strong className="text-amber-400">{business.businessName}</strong>
          </p>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Dining Preference */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                1
              </span>
              Dining Preference
            </h2>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('dine_in')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  orderType === 'dine_in'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <UtensilsCrossed className="w-5 h-5 mx-auto mb-1 text-current" />
                <span className="text-xs block">Dine-In</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('takeaway')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  orderType === 'takeaway'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Store className="w-5 h-5 mx-auto mb-1 text-current" />
                <span className="text-xs block">Takeout</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  orderType === 'delivery'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Bike className="w-5 h-5 mx-auto mb-1 text-current" />
                <span className="text-xs block">Delivery</span>
              </button>
            </div>

            {orderType === 'dine_in' && (
              <div>
                <label className="block text-zinc-300 text-xs font-medium mb-1">Table Number</label>
                <input
                  type="text"
                  placeholder="e.g. Table 4 or Bar 2"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {orderType === 'delivery' && (
              <div>
                <label className="block text-zinc-300 text-xs font-medium mb-1">Delivery Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street address, apartment, suite number..."
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* 2. Customer Information */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                2
              </span>
              Guest & Contact Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-300 font-medium mb-1">Email Address (for Receipt & Tracking) *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-300 font-medium mb-1">Kitchen Preparation Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Dressing on the side, allergies, extra napkins..."
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                3
              </span>
              Payment Method
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                  paymentMethod === 'stripe'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <CreditCard className="w-4 h-4 text-current" />
                <span className="text-xs">Credit Card (Stripe)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Store className="w-4 h-4 text-current" />
                <span className="text-xs">Pay at Counter / Cash</span>
              </button>
            </div>

            {paymentMethod === 'stripe' && (
              <div className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span className="flex items-center gap-1 font-semibold text-zinc-300">
                    <Lock className="w-3 h-3 text-emerald-400" /> Stripe 256-Bit Test Mode Encryption
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-mono">
                    READY
                  </span>
                </div>

                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 text-[11px] mb-1">Expiration</label>
                    <input
                      type="text"
                      value={cardExp}
                      onChange={e => setCardExp(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 text-[11px] mb-1">CVC</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Summary Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 sticky top-24 shadow-xl">
            <h2 className="text-base font-bold text-white border-b border-zinc-800 pb-3">
              Order Summary ({items.length} items)
            </h2>

            <div className="max-h-60 overflow-y-auto divide-y divide-zinc-800/60 pr-1 space-y-2">
              {items.map(item => (
                <div key={item.menuItemId} className="pt-2 flex items-start justify-between gap-3 text-xs">
                  <div className="flex-1">
                    <span className="font-semibold text-zinc-200">
                      {item.quantity}x {item.name}
                    </span>
                    {item.specialInstructions && (
                      <div className="text-[10px] text-zinc-400 italic">"{item.specialInstructions}"</div>
                    )}
                  </div>
                  <span className="font-bold text-zinc-200">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-zinc-800 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-zinc-200">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({((business.taxRate || 0.08) * 100).toFixed(1)}%)</span>
                <span className="text-zinc-200">${tax.toFixed(2)}</span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-zinc-200">${deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-zinc-800">
                <span>Total Amount</span>
                <span className="text-amber-400">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black rounded-xl text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <span>Authorizing Payment...</span>
              ) : (
                <>
                  <span>Place Order & Pay ${total.toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-[10px] text-zinc-500 text-center leading-relaxed">
              By confirming, order is instantly synced with the cloud kitchen KDS and tracked in real-time.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
