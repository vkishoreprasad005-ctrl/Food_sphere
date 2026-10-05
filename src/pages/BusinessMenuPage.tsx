import React, { useState, useEffect } from 'react';
import { MenuCategory, MenuItem } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { Modal } from '../components/Modal.tsx';
import {
  Utensils,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Tag,
  CheckCircle,
  XCircle,
  FolderPlus,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

export const BusinessMenuPage: React.FC = () => {
  const { business } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');

  // Modal states
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  // Category form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catOrder, setCatOrder] = useState(1);

  // Item form
  const [itemName, setItemName] = useState('');
  const [itemCatId, setItemCatId] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemPrepTime, setItemPrepTime] = useState('15');
  const [itemTags, setItemTags] = useState<string[]>([]);
  const [itemAvailable, setItemAvailable] = useState(true);

  const fetchMenuData = async () => {
    setIsLoading(true);
    const [catsRes, itemsRes] = await Promise.all([
      apiRequest<MenuCategory[]>('/api/tenant/categories'),
      apiRequest<MenuItem[]>('/api/tenant/items'),
    ]);

    if (catsRes.data) setCategories(catsRes.data);
    if (itemsRes.data) setItems(itemsRes.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMenuData();
  }, [business?.id]);

  // Handle Category submit
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    if (editingCategory) {
      const res = await apiRequest(`/api/tenant/categories/${editingCategory.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: catName, description: catDesc, displayOrder: catOrder }),
      });
      if (res.data) {
        showToast('Category updated', 'success');
        fetchMenuData();
        setIsCatModalOpen(false);
      } else {
        showToast(res.error || 'Failed to update category', 'error');
      }
    } else {
      const res = await apiRequest('/api/tenant/categories', {
        method: 'POST',
        body: JSON.stringify({ name: catName, description: catDesc, displayOrder: catOrder }),
      });
      if (res.data) {
        showToast('New menu category created', 'success');
        fetchMenuData();
        setIsCatModalOpen(false);
      } else {
        showToast(res.error || 'Failed to create category', 'error');
      }
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}" and all dishes in it?`)) return;
    const res = await apiRequest(`/api/tenant/categories/${id}`, { method: 'DELETE' });
    if (res.data) {
      showToast(`Category "${name}" deleted`, 'success');
      fetchMenuData();
    } else {
      showToast(res.error || 'Failed to delete category', 'error');
    }
  };

  // Open item modal for add
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemName('');
    setItemCatId(categories[0]?.id || '');
    setItemPrice('');
    setItemDesc('');
    setItemImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
    setItemPrepTime('15');
    setItemTags([]);
    setItemAvailable(true);
    setIsItemModalOpen(true);
  };

  // Open item modal for edit
  const handleOpenEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCatId(item.categoryId);
    setItemPrice(item.price.toString());
    setItemDesc(item.description);
    setItemImage(item.image);
    setItemPrepTime(item.preparationTime.toString());
    setItemTags(item.dietaryTags || []);
    setItemAvailable(item.available);
    setIsItemModalOpen(true);
  };

  // Save Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice || !itemCatId) {
      showToast('Name, price, and category are required', 'error');
      return;
    }

    const payload = {
      categoryId: itemCatId,
      name: itemName,
      description: itemDesc,
      price: Number(itemPrice),
      image: itemImage,
      preparationTime: Number(itemPrepTime) || 15,
      dietaryTags: itemTags,
      available: itemAvailable,
    };

    if (editingItem) {
      const res = await apiRequest(`/api/tenant/items/${editingItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.data) {
        showToast(`Menu item "${itemName}" updated`, 'success');
        fetchMenuData();
        setIsItemModalOpen(false);
      } else {
        showToast(res.error || 'Failed to update item', 'error');
      }
    } else {
      const res = await apiRequest('/api/tenant/items', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.data) {
        showToast(`Dish "${itemName}" created and published!`, 'success');
        fetchMenuData();
        setIsItemModalOpen(false);
      } else {
        showToast(res.error || 'Failed to create item', 'error');
      }
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Delete dish "${name}" from your menu?`)) return;
    const res = await apiRequest(`/api/tenant/items/${id}`, { method: 'DELETE' });
    if (res.data) {
      showToast(`Dish "${name}" deleted`, 'success');
      fetchMenuData();
    } else {
      showToast(res.error || 'Failed to delete dish', 'error');
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    const updatedStatus = !item.available;
    const res = await apiRequest(`/api/tenant/items/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ available: updatedStatus }),
    });

    if (res.data) {
      setItems(prev =>
        prev.map(i => (i.id === item.id ? { ...i, available: updatedStatus } : i))
      );
      showToast(
        `"${item.name}" marked as ${updatedStatus ? 'Available' : 'Sold Out'}`,
        'info'
      );
    }
  };

  const filteredItems = selectedCatId === 'all'
    ? items
    : items.filter(i => i.categoryId === selectedCatId);

  const availableTags = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Spicy', 'Chef Special', 'Nut-Free'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-amber-500" />
            Menu & Catalog Management
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Build categories, curate recipes, update pricing, and toggle item availability in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingCategory(null);
              setCatName('');
              setCatDesc('');
              setCatOrder(categories.length + 1);
              setIsCatModalOpen(true);
            }}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>Add Category</span>
          </button>

          <button
            onClick={handleOpenAddItem}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Dish</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Quick Management */}
      <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300">Menu Categories ({categories.length})</span>
          <span className="text-[11px]">Click a category to filter dishes</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCatId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCatId === 'all'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            All Categories ({items.length})
          </button>

          {categories.map(cat => {
            const count = items.filter(i => i.categoryId === cat.id).length;
            const isSelected = selectedCatId === cat.id;

            return (
              <div
                key={cat.id}
                className={`inline-flex items-center rounded-xl transition-colors ${
                  isSelected ? 'bg-amber-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                <button
                  onClick={() => setSelectedCatId(cat.id)}
                  className="px-3 py-1.5 text-xs whitespace-nowrap"
                >
                  {cat.name} ({count})
                </button>
                <button
                  onClick={() => {
                    setEditingCategory(cat);
                    setCatName(cat.name);
                    setCatDesc(cat.description || '');
                    setCatOrder(cat.displayOrder);
                    setIsCatModalOpen(true);
                  }}
                  className={`p-1.5 hover:text-white transition-colors ${isSelected ? 'text-zinc-900' : 'text-zinc-500'}`}
                  title="Edit category"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className={`p-1.5 hover:text-rose-500 transition-colors ${isSelected ? 'text-zinc-900' : 'text-zinc-500'}`}
                  title="Delete category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Menu Items Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-zinc-900/50 rounded-2xl animate-pulse border border-zinc-800" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800 space-y-3">
          <Utensils className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-200">No dishes in this category</h3>
          <p className="text-xs text-zinc-400">Click "Add Menu Dish" above to create your first item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const cat = categories.find(c => c.id === item.categoryId);

            return (
              <div
                key={item.id}
                className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all flex flex-col justify-between shadow-md ${
                  item.available ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-800/50 opacity-70'
                }`}
              >
                <div>
                  <div className="relative h-44 bg-zinc-950 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-zinc-300 font-semibold border border-zinc-800">
                      {cat?.name || 'Dish'}
                    </div>

                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold shadow-md cursor-pointer transition-colors ${
                          item.available
                            ? 'bg-emerald-500 text-zinc-950'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {item.available ? 'Available' : 'Sold Out'}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-sm">{item.name}</h3>
                      <span className="font-black text-amber-400 text-sm shrink-0">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.preparationTime}m
                      </span>
                      {item.dietaryTags?.map(tag => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-800 text-amber-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-zinc-800/60 mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">ID: {item.id}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditItem(item)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      title="Edit dish"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      title="Delete dish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Menu Category'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-medium mb-1">Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Starters, Wood-Fired Pizzas, Desserts"
              value={catName}
              onChange={e => setCatName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Brief description of dishes in this section..."
              value={catDesc}
              onChange={e => setCatDesc(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Display Sort Order</label>
            <input
              type="number"
              min={1}
              value={catOrder}
              onChange={e => setCatOrder(Number(e.target.value))}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-xl"
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Menu Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? 'Edit Menu Dish' : 'Add New Menu Dish'}
        maxWidth="xl"
      >
        <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Dish Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Saffron Lobster Tagliatelle"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Category *</label>
              <select
                required
                value={itemCatId}
                onChange={e => setItemCatId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Price ($ USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="18.50"
                value={itemPrice}
                onChange={e => setItemPrice(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Preparation Time (minutes)</label>
              <input
                type="number"
                min="1"
                value={itemPrepTime}
                onChange={e => setItemPrepTime(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Image URL (Cloudinary / CDN)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={itemImage}
              onChange={e => setItemImage(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">Description & Ingredients</label>
            <textarea
              rows={3}
              placeholder="Describe culinary preparation, source of ingredients, flavor profile..."
              value={itemDesc}
              onChange={e => setItemDesc(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-2">Dietary Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => {
                const isChecked = itemTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (isChecked) {
                        setItemTags(itemTags.filter(t => t !== tag));
                      } else {
                        setItemTags([...itemTags, tag]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      isChecked
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="itemAvailableCheckbox"
              checked={itemAvailable}
              onChange={e => setItemAvailable(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="itemAvailableCheckbox" className="text-zinc-200 font-medium">
              Item is immediately available for customer ordering
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsItemModalOpen(false)}
              className="px-4 py-2 bg-zinc-800 text-zinc-300 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-xl"
            >
              {editingItem ? 'Save Dish' : 'Publish Dish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
