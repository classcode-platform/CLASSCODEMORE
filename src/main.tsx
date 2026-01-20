import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // Asegurate que App existe
import './index.css'    // Tu archivo de estilos (Tailwind)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
