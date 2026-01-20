import React, { useState } from 'react';
import { X, Copy, Check, Share2, Instagram, Linkedin } from 'lucide-react';

const ShareModal = ({ isOpen, onClose, userProfile }) => {
  const [copied, setCopied] = useState(false);
  
  // URL actual
  const profileUrl = window.location.href; 

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    // Z-Index alto (70) para que tape todo
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-['Open_Sans']">
      
      {/* Tarjeta con tu color #252526 */}
      <div className="relative w-full max-w-sm bg-[#252526] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Botón Cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
        >
          <X size={20} />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          
          {/* Foto de Perfil */}
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-[#333333] mx-auto mb-4 border-2 border-[#252526] ring-2 ring-white/20 overflow-hidden">
                <img 
                  src={userProfile?.photos?.[0] || "/api/placeholder/80/80"} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
            </div>
            <h3 className="text-xl font-bold text-white mb-1 font-['Poppins'] uppercase">
              {userProfile?.name || 'Usuario'}
            </h3>
            <p className="text-[10px] tracking-widest text-purple-400 font-bold uppercase">
              {userProfile?.job || 'PROFESIONAL'}
            </p>
          </div>

          {/* QR Code Placeholder */}
          <div className="bg-white p-2 rounded-xl mb-8">
             <div className="w-32 h-32 bg-gray-100 flex items-center justify-center">
                <span className="text-black text-xs font-mono font-bold">QR CODE</span>
             </div>
          </div>

          {/* Input de Copiado */}
          <div className="w-full relative mb-6">
            <div className="flex items-center bg-[#1e1e1f] border border-white/10 rounded-xl p-1 pl-4">
              <span className="text-gray-400 text-[10px] truncate flex-1 text-left font-mono">
                {profileUrl}
              </span>
              <button
                onClick={handleCopy}
                className={`p-2 px-4 rounded-lg text-[10px] font-bold tracking-widest transition-all duration-200 uppercase ${
                  copied 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-[#333333] text-white hover:bg-[#3e3e3e]'
                }`}
              >
                {copied ? <div className="flex gap-2 items-center"><Check size={12}/> COPIADO</div> : <div className="flex gap-2 items-center"><Copy size={12}/> COPIAR</div>}
              </button>
            </div>
          </div>

          {/* Redes Sociales */}
          <div className="flex gap-6 justify-center">
            <button className="text-gray-400 hover:text-white transition-transform hover:scale-110">
                <Instagram size={20} />
            </button>
            <button className="text-gray-400 hover:text-white transition-transform hover:scale-110">
                <Linkedin size={20} />
            </button>
            <button className="text-gray-400 hover:text-white transition-transform hover:scale-110">
                <Share2 size={20} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShareModal;