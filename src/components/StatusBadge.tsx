import React from 'react';
import { OrderStatus, ReservationStatus } from '../types/index.ts';

interface StatusBadgeProps {
  status: OrderStatus | ReservationStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = status.toUpperCase();

  let styles = 'bg-zinc-800 text-zinc-300 border-zinc-700';

  if (s === 'PENDING') {
    styles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (s === 'CONFIRMED') {
    styles = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  } else if (s === 'PREPARING') {
    styles = 'bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse';
  } else if (s === 'READY') {
    styles = 'bg-teal-500/10 text-teal-400 border-teal-500/30';
  } else if (s === 'COMPLETED') {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (s === 'CANCELLED') {
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (s === 'ACTIVE') {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (s === 'SUSPENDED') {
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full border ${padding} ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
};
