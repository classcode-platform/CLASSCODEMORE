import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const SplashScreen = ({ onFinished }) => {
  // Usamos un 'ref' en lugar de querySelector para mayor seguridad en React
  const videoRef = useRef(null);

  useEffect(() => {
    // Temporizador de seguridad: Si pasan 6 segundos, cerramos el splash pase lo que pase
    const safetyTimer = setTimeout(() => {
      onFinished();
    }, 6000);

    // Lógica robusta de control de video
    const video = videoRef.current;
    if (video) {
      video.play().catch((error) => {
        console.warn("Autoplay bloqueado, saltando splash:", error);
        onFinished();
      });
    }

    return () => clearTimeout(safetyTimer);
  }, [onFinished]);

  return (
    <div 
      onClick={onFinished}
      className="fixed inset-0 bg-[#000000] flex items-center justify-center z-[9999] cursor-pointer overflow-hidden"
    >
      {/* LUCES */}
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

      {/* VIDEO */}
      <div className="relative z-10 w-full max-w-[600px] px-6">
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          playsInline
          preload="metadata" // Cambiado de 'auto' a 'metadata' para evitar bloqueos
          onEnded={onFinished}
          onError={onFinished}
          className="w-full h-auto block"
          // Si el blend mode te da problemas, quítalo. 
          // Si el video tiene fondo negro, se verá bien sin él.
          style={{ mixBlendMode: 'normal' }} 
        >
          <source src="/INT.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default SplashScreen;