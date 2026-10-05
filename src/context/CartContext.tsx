import React, { createContext, useContext, useState, useEffect } from 'react';
import { OrderItem, Business } from '../types/index.ts';

interface CartContextType {
  tenantId: string | null;
  business: Business | null;
  items: OrderItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  setOrderType: (type: 'dine_in' | 'takeaway' | 'delivery') => void;
  addItem: (item: { id: string; name: string; price: number; image?: string }, business: Business, quantity?: number, instructions?: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenantId, setTenantId] = useState<string | null>(() => localStorage.getItem('foodsphere_cart_tenant'));
  const [business, setBusiness] = useState<Business | null>(() => {
    const saved = localStorage.getItem('foodsphere_cart_biz');
    return saved ? JSON.parse(saved) : null;
  });
  const [items, setItems] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem('foodsphere_cart_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    if (tenantId) {
      localStorage.setItem('foodsphere_cart_tenant', tenantId);
    } else {
      localStorage.removeItem('foodsphere_cart_tenant');
    }
  }, [tenantId]);

  useEffect(() => {
    if (business) {
      localStorage.setItem('foodsphere_cart_biz', JSON.stringify(business));
    } else {
      localStorage.removeItem('foodsphere_cart_biz');
    }
  }, [business]);

  useEffect(() => {
    localStorage.setItem('foodsphere_cart_items', JSON.stringify(items));
  }, [items]);

  const addItem = (
    item: { id: string; name: string; price: number; image?: string },
    biz: Business,
    quantity = 1,
    instructions = ''
  ) => {
    // If adding from a different business, switch cart over
    if (tenantId && tenantId !== biz.id) {
      if (!confirm(`Your cart contains items from ${business?.businessName || 'another restaurant'}. Reset cart to start order from ${biz.businessName}?`)) {
        return;
      }
      setItems([]);
    }

    setTenantId(biz.id);
    setBusiness(biz);

    setItems(prev => {
      const idx = prev.findIndex(i => i.menuItemId === item.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + quantity,
          specialInstructions: instructions || next[idx].specialInstructions,
        };
        return next;
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity,
          image: item.image,
          specialInstructions: instructions,
        },
      ];
    });

    setIsCartDrawerOpen(true);
  };

  const removeItem = (menuItemId: string) => {
    setItems(prev => {
      const filtered = prev.filter(i => i.menuItemId !== menuItemId);
      if (filtered.length === 0) {
        setTenantId(null);
        setBusiness(null);
      }
      return filtered;
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems(prev =>
      prev.map(i => (i.menuItemId === menuItemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setTenantId(null);
    setBusiness(null);
  };

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = Math.round(items.reduce((acc, i) => acc + i.price * i.quantity, 0) * 100) / 100;
  const taxRate = business?.taxRate || 0.08;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const deliveryFee = orderType === 'delivery' && items.length > 0 ? (business?.deliveryFee || 3.99) : 0;
  const total = Math.round((subtotal + tax + deliveryFee) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        tenantId,
        business,
        items,
        itemCount,
        subtotal,
        tax,
        deliveryFee,
        total,
        orderType,
        setOrderType,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
