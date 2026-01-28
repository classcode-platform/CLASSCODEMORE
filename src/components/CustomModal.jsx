import React, { useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';

export default function CustomModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "ACEPTAR", 
  cancelText = "CANCELAR", 
  isConfirm = true,
  type = "warning" 
}) {
  
  // Bloqueo de scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Overlay con desenfoque premium y cierre al hacer click fuera */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Contenedor del Modal */}
      <div className="relative bg-[#1e1e1e] border border-white/10 w-full max-w-sm rounded-[2rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Luces de fondo decorativas (Glow effect) */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/20 blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-600/10 blur-[60px] pointer-events-none" />

        {/* Botón Cerrar X */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-600 hover:text-white transition-colors z-10"
        >
          <X size={18} />
        </button>
        <div className="flex flex-col items-center text-center">
          {/* Icono Success */}
          {type === 'success' && (
            <div className="p-4 rounded-2xl mb-6 bg-green-500/10 text-green-500">
              <CheckCircle size={32} />
            </div>
          )}

          {/* Textos (Sin Italic) */}
          <div className={`${type !== 'success' ? 'mt-4' : ''} space-y-2`}>
            <h3 className="text-[15px] font-black uppercase tracking-[0.3em] text-white">
              {title}
            </h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
              {message}
            </p>
          </div>

          {/* Botones */}
          <div className="flex w-full gap-3 mt-10">
            {isConfirm && (
              <button 
                onClick={onClose}
                className="flex-1 py-4 rounded-xl border border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 hover:bg-white/5 transition-all"
              >
                {cancelText}
              </button>
            )}
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-800 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
