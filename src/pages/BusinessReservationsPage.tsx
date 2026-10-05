import React, { useState, useEffect } from 'react';
import { Reservation, RestaurantTable } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  MapPin,
  Phone,
  Mail,
  LayoutGrid,
} from 'lucide-react';

export const BusinessReservationsPage: React.FC = () => {
  const { business } = useAuth();
  const { showToast } = useToast();
  const { lastEvent } = useRealtime();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Table modal state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [tableCapacity, setTableCapacity] = useState(4);
  const [tableLocation, setTableLocation] = useState<'indoor' | 'patio' | 'rooftop' | 'bar'>('indoor');

  const fetchData = async () => {
    setIsLoading(true);
    const [resList, tblList] = await Promise.all([
      apiRequest<Reservation[]>('/api/tenant/reservations'),
      apiRequest<RestaurantTable[]>('/api/tenant/tables'),
    ]);
    if (resList.data) setReservations(resList.data);
    if (tblList.data) setTables(tblList.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [business?.id]);

  useEffect(() => {
    if (lastEvent && (lastEvent.type === 'RESERVATION_CREATED' || lastEvent.type === 'RESERVATION_UPDATED')) {
      fetchData();
    }
  }, [lastEvent]);

  // Update reservation status & table assignment
  const handleUpdateStatus = async (
    reservationId: string,
    status: Reservation['status'],
    tableId?: string,
    tableNum?: string | number
  ) => {
    const res = await apiRequest(`/api/tenant/reservations/${reservationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, tableId, tableNumber: tableNum }),
    });

    if (res.data) {
      setReservations(prev =>
        prev.map(r => (r.id === reservationId ? { ...r, status, tableId, tableNumber: tableNum } : r))
      );
      showToast(`Reservation marked as ${status}`, 'success');
    } else {
      showToast(res.error || 'Failed to update reservation', 'error');
    }
  };

  // Add Table
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber) {
      showToast('Table number is required', 'error');
      return;
    }

    const res = await apiRequest('/api/tenant/tables', {
      method: 'POST',
      body: JSON.stringify({
        tableNumber,
        capacity: Number(tableCapacity),
        location: tableLocation,
        status: 'available',
      }),
    });

    if (res.data) {
      showToast(`Table "${tableNumber}" created`, 'success');
      fetchData();
      setIsTableModalOpen(false);
      setTableNumber('');
    } else {
      showToast(res.error || 'Failed to add table', 'error');
    }
  };

  const handleDeleteTable = async (id: string, name: string | number) => {
    if (!confirm(`Remove table ${name}?`)) return;
    const res = await apiRequest(`/api/tenant/tables/${id}`, { method: 'DELETE' });
    if (res.data) {
      showToast(`Table ${name} deleted`, 'success');
      fetchData();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-amber-500" />
            Table Reservations & Floor Plan
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage incoming guest bookings and organize seating capacity for <strong className="text-white">{business?.businessName}</strong>.
          </p>
        </div>

        <button
          onClick={() => setIsTableModalOpen(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dining Table</span>
        </button>
      </div>

      {/* Floor Plan / Tables Section */}
      <div className="bg-zinc-900/60 p-6 rounded-3xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-amber-400" />
            Dining Tables & Layout ({tables.length})
          </h2>
          <span className="text-[11px] text-zinc-400">Click table to inspect</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tables.map(tbl => (
            <div
              key={tbl.id}
              className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                tbl.status === 'occupied'
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : tbl.status === 'reserved'
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-zinc-950 border-zinc-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-black text-zinc-100">{tbl.tableNumber}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                      tbl.status === 'occupied'
                        ? 'bg-rose-500/10 text-rose-400'
                        : tbl.status === 'reserved'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {tbl.status}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-zinc-400" />
                  <span>{tbl.capacity} seats</span>
                </div>
                <div className="text-[10px] text-zinc-400 capitalize mt-0.5">
                  📍 {tbl.location}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/60 mt-2 flex justify-end">
                <button
                  onClick={() => handleDeleteTable(tbl.id, tbl.tableNumber)}
                  className="text-zinc-600 hover:text-rose-400 p-1 transition-colors"
                  title="Remove table"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reservations List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white">Incoming Guest Bookings ({reservations.length})</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-zinc-950 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12 text-xs text-zinc-500">No reservations requested yet</div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {reservations.map(res => (
              <div
                key={res.id}
                className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-sm">{res.customerName}</span>
                    <StatusBadge status={res.status} size="sm" />
                    {res.tableNumber && (
                      <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                        Seated: {res.tableNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-zinc-300">
                    <span className="flex items-center gap-1 font-semibold text-amber-400">
                      <CalendarDays className="w-3.5 h-3.5" /> {res.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" /> {res.time}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-zinc-400" /> {res.partySize} Guests
                    </span>
                  </div>

                  <div className="text-zinc-400 flex items-center gap-3 text-[11px]">
                    <span>{res.customerEmail}</span>
                    {res.customerPhone && <span>• {res.customerPhone}</span>}
                  </div>

                  {res.notes && (
                    <div className="text-zinc-400 italic text-[11px] pt-0.5">
                      "{res.notes}"
                    </div>
                  )}
                </div>

                {/* Status & Assignment controls */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                  {/* Table assignment dropdown */}
                  <select
                    value={res.tableId || ''}
                    onChange={e => {
                      const selectedTbl = tables.find(t => t.id === e.target.value);
                      handleUpdateStatus(
                        res.id,
                        res.status,
                        selectedTbl?.id,
                        selectedTbl?.tableNumber
                      );
                    }}
                    className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Assign Table...</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.tableNumber} ({t.capacity}p)
                      </option>
                    ))}
                  </select>

                  {res.status === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateStatus(res.id, 'CONFIRMED', res.tableId, res.tableNumber)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Confirm
                    </button>
                  )}

                  {res.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateStatus(res.id, 'COMPLETED', res.tableId, res.tableNumber)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Seat / Complete
                    </button>
                  )}

                  {res.status !== 'CANCELLED' && res.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleUpdateStatus(res.id, 'CANCELLED')}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Table Modal */}
      <Modal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        title="Add Restaurant Table"
      >
        <form onSubmit={handleAddTable} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-medium mb-1">Table Number or Identifier *</label>
            <input
              type="text"
              required
              placeholder="e.g. Table 5, Patio 2, Booth 1"
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Seating Capacity</label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={tableCapacity}
                onChange={e => setTableCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Section Location</label>
              <select
                value={tableLocation}
                onChange={e => setTableLocation(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                <option value="indoor">Indoor Dining Room</option>
                <option value="patio">Outdoor Patio</option>
                <option value="rooftop">Rooftop Terrace</option>
                <option value="bar">Bar Counter</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsTableModalOpen(false)}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-xl"
            >
              Add Table
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
