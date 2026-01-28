import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveGallery() {
  const { eventCode } = useParams();
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Buscamos el evento por código y escuchamos cambios en tiempo real
    const q = query(collection(db, "events"), where("eventCode", "==", eventCode));
    
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        // Si hay fotos nuevas, las ponemos al principio
        setPhotos(data.liveGallery || []);
      }
    });

    return () => unsub();
  }, [eventCode]);

  // Rotación automática de fotos cada 6 segundos
  useEffect(() => {
    if (photos.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [photos]);

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 tracking-[0.5em] text-[10px] uppercase font-black font-['Poppins']">
            Esperando capturas live: {eventCode}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.img
          key={photos[currentIndex]}
          src={photos[currentIndex]}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: "anticipate" }}
          className="max-w-[90vw] max-h-[85vh] object-contain shadow-[0_0_100px_rgba(168,85,247,0.2)] border border-white/5 rounded-sm"
        />
      </AnimatePresence>

      {/* Footer Técnico de CLASSCODE */}
      <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end opacity-40">
        <div className="text-left">
          <p className="text-white text-[12px] font-black tracking-[0.3em] font-['Poppins']">CLASSCODE LIVE</p>
          <p className="text-purple-500 text-[8px] font-bold tracking-widest mt-1">EVENTO: {eventCode}</p>
        </div>
        <p className="text-white text-[8px] font-bold tracking-[0.5em]">CONTENT REEL • {currentIndex + 1} / {photos.length}</p>
      </div>
    </div>
  );
}