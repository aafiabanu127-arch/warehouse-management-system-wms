import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products';
import { getCategories } from '../api/categories';
import type { Product } from '../types/product';
import type { Category } from '../types/category';
import ProductFormModal from '../components/ProductFormModal';

const PAGE_SIZE = 20;

export default function Products() {
  const { canEditProducts, canDeleteAny } = usePermissions();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    getCategories({ page: 1 }).then((data) => setCategories(data.results)).catch(() => {});
  }, []);

  const categoryName = (id: number) =>
    categories.find((c) => c.id === id)?.name ?? `#${id}`;

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getProducts({ search, page });
      setProducts(data.results);
      setCount(data.count);
    } catch {
      setError('Failed to load products.');
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleCreate = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      loadProducts();
    } catch {
      alert('Failed to delete product.');
    }
  };

  const handleSubmit = async (data: Partial<Product>) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, data);
    } else {
      await createProduct(data);
    }
    setShowModal(false);
    loadProducts();
  };

  const totalPages = Math.ceil(count / PAGE_SIZE) || 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        {canEditProducts && (
          <button onClick={handleCreate} className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded text-sm font-semibold transition">
            + Add Product
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search by name, SKU, or description..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full max-w-md mb-4 px-3 py-2 rounded bg-slate-800 text-white border border-slate-600 focus:outline-none focus:border-emerald-400"
      />

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">SKU</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Volume</th>
              <th className="text-left px-4 py-3">Weight</th>
              <th className="text-left px-4 py-3">Price</th>
              {canEditProducts && <th className="text-left px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-6 text-slate-400">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-slate-400">No products found.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">{p.sku}</td>
                  <td className="px-4 py-3">{categoryName(p.category)}</td>
                  <td className="px-4 py-3">{p.unit_volume}</td>
                  <td className="px-4 py-3">{p.unit_weight}</td>
                  <td className="px-4 py-3">${p.unit_price?.toFixed(2) ?? '—'}</td>
                  {canEditProducts && (
                    <td className="px-4 py-3 space-x-2">
                      <button onClick={() => handleEdit(p)} className="text-emerald-400 hover:underline">Edit</button>
                      {canDeleteAny && (
                        <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:underline">Delete</button>
                      )}
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
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
