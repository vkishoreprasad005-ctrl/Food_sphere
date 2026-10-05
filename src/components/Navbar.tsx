import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';
import {
  Cloud,
  ShoppingBag,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Utensils,
  CalendarDays,
  BarChart3,
  Settings,
  Store,
  Menu as MenuIcon,
  X,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, business, logout, isAuthenticated } = useAuth();
  const { itemCount, setIsCartDrawerOpen } = useCart();
  const { notifications, unreadCount, markAsRead } = useRealtime();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNav = (view: string, params?: any) => {
    onNavigate(view, params);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsNotifOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-zinc-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Cloud className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  FoodSphere
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    SaaS
                  </span>
                </span>
                <span className="text-[10px] text-zinc-400 block -mt-0.5 font-medium tracking-wide">
                  Cloud Food Business System
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 text-sm font-medium">
              <button
                onClick={() => handleNav('explore')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  currentView === 'explore'
                    ? 'bg-zinc-800 text-amber-400'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                Explore Eateries
              </button>

              {/* Role-Specific Portal Links */}
              {user?.role === 'platform_admin' && (
                <>
                  <button
                    onClick={() => handleNav('admin_dashboard')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                      currentView.startsWith('admin_')
                        ? 'bg-amber-500/10 text-amber-400 font-semibold'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" /> Admin Console
                  </button>
                </>
              )}

              {(user?.role === 'business_owner' || user?.role === 'staff') && (
                <>
                  <button
                    onClick={() => handleNav('business_dashboard')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                      currentView === 'business_dashboard'
                        ? 'bg-amber-500/10 text-amber-400 font-semibold'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Business Dashboard
                  </button>

                  <button
                    onClick={() => handleNav('business_orders')}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                      currentView === 'business_orders'
                        ? 'bg-amber-500/10 text-amber-400 font-semibold'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                    }`}
                  >
                    <Utensils className="w-4 h-4" /> Live Orders
                  </button>

                  {user.role === 'business_owner' && (
                    <>
                      <button
                        onClick={() => handleNav('business_menu')}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${
                          currentView === 'business_menu'
                            ? 'bg-amber-500/10 text-amber-400 font-semibold'
                            : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                        }`}
                      >
                        Menu Manager
                      </button>
                      <button
                        onClick={() => handleNav('business_reservations')}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${
                          currentView === 'business_reservations'
                            ? 'bg-amber-500/10 text-amber-400 font-semibold'
                            : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                        }`}
                      >
                        Reservations & Tables
                      </button>
                      <button
                        onClick={() => handleNav('business_analytics')}
                        className={`px-3 py-1.5 rounded-lg transition-colors ${
                          currentView === 'business_analytics'
                            ? 'bg-amber-500/10 text-amber-400 font-semibold'
                            : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                        }`}
                      >
                        Analytics
                      </button>
                    </>
                  )}
                </>
              )}

              {user?.role === 'customer' && (
                <>
                  <button
                    onClick={() => handleNav('customer_orders')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      currentView === 'customer_orders'
                        ? 'bg-amber-500/10 text-amber-400 font-semibold'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                    }`}
                  >
                    My Orders
                  </button>
                  <button
                    onClick={() => handleNav('customer_reservations')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      currentView === 'customer_reservations'
                        ? 'bg-amber-500/10 text-amber-400 font-semibold'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                    }`}
                  >
                    My Reservations
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Open Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Notifications Trigger */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute 1 top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-zinc-950" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">Notifications</span>
                      <span className="text-[11px] text-zinc-400">{notifications.length} updates</span>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800/50">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-zinc-400">No new notifications</div>
                      ) : (
                        notifications.slice(0, 6).map(n => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs transition-colors hover:bg-zinc-800/50 ${
                              !n.read ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="font-semibold text-zinc-200">{n.title}</span>
                              {!n.read && (
                                <button
                                  onClick={() => markAsRead(n.id)}
                                  className="text-amber-400 hover:text-amber-300 text-[10px] shrink-0"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                            <p className="text-zinc-400 leading-snug">{n.message}</p>
                            <span className="text-[10px] text-zinc-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile or Login */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 transition-all text-xs font-medium text-zinc-200"
                >
                  <img
                    src={user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover border border-zinc-700"
                  />
                  <span className="hidden sm:inline font-semibold">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <div className="font-semibold text-zinc-100 text-sm">{user.name}</div>
                      <div className="text-xs text-zinc-400 truncate">{user.email}</div>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-amber-400 border border-zinc-700">
                        {user.role.replace('_', ' ')}
                      </div>
                      {business && (
                        <div className="text-xs text-zinc-400 mt-1">
                          Tenant: <span className="text-zinc-200 font-medium">{business.businessName}</span>
                        </div>
                      )}
                    </div>

                    <div className="py-1 text-xs">
                      {user.role === 'platform_admin' && (
                        <button
                          onClick={() => handleNav('admin_dashboard')}
                          className="w-full px-4 py-2 text-left text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-400" /> Platform Admin Dashboard
                        </button>
                      )}

                      {(user.role === 'business_owner' || user.role === 'staff') && (
                        <>
                          <button
                            onClick={() => handleNav('business_dashboard')}
                            className="w-full px-4 py-2 text-left text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                          >
                            <LayoutDashboard className="w-4 h-4 text-amber-400" /> Business Dashboard
                          </button>
                          <button
                            onClick={() => handleNav('business_orders')}
                            className="w-full px-4 py-2 text-left text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                          >
                            <Utensils className="w-4 h-4 text-emerald-400" /> Live Orders
                          </button>
                          {user.role === 'business_owner' && (
                            <button
                              onClick={() => handleNav('business_settings')}
                              className="w-full px-4 py-2 text-left text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                            >
                              <Settings className="w-4 h-4 text-zinc-400" /> Business Settings
                            </button>
                          )}
                        </>
                      )}

                      {user.role === 'customer' && (
                        <>
                          <button
                            onClick={() => handleNav('customer_orders')}
                            className="w-full px-4 py-2 text-left text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                          >
                            <Utensils className="w-4 h-4 text-amber-400" /> My Orders
                          </button>
                          <button
                            onClick={() => handleNav('customer_reservations')}
                            className="w-full px-4 py-2 text-left text-zinc-300 hover:text-white hover:bg-zinc-800 flex items-center gap-2"
                          >
                            <CalendarDays className="w-4 h-4 text-amber-400" /> My Table Bookings
                          </button>
                        </>
                      )}

                      <div className="border-t border-zinc-800 my-1" />

                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                          handleNav('home');
                        }}
                        className="w-full px-4 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl shadow-md shadow-amber-500/10 transition-all"
                >
                  Register Business
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-800 bg-zinc-950 px-4 pt-2 pb-6 space-y-2 text-sm font-medium">
          <button
            onClick={() => handleNav('home')}
            className="w-full text-left py-2 text-zinc-300 hover:text-white"
          >
            Home Overview
          </button>
          <button
            onClick={() => handleNav('explore')}
            className="w-full text-left py-2 text-zinc-300 hover:text-white"
          >
            Explore Eateries
          </button>

          {user?.role === 'platform_admin' && (
            <button
              onClick={() => handleNav('admin_dashboard')}
              className="w-full text-left py-2 text-amber-400 font-bold"
            >
              Platform Admin Dashboard
            </button>
          )}

          {(user?.role === 'business_owner' || user?.role === 'staff') && (
            <>
              <button
                onClick={() => handleNav('business_dashboard')}
                className="w-full text-left py-2 text-amber-400 font-bold"
              >
                Business Dashboard
              </button>
              <button
                onClick={() => handleNav('business_orders')}
                className="w-full text-left py-2 text-zinc-300"
              >
                Live Orders
              </button>
              <button
                onClick={() => handleNav('business_menu')}
                className="w-full text-left py-2 text-zinc-300"
              >
                Menu Manager
              </button>
              <button
                onClick={() => handleNav('business_reservations')}
                className="w-full text-left py-2 text-zinc-300"
              >
                Reservations & Tables
              </button>
              <button
                onClick={() => handleNav('business_analytics')}
                className="w-full text-left py-2 text-zinc-300"
              >
                Business Analytics
              </button>
            </>
          )}

          {user?.role === 'customer' && (
            <>
              <button
                onClick={() => handleNav('customer_orders')}
                className="w-full text-left py-2 text-zinc-300"
              >
                My Orders
              </button>
              <button
                onClick={() => handleNav('customer_reservations')}
                className="w-full text-left py-2 text-zinc-300"
              >
                My Reservations
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
