# Multi-Branch Church CMS System

## Overview

Your Church CMS has been upgraded with a comprehensive multi-branch management system. This allows you to manage multiple church branches from a single central administration point, with each branch having its own independent management system, staff, members, and data.

---

## Architecture

### User Roles & Hierarchy

```
Super Admin (HQ)
├── Can create and manage all branches
├── Can view and manage all data across branches
├── Can assign branch managers to each branch
└── Can access branch selection screen at login

Branch Manager 
├── Assigned to ONE specific branch
├── Can manage staff within their branch
├── Can view and edit all data within their branch
├── Cannot access other branches
└── Cannot create new branches

Staff
├── Assigned to ONE specific branch
├── Can create/edit members, visitors, announcements
├── Can record attendance
├── Cannot manage users or other staff
└── Strictly isolated to their branch

Member
├── Assigned to ONE branch
├── Can view branch information (in future updates)
└── Limited access based on permissions
```

### Data Isolation Model

Every entity is now scoped to a branch:
- **Members** - Each member belongs to one branch
- **Visitors** - Each visitor is tracked per branch
- **Departments** - Unique per branch (no shared departments)
- **Attendance** - Recorded per branch
- **Announcements** - Visible only to branch members
- **Users** - Assigned to specific branch (except super-admin)
- **Branches** - Contain all of the above

---

## New Database Models

### Branch Model

```
{
  _id: ObjectId,
  name: String (unique),              // e.g., "Main Branch", "Cape Coast"
  email: String,                      // Branch contact email
  phone: String,                      // Branch contact phone
  address: String,                    // Physical location
  manager: ObjectId (ref: User),      // Branch manager user
  createdBy: ObjectId (ref: User),    // Super-admin who created it
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

---

## How It Works

### 1. Login Flow

**For Super Admin:**
1. Enter email: `admin@church.com` and password: `admin123`
2. System displays list of all active branches
3. Select a branch to manage
4. Dashboard shows data for selected branch
5. Can switch branches anytime via "Switch branch" button in sidebar

**For Branch Manager:**
1. Enter assigned email and password
2. System auto-loads their assigned branch
3. Only see their branch's data
4. No branch selector visible

**For Staff:**
1. Enter assigned email and password
2. System auto-loads their assigned branch
3. Only see their branch's data
4. Cannot see other branches

### 2. Data Access Pattern

All API requests automatically include branch filtering:
- Backend middleware (`branchAccess.js`) validates access
- Only data for user's assigned branch is returned
- Super-admin can access any branch by specifying branchId in query

### 3. Branch Operations

**Creating a Branch (Super Admin Only):**
```
POST /api/branches
{
  "name": "Cape Coast Branch",
  "email": "cape@church.com",
  "phone": "0541234567",
  "address": "Cape Coast, Ghana",
  "manager": "userId" // Optional: Will create branch manager
}
```

**Viewing Branch Details:**
```
GET /api/branches/:id
Returns: Branch info + statistics (member count, staff count, etc.)
```

**Updating Branch:**
```
PUT /api/branches/:id
Update: name, email, phone, address, isActive
```

**Managing Staff in Branch:**
```
POST /api/branches/:id/staff
Assign staff to branch

GET /api/branches/:id/staff
List all staff in branch

DELETE /api/branches/:id/staff/:userId
Remove staff from branch
```

---

## Test Accounts (After Seeding)

### Super Admin
- **Email:** `admin@church.com`
- **Password:** `admin123`
- **Capabilities:** Create branches, manage all data, switch between branches

### Branch Manager
- **Email:** `manager@church.com`
- **Password:** `manager123`
- **Assigned to:** Main Branch
- **Capabilities:** Manage staff, view branch data

### Staff
- **Email:** `staff@church.com`
- **Password:** `staff123`
- **Assigned to:** Main Branch
- **Capabilities:** Manage members/visitors, record attendance

---

## Adding a New Branch

### Via API (Recommended for automation)

```bash
curl -X POST http://localhost:3000/api/branches \
  -H "Authorization: Bearer <super-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kumasi Branch",
    "email": "kumasi@church.com",
    "phone": "0321234567",
    "address": "Kumasi, Ghana"
  }'
```

### Via Frontend (Not yet implemented - Manual API call currently)

Future update will add branch management UI.

---

## Adding Staff to a Branch

### Via API

```bash
# First, create the user (staff account)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Authorization: Bearer <super-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@kumasi.church.com",
    "password": "secure123",
    "role": "staff"
  }'

# Then, assign to branch
curl -X POST http://localhost:3000/api/branches/<branch-id>/staff \
  -H "Authorization: Bearer <super-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-id-from-register>"
  }'
```

---

## Security Features

✅ **Branch Isolation**
- Users cannot access data from branches they're not assigned to
- Super-admin must explicitly select a branch
- Middleware validates every request

✅ **Role-Based Access Control**
- Different endpoints for super-admin vs branch staff
- Staff cannot create or delete branches
- Staff cannot access user management

✅ **Data Integrity**
- Departments are unique per branch (prevents conflicts)
- Members can only be in one branch
- Attendance is tracked per branch

✅ **Audit Trail**
- Branch creation tracked (`createdBy` field)
- All operations scoped to user's branch
- Timestamp tracking on all records

---

## Backend Changes Summary

### New Files
- `models/Branch.js` - Branch model
- `middleware/branchAccess.js` - Branch access validation
- `controllers/branchController.js` - Branch CRUD operations
- `routes/branches.js` - Branch API endpoints

### Modified Files
- `models/User.js` - Added branchId, updated roles
- `models/Member.js` - Added branchId
- `models/Department.js` - Added branchId (unique per branch)
- `models/Attendance.js` - Added branchId
- `models/Announcement.js` - Added branchId
- `models/Visitor.js` - Added branchId
- `controllers/membersController.js` - Added branch filtering
- `controllers/visitorsController.js` - Added branch filtering
- `controllers/attendanceController.js` - Added branch filtering
- `controllers/announcementsController.js` - Added branch filtering
- `controllers/authController.js` - Updated login response
- `routes/members.js` - Added branchAccess middleware
- `routes/visitors.js` - Added branchAccess middleware
- `routes/attendance.js` - Added branchAccess middleware
- `routes/announcements.js` - Added branchAccess middleware
- `routes/departments.js` - Added branchAccess middleware
- `seed.js` - Initialize main branch and new user roles

### Role Updates
- `admin` → `super-admin` (Can manage all branches)
- `staff` → `staff` (Assigned to one branch)
- **New role:** `branch-manager` (Manages one branch)

---

## Frontend Changes Summary

### New/Updated Files
- `context/AuthContext.jsx` - Added branch state management
- `pages/LoginPage.jsx` - Added branch selection screen
- `components/layout/Layout.jsx` - Added branch switcher for super-admin
- `utils/api.js` - Auto-attach branchId to requests

### Features Added
- ✅ Branch selection at login
- ✅ Branch switcher in sidebar (super-admin only)
- ✅ Display current branch name
- ✅ Auto-filter data by branch
- ✅ Branch context in auth provider

---

## Database Migration

When you seed the database:

```bash
cd backend
npm run seed
```

This will:
1. Clear existing data
2. Create "Main Branch"
3. Create Super Admin assigned to HQ level
4. Create Branch Manager and Staff for Main Branch
5. Create departments scoped to Main Branch
6. Create sample members and visitors scoped to Main Branch
7. Create sample announcements for Main Branch

---

## Advanced Usage

### Super Admin Features

**Switch Branches:**
- login → select branch from list → manage that branch's data
- Click "Switch branch" button any time to choose different branch

**View Branch Statistics:**
```
GET /api/branches/:id
Returns: {
  _id: "...",
  name: "Main Branch",
  stats: {
    members: 8,
    visitors: 2,
    staff: 2,
    departments: 7
  }
}
```

**Manage Branch Staff:**
```
GET /api/branches/:id/staff
POST /api/branches/:id/staff
DELETE /api/branches/:id/staff/:userId
```

### Branch Manager Features

**Record Attendance:**
- Can only record for their branch
- Attendance data isolated to their branch

**Create Announcements:**
- Automatically scoped to their branch
- Only visible to branch members

**Manage Members:**
- Can create, edit, delete members in their branch
- Cannot see members from other branches

**Bulk Upload:**
- Import members/visitors for their branch
- All imports automatically assigned to their branch

---

## Common Scenarios

### Scenario 1: Administrator Wants to Check Cape Coast Branch

1. Login as `admin@church.com`
2. Select "Cape Coast Branch" from dropdown
3. View dashboard shows Cape Coast data only
4. All operations now affect Cape Coast branch only
5. Click "Switch branch" to change to different branch

### Scenario 2: Cape Coast Manager Logs In

1. Login as `manager_capetown@church.com`
2. System auto-loads Cape Coast branch
3. Cannot see branch selector (only their branch available)
4. All data shown is Cape Coast only
5. Can manage staff and members for Cape Coast

### Scenario 3: Create New Branch (Accra)

```javascript
// API Call
POST /api/branches
Authorization: Bearer <super-admin-token>
{
  "name": "Accra Branch",
  "email": "accra@church.com",
  "phone": "054-xxx-xxxx",
  "address": "Osu, Accra"
}

// Response
{
  success: true,
  data: {
    _id: "branch_accra_001",
    name: "Accra Branch",
    ...
  }
}
```

### Scenario 4: Assign Staff to Accra Branch

```javascript
// First create user
POST /api/auth/register
{
  name: "Ama Accra",
  email: "ama@accra.church.com",
  password: "secure123",
  role: "staff"
}

// Then assign to branch
POST /api/branches/branch_accra_001/staff
{
  userId: "user_ama_001"
}
```

---

## Troubleshooting

### Issue: User can't see branches at login

**Solution:** 
- Ensure user role is `super-admin`
- Check localStorage for branches in DevTools
- Try logging out and logging back in

### Issue: Data showing from other branches

**Solution:**  
- Clear browser cache and localStorage
- Verify currentBranch is set correctly in localStorage
- Check API response includes proper branchId filtering

### Issue: Can't create members in branch

**Solution:**
- Verify your user is assigned to a branch (not super-admin viewing)
- Check that you've selected the branch you want to add members to
- Ensure branchId is in API request

---

## Next Steps (Recommendations)

1. **Test the Multi-Branch System**
   - Create a new branch via API
   - Assign staff to it
   - Verify data isolation

2. **Set Up Production Branches**
   - Identify all church branches to manage
   - Create branch accounts with managers
   - Migrate existing data to main branch

3. **Add Branch UI (Future)**
   - Build branch management dashboard
   - Add branch creation form in frontend
   - Add staff assignment UI

4. **Implement Reports**
   - Cross-branch statistics dashboard
   - Branch performance metrics
   - Attendance reports per branch

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Church Organization                  │
├─────────────────────────────────────────────────────────┤
│  Super Admin (admin@church.com)                         │
│  ├─ Can create/manage ALL branches                      │
│  ├─ Can switch between branches                         │
│  └─ Full access to all data                            │
├─────────────────────────────────────────────────────────┤
│  Branch 1: Main Branch                                  │
│  ├─ Manager: manager@church.com (branch-manager)        │
│  ├─ Staff: staff@church.com (staff)                     │
│  ├─ Members: 8                                          │
│  ├─ Visitors: 2                                         │
│  └─ Departments: 7 (isolated to this branch)            │
├─────────────────────────────────────────────────────────┤
│  Branch 2: Cape Coast Branch (Future)                   │
│  ├─ Manager: [To be assigned]                           │
│  ├─ Staff: [To be assigned]                             │
│  └─ All data isolated to this branch                    │
├─────────────────────────────────────────────────────────┤
│  Branch 3: Accra Branch (Future)                        │
│  └─ All data isolated to this branch                    │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints Reference

### Branches
- `POST /api/branches` - Create branch (super-admin only)
- `GET /api/branches` - List all branches (super-admin only)
- `GET /api/branches/:id` - Get branch details
- `PUT /api/branches/:id` - Update branch
- `POST /api/branches/:id/staff` - Assign staff
- `GET /api/branches/:id/staff` - Get branch staff
- `DELETE /api/branches/:id/staff/:userId` - Remove staff

### Members (Branch-scoped)
- `GET /api/members` - List members (your branch only)
- `POST /api/members` - Create member (auto your branch)
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member
- `POST /api/members/bulk` - Bulk import

### All Other Endpoints are Now Branch-Filtered
- `/api/visitors` - Branch filtered
- `/api/attendance` - Branch filtered
- `/api/announcements` - Branch filtered
- `/api/departments` - Branch filtered

---

## Support

For issues or questions about the multi-branch system, refer to the logic implemented in:
- Backend: `middleware/branchAccess.js`
- Backend: `controllers/branchController.js`
- Frontend: `context/AuthContext.jsx`

Your system is now ready for multi-branch operations! 🎉
