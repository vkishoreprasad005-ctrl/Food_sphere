import React, { useState, useEffect } from 'react';
import { Reservation } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { CalendarDays, Clock, Users, MapPin, Store } from 'lucide-react';

interface CustomerReservationsPageProps {
  onNavigate: (view: string, params?: any) => void;
}

export const CustomerReservationsPage: React.FC<CustomerReservationsPageProps> = ({ onNavigate }) => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const res = await apiRequest<any[]>('/api/reservations/my-reservations');
      if (res.data) {
        setReservations(res.data);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Table Bookings</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Review your dining reservations and booking status across restaurants.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-28 bg-zinc-900/50 rounded-2xl animate-pulse border border-zinc-800" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800 space-y-4">
          <CalendarDays className="w-12 h-12 text-zinc-600 mx-auto" />
          <h2 className="text-base font-semibold text-zinc-200">No Reservations Found</h2>
          <p className="text-xs text-zinc-400">Reserve a table at an artisan bistro or bakery patio today.</p>
          <button
            onClick={() => onNavigate('explore')}
            className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-xl text-xs"
          >
            Find a Restaurant
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map(res => (
            <div
              key={res.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-white text-base">{res.businessName}</h3>
                  <StatusBadge status={res.status} />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <CalendarDays className="w-4 h-4" />
                    <span>{res.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span>{res.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-zinc-400" />
                    <span>{res.partySize} Guests</span>
                  </div>
                  {res.tableNumber && (
                    <div className="text-emerald-400 font-medium">
                      Assigned: {res.tableNumber}
                    </div>
                  )}
                </div>

                {res.businessAddress && (
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{res.businessAddress}</span>
                  </div>
                )}

                {res.notes && (
                  <div className="text-xs text-zinc-400 italic">
                    Special request: "{res.notes}"
                  </div>
                )}
              </div>

              <div className="text-right text-[11px] text-zinc-400 self-end sm:self-center">
                Requested on {new Date(res.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
