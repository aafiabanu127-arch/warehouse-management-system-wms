import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { usePermissions } from '../hooks/usePermissions';

interface TransferRequest {
  id: number;
  product: number;
  product_name?: string;
  from_inventory: number;
  to_inventory: number;
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_by: number;
  requested_by_username?: string;
  reviewed_by: number | null;
  reviewed_by_username?: string;
  reason: string;
  reviewed_at: string | null;
  created_at: string;
}

interface AdjustmentRequest {
  id: number;
  inventory: number;
  adjustment_type: 'ADD' | 'REMOVE' | 'CORRECT';
  requested_quantity: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_by: number;
  requested_by_username?: string;
  reviewed_by: number | null;
  reviewed_by_username?: string;
  reviewed_at: string | null;
  created_at: string;
}

const STATUS_COLORS = {
  PENDING: 'text-yellow-400 bg-yellow-400/10',
  APPROVED: 'text-emerald-400 bg-emerald-400/10',
  REJECTED: 'text-red-400 bg-red-400/10',
};

export default function Approvals() {
  const { canApproveRequests } = usePermissions();
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [tab, setTab] = useState<'transfers' | 'adjustments'>('transfers');

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [tRes, aRes] = await Promise.all([
        apiClient.get('/inventory/transfer-requests/'),
        apiClient.get('/inventory/adjustment-requests/'),
      ]);
      const tData = tRes.data;
      const aData = aRes.data;
      setTransfers(Array.isArray(tData) ? tData : tData.results ?? []);
      setAdjustments(Array.isArray(aData) ? aData : aData.results ?? []);
    } catch {
      setError('Failed to load approval requests.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAction = async (type: 'transfer' | 'adjustment', id: number, action: 'approve' | 'reject') => {
    const url = type === 'transfer'
      ? `/inventory/transfer-requests/${id}/${action}/`
      : `/inventory/adjustment-requests/${id}/${action}/`;
    try {
      await apiClient.post(url);
      setActionMsg(`Request #${id} ${action}d successfully.`);
      setTimeout(() => setActionMsg(''), 3000);
      fetchAll();
    } catch {
      setActionMsg(`Failed to ${action} request #${id}.`);
      setTimeout(() => setActionMsg(''), 3000);
    }
  };

  const pendingTransfers = transfers.filter((t) => t.status === 'PENDING').length;
  const pendingAdjustments = adjustments.filter((a) => a.status === 'PENDING').length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Approval Workflows</h1>
      <p className="text-slate-400 mb-6">Review and action pending transfer and adjustment requests</p>

      {actionMsg && (
        <div className="mb-4 px-4 py-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          {actionMsg}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
          <p className="text-slate-400 text-sm">Pending Transfers</p>
          <p className="text-4xl font-bold text-yellow-400 mt-1">{pendingTransfers}</p>
        </div>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
          <p className="text-slate-400 text-sm">Pending Adjustments</p>
          <p className="text-4xl font-bold text-yellow-400 mt-1">{pendingAdjustments}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('transfers')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            tab === 'transfers' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Transfer Requests
          {pendingTransfers > 0 && (
            <span className="ml-2 bg-yellow-400 text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {pendingTransfers}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('adjustments')}
          className={`px-4 py-2 rounded text-sm font-medium transition ${
            tab === 'adjustments' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Adjustment Requests
          {pendingAdjustments > 0 && (
            <span className="ml-2 bg-yellow-400 text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {pendingAdjustments}
            </span>
          )}
        </button>
      </div>

      {isLoading && <p className="text-slate-400">Loading requests...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {/* Transfer Requests Table */}
      {!isLoading && tab === 'transfers' && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {transfers.length === 0 ? (
            <p className="p-6 text-slate-400 text-sm">No transfer requests found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-slate-700 bg-slate-900/40">
                <tr>
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-left px-4 py-3">Qty</th>
                  <th className="text-left px-4 py-3">Reason</th>
                  <th className="text-left px-4 py-3">Requested</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Reviewed At</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-300">#{t.id}</td>
                    <td className="px-4 py-3">{t.quantity}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[180px] truncate">{t.reason || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {t.reviewed_at ? new Date(t.reviewed_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {t.status === 'PENDING' && canApproveRequests ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction('transfer', t.id, 'approve')}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction('transfer', t.id, 'reject')}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">
                          {t.status === 'PENDING' ? 'Awaiting approval' : 'No action needed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Adjustment Requests Table */}
      {!isLoading && tab === 'adjustments' && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {adjustments.length === 0 ? (
            <p className="p-6 text-slate-400 text-sm">No adjustment requests found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-slate-700 bg-slate-900/40">
                <tr>
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Qty</th>
                  <th className="text-left px-4 py-3">Reason</th>
                  <th className="text-left px-4 py-3">Requested</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Reviewed At</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((a) => (
                  <tr key={a.id} className="border-t border-slate-700 hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-slate-300">#{a.id}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-400/10 text-blue-400">
                        {a.adjustment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{a.requested_quantity}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[160px] truncate">{a.reason}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(a.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[a.status]}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {a.reviewed_at ? new Date(a.reviewed_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {a.status === 'PENDING' && canApproveRequests ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction('adjustment', a.id, 'approve')}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction('adjustment', a.id, 'reject')}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">
                          {a.status === 'PENDING' ? 'Awaiting approval' : 'No action needed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}