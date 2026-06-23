import { useState, useEffect, type FormEvent } from 'react';
import type { Product } from '../types/product';
import type { Category } from '../types/category';

interface ProductFormModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: Partial<Product>) => Promise<void>;
}

export default function ProductFormModal({ product, categories, onClose, onSubmit }: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [unitVolume, setUnitVolume] = useState(0);
  const [unitWeight, setUnitWeight] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [category, setCategory] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setDescription(product.description);
      setUnitVolume(product.unit_volume);
      setUnitWeight(product.unit_weight);
      setUnitPrice(product.unit_price ?? 0);
      setCategory(product.category);
    } else {
      setName('');
      setSku('');
      setDescription('');
      setUnitVolume(0);
      setUnitWeight(0);
      setUnitPrice(0);
      setCategory('');
    }
  }, [product]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (category === '') {
      setError('Please select a category.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        sku,
        description,
        unit_volume: unitVolume,
        unit_weight: unitWeight,
        unit_price: unitPrice,
        category: category as number,
      });
    } catch {
      setError('Failed to save product. Check that the SKU is unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">
          {product ? 'Edit Product' : 'Add Product'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="product-name" className="block text-sm text-slate-300 mb-1">Name</label>
            <input id="product-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-emerald-400" required />
          </div>
          <div>
            <label htmlFor="product-sku" className="block text-sm text-slate-300 mb-1">SKU</label>
            <input id="product-sku" type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-emerald-400" required />
          </div>
          <div>
            <label htmlFor="product-category" className="block text-sm text-slate-300 mb-1">Category</label>
            <select id="product-category" value={category} onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-emerald-400" required>
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-yellow-400 text-xs mt-1">No categories found. Please add a category first.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="product-unit-volume" className="block text-sm text-slate-300 mb-1">Unit Volume</label>
              <input id="product-unit-volume" type="number" step="0.01" value={unitVolume} onChange={(e) => setUnitVolume(Number(e.target.value))} className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-emerald-400" required />
            </div>
            <div>
              <label htmlFor="product-unit-weight" className="block text-sm text-slate-300 mb-1">Unit Weight</label>
              <input id="product-unit-weight" type="number" step="0.01" value={unitWeight} onChange={(e) => setUnitWeight(Number(e.target.value))} className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-emerald-400" required />
            </div>
          </div>
          <div>
            <label htmlFor="product-unit-price" className="block text-sm text-slate-300 mb-1">Unit Price ($)</label>
            <input id="product-unit-price" type="number" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-emerald-400" required />
          </div>
          <div>
            <label htmlFor="product-description" className="block text-sm text-slate-300 mb-1">Description</label>
            <textarea id="product-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-emerald-400" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded transition">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-2 rounded transition">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
