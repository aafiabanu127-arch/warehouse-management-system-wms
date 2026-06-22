import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getShelves } from '../api/shelves';
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

  const totalPages = Math.ceil(count / PAGE_SIZE);
  const usagePct = (s: Shelf) =>
    s.capacity > 0 ? Math.round((s.occupied_capacity / s.capacity) * 100) : 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Shelves</h1>
      </div>

      <input
        type="text"
        placeholder="Search shelves..."
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
                <th className="px-4 py-2 text-left">Shelf Code</th>
                <th className="px-4 py-2 text-left">Rack ID</th>
                <th className="px-4 py-2 text-left">Capacity</th>
                <th className="px-4 py-2 text-left">Occupied</th>
                <th className="px-4 py-2 text-left">Usage</th>
              </tr>
            </thead>
            <tbody>
              {shelves.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-400">No shelves found.</td></tr>
              ) : shelves.map(s => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{s.id}</td>
                  <td className="px-4 py-2 font-medium">{s.shelf_code}</td>
                  <td className="px-4 py-2">{s.rack}</td>
                  <td className="px-4 py-2">{s.capacity}</td>
                  <td className="px-4 py-2">{s.occupied_capacity}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${usagePct(s) >= 90 ? 'bg-red-500' : usagePct(s) >= 60 ? 'bg-yellow-400' : 'bg-green-500'}`}
                          style={{ width: `${usagePct(s)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{usagePct(s)}%</span>
                    </div>
                  </td>
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
    </div>
  );
}