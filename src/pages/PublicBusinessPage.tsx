import React, { useState, useEffect } from 'react';
import { Business, MenuCategory, MenuItem } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { useCart } from '../context/CartContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  MapPin,
  Clock,
  Phone,
  Plus,
  Minus,
  UtensilsCrossed,
  CalendarCheck,
  Search,
  Sparkles,
  Info,
  CheckCircle,
  Tag,
  ShoppingBag,
} from 'lucide-react';

interface PublicBusinessPageProps {
  slug: string;
  onNavigate: (view: string, params?: any) => void;
}

export const PublicBusinessPage: React.FC<PublicBusinessPageProps> = ({ slug, onNavigate }) => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'reservation' | 'info'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<string>('all');

  // Reservation form state
  const { user } = useAuth();
  const { addItem, setIsCartDrawerOpen } = useCart();
  const { showToast } = useToast();

  const [resDate, setResDate] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [resTime, setResTime] = useState('19:00');
  const [resPartySize, setResPartySize] = useState(2);
  const [resNotes, setResNotes] = useState('');
  const [resName, setResName] = useState(user?.name || '');
  const [resEmail, setResEmail] = useState(user?.email || '');
  const [resPhone, setResPhone] = useState(user?.phone || '');
  const [isSubmittingRes, setIsSubmittingRes] = useState(false);
  const [resSuccess, setResSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const res = await apiRequest<{ business: Business; categories: MenuCategory[]; items: MenuItem[] }>(
        `/api/businesses/${slug}/menu`
      );
      if (res.data) {
        setBusiness(res.data.business);
        setCategories(res.data.categories);
        setItems(res.data.items);
      }
      setIsLoading(false);
    }
    load();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-zinc-400 text-sm">Loading eatery menu & cloud catalog...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <UtensilsCrossed className="w-12 h-12 text-zinc-600 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Eatery Not Found</h2>
        <p className="text-sm text-zinc-400">The requested business slug could not be located in FoodSphere.</p>
        <button
          onClick={() => onNavigate('explore')}
          className="px-5 py-2.5 bg-amber-500 text-zinc-950 font-bold rounded-xl text-xs"
        >
          Explore All Businesses
        </button>
      </div>
    );
  }

  const filteredItems = items.filter(item => {
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
    if (dietaryFilter !== 'all' && (!item.dietaryTags || !item.dietaryTags.includes(dietaryFilter))) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleBookReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resName || !resEmail || !resDate || !resTime) {
      showToast('Please complete all required reservation fields', 'error');
      return;
    }

    setIsSubmittingRes(true);
    const res = await apiRequest('/api/reservations', {
      method: 'POST',
      body: JSON.stringify({
        tenantId: business.id,
        date: resDate,
        time: resTime,
        partySize: resPartySize,
        notes: resNotes,
        customerName: resName,
        customerEmail: resEmail,
        customerPhone: resPhone,
      }),
    });
    setIsSubmittingRes(false);

    if (res.data) {
      setResSuccess(true);
      showToast('Reservation requested successfully! The restaurant will review and confirm.', 'success');
    } else {
      showToast(res.error || 'Failed to submit reservation', 'error');
    }
  };

  return (
    <div className="pb-20 space-y-8">
      {/* Eatery Hero Header */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden border-b border-zinc-800">
        <img
          src={business.coverImage}
          alt={business.businessName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={business.logo}
              alt={business.businessName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-zinc-700 shadow-2xl bg-zinc-900"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase mb-1">
                {business.businessType}
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white">{business.businessName}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {business.address}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {business.openingHours}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'menu'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              Menu & Order Online
            </button>
            <button
              onClick={() => setActiveTab('reservation')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'reservation'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              Book a Table
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* TAB 1: MENU & ORDERING */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-amber-500 text-zinc-950 font-bold'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  All Items ({items.length})
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Search & Dietary filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-60">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <select
                  value={dietaryFilter}
                  onChange={e => setDietaryFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Diets</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Gluten-Free">Gluten-Free</option>
                  <option value="Chef Special">Chef Special</option>
                </select>
              </div>
            </div>

            {/* Menu Items Grid */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/30 rounded-3xl border border-zinc-800">
                <UtensilsCrossed className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-zinc-200">No menu items match your selection</h3>
                <p className="text-xs text-zinc-400 mt-1">Try switching categories or clearing search filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col justify-between group shadow-md"
                  >
                    <div>
                      <div className="relative h-44 overflow-hidden bg-zinc-950">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 right-2 flex flex-wrap gap-1">
                          {item.dietaryTags?.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-950/80 backdrop-blur-md text-amber-300 border border-amber-500/20"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                            {item.name}
                          </h4>
                          <span className="text-sm font-black text-amber-400 shrink-0">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="text-[11px] text-zinc-400 flex items-center gap-1 pt-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>~{item.preparationTime} mins prep</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button
                        onClick={() => {
                          addItem(
                            { id: item.id, name: item.name, price: item.price, image: item.image },
                            business,
                            1
                          );
                          showToast(`Added "${item.name}" to cart`, 'success');
                        }}
                        className="w-full py-2.5 px-3 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TABLE RESERVATION */}
        {activeTab === 'reservation' && (
          <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">Reserve a Table at {business.businessName}</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Book in advance. Our team will review availability and confirm your reservation.
              </p>
            </div>

            {resSuccess ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">Reservation Request Received!</h3>
                <p className="text-xs text-zinc-300 max-w-sm mx-auto">
                  Thank you, <strong>{resName}</strong>. Your request for {resPartySize} guests on{' '}
                  <strong>{resDate}</strong> at <strong>{resTime}</strong> has been transmitted to the host.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setResSuccess(false);
                      setActiveTab('menu');
                    }}
                    className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl"
                  >
                    Browse Menu
                  </button>
                  <button
                    onClick={() => onNavigate('customer_reservations')}
                    className="px-4 py-2 bg-zinc-800 text-zinc-200 font-semibold text-xs rounded-xl"
                  >
                    View My Reservations
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookReservation} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Reservation Date *</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={resDate}
                      onChange={e => setResDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Preferred Time *</label>
                    <select
                      value={resTime}
                      onChange={e => setResTime(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="11:30">11:30 AM (Lunch)</option>
                      <option value="12:00">12:00 PM (Lunch)</option>
                      <option value="12:30">12:30 PM (Lunch)</option>
                      <option value="13:00">1:00 PM (Lunch)</option>
                      <option value="17:30">5:30 PM (Dinner)</option>
                      <option value="18:00">6:00 PM (Dinner)</option>
                      <option value="18:30">6:30 PM (Dinner)</option>
                      <option value="19:00">7:00 PM (Dinner)</option>
                      <option value="19:30">7:30 PM (Dinner)</option>
                      <option value="20:00">8:00 PM (Dinner)</option>
                      <option value="20:30">8:30 PM (Dinner)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Party Size *</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      required
                      value={resPartySize}
                      onChange={e => setResPartySize(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={resName}
                      onChange={e => setResName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={resPhone}
                      onChange={e => setResPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="customer@example.com"
                    value={resEmail}
                    onChange={e => setResEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Special Requests or Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Window table, celebrating birthday, highchair needed..."
                    value={resNotes}
                    onChange={e => setResNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingRes}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  {isSubmittingRes ? 'Confirming Reservation...' : 'Request Reservation'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
