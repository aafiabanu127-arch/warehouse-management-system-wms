import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getShelves, createShelf, updateShelf, deleteShelf } from '../api/shelves';
import type { Shelf } from '../types/shelf';

const PAGE_SIZE = 20;

export default function Shelves() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Shelf | null>(null);
  const [form, setForm] = useState({ shelf_code: '', capacity: '', rack: '' });
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getShelves({ search, page });
      setShelves(data.results);
      setCount(data.count);
    } catch {
      setError('Failed to load shelves.');
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ shelf_code: '', capacity: '', rack: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (s: Shelf) => {
    setEditing(s);
    setForm({ shelf_code: s.shelf_code, capacity: String(s.capacity), rack: String(s.rack) });
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this shelf?')) return;
    try {
      await deleteShelf(id);
      load();
    } catch {
      alert('Failed to delete shelf.');
    }
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.shelf_code.trim() || !form.capacity || !form.rack) {
      setFormError('All fields are required.');
      return;
    }
    const payload = { shelf_code: form.shelf_code, capacity: Number(form.capacity), rack: Number(form.rack) };
    try {
      if (editing) {
        await updateShelf(editing.id, payload);
      } else {
        await createShelf(payload);
      }
      setShowModal(false);
      load();
    } catch {
      setFormError('Failed to save shelf.');
    }
  };

  const totalPages = Math.ceil(count / PAGE_SIZE) || 1;
  const usagePct = (s: Shelf) =>
    s.capacity > 0 ? Math.round((s.occupied_capacity / s.capacity) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shelves</h1>
        {canEdit && (
          <button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded text-sm font-semibold transition">
            + Add Shelf
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search shelves..."
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="w-full max-w-md mb-4 px-3 py-2 rounded bg-slate-800 text-white border border-slate-600 focus:outline-none focus:border-emerald-400"
      />

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Shelf Code</th>
              <th className="text-left px-4 py-3">Rack ID</th>
              <th className="text-left px-4 py-3">Capacity</th>
              <th className="text-left px-4 py-3">Occupied</th>
              <th className="text-left px-4 py-3">Usage</th>
              {canEdit && <th className="text-left px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-6 text-slate-400">Loading...</td></tr>
            ) : shelves.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-6 text-slate-400">No shelves found.</td></tr>
            ) : shelves.map(s => (
              <tr key={s.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                <td className="px-4 py-3">{s.id}</td>
                <td className="px-4 py-3 font-medium">{s.shelf_code}</td>
                <td className="px-4 py-3">{s.rack}</td>
                <td className="px-4 py-3">{s.capacity}</td>
                <td className="px-4 py-3">{s.occupied_capacity}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${usagePct(s) >= 90 ? 'bg-red-500' : usagePct(s) >= 60 ? 'bg-yellow-400' : 'bg-emerald-500'}`}
                        style={{ width: `${usagePct(s)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{usagePct(s)}%</span>
                  </div>
                </td>
                {canEdit && (
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => openEdit(s)} className="text-emerald-400 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:underline">Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 text-sm text-slate-300">
        <span>Page {page} of {totalPages} ({count} total)</span>
        <div className="space-x-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40">Previous</button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40">Next</button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Shelf' : 'Add Shelf'}</h2>
            {formError && <p className="text-red-400 text-sm mb-2">{formError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Shelf Code</label>
                <input value={form.shelf_code} onChange={e => setForm(f => ({ ...f, shelf_code: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Rack ID</label>
                <input type="number" value={form.rack} onChange={e => setForm(f => ({ ...f, rack: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
