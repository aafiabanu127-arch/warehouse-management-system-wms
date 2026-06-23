import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';
import type { Category } from '../types/category';
import CategoryFormModal from '../components/CategoryFormModal';

const PAGE_SIZE = 20;

export default function Categories() {
  const { canEditCategories, canDeleteAny } = usePermissions();

  const [categories, setCategories] = useState<Category[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getCategories({ search, page });
      setCategories(data.results);
      setCount(data.count);
    } catch {
      setError('Failed to load categories.');
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreate = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await deleteCategory(id);
      loadCategories();
    } catch {
      alert('Failed to delete category.');
    }
  };

  const handleSubmit = async (data: Partial<Category>) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
    } else {
      await createCategory(data);
    }
    setShowModal(false);
    loadCategories();
  };

  const totalPages = Math.ceil(count / PAGE_SIZE) || 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        {canEditCategories && (
          <button
            onClick={handleCreate}
            className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded text-sm font-semibold transition"
          >
            + Add Category
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full max-w-md mb-4 px-3 py-2 rounded bg-slate-800 text-white border border-slate-600 focus:outline-none focus:border-emerald-400"
      />

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Description</th>
              {canEditCategories && <th className="text-left px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={3} className="text-center py-6 text-slate-400">Loading...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-6 text-slate-400">No categories found.</td></tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">{c.description}</td>
                  {canEditCategories && (
                    <td className="px-4 py-3 space-x-2">
                      <button onClick={() => handleEdit(c)} className="text-emerald-400 hover:underline">Edit</button>
                      {canDeleteAny && (
                        <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:underline">Delete</button>
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
        <CategoryFormModal
          category={editingCategory}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}