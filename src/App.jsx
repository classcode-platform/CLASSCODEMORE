import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// --- IMPORTACIONES DE COMPONENTES ---
import SplashScreen from './components/SplashScreen'; 
import Auth from './Auth';             
import Home from './Home';             
import Results from './Results';       
import Dashboard from './Dashboard';   
import ProfileP from './ProfileP';     
import ClientProfile from './ClientProfile'; 
import EventOrganizer from './components/EventOrganizer';
import LiveControlPanel from './components/LiveControlPanel';
import EventDetail from './components/EventDetail';
import Academy from './Academy';       
import Terms from './Terms';           
import Privacy from './Privacy'; 
import Plans from './Plans';  
import AcademyTest from './AcademyTest'; 
import BusinessChat from './components/BusinessChat';
import PaymentSuccess from './PaymentSuccess'; 
import GuestUpload from './components/GuestUpload';
import LiveGallery from './components/LiveGallery'; 
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/chat/');

  return (
    <div className="relative min-h-screen">
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} /> 
        <Route path="/auth" element={<Auth />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} /> 
        <Route path="/results" element={<Results />} />
        <Route path="/profile/:id" element={<ProfileP />} /> 
        
        {/* --- RUTAS GUEST --- */}
        <Route path="/guest-upload/:eventCode" element={<GuestUpload />} />
        <Route path="/live/:eventCode" element={<GuestUpload />} />
        <Route path="/live-gallery/:eventCode" element={<LiveGallery />} />

        {/* --- RUTAS PROTEGIDAS --- */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/client-profile" element={<ProtectedRoute><ClientProfile /></ProtectedRoute>} /> 
        
        {/* --- RUTAS DE ORGANIZADOR --- */}
        <Route path="/organizer" element={<ProtectedRoute><EventOrganizer /></ProtectedRoute>} /> 
        <Route path="/organizer/:eventId" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} /> 
        <Route path="/live-control" element={<ProtectedRoute><LiveControlPanel /></ProtectedRoute>} />

        <Route path="/academy" element={<ProtectedRoute><Academy /></ProtectedRoute>} />      
        <Route path="/academy-test/:category" element={<ProtectedRoute><AcademyTest /></ProtectedRoute>} /> 
        <Route path="/academy-test/Generico" element={<ProtectedRoute><AcademyTest /></ProtectedRoute>} />
        <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
        <Route path="/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        
        <Route path="/chat/:chatId" element={
          <ProtectedRoute>
            <ClientProfile /> 
            <BusinessChat />
          </ProtectedRoute>
        } />

        {/* RUTA DE RESPALDO */}
        <Route path="*" element={<Home />} />
      </Routes>

      {isChatRoute && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[150] pointer-events-none" />
      )}
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Sincronizar el tema globalmente apenas carga la app
  useEffect(() => {
    const savedTheme = localStorage.getItem('classcode_theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, []);

  return (
    <BrowserRouter>
      {showSplash ? (
        <SplashScreen onFinished={() => setShowSplash(false)} />
      ) : (
        <div className="animate-in fade-in duration-1000 min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
          <AppContent />
        </div>
      )}
    </BrowserRouter>
  );
}