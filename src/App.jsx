import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// --- IMPORTACIONES DE COMPONENTES ---
import SplashScreen from './components/SplashScreen'; 
import Landing from './Landing';       
import Auth from './Auth';             
import Home from './Home';             
import Results from './Results';       
import Dashboard from './Dashboard';   
import ProfileP from './ProfileP';     
import ClientProfile from './ClientProfile'; 
import Academy from './Academy';       
import Terms from './Terms';           
import Privacy from './Privacy'; 
import Plans from './Plans';  
import AcademyTest from './AcademyTest'; 
import BusinessChat from './components/BusinessChat';
import PaymentSuccess from './PaymentSuccess'; 
import GuestUpload from './components/GuestUpload';
import LiveGallery from './components/LiveGallery'; 

function AppContent() {
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/chat/');

  return (
    <div className="relative min-h-screen">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        
        {/* RUTAS LEGALES */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} /> 

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/client-profile" element={<ClientProfile />} /> 
        <Route path="/academy" element={<Academy />} />      
        <Route path="/academy-test/:category" element={<AcademyTest />} /> 
        <Route path="/academy-test/Generico" element={<AcademyTest />} />
        
        <Route path="/chat/:chatId" element={
          <>
            <ClientProfile /> 
            <BusinessChat />
          </>
        } />

        <Route path="/results" element={<Results />} />
        <Route path="/profile/:id" element={<ProfileP />} /> 
        <Route path="/plans" element={<Plans />} />
        <Route path="/success" element={<PaymentSuccess />} />

        {/* --- CORRECCIÓN CRÍTICA AQUÍ --- */}
        {/* Cambié /live por /guest-upload para que coincida con el link del perfil */}
        <Route path="/guest-upload/:eventCode" element={<GuestUpload />} />
        {/* Mantengo /live por si acaso tenías códigos QR viejos impresos, ambos llevarán al mismo lugar */}
        <Route path="/live/:eventCode" element={<GuestUpload />} />
        
        <Route path="/live-gallery/:eventCode" element={<LiveGallery />} />

        {/* RUTA DE RESPALDO (404) para evitar pantallas negras */}
        <Route path="*" element={<Landing />} />
      </Routes>

      {isChatRoute && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[150] pointer-events-none" />
      )}
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <BrowserRouter>
      {showSplash ? (
        <SplashScreen onFinished={() => setShowSplash(false)} />
      ) : (
        // Añadí h-full y bg-black para evitar destellos blancos entre transiciones
        <div className="animate-in fade-in duration-1000 min-h-screen bg-[#0a0a0a]">
          <AppContent />
        </div>
      )}
    </BrowserRouter>
  );
}