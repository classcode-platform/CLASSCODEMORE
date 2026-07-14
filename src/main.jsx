import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; 
import './index.css';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
// REGISTRO DEL SERVICE WORKER (PWA)
if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('CLASSCODE App: Service Worker registrado con éxito');
      })
      .catch((error) => {
        // Esto solo se mostrará si realmente el navegador falla al registrarlo
        console.warn('CLASSCODE App: El navegador no soporta o bloqueó el SW:', error);
      });
  });
}