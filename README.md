# 🤖 AttendAI — AI-Powered Attendance System

An intelligent attendance management system with **face recognition**, **geolocation**, **role-based access**, and an **AI assistant** powered by Google Gemini.

---

## 🏗️ Architecture

```
attendance-system/
├── backend/          # FastAPI + MongoDB + face-recognition
│   ├── main.py
│   ├── routes/
│   │   ├── auth.py           # JWT auth, register with face
│   │   ├── attendance.py     # Punch in/out with face recognition
│   │   ├── overtime.py       # OT request/approval workflow
│   │   ├── admin.py          # Admin panel, user management
│   │   ├── reports.py        # PDF/Excel export
│   │   └── ai_assistant.py   # Gemini-powered AI queries
│   ├── face_service.py       # OpenCV + face-recognition
│   ├── geo_service.py        # Geofencing (500m radius)
│   └── auth_utils.py         # JWT, RBAC
└── frontend/         # React + Vite + Redux Toolkit
    └── src/
        ├── pages/            # All page components
        ├── components/       # FaceCapture, Layout
        └── store/            # Redux slices
```

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, Python 3.11+ |
| Face Recognition | OpenCV + face-recognition (dlib) |
| Database | MongoDB Atlas (Motor async) |
| Frontend | React 18, Vite, Redux Toolkit |
| Styling | Tailwind CSS (Dark mode) |
| AI | Google Gemini 1.5 Flash |
| Auth | JWT (python-jose) |
| Export | ReportLab (PDF), openpyxl (Excel) |
| Deploy | Render (Backend) + Netlify (Frontend) |

---

## ⚙️ Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB Atlas account
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))
- CMake (for dlib/face-recognition compilation)

---

### Backend Setup

```bash
cd backend

# Install system deps (Ubuntu/Debian)
sudo apt-get install cmake build-essential libopenblas-dev liblapack-dev

# Install Python deps
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values:
#   MONGODB_URL=mongodb+srv://...
#   SECRET_KEY=your-random-secret
#   GEMINI_API_KEY=your-gemini-key

# Run development server
uvicorn main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit VITE_API_URL=http://localhost:8000/api

# Run dev server
npm run dev
```

App available at: `http://localhost:3000`

---

## 🔐 Environment Variables

### Backend `.env`

| Variable | Description |
|----------|-------------|
| `MONGODB_URL` | MongoDB Atlas connection string |
| `DB_NAME` | Database name (default: attendance_system) |
| `SECRET_KEY` | JWT secret (use long random string) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token TTL (default: 1440 = 24h) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `OPENROUTER_API_KEY` | OpenRouter key (fallback AI) |
| `GEOFENCE_RADIUS_METERS` | Allowed radius from office (default: 500) |

### Frontend `.env`

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |

---

## 🌐 Deployment

### Backend → Render

1. Push code to GitHub
2. Create new **Web Service** on Render
3. Set **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add all environment variables from `.env.example`

### Frontend → Netlify

1. Push code to GitHub
2. Connect repo on Netlify
3. Set **Build command**: `npm run build`
4. Set **Publish directory**: `dist`
5. Add env var: `VITE_API_URL=https://your-backend.onrender.com/api`

### Database → MongoDB Atlas

1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create database user
3. Whitelist all IPs (0.0.0.0/0 for Render)
4. Copy connection string to `MONGODB_URL`

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with face (base64 camera selfie) |
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Current user info |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance/punch-in` | Face + GPS punch in |
| POST | `/api/attendance/punch-out` | Face + GPS punch out |
| GET | `/api/attendance/today` | Today's status |
| GET | `/api/attendance/history` | Historical records |

### Overtime
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/overtime/request` | Submit OT request |
| GET | `/api/overtime/my-requests` | My OT requests |
| GET | `/api/overtime/pending` | Pending approvals (manager/admin) |
| PUT | `/api/overtime/{id}/action` | Approve/reject OT |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all employees |
| PUT | `/api/admin/users/{id}/toggle-active` | Enable/disable user |
| GET | `/api/admin/attendance` | All attendance records |
| PUT | `/api/admin/attendance/{id}/mark-fake` | Flag as fake |
| GET | `/api/admin/stats` | Dashboard statistics |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/my-report` | Personal attendance report |
| GET | `/api/reports/team-report` | Team report (manager/admin) |
| GET | `/api/reports/export/excel` | Download Excel |
| GET | `/api/reports/export/pdf` | Download PDF |

### AI Assistant
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/query` | Natural language attendance query |
| GET | `/api/ai/context` | Raw attendance context data |

---

## 👥 User Roles

| Feature | Employee | Manager | Admin |
|---------|----------|---------|-------|
| Punch In/Out | ✅ | ✅ | ✅ |
| View own attendance | ✅ | ✅ | ✅ |
| Request OT | ✅ | ✅ | ✅ |
| Approve/Reject OT | ❌ | ✅ (team) | ✅ |
| View team attendance | ❌ | ✅ (team) | ✅ |
| AI Assistant | ❌ | ✅ | ✅ |
| Disable users | ❌ | ❌ | ✅ |
| Flag fake records | ❌ | ❌ | ✅ |
| All reports | ❌ | Team only | ✅ |

---

## 🧠 Attendance Logic

| Hours Worked | Status |
|-------------|--------|
| ≥ 8 hours | ✅ Present |
| < 8 hours | ⚠️ Incomplete |
| No punch-in | ❌ Absent |
| Flagged manually | 🚩 Fake |

---

## 🤖 AI Assistant Examples

Powered by **Google Gemini 1.5 Flash** with real-time attendance context:

- *"Who came late today?"*
- *"How many employees are absent?"*
- *"List employees with less than 8 hours"*
- *"Show all pending overtime requests"*
- *"Give me today's attendance summary"*

---

## 🔒 Security Features

- **Face liveness check** (anti-spoofing via Laplacian variance)
- **Face recognition** with configurable tolerance (0.5 = 50% threshold)
- **JWT authentication** with 24h expiry
- **Role-based access control** (RBAC) on all endpoints
- **Bcrypt password hashing**
- **Geofencing** (500m radius, configurable)
- Camera-only capture (no file uploads accepted)

---

## 🌙 Bonus Features

- ✅ Dark mode (system + manual toggle)
- ✅ Geofencing (500m office radius)
- ✅ Anti-spoofing (liveness detection)
- ✅ PDF & Excel export
- ✅ Real-time AI assistant with Gemini

---

## 📹 Demo Video Script

1. Register new employee with camera selfie
2. Login and view dashboard
3. Punch in with face recognition + location
4. Punch out after hours
5. Request overtime
6. Manager: approve OT request
7. Admin: view all attendance, flag fake record
8. AI Assistant: query "Who is absent today?"
9. Download PDF/Excel report
10. Toggle dark mode

---

## 📬 Postman Collection

Import `postman_collection.json` to test all endpoints.
Set environment variable `BASE_URL = https://your-backend.onrender.com`
Set `TOKEN` after login for authenticated requests.

---

## 👨‍💻 Author

Built with FastAPI + React + MongoDB Atlas + Google Gemini
