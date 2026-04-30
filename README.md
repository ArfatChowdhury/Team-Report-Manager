# Team Report Manager (Hiring Assessment)

A professional React Native CLI application for enterprise team management. This system enforces a strict three-tier role hierarchy (Admin, Leader, Member) and features AI-assisted task generation, real-time reporting, and automated email summaries.

## 🚀 Key Features
- **Role-Based Dashboards**: Customized experiences for Admins, Leaders, and Members.
- **AI Planning (Groq Llama-3)**: Generate structured task lists from free-text prompts.
- **Visual Analytics**: Custom SVG charts (Donut/Bar) for productivity tracking.
- **Email Reporting**: AI-generated HTML reports with task tables sent via SMTP.
- **Time Tracking**: Automatic calculation of work minutes per task.
- **Task Locking**: Locked carry-over logic to preserve project history.

## 🛠 Tech Stack
- **Frontend**: React Native CLI, Redux Toolkit, React Navigation, SVG.
- **Backend**: Node.js, Express, MongoDB, Firebase Auth.
- **AI Service**: Groq API (Llama-3-70B & 8B).
- **Persistence**: AsyncStorage for offline-first session recovery.

---

## ⚙️ Setup Instructions

### 1. Backend Setup
```bash
cd f:/TeamReportM-backend
npm install
# Configure your .env (see sample below)
npm run seed  # Populate demo data
npm start
```

#### Backend `.env` Requirements:
```text
PORT=5000
MONGO_URI=your_mongodb_uri
GROQ_API_KEY=your_groq_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_app_password
```

### 2. Mobile App Setup
```bash
cd f:/TeamReportM
npm install
# Ensure Android Emulator is running
npm run android
```

---

## 🔐 Demo Credentials
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@test.com` | `password123` |
| **Leader** | `leader@test.com` | `password123` |
| **Member** | `member@test.com` | `password123` |

---

## 📊 Evaluation Highlights
- **Security**: Granular role enforcement via server-side middleware.
- **Clean Code**: Modular Redux architecture and component-driven UI.
- **UX**: Professional glassmorphism design with responsive charts.
- **AI**: Seamless integration of Llama-3 for project management efficiency.

---
*Created by [Your Name] for the Hiring Assessment (May 2026).*
