import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' 
import './index.css'    

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// REGISTRO DEL SERVICE WORKER (PWA)
// Esto permite que CLASSCODE se pueda instalar en el celular como una App
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