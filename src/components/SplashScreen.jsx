import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onFinished }) => {
  useEffect(() => {
    // Seguro de vida a los 4s (aunque con 49KB cargará en milisegundos)
    const timer = setTimeout(() => {
      onFinished();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div 
      onClick={onFinished}
      className="fixed inset-0 bg-[#000000] flex items-center justify-center z-[9999] cursor-pointer overflow-hidden"
    >
      {/* LUCES DINÁMICAS AMBIENTALES (Solo en Desktop) */}
      <div className="hidden md:block absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }} 
          className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px]" 
        />
        <motion.div 
          animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }} 
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[130px]" 
        />
      </div>

      {/* VIDEO ULTRA LIGHTWEIGHT */}
      <div className="relative z-10 w-full max-w-[600px] px-6">
        <video 
          autoPlay 
          muted 
          playsInline
          preload="auto"
          onEnded={onFinished}
          className="w-full h-auto block"
          style={{ mixBlendMode: 'screen' }}
        >
          <source src="/INT.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default SplashScreen;