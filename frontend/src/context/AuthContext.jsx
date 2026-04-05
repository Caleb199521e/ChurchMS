import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [branches, setBranches] = useState(() => {
    const stored = localStorage.getItem('branches');
    return stored ? JSON.parse(stored) : [];
  });
  const [currentBranch, setCurrentBranch] = useState(() => {
    const stored = localStorage.getItem('currentBranch');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          
          // For super-admin, update branches if provided
          if (res.data.branches) {
            localStorage.setItem('branches', JSON.stringify(res.data.branches));
            setBranches(res.data.branches);
            // If no current branch set, use first available
            if (!currentBranch && res.data.branches.length > 0) {
              setCurrentBranch(res.data.branches[0]._id);
              localStorage.setItem('currentBranch', JSON.stringify(res.data.branches[0]._id));
            }
          }
          
          // If user has branchId, set it as current branch
          if (res.data.user?.branchId) {
            setCurrentBranch(res.data.user.branchId);
            localStorage.setItem('currentBranch', JSON.stringify(res.data.user.branchId));
          }
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user, branches: availableBranches, message } = res.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);

    // For super-admin, store available branches and set a default one
    if (availableBranches) {
      localStorage.setItem('branches', JSON.stringify(availableBranches));
      setBranches(availableBranches);
      // Set first branch as current if available
      if (availableBranches.length > 0) {
        const defaultBranch = availableBranches[0];
        setCurrentBranch(defaultBranch._id);
        localStorage.setItem('currentBranch', JSON.stringify(defaultBranch._id));
        return { user, branches: availableBranches, selectBranch: true, message };
      }
    } else if (user?.branchId) {
      // For branch staff, set their branch as current
      const branchId = typeof user.branchId === 'string' ? user.branchId : user.branchId._id;
      setCurrentBranch(branchId);
      localStorage.setItem('currentBranch', JSON.stringify(branchId));
    }

    return user;
  };

  const selectBranch = (branchId) => {
    setCurrentBranch(branchId);
    localStorage.setItem('currentBranch', JSON.stringify(branchId));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('branches');
    localStorage.removeItem('currentBranch');
    setUser(null);
    setBranches([]);
    setCurrentBranch(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      branches,
      currentBranch,
      selectBranch,
      isSuperAdmin: user?.role === 'super-admin',
      isBranchManager: user?.role === 'branch-manager',
      isStaff: user?.role === 'staff',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
