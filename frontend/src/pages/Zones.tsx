import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { getZones, createZone, updateZone, deleteZone } from '../api/zones';
import type { Zone } from '../api/zones';

const PAGE_SIZE = 20;

export default function Zones() {
  const { canEditZones, canDeleteAny } = usePermissions();

  const [zones, setZones] = useState<Zone[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [form, setForm] = useState({ name: '', capacity: '', warehouse: '' });
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getZones({ search, page });
      setZones(data.results);
      setCount(data.count);
    } catch {
      setError('Failed to load zones.');
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', capacity: '', warehouse: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (z: Zone) => {
    setEditing(z);
    setForm({ name: z.name, capacity: String(z.capacity), warehouse: String(z.warehouse) });
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this zone?')) return;
    try {
      await deleteZone(id);
      load();
    } catch {
      alert('Failed to delete zone.');
    }
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.name.trim() || !form.capacity || !form.warehouse) {
      setFormError('All fields are required.');
      return;
    }
    const payload = { name: form.name, capacity: Number(form.capacity), warehouse: Number(form.warehouse) };
    try {
      if (editing) {
        await updateZone(editing.id, payload);
      } else {
        await createZone(payload);
      }
      setShowModal(false);
      load();
    } catch {
      setFormError('Failed to save zone.');
    }
  };

  const totalPages = Math.ceil(count / PAGE_SIZE) || 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Zones</h1>
        {canEditZones && (
          <button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded text-sm font-semibold transition">
            + Add Zone
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search zones..."
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
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Capacity</th>
              <th className="text-left px-4 py-3">Warehouse ID</th>
              {canEditZones && <th className="text-left px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-6 text-slate-400">Loading...</td></tr>
            ) : zones.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-6 text-slate-400">No zones found.</td></tr>
            ) : zones.map(z => (
              <tr key={z.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                <td className="px-4 py-3">{z.id}</td>
                <td className="px-4 py-3">{z.name}</td>
                <td className="px-4 py-3">{z.capacity}</td>
                <td className="px-4 py-3">{z.warehouse}</td>
                {canEditZones && (
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => openEdit(z)} className="text-emerald-400 hover:underline">Edit</button>
                    {canDeleteAny && (
                        <button onClick={() => handleDelete(z.id)} className="text-red-400 hover:underline">Delete</button>
                      )}
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
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Zone' : 'Add Zone'}</h2>
            {formError && <p className="text-red-400 text-sm mb-2">{formError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Warehouse ID</label>
                <input type="number" value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400" />
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
