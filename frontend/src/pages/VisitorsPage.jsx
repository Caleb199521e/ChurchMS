import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PageHeader from '../components/common/PageHeader';
import Pagination from '../components/common/Pagination';
import { toast } from '../components/common/Toaster';
import { useAuth } from '../context/AuthContext';
import GroupsIcon from '@mui/icons-material/Groups';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisitorsBulkUploadModal from '../components/common/VisitorsBulkUploadModal';

const emptyForm = { name: '', phone: '', email: '', invitedBy: '', address: '', notes: '', firstVisitDate: new Date().toISOString().split('T')[0] };

export default function VisitorsPage() {
  const { isAdmin } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterConverted, setFilterConverted] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [convertTarget, setConvertTarget] = useState(null);
  const [converting, setConverting] = useState(false);

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (filterConverted !== '') params.set('converted', filterConverted);
      const res = await api.get(`/visitors?${params}`);
      setVisitors(res.data.data);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load visitors.');
    } finally {
      setLoading(false);
    }
  }, [search, filterConverted, page]);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);
  useEffect(() => { setPage(1); }, [search, filterConverted]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (v) => {
    setEditing(v);
    setForm({
      name: v.name, phone: v.phone || '', email: v.email || '',
      invitedBy: v.invitedBy || '', address: v.address || '', notes: v.notes || '',
      firstVisitDate: v.firstVisitDate ? v.firstVisitDate.split('T')[0] : ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required.');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/visitors/${editing._id}`, form);
        toast.success('Visitor updated.');
      } else {
        await api.post('/visitors', form);
        toast.success('Visitor added.');
      }
      setModalOpen(false);
      fetchVisitors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/visitors/${deleteTarget._id}`);
      toast.success('Visitor deleted.');
      setDeleteTarget(null);
      fetchVisitors();
    } catch {
      toast.error('Failed to delete.');
    } finally {
      setDeleting(false);
    }
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      await api.post(`/visitors/${convertTarget._id}/convert`);
      toast.success(`${convertTarget.name} has been converted to a member! 🎉`);
      setConvertTarget(null);
      fetchVisitors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Conversion failed.');
    } finally {
      setConverting(false);
    }
  };

  const handleBulkUpload = async (visitorsData) => {
    try {
      await api.post('/visitors/bulk', { visitors: visitorsData });
      fetchVisitors();
    } catch (err) {
      throw err.response?.data || new Error('Bulk upload failed');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Visitors (${total})`}
        subtitle="Track and follow up with visitors"
        action={
          <div className="flex gap-2">
            <button onClick={() => setBulkUploadOpen(true)} className="btn-outline flex items-center gap-2">
              <CloudUploadIcon sx={{ fontSize: 18 }} />
              Bulk Upload
            </button>
            <button onClick={openCreate} className="btn-primary">+ Add Visitor</button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input className="input flex-1" placeholder="🔍 Search by name or phone..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input sm:w-44" value={filterConverted} onChange={e => setFilterConverted(e.target.value)}>
          <option value="">All Visitors</option>
          <option value="false">Pending Follow-up</option>
          <option value="true">Converted Members</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : visitors.length === 0 ? (
        <div className="card text-center py-14">
          <div className="mb-3"><GroupsIcon sx={{ fontSize: 60, color: '#d1d5db' }} /></div>
          <p className="text-gray-400 text-sm">No visitors recorded yet.</p>
          <button onClick={openCreate} className="btn-primary mt-4">Add First Visitor</button>
        </div>
      ) : (
        <div className="space-y-3">
          {visitors.map(v => (
            <div key={v._id} className={`card ${v.converted ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-sm font-bold text-brand flex-shrink-0">
                    {v.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{v.name}</p>
                      {v.converted && <span className="badge bg-green-100 text-green-700">✅ Member</span>}
                    </div>
                    <p className="text-sm text-gray-500">{v.phone || 'No phone'}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400">
                        First visit: {new Date(v.firstVisitDate).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      {v.invitedBy && <span className="text-xs text-gray-400">Invited by: {v.invitedBy}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end flex-shrink-0">
                  {!v.converted && (
                    <button onClick={() => setConvertTarget(v)}
                      className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded-lg font-medium transition-colors">
                      Convert to Member
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(v)} className="text-xs text-brand hover:underline font-medium">Edit</button>
                    {isAdmin && <button onClick={() => setDeleteTarget(v)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>}
                  </div>
                </div>
              </div>
              {v.notes && <p className="text-xs text-gray-400 mt-2 pl-13 border-t border-gray-50 pt-2">{v.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Visitor' : 'Add Visitor'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" placeholder="Visitor's name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="0244..." value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">First Visit Date</label>
              <input type="date" className="input" value={form.firstVisitDate}
                onChange={e => setForm({ ...form, firstVisitDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Invited By</label>
            <input className="input" placeholder="Name of member who invited them" value={form.invitedBy}
              onChange={e => setForm({ ...form, invitedBy: e.target.value })} />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" placeholder="Home address" value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} placeholder="Any follow-up notes..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editing ? 'Update' : 'Add Visitor'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Visitor" message={`Delete ${deleteTarget?.name}? This cannot be undone.`} />

      <ConfirmDialog isOpen={!!convertTarget} onClose={() => setConvertTarget(null)}
        onConfirm={handleConvert} loading={converting}
        title="Convert to Member" confirmLabel="Convert"
        message={`Convert ${convertTarget?.name} to a full church member? A new member profile will be created.`} />

      <VisitorsBulkUploadModal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onSubmit={handleBulkUpload}
      />
    </div>
  );
}
