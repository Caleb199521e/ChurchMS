import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/common/Modal';
import PageHeader from '../components/common/PageHeader';
import { toast } from '../components/common/Toaster';

const emptyForm = { name: '', email: '', password: '', role: 'staff' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data.data);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => { setEditingUser(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (u) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingUser && !form.password) return toast.error('Password is required for new users.');
    setSaving(true);
    try {
      if (editingUser) {
        const payload = { name: form.name, email: form.email, role: form.role };
        await api.put(`/auth/users/${editingUser._id}`, payload);
        toast.success('User updated.');
      } else {
        await api.post('/auth/register', form);
        toast.success('User created.');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/auth/users/${u._id}`, { isActive: !u.isActive });
      toast.success(`User ${u.isActive ? 'deactivated' : 'activated'}.`);
      fetchUsers();
    } catch {
      toast.error('Failed to update user.');
    }
  };

  const roleColors = { admin: 'bg-purple-100 text-purple-800', staff: 'bg-blue-100 text-blue-800', member: 'bg-gray-100 text-gray-700' };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeader
        title="Users"
        subtitle="Manage system access"
        action={<button onClick={openCreate} className="btn-primary">+ Add User</button>}
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u._id} className={`card flex items-center justify-between gap-3 ${!u.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {u.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                    <span className={`badge ${roleColors[u.role]}`}>{u.role}</span>
                    {!u.isActive && <span className="badge bg-red-100 text-red-600">Inactive</span>}
                  </div>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button onClick={() => openEdit(u)} className="text-xs text-brand hover:underline font-medium">Edit</button>
                <button onClick={() => toggleActive(u)}
                  className={`text-xs font-medium ${u.isActive ? 'text-red-500 hover:underline' : 'text-green-600 hover:underline'}`}>
                  {u.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Create New User'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          {!editingUser && (
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" placeholder="Min 6 characters" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} minLength={6} />
            </div>
          )}
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
            <strong>Roles:</strong> Admin has full access. Staff can manage members and attendance. Member can view announcements only.
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
