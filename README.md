# Top Team Manager 🚀

A high-performance, **AI-augmented** project management platform built for modern teams. Featuring a cutting-edge **Next-Gen Dark Glassmorphism** UI, real-time task tracking, and automated roadmap generation.

![App Header](https://img.shields.io/badge/UI-OLED_Dark-020617?style=for-the-badge&logo=react)
![AI](https://img.shields.io/badge/AI-Llama_3.1-38BDF8?style=for-the-badge&logo=meta)
![Backend](https://img.shields.io/badge/Backend-Vercel_Express-white?style=for-the-badge&logo=vercel)

## ✨ Premium Features

### 🌌 Next-Gen Glassmorphic UI
- **OLED Dark Theme**: Deep `#020617` backgrounds with cyan neon accents.
- **Skia Animations**: Dynamic, ambient background orbs that respond to the app state.
- **Frosted Overlays**: Premium blur effects on cards and modals for a high-end feel.

### 🤖 AI-Powered Roadmap Generator
- **Intelligent Planning**: Input a project goal, and the Llama 3.1 engine generates a complete set of actionable tasks, descriptions, and priorities.
- **Bulk Creation**: Launch entire projects with 10+ sub-tasks in a single click.
- **AI Polish**: Refine roughly written task descriptions into professional requirements.

### ⏱️ Mission Control Dashboard
- **Live Timers**: Real-time progress tracking down to the second.
- **Bento Grid Layouts**: High-density information display inspired by modern design systems.
- **Role-Based Access**: 
    - **Admin**: System-wide oversight, project creation, and user management.
    - **Leader**: Team productivity monitoring and task assignment.
    - **Member**: Focused task execution and status reporting.

## 🛠️ Technology Stack

- **Frontend**: React Native, Reanimated, Shopify Skia, Redux Toolkit.
- **Backend**: Node.js, Express, MongoDB (Atlas).
- **Cloud**: Firebase Auth, Vercel (Deployment).
- **AI**: Groq Cloud (Llama 3.1 Models).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- React Native Environment (Android/iOS)
- Firebase Project configured

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ArfatChowdhury/TeamReportM.git
   cd TeamReportM
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` in the root (backend) and configure:
   - `MONGO_URI`
   - `FIREBASE_PROJECT_ID`
   - `GROQ_API_KEY`

4. **Run the App**
   ```bash
   # Terminal 1: Start Metro
   npx react-native start

   # Terminal 2: Run on Android
   npx react-native run-android
   ```

## 🔐 Emergency Auth Bypass (Demo Only)
For rapid testing during the demo, the app includes an automatic role-assignment bypass based on email:
- Email contains `admin` → Admin Dashboard
- Email contains `leader` → Leader Dashboard
- Email contains `member` → Member Dashboard

---

Developed with ❤️ by **Arfat Chowdhury**
