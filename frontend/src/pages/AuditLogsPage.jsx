import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Table from '../components/common/Table';
import Pagination from '../components/common/Pagination';
import PageHeader from '../components/common/PageHeader';
import { toast } from '../components/common/Toaster';
import LoadingSpinner from '../components/common/LoadingSpinner';
import HistoryIcon from '@mui/icons-material/History';
import Modal from '../components/common/Modal';

const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ASSIGN_STAFF', 'REMOVE_STAFF'];
const RESOURCE_TYPES = ['Branch', 'User', 'Member', 'Department', 'Attendance', 'Announcement', 'Visitor'];

export default function AuditLogsPage() {
  const { isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterResourceType, setFilterResourceType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        limit: 20,
        skip: (page - 1) * 20
      });
      if (filterAction) params.set('action', filterAction);
      if (filterResourceType) params.set('resourceType', filterResourceType);

      const res = await api.get(`/audit-logs?${params}`);
      setLogs(res.data.data);
      setTotalPages(res.data.pagination.pages);
      setTotal(res.data.pagination.total);
    } catch (err) {
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterResourceType]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchLogs();
  }, [fetchLogs, isSuperAdmin]);

  useEffect(() => {
    setPage(1);
  }, [filterAction, filterResourceType]);

  const columns = [
    {
      key: 'userName',
      label: 'User',
      render: log => (
        <div>
          <p className="font-medium text-gray-900">{log.userName}</p>
          <p className="text-xs text-gray-500">{log.userEmail}</p>
        </div>
      )
    },
    {
      key: 'action',
      label: 'Action',
      render: log => {
        const color = {
          CREATE: 'bg-green-100 text-green-800',
          UPDATE: 'bg-blue-100 text-blue-800',
          DELETE: 'bg-red-100 text-red-800',
          LOGIN: 'bg-purple-100 text-purple-800',
          LOGOUT: 'bg-gray-100 text-gray-800',
          ASSIGN_STAFF: 'bg-indigo-100 text-indigo-800',
          REMOVE_STAFF: 'bg-orange-100 text-orange-800'
        };
        return <span className={`badge ${color[log.action]}`}>{log.action}</span>;
      }
    },
    { 
      key: 'resourceType', 
      label: 'Resource Type',
      render: log => <span className="badge bg-gray-100 text-gray-700">{log.resourceType}</span>
    },
    {
      key: 'resourceName',
      label: 'Resource Name',
      render: log => <span className="text-sm text-gray-700">{log.resourceName || '—'}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: log => (
        <span className={`badge ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {log.status}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Date & Time',
      render: log => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {new Date(log.createdAt).toLocaleDateString('en-GH', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(log.createdAt).toLocaleTimeString('en-GH', { 
              hour: '2-digit', 
              minute: '2-digit'
            })}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      mobileHide: true,
      render: log => (
        <button
          onClick={() => {
            setSelectedLog(log);
            setDetailsModalOpen(true);
          }}
          className="text-xs text-brand hover:underline font-medium"
        >
          View Details
        </button>
      )
    }
  ];

  if (!isSuperAdmin) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <PageHeader title="Audit Logs" subtitle="System activity tracking" />
        <div className="card text-center py-14">
          <HistoryIcon sx={{ fontSize: 60, color: '#9ca3af' }} />
          <p className="text-gray-400 mt-3">Access denied. Only super-admins can view audit logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <PageHeader 
        title={`Audit Logs (${total})`} 
        subtitle="System activity and changes tracking"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select 
          className="input flex-1 sm:w-40" 
          value={filterAction} 
          onChange={e => setFilterAction(e.target.value)}
        >
          <option value="">All Actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select 
          className="input flex-1 sm:w-44" 
          value={filterResourceType} 
          onChange={e => setFilterResourceType(e.target.value)}
        >
          <option value="">All Resources</option>
          {RESOURCE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <Table 
        columns={columns} 
        data={logs} 
        loading={loading} 
        emptyMessage="No audit logs found."
      />
      <Pagination 
        currentPage={page} 
        totalPages={totalPages} 
        onPageChange={setPage} 
      />

      {/* Details Modal */}
      <Modal 
        isOpen={detailsModalOpen} 
        onClose={() => setDetailsModalOpen(false)}
        title="Audit Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">User</p>
                <p className="font-medium text-gray-900 mt-1">{selectedLog.userName}</p>
                <p className="text-sm text-gray-600">{selectedLog.userEmail}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Action</p>
                <p className="font-medium text-gray-900 mt-1">{selectedLog.action}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Resource Type</p>
                <p className="font-medium text-gray-900 mt-1">{selectedLog.resourceType}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                <p className="font-medium text-gray-900 mt-1">{selectedLog.status}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Resource Name</p>
                <p className="font-medium text-gray-900 mt-1">{selectedLog.resourceName || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Timestamp</p>
                <p className="font-medium text-gray-900 mt-1">
                  {new Date(selectedLog.createdAt).toLocaleString('en-GH')}
                </p>
              </div>
              {selectedLog.ipAddress && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">IP Address</p>
                  <p className="font-medium text-gray-900 mt-1 font-mono text-sm">{selectedLog.ipAddress}</p>
                </div>
              )}
              {selectedLog.errorMessage && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Error Message</p>
                  <p className="font-medium text-red-600 mt-1 text-sm">{selectedLog.errorMessage}</p>
                </div>
              )}
            </div>

            {/* Changes Section */}
            {selectedLog.changes && (selectedLog.changes.before || selectedLog.changes.after) && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Changes</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.changes.before && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Before</p>
                      <pre className="bg-red-50 p-3 rounded text-xs overflow-auto max-h-40 border border-red-200">
                        {JSON.stringify(selectedLog.changes.before, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.changes.after && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">After</p>
                      <pre className="bg-green-50 p-3 rounded text-xs overflow-auto max-h-40 border border-green-200">
                        {JSON.stringify(selectedLog.changes.after, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
