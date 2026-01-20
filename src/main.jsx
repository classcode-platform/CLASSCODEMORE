import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' 
import './index.css'    

// Sin el signo "!" que da error en JS
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
