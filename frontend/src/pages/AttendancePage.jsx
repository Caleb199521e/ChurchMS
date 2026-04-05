import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/common/Modal';
import PageHeader from '../components/common/PageHeader';
import { toast } from '../components/common/Toaster';
import CheckIcon from '@mui/icons-material/Check';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SearchIcon from '@mui/icons-material/Search';

const SERVICE_TYPES = ['sunday', 'midweek', 'special', 'prayer'];

export default function AttendancePage() {
  const [tab, setTab] = useState('mark'); // 'mark' | 'history'
  const [allMembers, setAllMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [searchMember, setSearchMember] = useState('');
  const [serviceType, setServiceType] = useState('sunday');
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceTitle, setServiceTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => {
    api.get('/members/all')
      .then(r => setAllMembers(r.data.data))
      .catch(() => toast.error('Failed to load members.'));
  }, []);

  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/attendance?limit=30');
      setHistory(res.data.data);
    } catch {
      toast.error('Failed to load attendance history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleMember = (id) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const filtered = filteredMembers.map(m => m._id);
    const allSelected = filtered.every(id => selectedMembers.has(id));
    setSelectedMembers(prev => {
      const next = new Set(prev);
      allSelected ? filtered.forEach(id => next.delete(id)) : filtered.forEach(id => next.add(id));
      return next;
    });
  };

  const handleSave = async () => {
    if (!serviceDate) return toast.error('Please select a date.');
    if (selectedMembers.size === 0) return toast.error('Please select at least one member.');
    setSaving(true);
    try {
      await api.post('/attendance', {
        date: serviceDate,
        serviceType,
        serviceTitle,
        members: Array.from(selectedMembers),
      });
      toast.success(`Attendance saved — ${selectedMembers.size} members marked.`);
      setSelectedMembers(new Set());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const openRecord = async (id) => {
    try {
      const res = await api.get(`/attendance/${id}`);
      setViewRecord(res.data.data);
      setViewOpen(true);
    } catch {
      toast.error('Failed to load record.');
    }
  };

  const filteredMembers = allMembers.filter(m =>
    m.fullName.toLowerCase().includes(searchMember.toLowerCase()) ||
    (m.phone && m.phone.includes(searchMember))
  );

  const serviceColors = { sunday: 'bg-blue-100 text-blue-800', midweek: 'bg-purple-100 text-purple-800', special: 'bg-amber-100 text-amber-800', prayer: 'bg-green-100 text-green-800' };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <PageHeader title="Attendance" subtitle="Mark and view service attendance" />

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5 w-full sm:w-64">
        {[{ key: 'mark', label: 'Mark', icon: CheckIcon }, { key: 'history', label: 'History', icon: AssignmentIcon }].map(t => {
          const TabIcon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 px-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${tab === t.key ? 'bg-white shadow text-brand' : 'text-gray-500 hover:text-gray-700'}`}>
              <TabIcon sx={{ fontSize: 18 }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'mark' && (
        <div className="space-y-4">
          {/* Service Config */}
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-3">Service Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={serviceDate}
                  onChange={e => setServiceDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Service Type</label>
                <select className="input" value={serviceType} onChange={e => setServiceType(e.target.value)}>
                  {SERVICE_TYPES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)} Service</option>)}
                </select>
              </div>
              <div>
                <label className="label">Service Title (optional)</label>
                <input className="input" placeholder="e.g. Easter Sunday" value={serviceTitle}
                  onChange={e => setServiceTitle(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Member Selection */}
          <div className="card">
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <div>
                <h3 className="font-bold text-gray-800">Mark Members Present</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedMembers.size} of {allMembers.length} selected</p>
              </div>
              <button onClick={selectAll} className="btn-outline text-xs">
                {filteredMembers.every(m => selectedMembers.has(m._id)) ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <input className="input mb-3" placeholder="Search member..."
              value={searchMember} onChange={e => setSearchMember(e.target.value)} />

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 rounded-lg border border-gray-100">
              {filteredMembers.length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">No members found.</p>
              ) : filteredMembers.map(m => {
                const checked = selectedMembers.has(m._id);
                return (
                  <label key={m._id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${checked ? 'bg-green-50' : ''}`}>
                    <input type="checkbox" className="w-4 h-4 accent-brand" checked={checked}
                      onChange={() => toggleMember(m._id)} />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${checked ? 'bg-green-500 text-white' : 'bg-brand/10 text-brand'}`}>
                      {m.fullName[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{m.fullName}</p>
                      {m.department?.name && <p className="text-xs text-gray-400">{m.department.name}</p>}
                    </div>
                    {checked && <CheckIcon sx={{ fontSize: 24, color: '#10b981' }} />}
                  </label>
                );
              })}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving || selectedMembers.size === 0} className="btn-primary w-full py-3 text-base">
            {saving ? 'Saving...' : `Save Attendance (${selectedMembers.size} present)`}
          </button>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {historyLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">No attendance records yet.</div>
          ) : history.map(r => (
            <div key={r._id} className="card flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openRecord(r._id)}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge ${serviceColors[r.serviceType]}`}>
                    {r.serviceType.charAt(0).toUpperCase() + r.serviceType.slice(1)}
                  </span>
                  {r.serviceTitle && <span className="text-sm text-gray-500">{r.serviceTitle}</span>}
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(r.date).toLocaleDateString('en-GH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-gray-900">{r.members?.length ?? 0}</p>
                <p className="text-xs text-gray-400">present</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Record Modal */}
      <Modal isOpen={viewOpen} onClose={() => setViewOpen(false)} title="Attendance Record" size="md">
        {viewRecord && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`badge ${serviceColors[viewRecord.serviceType]}`}>
                {viewRecord.serviceType.charAt(0).toUpperCase() + viewRecord.serviceType.slice(1)}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(viewRecord.date).toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="mb-3 p-3 bg-brand/5 rounded-lg">
              <p className="text-2xl font-bold text-brand">{viewRecord.members?.length}</p>
              <p className="text-sm text-gray-500">members present</p>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {viewRecord.members?.map((m, i) => (
                <div key={m._id || i} className="flex items-center gap-2 py-1.5">
                  <CheckIcon sx={{ fontSize: 18, color: '#10b981' }} />
                  <span className="text-sm text-gray-700">{m.fullName}</span>
                </div>
              ))}
            </div>
            {viewRecord.markedBy && (
              <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
                Marked by: {viewRecord.markedBy.name}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
