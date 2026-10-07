import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.tsx';
import { apiRequest } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MongoAtlasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MongoAtlasModal: React.FC<MongoAtlasModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mongoUri, setMongoUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    const res = await apiRequest('/api/database/status');
    if (res.data) {
      setStatus(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUri.trim()) {
      showToast('Please enter a MongoDB Atlas connection string', 'error');
      return;
    }

    setIsConnecting(true);
    const res = await apiRequest('/api/database/connect', {
      method: 'POST',
      body: JSON.stringify({ uri: mongoUri.trim() }),
    });
    setIsConnecting(false);

    if (res.data) {
      showToast('Successfully connected to MongoDB Atlas cluster!', 'success');
      setStatus(res.data.status);
      setMongoUri('');
    } else {
      showToast(res.error || 'Failed to connect to MongoDB Atlas', 'error');
      if ((res as any).hint) {
        showToast((res as any).hint, 'info');
      }
      fetchStatus();
    }
  };

  const handleSyncToAtlas = async () => {
    setIsSyncing(true);
    const res = await apiRequest('/api/database/sync-atlas', { method: 'POST' });
    setIsSyncing(false);

    if (res.data) {
      showToast('All collections synchronized to MongoDB Atlas!', 'success');
      setStatus(res.data.status);
    } else {
      showToast(res.error || 'Failed to sync to MongoDB Atlas', 'error');
    }
  };

  const handleSyncFromAtlas = async () => {
    setIsSyncing(true);
    const res = await apiRequest('/api/database/sync-from-atlas', { method: 'POST' });
    setIsSyncing(false);

    if (res.data) {
      showToast('App refreshed with data from MongoDB Atlas!', 'success');
      setStatus(res.data.status);
      window.location.reload();
    } else {
      showToast(res.error || 'Failed to pull from MongoDB Atlas', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="MongoDB Atlas Cloud Database Integration" maxWidth="2xl">
      <div className="space-y-6 text-xs text-zinc-300">
        {/* Status Banner */}
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            status?.connected
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-zinc-950 border-zinc-800 text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                status?.connected
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {status?.connected ? 'MongoDB Atlas Cluster Connected' : 'Local Storage Mode (Atlas Standby)'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    status?.connected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {status?.connected ? 'LIVE' : 'STANDBY'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                {status?.clusterHost ? `${status.clusterHost} / ${status.databaseName}` : 'Cluster URI awaiting setup'}
              </p>
            </div>
          </div>

          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Check Status</span>
          </button>
        </div>

        {/* Error diagnosis banner if any */}
        {status?.error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong>Atlas Connection Notice:</strong> {status.error}
              <div className="text-[11px] text-rose-300/80 mt-1">
                Tip: In MongoDB Atlas Dashboard, make sure your Database User has read/write privileges and your IP Whitelist allows incoming connections (0.0.0.0/0).
              </div>
            </div>
          </div>
        )}

        {/* Live Atlas Collections Count Grid */}
        {status?.connected && status?.collectionCounts && (
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Live Collections in MongoDB Atlas
              </span>
              <span className="text-[10px] text-zinc-500">Real Document Counts in Cluster</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-400 text-[10px] block">Users (Auth)</span>
                <span className="text-base font-black text-emerald-400">{status.collectionCounts.users}</span>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-400 text-[10px] block">Businesses (Tenants)</span>
                <span className="text-base font-black text-amber-400">{status.collectionCounts.businesses}</span>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-400 text-[10px] block">Categories</span>
                <span className="text-base font-black text-zinc-200">{status.collectionCounts.categories}</span>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-400 text-[10px] block">Menu Items</span>
                <span className="text-base font-black text-zinc-200">{status.collectionCounts.menuItems}</span>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-400 text-[10px] block">Orders (KDS)</span>
                <span className="text-base font-black text-purple-400">{status.collectionCounts.orders}</span>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-400 text-[10px] block">Reservations</span>
                <span className="text-base font-black text-sky-400">{status.collectionCounts.reservations}</span>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-400 text-[10px] block">Tables</span>
                <span className="text-base font-black text-zinc-200">{status.collectionCounts.tables}</span>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/80">
                <span className="text-zinc-400 text-[10px] block">Notifications</span>
                <span className="text-base font-black text-zinc-200">{status.collectionCounts.notifications}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2 justify-end">
              <button
                onClick={handleSyncToAtlas}
                disabled={isSyncing}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Push Local State to Atlas</span>
              </button>
              <button
                onClick={handleSyncFromAtlas}
                disabled={isSyncing}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Pull from Atlas Cluster</span>
              </button>
            </div>
          </div>
        )}

        {/* Separate Authentication Architecture Proof */}
        <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Strict User & Tenant Authentication Isolation</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Every user in FoodSphere has a distinct record in the MongoDB Atlas <code className="text-amber-400 font-mono">users</code> collection with a unique email index and bcrypt password hash:
          </p>
          <ul className="space-y-1 text-[11px] text-zinc-300 list-disc list-inside">
            <li><strong>Platform Super Admin</strong>: Role-restricted to global stats & business activation.</li>
            <li><strong>Tenant A Users</strong>: Chef Marco Rossi (Owner) & Elena Rostova (Staff) locked to <code className="text-amber-400 font-mono">biz_artisanal_fork</code>.</li>
            <li><strong>Tenant B Users</strong>: Chloe Laurent (Owner) & Liam Chen (Staff) locked to <code className="text-amber-400 font-mono">biz_sweet_harmony</code>.</li>
            <li><strong>Customers</strong>: Isolated customer profiles with private order history and table bookings.</li>
          </ul>
        </div>

        {/* Connect or Update MongoDB Atlas URI Form */}
        <form onSubmit={handleConnect} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3">
          <div>
            <label className="block text-zinc-200 font-bold mb-1">
              Connect or Switch MongoDB Atlas Connection String
            </label>
            <p className="text-[11px] text-zinc-400 mb-2">
              Enter your standard MongoDB Atlas connection string. Passwords are encrypted and masked in UI.
            </p>
            <input
              type="text"
              required
              placeholder="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/foodsphere?retryWrites=true&w=majority"
              value={mongoUri}
              onChange={e => setMongoUri(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono text-[11px] focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div className="text-[10px] text-zinc-500">
              Active: <span className="font-mono text-zinc-400">{status?.maskedUri || 'None'}</span>
            </div>

            <button
              type="submit"
              disabled={isConnecting}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting to Atlas...</span>
                </>
              ) : (
                <>
                  <Server className="w-3.5 h-3.5" />
                  <span>Test & Connect Atlas Cluster</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
