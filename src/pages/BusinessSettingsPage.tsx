import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { apiRequest } from '../services/api.ts';
import { Business } from '../types/index.ts';
import { Settings, Store, Clock, MapPin, Phone, Mail, Image as ImageIcon, Save, ShieldCheck } from 'lucide-react';

export const BusinessSettingsPage: React.FC = () => {
  const { business, updateCurrentBusiness } = useAuth();
  const { showToast } = useToast();

  const [bizName, setBizName] = useState(business?.businessName || '');
  const [bizType, setBizType] = useState(business?.businessType || 'restaurant');
  const [desc, setDesc] = useState(business?.description || '');
  const [address, setAddress] = useState(business?.address || '');
  const [phone, setPhone] = useState(business?.phone || '');
  const [email, setEmail] = useState(business?.email || '');
  const [hours, setHours] = useState(business?.openingHours || '');
  const [taxRate, setTaxRate] = useState(((business?.taxRate || 0.08) * 100).toString());
  const [deliveryFee, setDeliveryFee] = useState((business?.deliveryFee || 3.99).toString());
  const [logo, setLogo] = useState(business?.logo || '');
  const [coverImage, setCoverImage] = useState(business?.coverImage || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName.trim()) {
      showToast('Business name is required', 'error');
      return;
    }

    setIsSaving(true);
    const res = await apiRequest<Business>('/api/tenant/info', {
      method: 'PUT',
      body: JSON.stringify({
        businessName: bizName,
        businessType: bizType,
        description: desc,
        address,
        phone,
        email,
        openingHours: hours,
        taxRate: Number(taxRate) / 100,
        deliveryFee: Number(deliveryFee),
        logo,
        coverImage,
      }),
    });
    setIsSaving(false);

    if (res.data) {
      updateCurrentBusiness(res.data);
      showToast('Business profile and operational settings saved!', 'success');
    } else {
      showToast(res.error || 'Failed to update settings', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-500" />
            Business Profile & Cloud Settings
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure metadata, contact info, taxes, delivery rates, and branding for <strong className="text-white">{business?.businessName}</strong>.
          </p>
        </div>

        <div className="text-[11px] font-mono text-zinc-500">
          Tenant Slug: <span className="text-amber-400">{business?.slug}</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Basic Info Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white">General Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={bizName}
                onChange={e => setBizName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Business Category *</label>
              <select
                value={bizType}
                onChange={e => setBizType(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                <option value="restaurant">Full Service Restaurant</option>
                <option value="bakery">Artisan Bakery & Patisserie</option>
                <option value="cafe">Specialty Cafe & Espresso</option>
                <option value="cloud_kitchen">Cloud / Ghost Kitchen</option>
                <option value="food_truck">Food Truck & Mobile</option>
                <option value="bistro">Bistro & Wine Bar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Public Story & Description</label>
            <textarea
              rows={3}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Operational & Rates Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white">Operations & Rates</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Opening Hours</label>
              <input
                type="text"
                placeholder="e.g. Mon-Sun: 11:00 AM – 10:00 PM"
                value={hours}
                onChange={e => setHours(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Sales Tax Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="30"
                value={taxRate}
                onChange={e => setTaxRate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">Applied to online orders automatically</span>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Base Delivery Fee ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={deliveryFee}
                onChange={e => setDeliveryFee(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Media Assets Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white">Media & Cloud Branding</h2>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Logo URL (Cloudinary / Web)</label>
            <input
              type="url"
              value={logo}
              onChange={e => setLogo(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono text-[11px] focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Hero Banner Cover Image URL</label>
            <input
              type="url"
              value={coverImage}
              onChange={e => setCoverImage(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono text-[11px] focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Updating...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
