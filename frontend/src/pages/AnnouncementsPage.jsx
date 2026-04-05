import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import { toast } from '../components/common/Toaster';
import { useAuth } from '../context/AuthContext';
import CampaignIcon from '@mui/icons-material/Campaign';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const emptyForm = { title: '', message: '', priority: 'normal', expiresAt: '' };

export default function AnnouncementsPage() {
  const { isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements?limit=50');
      setAnnouncements(res.data.data);
    } catch {
      toast.error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (a) => {
    setEditing(a);
    setForm({
      title: a.title, message: a.message, priority: a.priority,
      expiresAt: a.expiresAt ? a.expiresAt.split('T')[0] : ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return toast.error('Title and message are required.');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/announcements/${editing._id}`, form);
        toast.success('Announcement updated.');
      } else {
        await api.post('/announcements', form);
        toast.success('Announcement posted.');
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/announcements/${deleteTarget._id}`);
      toast.success('Announcement deleted.');
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch {
      toast.error('Failed to delete.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Announcements"
        subtitle="Church notices and updates"
        action={<button onClick={openCreate} className="btn-primary">+ New Announcement</button>}
      />

      {loading ? (
        <LoadingSpinner text="Loading announcements..." />
      ) : announcements.length === 0 ? (
        <div className="card text-center py-14">
          <div className="text-4xl mb-3"><CampaignIcon sx={{ fontSize: 60, color: '#9ca3af' }} /></div>
          <p className="text-gray-400 text-sm">No announcements yet. Post one!</p>
          <button onClick={openCreate} className="btn-primary mt-4">Post Announcement</button>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a._id} className={`card border-l-4 ${a.priority === 'urgent' ? 'border-red-500' : 'border-brand'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-gray-900">{a.title}</h3>
                    {a.priority === 'urgent' && (
                      <span className="badge bg-red-100 text-red-700 flex items-center gap-1"><WarningAmberIcon sx={{ fontSize: 16 }} /> Urgent</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{a.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">
                      {new Date(a.createdAt).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    {a.expiresAt && (
                      <span className="text-xs text-amber-600">Expires: {new Date(a.expiresAt).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(a)} className="text-xs text-brand hover:underline font-medium">Edit</button>
                  {isAdmin && (
                    <button onClick={() => setDeleteTarget(a)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Announcement' : 'New Announcement'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="Announcement title" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Message *</label>
            <textarea className="input" rows={4} placeholder="Write your announcement here..."
              value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="normal">Normal</option>
                <option value="urgent">⚠️ Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Expires (optional)</label>
              <input type="date" className="input" value={form.expiresAt}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editing ? 'Update' : 'Post'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Announcement"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
      />
    </div>
  );
}
