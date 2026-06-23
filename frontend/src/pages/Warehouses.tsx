import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../api/warehouses';
import type { Warehouse } from '../types/warehouse';
import WarehouseFormModal from '../components/WarehouseFormModal';

const PAGE_SIZE = 20;

export default function Warehouses() {
  const { canEditWarehouses, canDeleteAny } = usePermissions();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const loadWarehouses = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getWarehouses({ search, page });
      setWarehouses(data.results);
      setCount(data.count);
    } catch {
      setError('Failed to load warehouses.');
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const handleCreate = () => {
    setEditingWarehouse(null);
    setShowModal(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this warehouse?')) return;
    try {
      await deleteWarehouse(id);
      loadWarehouses();
    } catch {
      alert('Failed to delete warehouse.');
    }
  };

  const handleSubmit = async (data: Partial<Warehouse>) => {
    if (editingWarehouse) {
      await updateWarehouse(editingWarehouse.id, data);
    } else {
      await createWarehouse(data);
    }
    setShowModal(false);
    loadWarehouses();
  };

  const totalPages = Math.ceil(count / PAGE_SIZE) || 1;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Warehouses</h1>
        {canEditWarehouses && (
          <button
            onClick={handleCreate}
            className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded text-sm font-semibold transition"
          >
            + Add Warehouse
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search by name, location, or manager..."
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
              <th className="text-left px-4 py-3">Location</th>
              <th className="text-left px-4 py-3">Total Capacity</th>
              <th className="text-left px-4 py-3">Available</th>
              <th className="text-left px-4 py-3">Manager</th>
              {canEditWarehouses && <th className="text-left px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-6 text-slate-400">Loading...</td></tr>
            ) : warehouses.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-slate-400">No warehouses found.</td></tr>
            ) : (
              warehouses.map((w) => (
                <tr key={w.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                  <td className="px-4 py-3">{w.name}</td>
                  <td className="px-4 py-3">{w.location}</td>
                  <td className="px-4 py-3">{w.total_capacity}</td>
                  <td className="px-4 py-3">{w.available_capacity}</td>
                  <td className="px-4 py-3">{w.manager_username ?? '—'}</td>
                  {canEditWarehouses && (
                    <td className="px-4 py-3 space-x-2">
                      <button onClick={() => handleEdit(w)} className="text-emerald-400 hover:underline">Edit</button>
                      {canDeleteAny && (
                        <button onClick={() => handleDelete(w.id)} className="text-red-400 hover:underline">Delete</button>
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
        <WarehouseFormModal
          warehouse={editingWarehouse}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}