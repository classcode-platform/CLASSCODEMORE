import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase'; 
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Camera, CheckCircle2, Loader2, AlertCircle, ImageIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GuestUpload() {
  const { eventCode } = useParams();
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [eventData, setEventData] = useState(null);

  const CLOUD_NAME = "dsyfitywd";
  const UPLOAD_PRESET = "CLASSCODE";

  // Efecto para validar el código apenas carga
  useEffect(() => {
    const validateEvent = async () => {
      if (!eventCode) {
        setError("CÓDIGO NO DETECTADO EN URL");
        return;
      }
      try {
        const q = query(collection(db, "events"), where("eventCode", "==", eventCode.toUpperCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setEventData(snap.docs[0].data());
        } else {
          setError("EL EVENTO NO EXISTE O EXPIRÓ.");
        }
      } catch (err) {
        console.error(err);
      }
    };
    validateEvent();
  }, [eventCode]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.secure_url) {
        const q = query(collection(db, "events"), where("eventCode", "==", eventCode.toUpperCase()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const eventDoc = querySnapshot.docs[0];
          const eventRef = doc(db, "events", eventDoc.id); 
          await updateDoc(eventRef, {
            liveGallery: arrayUnion(data.secure_url)
          });
          setDone(true);
        }
      }
    } catch (err) {
      setError("ERROR AL TRANSMITIR EL ARCHIVO.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 font-['Open_Sans'] uppercase antialiased relative overflow-hidden">
      
      {/* Fondo Ambient / Glassmorphism */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-full h-full bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-full h-full bg-indigo-900/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-10 text-center relative z-10"
      >
        <header className="space-y-3">
          <div className="text-[26px] font-['Poppins'] font-normal tracking-[0.05em] text-white">CLASSCODE</div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={12} className="text-purple-500 animate-pulse" />
            <p className="text-purple-400 text-[10px] font-bold tracking-[0.3em]">LIVE EVENT EXPERIENCE</p>
          </div>
        </header>

        <div className="bg-white/[0.02] backdrop-blur-2xl rounded-[3.5rem] p-10 border border-white/10 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] space-y-10 relative">
          
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 p-5 rounded-3xl text-red-400 text-[9px] font-bold tracking-widest flex items-center gap-3 justify-center">
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}

          {done ? (
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="space-y-8 py-10">
              <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="text-[16px] font-normal tracking-[0.2em] text-white">¡RECIBIDO!</p>
                <p className="text-[9px] text-gray-500 tracking-[0.1em]">TU FOTO YA ESTÁ EN PANTALLA</p>
              </div>
              <button 
                onClick={() => setDone(false)} 
                className="px-10 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] text-purple-400 font-bold tracking-[0.3em] transition-all border border-white/5"
              >
                SUBIR OTRA MÁS
              </button>
            </motion.div>
          ) : (
            <>
              <div className="space-y-4 text-center">
                <div className="inline-block px-5 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                   <h2 className="text-[14px] font-normal tracking-[0.3em] text-purple-400">
                    EVENTO: {eventCode ? eventCode.toUpperCase() : "---"}
                   </h2>
                </div>
                <p className="text-[10px] text-gray-400 font-normal tracking-[0.15em] leading-relaxed">
                  CAPTURA O SELECCIONA UNA FOTO <br/> PARA TRANSMITIR AL VIVO.
                </p>
              </div>

              <label className="relative flex flex-col items-center justify-center bg-white/[0.01] border-2 border-dashed border-white/10 rounded-[3rem] py-20 cursor-pointer hover:bg-purple-500/5 hover:border-purple-500/30 transition-all group active:scale-95 shadow-inner">
                {uploading ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <Loader2 size={60} className="text-purple-500 animate-spin" />
                      <div className="absolute inset-0 blur-lg bg-purple-500/20 animate-pulse" />
                    </div>
                    <span className="text-[11px] font-bold tracking-[0.4em] text-purple-400 animate-pulse">ENVIANDO...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-600 transition-all duration-500 shadow-2xl border border-white/5">
                      <Camera size={44} className="text-white group-hover:text-white" />
                    </div>
                    <span className="text-[12px] font-bold tracking-[0.4em] text-gray-400 group-hover:text-white transition-colors">CAPTURAR MOMENTO</span>
                  </>
                )}
                <input type="file" className="hidden" onChange={handleUpload} accept="image/*" disabled={uploading || !!error} />
              </label>
            </>
          )}
        </div>

        <footer className="opacity-20 flex flex-col items-center gap-4">
          <div className="h-[1px] w-12 bg-white/20"></div>
          <p className="text-[8px] font-normal tracking-[0.5em] font-['Poppins']">POWERED BY CLASSCODE®</p>
        </footer>
      </motion.div>
    </div>
  );
}

