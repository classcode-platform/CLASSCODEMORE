import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onFinished }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinished();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    /* bg-[#000000] sólido y z-[9999] para bloquear la Landing */
    <div 
      onClick={onFinished}
      className="fixed inset-0 bg-[#000000] flex items-center justify-center z-[9999] cursor-pointer overflow-hidden"
    >
      {/* LUCES: Solo resplandores en las esquinas muy lejos del centro */}
      <div className="hidden md:block absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute -top-[30%] -left-[30%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[180px]" 
        />
        <motion.div 
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5.5, repeat: Infinity }}
          className="absolute -bottom-[30%] -right-[30%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[180px]" 
        />
      </div>

      {/* VIDEO: Centrado y sin transparencias raras */}
      <div className="relative z-10 w-full max-w-[600px] px-6">
        <video 
          autoPlay 
          muted 
          playsInline
          preload="auto"
          onEnded={onFinished}
          onError={onFinished}
          className="w-full h-auto block"
          /* Quitamos el mix-blend-mode si el fondo del video ya es negro, 
             esto evita que se vea lo de abajo */
          style={{ mixBlendMode: 'screen' }} 
        >
          <source src="/INT.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default SplashScreen;