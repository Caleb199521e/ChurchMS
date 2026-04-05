# ✝️ Church Management System (CMS)

A production-ready church management system tailored for Ghanaian churches. Built with React + Node.js + MongoDB.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)

---

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set your values:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/church_cms
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRE=7d
```

Install and seed:
```bash
npm install
npm run seed      # Creates admin user + sample data
npm run dev       # Start backend (port 5000)
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev       # Start frontend (port 5173)
```

Open: **http://localhost:5173**

---

## 🔑 Default Login Credentials

| Role  | Email              | Password   |
|-------|--------------------|------------|
| Admin | admin@church.com   | admin123   |
| Staff | staff@church.com   | staff123   |

> ⚠️ Change these passwords immediately after first login!

---

## 📁 Project Structure

```
cms/
├── backend/
│   ├── server.js             # Express entry point
│   ├── seed.js               # Database seeder
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── models/
│   │   ├── User.js
│   │   ├── Member.js
│   │   ├── Department.js
│   │   ├── Attendance.js
│   │   ├── Announcement.js
│   │   └── Visitor.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── membersController.js
│   │   ├── attendanceController.js
│   │   ├── announcementsController.js
│   │   ├── visitorsController.js
│   │   └── dashboardController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── members.js
│   │   ├── attendance.js
│   │   ├── announcements.js
│   │   ├── visitors.js
│   │   ├── departments.js
│   │   └── dashboard.js
│   └── middleware/
│       ├── auth.js           # JWT protect + role authorize
│       └── error.js          # Global error handler
│
└── frontend/
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── context/
        │   └── AuthContext.jsx
        ├── utils/
        │   └── api.js         # Axios + interceptors
        ├── components/
        │   ├── common/
        │   │   ├── Modal.jsx
        │   │   ├── Table.jsx
        │   │   ├── Toaster.jsx
        │   │   ├── Pagination.jsx
        │   │   ├── ConfirmDialog.jsx
        │   │   └── PageHeader.jsx
        │   └── layout/
        │       └── Layout.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── Dashboard.jsx
            ├── MembersPage.jsx
            ├── AttendancePage.jsx
            ├── AnnouncementsPage.jsx
            ├── VisitorsPage.jsx
            └── UsersPage.jsx
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint               | Access      |
|--------|------------------------|-------------|
| POST   | /api/auth/login        | Public      |
| GET    | /api/auth/me           | Protected   |
| POST   | /api/auth/register     | Admin only  |
| GET    | /api/auth/users        | Admin only  |
| PUT    | /api/auth/users/:id    | Admin only  |

### Members
| Method | Endpoint           | Access         |
|--------|--------------------|----------------|
| GET    | /api/members       | All staff      |
| GET    | /api/members/all   | All staff      |
| POST   | /api/members       | Admin + Staff  |
| PUT    | /api/members/:id   | Admin + Staff  |
| DELETE | /api/members/:id   | Admin only     |

### Attendance
| Method | Endpoint                  | Access    |
|--------|---------------------------|-----------|
| GET    | /api/attendance           | All staff |
| POST   | /api/attendance           | All staff |
| GET    | /api/attendance/summary   | All staff |
| DELETE | /api/attendance/:id       | Admin     |

### Announcements
| Method | Endpoint                    | Access        |
|--------|-----------------------------|---------------|
| GET    | /api/announcements          | All staff     |
| POST   | /api/announcements          | Admin + Staff |
| PUT    | /api/announcements/:id      | Admin + Staff |
| DELETE | /api/announcements/:id      | Admin only    |

### Visitors
| Method | Endpoint                   | Access        |
|--------|----------------------------|---------------|
| GET    | /api/visitors              | All staff     |
| POST   | /api/visitors              | All staff     |
| PUT    | /api/visitors/:id          | All staff     |
| POST   | /api/visitors/:id/convert  | Admin + Staff |
| DELETE | /api/visitors/:id          | Admin only    |

---

## 🌐 Deploying to Production

### Backend (Railway / Render / VPS)
1. Push code to GitHub
2. Set environment variables (MONGO_URI, JWT_SECRET)
3. Set start command: `node server.js`

### Frontend (Netlify / Vercel)
1. Update `vite.config.js` proxy OR set `VITE_API_URL` env variable
2. Update `src/utils/api.js` baseURL to your backend URL
3. Build: `npm run build`
4. Deploy `/dist` folder

### MongoDB Atlas (Free tier for small churches)
1. Create free cluster at mongodb.com/atlas
2. Whitelist your server IP
3. Copy connection string to MONGO_URI

---

## 🔒 Security Checklist Before Going Live
- [ ] Change default admin password
- [ ] Set strong JWT_SECRET (32+ random chars)
- [ ] Use HTTPS
- [ ] Set MONGO_URI to Atlas (not local)
- [ ] Add rate limiting (express-rate-limit)

---

## 📱 Features
- ✅ Mobile-first responsive design
- ✅ JWT authentication + role-based access
- ✅ Member management with search + pagination
- ✅ Bulk attendance marking
- ✅ Announcements with urgent flag + expiry
- ✅ Visitor tracking + convert to member
- ✅ Dashboard with live stats
- ✅ Graceful offline error handling
- ✅ Admin user management
