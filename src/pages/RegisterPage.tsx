import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import {
  Cloud,
  Store,
  UserCheck,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (view: string, params?: any) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [role, setRole] = useState<'customer' | 'business_owner'>('business_owner');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Business Owner fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('restaurant');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      showToast('Name, email, and password are required', 'error');
      return;
    }

    if (role === 'business_owner' && !businessName) {
      showToast('Business name is required for food business onboarding', 'error');
      return;
    }

    setIsSubmitting(true);
    const res = await register({
      name,
      email,
      password,
      role,
      phone,
      businessName: role === 'business_owner' ? businessName : undefined,
      businessType: role === 'business_owner' ? businessType : undefined,
      description: role === 'business_owner' ? description : undefined,
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast(
        role === 'business_owner'
          ? `Welcome to FoodSphere! Your business "${businessName}" has been provisioned.`
          : 'Customer account created successfully!',
        'success'
      );
      if (role === 'business_owner') {
        onNavigate('business_dashboard');
      } else {
        onNavigate('explore');
      }
    } else {
      showToast(res.error || 'Registration failed', 'error');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-amber-500/20 mx-auto">
          <Cloud className="w-6 h-6 fill-current" />
        </div>
        <h1 className="text-2xl font-black text-white">Create FoodSphere Account</h1>
        <p className="text-xs text-zinc-400">
          Join the multi-tenant food business platform as a business owner or guest customer.
        </p>
      </div>

      {/* Account Type Selection */}
      <div className="grid grid-cols-2 gap-3 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setRole('business_owner')}
          className={`p-3 rounded-xl text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
            role === 'business_owner'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Store className="w-5 h-5 text-current" />
          <span className="text-xs font-bold">Food Business Owner</span>
          <span className={`text-[10px] ${role === 'business_owner' ? 'text-zinc-900' : 'text-zinc-500'}`}>
            Manage menu, orders & tables
          </span>
        </button>

        <button
          type="button"
          onClick={() => setRole('customer')}
          className={`p-3 rounded-xl text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
            role === 'customer'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-5 h-5 text-current" />
          <span className="text-xs font-bold">Customer / Diner</span>
          <span className={`text-[10px] ${role === 'customer' ? 'text-zinc-900' : 'text-zinc-500'}`}>
            Order food & reserve tables
          </span>
        </button>
      </div>

      {/* Registration Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          {/* User Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Your Full Name *</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Chef Marco Rossi"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@business.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Business Onboarding Step for Business Owners */}
          {role === 'business_owner' && (
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  ★
                </span>
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  New Food Business Onboarding
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Business / Eatery Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Copper Kettle Bakery"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Business Type</label>
                  <select
                    value={businessType}
                    onChange={e => setBusinessType(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="restaurant">Restaurant & Dining</option>
                    <option value="bakery">Bakery & Pastry Shop</option>
                    <option value="cafe">Cafe & Coffee Bar</option>
                    <option value="cloud_kitchen">Cloud / Ghost Kitchen</option>
                    <option value="food_truck">Food Truck</option>
                    <option value="bistro">Bistro & Brasserie</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe your culinary style, signature recipes, and concept..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>
              {isSubmitting
                ? 'Provisioning Account...'
                : role === 'business_owner'
                ? 'Provision Business & Launch Cloud Dashboard'
                : 'Create Customer Account'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-400">
            Already registered?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
