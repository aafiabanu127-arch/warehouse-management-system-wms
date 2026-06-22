import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getZones, createZone, updateZone, deleteZone } from '../api/zones';
import type { Zone } from '../api/zones';

const PAGE_SIZE = 20;

export default function Zones() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

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

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Zones</h1>
        {canEdit && (
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            + Add Zone
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search zones..."
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
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Capacity</th>
                <th className="px-4 py-2 text-left">Warehouse ID</th>
                {canEdit && <th className="px-4 py-2 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {zones.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-400">No zones found.</td></tr>
              ) : zones.map(z => (
                <tr key={z.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{z.id}</td>
                  <td className="px-4 py-2">{z.name}</td>
                  <td className="px-4 py-2">{z.capacity}</td>
                  <td className="px-4 py-2">{z.warehouse}</td>
                  {canEdit && (
                    <td className="px-4 py-2 space-x-2">
                      <button onClick={() => openEdit(z)} className="text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(z.id)} className="text-red-600 hover:underline">Delete</button>
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
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Zone' : 'Add Zone'}</h2>
            {formError && <p className="text-red-500 text-sm mb-2">{formError}</p>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="border rounded px-3 py-2 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} className="border rounded px-3 py-2 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Warehouse ID</label>
                <input type="number" value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))} className="border rounded px-3 py-2 w-full" />
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