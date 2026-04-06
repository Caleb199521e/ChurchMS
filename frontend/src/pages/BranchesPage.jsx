import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Business as BusinessIcon, People as PeopleIcon, Person as PersonIcon } from '@mui/icons-material';
import { toast } from '../components/common/Toaster';

export default function BranchesPage() {
  const { isSuperAdmin } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [assignMembersTarget, setAssignMembersTarget] = useState(null);
  const [assignMembersModalOpen, setAssignMembersModalOpen] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/branches');
      setBranches(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load branches');
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async (data) => {
    try {
      console.log('Creating branch with data:', data);
      const res = await api.post('/branches', data);
      console.log('Branch creation response:', res.data);
      await fetchBranches(); // Refresh the list
      toast.success('Branch created successfully!');
      return { success: true, data: res.data.data };
    } catch (err) {
      console.error('Branch creation error:', err);
      console.error('Error response status:', err.response?.status);
      console.error('Error response data:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.statusText || err.message || 'Failed to create branch';
      toast.error(errorMsg);
      throw err;
    }
  };

  const handleDeleteBranch = async () => {
    setDeleting(true);
    try {
      await api.delete(`/branches/${deleteTarget._id}`);
      setBranches(branches.filter(b => b._id !== deleteTarget._id));
      toast.success('Branch deleted successfully!');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete branch');
    } finally {
      setDeleting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 font-semibold">Only Super Admin can access this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PageHeader 
          title="Branches" 
          subtitle="Manage all church branches"
        />

        {/* Header with Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">All Branches</h2>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <AddIcon sx={{ fontSize: 20 }} />
            New Branch
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <LoadingSpinner text="Loading branches..." />
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Branches Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
                <BusinessIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                <p className="text-gray-600 mt-2">No branches yet. Create one to get started!</p>
              </div>
            ) : (
              branches.map(branch => (
                <div key={branch._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand/10 rounded-lg flex items-center justify-center">
                        <BusinessIcon sx={{ fontSize: 20, color: '#3b82f6' }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{branch.name}</h3>
                        <p className="text-xs text-gray-500">Active: {branch.isActive ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Branch Info */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    {branch.email && (
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Email:</span> {branch.email}
                      </p>
                    )}
                    {branch.phone && (
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Phone:</span> {branch.phone}
                      </p>
                    )}
                    {branch.address && (
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Address:</span> {branch.address}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  {branch.stats && (
                    <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-3 mb-4 text-xs">
                      <div className="text-center">
                        <p className="font-bold text-brand">{branch.stats.members}</p>
                        <p className="text-gray-600">Members</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-brand">{branch.stats.staff}</p>
                        <p className="text-gray-600">Staff</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-brand">{branch.stats.departments}</p>
                        <p className="text-gray-600">Depts</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setAssignMembersTarget(branch);
                        setAssignMembersModalOpen(true);
                      }}
                      className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                    >
                      <PeopleIcon sx={{ fontSize: 16 }} />
                      Assign Members
                    </button>
                    <button
                      onClick={() => setDeleteTarget(branch)}
                      className="flex-1 py-2 px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Branch Modal */}
      <CreateBranchModal 
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateBranch}
      />

      {/* Assign Members Modal */}
      {assignMembersTarget && (
        <AssignMembersModal
          isOpen={assignMembersModalOpen}
          onClose={() => {
            setAssignMembersModalOpen(false);
            setAssignMembersTarget(null);
          }}
          branch={assignMembersTarget}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteBranch}
        title="Delete Branch?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All associated data (members, visitors, departments, attendance, announcements) will be permanently removed.`}
        confirmLabel="Delete Branch"
        loading={deleting}
      />
    </div>
  );
}

function CreateBranchModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.name.trim()) {
      setError('Branch name is required');
      return;
    }

    setLoading(true);
    try {
      const result = await onSubmit(form);
      if (result?.success) {
        setForm({ name: '', email: '', phone: '', address: '' });
        onClose();
      }
    } catch (err) {
      console.error('Branch creation error:', err);
      console.error('Error response:', err.response);
      const errorMsg = err.response?.data?.message || err.response?.statusText || err.message || 'Failed to create branch';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Create New Branch">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="label">Branch Name *</label>
          <input
            type="text"
            name="name"
            className="input"
            placeholder="e.g., Cape Coast Branch"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            name="email"
            className="input"
            placeholder="branch@church.com"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="label">Phone</label>
          <input
            type="tel"
            name="phone"
            className="input"
            placeholder="0541234567"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="label">Address</label>
          <input
            type="text"
            name="address"
            className="input"
            placeholder="Physical location"
            value={form.address}
            onChange={handleChange}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary"
          >
            {loading ? 'Creating...' : 'Create Branch'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssignMembersModal({ isOpen, onClose, branch }) {
  const [members, setMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && branch) {
      fetchData();
    }
  }, [isOpen, branch]);

  const fetchData = async () => {
    setFetching(true);
    try {
      // Fetch members already in this branch
      const res1 = await api.get(`/branches/${branch._id}/members`);
      setMembers(res1.data.data);
      
      // Fetch all members by getting from /members endpoint
      const res2 = await api.get('/members?limit=1000');
      setAllMembers(res2.data.data || []);
      
      setSelectedMemberId('');
      setSearchQuery('');
      setError('');
    } catch (err) {
      toast.error('Failed to load members');
      setError(err.response?.data?.message || 'Failed to load members');
    } finally {
      setFetching(false);
    }
  };

  const filteredMembers = allMembers.filter(m => 
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.phone && m.phone.includes(searchQuery)) ||
    (m.email && m.email.toLowerCase().includes(searchQuery))
  );

  const handleAssignMember = async () => {
    if (!selectedMemberId) {
      setError('Please select a member');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/branches/${branch._id}/members`, { memberId: selectedMemberId });
      toast.success('Member assigned to branch successfully!');
      setSelectedMemberId('');
      setSearchQuery('');
      await fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to assign member';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Members to ${branch?.name}`} size="lg">
      <div className="space-y-4">
        {/* Current Members List */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Members in this branch ({members.length})</h4>
          {fetching ? (
            <div className="text-center py-4 text-gray-500">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded">
              No members assigned yet
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map(member => (
                <div key={member._id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{member.fullName}</p>
                    <p className="text-xs text-gray-500">{member.phone || member.email || 'No contact'}</p>
                  </div>
                  <span className="badge bg-blue-100 text-blue-800 capitalize">{member.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t my-6"></div>

        {/* Assign New Member */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Assign New Member</h4>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {/* Search Box */}
            <div>
              <label className="label">Search Members</label>
              <input
                type="text"
                className="input"
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedMemberId('');
                }}
              />
            </div>

            {/* Members List */}
            <div>
              <label className="label">Select Member to Assign</label>
              {fetching ? (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded">Loading...</div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded">
                  {searchQuery ? 'No members found' : 'No members available'}
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredMembers.map(member => (
                    <label
                      key={member._id}
                      className="p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b last:border-b-0"
                    >
                      <input
                        type="radio"
                        name="memberSelect"
                        value={member._id}
                        checked={selectedMemberId === member._id}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        className="w-4 h-4 text-brand"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{member.fullName}</p>
                        <p className="text-xs text-gray-500">{member.phone || member.email || 'No contact'}</p>
                      </div>
                      <span className="badge bg-gray-100 text-gray-700 capitalize text-xs">{member.role}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleAssignMember}
                disabled={loading || !selectedMemberId}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Assigning...' : 'Assign Member'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

