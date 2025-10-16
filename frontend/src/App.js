import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider, useAuth } from "./context/AuthContext";

import AddChild from "./pages/AddChild";
import AdminPanel from "./pages/AdminPanel";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import LiveLocation from "./pages/LiveLocation";
import Login from "./pages/Login";
import MobileSimulator from "./pages/MobileSimulator";
import ScreenTime from "./pages/ScreenTime";
import SmsHistory from "./pages/SmsHistory";
import SocialMediaActivity from "./pages/SocialMediaActivity";
import WebHistory from "./pages/WebHistory"; // Import the new component


// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }
  
  return isAuthenticated ? children : <Navigate to="/" />;
};

function AppContent() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mobile-demo" element={<MobileSimulator />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/sms/:childId" element={<ProtectedRoute><SmsHistory /></ProtectedRoute>} />
          <Route path="/dashboard/social/:childId" element={<ProtectedRoute><SocialMediaActivity /></ProtectedRoute>} />
          <Route path="/dashboard/location/:childId/live" element={<ProtectedRoute><LiveLocation /></ProtectedRoute>} />
          <Route path="/dashboard/screen-time/:childId" element={<ProtectedRoute><ScreenTime /></ProtectedRoute>} />
          <Route path="/dashboard/web-history/:childId" element={<ProtectedRoute><WebHistory /></ProtectedRoute>} /> {/* Add new route for web history */}
          <Route path="/add-child" element={<ProtectedRoute><AddChild /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
