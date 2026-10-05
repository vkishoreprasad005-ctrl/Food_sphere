/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider, useCart } from './context/CartContext.tsx';
import { RealtimeProvider } from './context/RealtimeContext.tsx';

import { QuickDemoBar } from './components/QuickDemoBar.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';

// Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { ExplorePage } from './pages/ExplorePage.tsx';
import { PublicBusinessPage } from './pages/PublicBusinessPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { OrderDetailPage } from './pages/OrderDetailPage.tsx';
import { CustomerOrdersPage } from './pages/CustomerOrdersPage.tsx';
import { CustomerReservationsPage } from './pages/CustomerReservationsPage.tsx';
import { BusinessDashboardPage } from './pages/BusinessDashboardPage.tsx';
import { BusinessOrdersPage } from './pages/BusinessOrdersPage.tsx';
import { BusinessMenuPage } from './pages/BusinessMenuPage.tsx';
import { BusinessReservationsPage } from './pages/BusinessReservationsPage.tsx';
import { BusinessCustomersPage } from './pages/BusinessCustomersPage.tsx';
import { BusinessAnalyticsPage } from './pages/BusinessAnalyticsPage.tsx';
import { BusinessSettingsPage } from './pages/BusinessSettingsPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';

function MainApp() {
  const { user } = useAuth();

  const [currentView, setCurrentView] = useState<string>(() => {
    // Check initial hash route if any
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('/business/')) return 'business_public';
    if (hash.startsWith('/orders/')) return 'customer_order_detail';
    return hash || 'home';
  });

  const [viewParams, setViewParams] = useState<any>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('/business/')) {
      return { slug: hash.replace('/business/', '') };
    }
    if (hash.startsWith('/orders/')) {
      return { id: hash.replace('/orders/', '') };
    }
    return {};
  });

  // Navigate handler
  const handleNavigate = (view: string, params: any = {}) => {
    setCurrentView(view);
    setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Sync hash
    if (view === 'business_public' && params.slug) {
      window.location.hash = `/business/${params.slug}`;
    } else if (view === 'customer_order_detail' && params.id) {
      window.location.hash = `/orders/${params.id}`;
    } else {
      window.location.hash = view;
    }
  };

  // Sync hash changes (browser forward/back)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('/business/')) {
        setCurrentView('business_public');
        setViewParams({ slug: hash.replace('/business/', '') });
      } else if (hash.startsWith('/orders/')) {
        setCurrentView('customer_order_detail');
        setViewParams({ id: hash.replace('/orders/', '') });
      } else if (hash) {
        setCurrentView(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Multi-Tenant Academic Demo Switcher Header */}
      <QuickDemoBar />

      {/* Main SaaS App Navbar */}
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && <LandingPage onNavigate={handleNavigate} />}
        {currentView === 'explore' && <ExplorePage onNavigate={handleNavigate} />}
        {currentView === 'business_public' && (
          <PublicBusinessPage slug={viewParams.slug || 'artisanal-fork'} onNavigate={handleNavigate} />
        )}
        {currentView === 'checkout' && <CheckoutPage onNavigate={handleNavigate} />}
        {currentView === 'customer_orders' && <CustomerOrdersPage onNavigate={handleNavigate} />}
        {currentView === 'customer_order_detail' && (
          <OrderDetailPage orderId={viewParams.id || 'ORD-1001'} onNavigate={handleNavigate} />
        )}
        {currentView === 'customer_reservations' && (
          <CustomerReservationsPage onNavigate={handleNavigate} />
        )}

        {/* Business Tenant Management */}
        {currentView === 'business_dashboard' && <BusinessDashboardPage onNavigate={handleNavigate} />}
        {currentView === 'business_orders' && <BusinessOrdersPage />}
        {currentView === 'business_menu' && <BusinessMenuPage />}
        {currentView === 'business_reservations' && <BusinessReservationsPage />}
        {currentView === 'business_customers' && <BusinessCustomersPage />}
        {currentView === 'business_analytics' && <BusinessAnalyticsPage />}
        {currentView === 'business_settings' && <BusinessSettingsPage />}

        {/* Platform Admin */}
        {currentView === 'admin_dashboard' && <AdminDashboardPage />}

        {/* Auth */}
        {currentView === 'login' && <LoginPage onNavigate={handleNavigate} />}
        {currentView === 'register' && <RegisterPage onNavigate={handleNavigate} />}
      </main>

      {/* Persistent Shopping Cart Drawer */}
      <CartDrawer onCheckout={() => handleNavigate('checkout')} />

      {/* SaaS Platform Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <RealtimeProvider>
            <MainApp />
          </RealtimeProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
