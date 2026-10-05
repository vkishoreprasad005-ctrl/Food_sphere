import React from 'react';
import { useCart } from '../context/CartContext.tsx';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, UtensilsCrossed, Bike, Store } from 'lucide-react';

interface CartDrawerProps {
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const {
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    items,
    business,
    itemCount,
    subtotal,
    tax,
    deliveryFee,
    total,
    orderType,
    setOrderType,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside aria-label="Shopping Cart" className="w-screen max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-zinc-100">Your Cart</h2>
              <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded-full font-medium">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Business banner */}
          {business && (
            <div className="bg-zinc-800/40 px-6 py-2.5 border-b border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <Store className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">{business.businessName}</span>
              </div>
              <button
                onClick={clearCart}
                className="text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          )}

          {/* Order Type Toggle */}
          {items.length > 0 && (
            <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-950/40">
              <div className="text-xs font-medium text-zinc-400 mb-2">Order Dining Preference</div>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setOrderType('dine_in')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    orderType === 'dine_in'
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" /> Dine-in
                </button>
                <button
                  onClick={() => setOrderType('takeaway')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    orderType === 'takeaway'
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" /> Takeout
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    orderType === 'delivery'
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" /> Delivery
                </button>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-medium text-zinc-200 mb-1">Your cart is empty</h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto mb-6">
                  Browse menus from gourmet restaurants, cafés, and bakeries to start your order.
                </p>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold rounded-xl transition-all"
                >
                  Explore Menus
                </button>
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.menuItemId}
                  className="flex gap-3 bg-zinc-800/30 p-3 rounded-xl border border-zinc-800/60"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg shrink-0 border border-zinc-700/50"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-zinc-100 truncate">{item.name}</h4>
                      <span className="text-sm font-bold text-amber-400 shrink-0">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">${item.price.toFixed(2)} each</div>

                    {item.specialInstructions && (
                      <div className="text-[11px] text-amber-300/80 italic mt-1 bg-amber-500/10 px-2 py-0.5 rounded">
                        "{item.specialInstructions}"
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-zinc-700 rounded-lg bg-zinc-900">
                        <button
                          onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                          className="p-1 hover:text-amber-400 text-zinc-400 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold text-zinc-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                          className="p-1 hover:text-amber-400 text-zinc-400 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.menuItemId)}
                        className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-zinc-800 bg-zinc-900/90 space-y-3">
              <div className="space-y-1.5 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-zinc-200">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="text-zinc-200">${tax.toFixed(2)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="text-zinc-200">${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-zinc-100 pt-2 border-t border-zinc-800">
                  <span>Total</span>
                  <span className="text-amber-400">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  onCheckout();
                }}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
