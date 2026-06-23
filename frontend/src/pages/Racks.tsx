import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { getRacks, createRack, updateRack, deleteRack } from '../api/racks';
import type { Rack } from '../api/racks';

const PAGE_SIZE = 20;

export default function Racks() {
  const { canEditRacks, canDeleteAny } = usePermissions();

  const [racks, setRacks] = useState<Rack[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Rack | null>(null);
  const [form, setForm] = useState({ rack_code: '', capacity: '', zone: '' });
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getRacks({ search, page });
      setRacks(data.results);
      setCount(data.count);
    } catch {
      setError('Failed to load racks.');
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ rack_code: '', capacity: '', zone: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (r: Rack) => {
    setEditing(r);
    setForm({ rack_code: r.rack_code, capacity: String(r.capacity), zone: String(r.zone) });
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this rack?')) return;
    try {
      await deleteRack(id);
      load();
    } catch {
      alert('Failed to delete rack.');
    }
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!form.rack_code.trim() || !form.capacity || !form.zone) {
      setFormError('All fields are required.');
      return;
    }
    const payload = { rack_code: form.rack_code, capacity: Number(form.capacity), zone: Number(form.zone) };
    try {
      if (editing) {
        await updateRack(editing.id, payload);
      } else {
        await createRack(payload);
      }
      setShowModal(false);
      load();
    } catch {
      setFormError('Failed to save rack.');
    }
  };

  const totalPages = Math.ceil(count / PAGE_SIZE) || 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Racks</h1>
        {canEditRacks && (
          <button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded text-sm font-semibold transition">
            + Add Rack
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search racks..."
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
              <th className="text-left px-4 py-3">Rack Code</th>
              <th className="text-left px-4 py-3">Capacity</th>
              <th className="text-left px-4 py-3">Zone ID</th>
              {canEditRacks && <th className="text-left px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-6 text-slate-400">Loading...</td></tr>
            ) : racks.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-6 text-slate-400">No racks found.</td></tr>
            ) : racks.map(r => (
              <tr key={r.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                <td className="px-4 py-3">{r.id}</td>
                <td className="px-4 py-3">{r.rack_code}</td>
                <td className="px-4 py-3">{r.capacity}</td>
                <td className="px-4 py-3">{r.zone}</td>
                {canEditRacks && (
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => openEdit(r)} className="text-emerald-400 hover:underline">Edit</button>
                    {canDeleteAny && (
                        <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:underline">Delete</button>
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
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Rack' : 'Add Rack'}</h2>
            {formError && <p className="text-red-400 text-sm mb-2">{formError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Rack Code</label>
                <input value={form.rack_code} onChange={e => setForm(f => ({ ...f, rack_code: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">Zone ID</label>
                <input type="number" value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-emerald-400" />
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
