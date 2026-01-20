import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import GuestUpload from './components/GuestUpload';

// --- IMPORTACIONES ---
import Auth from './Auth';             
import Onboarding from './Onboarding'; 
import Home from './Home';             
import Results from './Results';       
import Dashboard from './Dashboard';   
import ProfileP from './ProfileP';     
import ClientProfile from './ClientProfile'; 
import Academy from './Academy';       
import Terms from './Terms';           
import Plans from './Plans';  
import AcademyTest from './AcademyTest'; 
import BusinessChat from './components/BusinessChat';
import PaymentSuccess from './PaymentSuccess'; 

function AppContent() {
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/chat/');

  return (
    <div className="relative min-h-screen">
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* RUTA PROFESIONAL */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* RUTA CLIENTE - ASEGURATE QUE EL DASHBOARD APUNTE A ESTE PATH */}
        <Route path="/client-profile" element={<ClientProfile />} /> 
        
        {/* RUTA ACADEMY */}
        <Route path="/academy" element={<Academy />} />      
        <Route path="/academy-test/:category" element={<AcademyTest />} /> 

        {/* CHAT OVERLAY */}
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
        <Route path="/live/:eventCode" element={<GuestUpload />} />
      </Routes>

      {isChatRoute && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[150] pointer-events-none" />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
