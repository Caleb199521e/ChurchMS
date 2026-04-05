import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Table from '../components/common/Table';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';
import PageHeader from '../components/common/PageHeader';
import { toast } from '../components/common/Toaster';
import BulkUploadModal from '../components/common/BulkUploadModal';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const ROLES = ['member', 'deacon', 'elder', 'pastor', 'leader', 'worker'];
const GENDERS = ['male', 'female', 'other'];

const emptyForm = {
  fullName: '', phone: '', email: '', gender: '', role: 'member',
  department: '', address: '', joinDate: new Date().toISOString().split('T')[0], notes: ''
};

export default function MembersPage() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (filterDept) params.set('department', filterDept);
      if (filterRole) params.set('role', filterRole);
      const res = await api.get(`/members?${params}`);
      setMembers(res.data.data);
      setTotalPages(res.data.pages);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load members.');
    } finally {
      setLoading(false);
    }
  }, [search, filterDept, filterRole, page]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => {
    api.get('/departments').then(r => setDepartments(r.data.data)).catch(() => {});
  }, []);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, filterDept, filterRole]);

  const openCreate = () => { setEditingMember(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (m) => {
    setEditingMember(m);
    setForm({
      fullName: m.fullName, phone: m.phone || '', email: m.email || '',
      gender: m.gender || '', role: m.role,
      department: m.department?._id || '', address: m.address || '',
      joinDate: m.joinDate ? m.joinDate.split('T')[0] : '',
      notes: m.notes || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) return toast.error('Full name is required.');
    setSaving(true);
    try {
      if (editingMember) {
        await api.put(`/members/${editingMember._id}`, form);
        toast.success('Member updated.');
      } else {
        await api.post('/members', form);
        toast.success('Member added.');
      }
      setModalOpen(false);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save member.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/members/${deleteTarget._id}`);
      toast.success('Member deleted.');
      setDeleteTarget(null);
      fetchMembers();
    } catch {
      toast.error('Failed to delete member.');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkUpload = async (membersData) => {
    try {
      await api.post('/members/bulk', { members: membersData });
      fetchMembers();
    } catch (err) {
      throw err.response?.data || new Error('Bulk upload failed');
    }
  };

  const columns = [
    {
      key: 'fullName', label: 'Name',
      render: m => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center text-xs font-bold text-brand flex-shrink-0">
            {m.fullName[0].toUpperCase()}
          </div>
          <span className="font-medium">{m.fullName}</span>
        </div>
      )
    },
    { key: 'phone', label: 'Phone', render: m => m.phone || '—' },
    {
      key: 'department', label: 'Department',
      render: m => m.department?.name
        ? <span className="badge bg-blue-100 text-blue-800">{m.department.name}</span>
        : '—'
    },
    {
      key: 'role', label: 'Role',
      render: m => <span className="capitalize badge bg-gray-100 text-gray-700">{m.role}</span>
    },
    {
      key: 'actions', label: 'Actions', mobileHide: false,
      render: m => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(m)} className="text-xs text-brand hover:underline font-medium">Edit</button>
          {isAdmin && (
            <button onClick={() => setDeleteTarget(m)} className="text-xs text-red-500 hover:underline font-medium">Delete</button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <PageHeader
        title={`Members (${total})`}
        subtitle="Manage your church members"
        action={
          <div className="flex gap-2">
            <button onClick={() => setBulkUploadOpen(true)} className="btn-outline flex items-center gap-2">
              <CloudUploadIcon sx={{ fontSize: 18 }} />
              Bulk Upload
            </button>
            <button onClick={openCreate} className="btn-primary">
              + Add Member
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          className="input flex-1"
          placeholder="Search by name, phone, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input sm:w-44" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select className="input sm:w-36" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
      </div>

      <Table columns={columns} data={members} loading={loading} emptyMessage="No members found." />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editingMember ? 'Edit Member' : 'Add New Member'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Full Name *</label>
              <input className="input" placeholder="e.g. Kwame Asante" value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input className="input" placeholder="0244..." value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="email@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select gender</option>
                {GENDERS.map(g => <option key={g} value={g} className="capitalize">{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                <option value="">No department</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Join Date</label>
              <input type="date" className="input" value={form.joinDate}
                onChange={e => setForm({ ...form, joinDate: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input className="input" placeholder="Home address" value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea className="input" rows={2} placeholder="Any additional notes..."
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editingMember ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Member"
        message={`Are you sure you want to delete ${deleteTarget?.fullName}? This cannot be undone.`}
      />

      <BulkUploadModal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onSubmit={handleBulkUpload}
        departments={departments}
      />
    </div>
  );
}
