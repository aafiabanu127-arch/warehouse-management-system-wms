import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../api/inventory';
import { getProducts } from '../api/products';
import { getShelves } from '../api/shelves';
import type { InventoryItem } from '../types/inventory';
import type { Product } from '../types/product';
import type { Shelf } from '../types/shelf';
import InventoryFormModal from '../components/InventoryFormModal';

const PAGE_SIZE = 20;

export default function Inventory() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'STAFF';

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    getProducts().then((data) => setProducts(data.results)).catch(() => {});
    getShelves().then((data) => setShelves(data.results)).catch(() => {});
  }, []);

  const productName = (id: number) => products.find((p) => p.id === id)?.name ?? `#${id}`;
  const shelfCode = (id: number) => shelves.find((s) => s.id === id)?.shelf_code ?? `#${id}`;

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getInventoryItems({ search, page });
      setItems(data.results);
      setCount(data.count);
    } catch {
      setError('Failed to load inventory.');
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleCreate = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this inventory record?')) return;
    try {
      await deleteInventoryItem(id);
      loadItems();
    } catch {
      alert('Failed to delete inventory record.');
    }
  };

  const handleSubmit = async (data: Partial<InventoryItem>) => {
    if (editingItem) {
      await updateInventoryItem(editingItem.id, data);
    } else {
      await createInventoryItem(data);
    }
    setShowModal(false);
    loadItems();
  };

  const totalPages = Math.ceil(count / PAGE_SIZE) || 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        {canEdit && (
          <button onClick={handleCreate} className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded text-sm font-semibold transition">
            + Add Record
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search inventory..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full max-w-md mb-4 px-3 py-2 rounded bg-slate-800 text-white border border-slate-600 focus:outline-none focus:border-emerald-400"
      />

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Shelf</th>
              <th className="text-left px-4 py-3">Quantity</th>
              {canEdit && <th className="text-left px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-6 text-slate-400">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-6 text-slate-400">No inventory records found.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                  <td className="px-4 py-3">{item.id}</td>
                  <td className="px-4 py-3">{productName(item.product)}</td>
                  <td className="px-4 py-3">{shelfCode(item.shelf)}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  {canEdit && (
                    <td className="px-4 py-3 space-x-2">
                      <button onClick={() => handleEdit(item)} className="text-emerald-400 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:underline">Delete</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 text-sm text-slate-300">
        <span>Page {page} of {totalPages} ({count} total)</span>
        <div className="space-x-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40">Previous</button>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40">Next</button>
        </div>
      </div>

      {showModal && (
        <InventoryFormModal
          item={editingItem}
          products={products}
          shelves={shelves}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
