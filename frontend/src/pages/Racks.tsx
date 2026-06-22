import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRacks, createRack, updateRack, deleteRack } from '../api/racks';
import type { Rack } from '../api/racks';

const PAGE_SIZE = 20;

export default function Racks() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

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

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Racks</h1>
        {canEdit && (
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Add Rack
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search racks..."
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="border rounded px-3 py-2 mb-4 w-full max-w-sm"
      />

      {isLoading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Rack Code</th>
                <th className="px-4 py-2 text-left">Capacity</th>
                <th className="px-4 py-2 text-left">Zone ID</th>
                {canEdit && <th className="px-4 py-2 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {racks.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-400">No racks found.</td></tr>
              ) : racks.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{r.id}</td>
                  <td className="px-4 py-2">{r.rack_code}</td>
                  <td className="px-4 py-2">{r.capacity}</td>
                  <td className="px-4 py-2">{r.zone}</td>
                  {canEdit && (
                    <td className="px-4 py-2 space-x-2">
                      <button onClick={() => openEdit(r)} className="text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
          <span className="px-3 py-1">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Rack' : 'Add Rack'}</h2>
            {formError && <p className="text-red-500 text-sm mb-2">{formError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Rack Code</label>
                <input value={form.rack_code} onChange={e => setForm(f => ({ ...f, rack_code: e.target.value }))} className="border rounded px-3 py-2 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className="border rounded px-3 py-2 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Zone ID</label>
                <input type="number" value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} className="border rounded px-3 py-2 w-full" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}