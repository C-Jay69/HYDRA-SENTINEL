import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AddChild from "./pages/AddChild";
import Billing from "./pages/Billing";
import AdminPanel from "./pages/AdminPanel";
import MobileSimulator from "./pages/MobileSimulator";
import SmsHistory from "./pages/SmsHistory";
import SocialMediaActivity from "./pages/SocialMediaActivity";
import LiveLocation from "./pages/LiveLocation";
import ScreenTime from "./pages/ScreenTime"; // Import the new component

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
          <Route 
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route 
            path="/dashboard/sms/:childId"
            element={<ProtectedRoute><SmsHistory /></ProtectedRoute>}
          />
          <Route 
            path="/dashboard/social/:childId"
            element={<ProtectedRoute><SocialMediaActivity /></ProtectedRoute>}
          />
          <Route 
            path="/dashboard/location/:childId/live" 
            element={<ProtectedRoute><LiveLocation /></ProtectedRoute>}
          />
           <Route 
            path="/dashboard/screen-time/:childId" // Add new route for screen time
            element={<ProtectedRoute><ScreenTime /></ProtectedRoute>}
          />
          <Route 
            path="/add-child" 
            element={<ProtectedRoute><AddChild /></ProtectedRoute>}
          />
          <Route 
            path="/billing" 
            element={<ProtectedRoute><Billing /></ProtectedRoute>}
          />
          <Route 
            path="/admin" 
            element={<ProtectedRoute><AdminPanel /></ProtectedRoute>}
          />
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
