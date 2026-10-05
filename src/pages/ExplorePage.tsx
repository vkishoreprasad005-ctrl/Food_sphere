import React, { useState, useEffect } from 'react';
import { Business } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { Search, MapPin, Clock, Phone, ArrowRight, Utensils, Coffee, Cake, Flame } from 'lucide-react';

interface ExplorePageProps {
  onNavigate: (view: string, params?: any) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ onNavigate }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const res = await apiRequest<Business[]>('/api/businesses');
      if (res.data) {
        setBusinesses(res.data);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  const filtered = businesses.filter(b => {
    if (selectedType !== 'all' && b.businessType !== selectedType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        b.businessName.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">Explore Food Businesses</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Discover restaurants, cafés, and bakeries powered by FoodSphere cloud SaaS.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search eatery name, cuisine, address..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Businesses' },
            { id: 'restaurant', label: 'Restaurants' },
            { id: 'bakery', label: 'Bakeries' },
            { id: 'cafe', label: 'Cafés' },
            { id: 'cloud_kitchen', label: 'Cloud Kitchens' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedType === tab.id
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-zinc-900/40 rounded-3xl animate-pulse border border-zinc-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800">
          <Utensils className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-200">No eateries match your criteria</h3>
          <p className="text-xs text-zinc-400 mt-1">Try resetting the search filters or register a new business.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(biz => (
            <div
              key={biz.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col group shadow-lg"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={biz.coverImage}
                  alt={biz.businessName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                <span className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-amber-400 border border-amber-500/20 capitalize">
                  {biz.businessType.replace('_', ' ')}
                </span>
                <span className="absolute top-3 right-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Open Now
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3 mb-2">
                    <img
                      src={biz.logo}
                      alt={biz.businessName}
                      className="w-10 h-10 rounded-xl object-cover border border-zinc-700 shrink-0"
                    />
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                        {biz.businessName}
                      </h3>
                      <div className="text-[11px] text-zinc-400 line-clamp-1">{biz.address}</div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                    {biz.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-1 text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{biz.openingHours}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>{biz.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <div className="text-xs text-zinc-400">
                    Delivery: <span className="text-zinc-200 font-semibold">${biz.deliveryFee.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => onNavigate('business_public', { slug: biz.slug })}
                    className="py-2 px-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>View Menu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
