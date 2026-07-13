import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' 
import './index.css'
import { AuthProvider } from './context/AuthContext' // 1. Importa el provider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* 2. Envuelve App aquí */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)

// REGISTRO DEL SERVICE WORKER (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('CLASSCODE App: Service Worker registrado con éxito');
      })
      .catch((error) => {
        console.error('CLASSCODE App: Fallo al registrar el SW:', error);
      });
  });
}