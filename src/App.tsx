import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import FloatingAddButton from './components/FloatingAddButton';
import NotificationBell from './components/NotificationBell';
import ThemeToggle from './components/ThemeToggle';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Timeline from './pages/Timeline';
import AddMemory from './pages/AddMemory';
import Gallery from './pages/Gallery';
import CalendarPage from './pages/CalendarPage';
import OurStory from './pages/OurStory';
import SpecialMemories from './pages/SpecialMemories';
import Profile from './pages/Profile';
import Search from './pages/Search';

function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <>{children}</>;

  return (
    <div className="md:flex min-h-screen">
      <Navigation />
      <div className="flex-1 relative">
        <div className="hidden md:flex justify-end items-center gap-2 px-8 pt-6">
          <ThemeToggle />
          <NotificationBell />
        </div>
        {children}
        <FloatingAddButton />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppShell>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
              <Route path="/add" element={<ProtectedRoute><AddMemory /></ProtectedRoute>} />
              <Route path="/edit/:memoryId" element={<ProtectedRoute><AddMemory /></ProtectedRoute>} />
              <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
              <Route path="/story" element={<ProtectedRoute><OurStory /></ProtectedRoute>} />
              <Route path="/special" element={<ProtectedRoute><SpecialMemories /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Routes>
          </AppShell>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
