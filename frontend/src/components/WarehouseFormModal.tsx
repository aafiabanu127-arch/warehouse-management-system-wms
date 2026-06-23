import { useState, useEffect, type FormEvent } from 'react';
import type { Warehouse } from '../types/warehouse';
import { getUsers } from '../api/auth';

interface User {
  id: number;
  username: string;
}

interface WarehouseFormModalProps {
  warehouse: Warehouse | null;
  onClose: () => void;
  onSubmit: (data: Partial<Warehouse>) => Promise<void>;
}

export default function WarehouseFormModal({ warehouse, onClose, onSubmit }: WarehouseFormModalProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [availableCapacity, setAvailableCapacity] = useState(0);
  const [manager, setManager] = useState<number | ''>('');
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    if (warehouse) {
      setName(warehouse.name);
      setLocation(warehouse.location);
      setTotalCapacity(warehouse.total_capacity);
      setAvailableCapacity(warehouse.available_capacity);
      setManager(warehouse.manager ?? '');
    } else {
      setName('');
      setLocation('');
      setTotalCapacity(0);
      setAvailableCapacity(0);
      setManager('');
    }
  }, [warehouse]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        location,
        total_capacity: totalCapacity,
        available_capacity: availableCapacity,
        manager: manager === '' ? null : manager as number,
      });
    } catch {
      setError('Failed to save warehouse. Check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">
          {warehouse ? 'Edit Warehouse' : 'Add Warehouse'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-emerald-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-emerald-400"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Total Capacity</label>
              <input
                type="number"
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-emerald-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Available Capacity</label>
              <input
                type="number"
                value={availableCapacity}
                onChange={(e) => setAvailableCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-emerald-400"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Manager</label>
            <select
              value={manager}
              onChange={(e) => setManager(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-emerald-400"
            >
              <option value="">— No manager assigned —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-2 rounded transition"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}