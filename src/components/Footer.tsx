import React from 'react';
import { Cloud, Shield, Database, Sparkles, Code2, Server } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, params?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-zinc-950 font-black">
                <Cloud className="w-4 h-4 fill-current" />
              </div>
              <span className="text-base font-black text-white">FoodSphere</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Enterprise-grade multi-tenant SaaS platform empowering independent restaurants, cafés, bakeries, and cloud kitchens with centralized cloud operations.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Multi-Tenant Cloud Cluster
            </div>
          </div>

          {/* Platform Solutions */}
          <div>
            <h4 className="text-zinc-200 font-semibold mb-3 text-sm">Platform Modules</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-amber-400 transition-colors">
                  Digital Menu & Online Ordering
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-amber-400 transition-colors">
                  Table & Reservation System
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-amber-400 transition-colors">
                  Live Kitchen KDS & Order Status
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-amber-400 transition-colors">
                  Multi-Tenant Tenant Isolation
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-amber-400 transition-colors">
                  Business Intelligence & Analytics
                </button>
              </li>
            </ul>
          </div>

          {/* Target Food Businesses */}
          <div>
            <h4 className="text-zinc-200 font-semibold mb-3 text-sm">Supported Businesses</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-500" />
                Fine Dining & Casual Restaurants
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-500" />
                Artisan Bakeries & Patisseries
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-500" />
                Specialty Cafes & Espresso Bars
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-500" />
                Ghost Kitchens & Virtual Brands
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-amber-500" />
                Bistros & Food Trucks
              </li>
            </ul>
          </div>

          {/* Architecture & Tech Specs */}
          <div>
            <h4 className="text-zinc-200 font-semibold mb-3 text-sm">Architecture Proof</h4>
            <div className="space-y-2 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Database className="w-3 h-3 text-amber-400" /> Data Isolation
                </span>
                <span className="text-amber-300 font-mono">Row-Level Tenant ID</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Server className="w-3 h-3 text-sky-400" /> Realtime Engine
                </span>
                <span className="text-sky-300 font-mono">Server-Sent Events</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" /> RBAC Matrix
                </span>
                <span className="text-emerald-300 font-mono">Admin/Owner/Staff/Cust</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Code2 className="w-3 h-3 text-purple-400" /> Payments & Media
                </span>
                <span className="text-purple-300 font-mono">Stripe + Cloudinary</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-400 text-[11px]">
          <div>
            © {new Date().getFullYear()} FoodSphere SaaS Inc. Cloud-Based Multi-Tenant Food Business Management.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400">Strict Tenant-Aware Authorization</span>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-400">REST API Architecture</span>
            <span className="text-zinc-700">•</span>
            <span className="text-amber-400">Academic Project Implementation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
