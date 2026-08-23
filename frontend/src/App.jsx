import React, { Suspense, lazy } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Login from './components/Login/Login.jsx';
import NavBar from './components/NavBar/NavBar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// 🚀 Code-split secondary route components with React.lazy
const Home = lazy(() => import('./components/Home/Home.jsx'));
const Rewards = lazy(() => import('./components/Rewards/Rewards.jsx'));
const Signup = lazy(() => import('./components/Signup/Signup.jsx'));
const Profile = lazy(() => import('./components/Profile/Profile.jsx'));
const LiveBattle = lazy(() => import('./components/Battle/LiveBattle.jsx'));
const Leaderboard = lazy(() => import('./components/Leaderboard/Leaderboard.jsx'));
const About = lazy(() => import('./components/About/About.jsx'));
const Developer = lazy(() => import('./components/Developer/Developer.jsx'));
const BattleArena = lazy(() => import('./components/Battle/BattleArena.jsx'));
const Practice = lazy(() => import('./components/Practice/Practice.jsx'));
const PracticeWorkspace = lazy(() => import('./components/Practice/PracticeWorkspace.jsx'));
const Terms = lazy(() => import('./components/Legal/Terms.jsx'));
const Privacy = lazy(() => import('./components/Legal/Privacy.jsx'));
const Cookies = lazy(() => import('./components/Legal/Cookies.jsx'));
const RoomLobby = lazy(() => import("./components/Battle/RoomLobby.jsx"));
const ControlHub = lazy(() => import('./components/Admin/ControlHub.jsx'));
// Fast, non-blocking loading placeholder
function PageLoader() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#00e5ff',
      fontSize: '0.9rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase'
    }}>
      Loading...
    </div>
  );
}

// 📌 Auth layout (no NavBar)
function AuthLayout() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}

// 📌 Main layout (with NavBar)
function MainLayout() {
  return (
    <>
      <NavBar />
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </>
  );
}

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ================= Auth Routes ================= */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* ================= Main App Routes ================= */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><ControlHub /></ProtectedRoute>} />

          {/* ✅ Battle Routes */}
          <Route path="/battle" element={<ProtectedRoute><BattleArena /></ProtectedRoute>} />
          <Route path="/battle/players" element={<ProtectedRoute><BattleArena defaultTab="players" /></ProtectedRoute>} />
          <Route path="/battle/live" element={<ProtectedRoute><LiveBattle /></ProtectedRoute>} />
          <Route path="/battle/room/:roomCode" element={<ProtectedRoute><RoomLobby /></ProtectedRoute>} />
          <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
          <Route path="/practice/:problemId" element={<ProtectedRoute><PracticeWorkspace /></ProtectedRoute>} />

          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/developer" element={<ProtectedRoute><Developer /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
          <Route path="/terms" element={<ProtectedRoute><Terms /></ProtectedRoute>} />
          <Route path="/privacy" element={<ProtectedRoute><Privacy /></ProtectedRoute>} />
          <Route path="/cookies" element={<ProtectedRoute><Cookies /></ProtectedRoute>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;
