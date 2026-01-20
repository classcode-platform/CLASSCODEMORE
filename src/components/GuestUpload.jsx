import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
// Corregido: Subimos un nivel (../) para encontrar firebase desde la carpeta components
import { db } from '../firebase'; 
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Camera, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GuestUpload() {
  const { eventCode } = useParams();
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const CLOUD_NAME = "dsyfitywd";
  const UPLOAD_PRESET = "CLASSCODE";

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
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
        // IMPORTANTE: Asegurate que el ID del documento en Firestore sea el UID del cliente
        // Para pruebas manuales, podés reemplazar esto con el ID que creaste en la captura anterior
        const eventRef = doc(db, "events", "ID_DE_TU_DOCUMENTO"); 
        await updateDoc(eventRef, {
          liveGallery: arrayUnion(data.secure_url)
        });
        setDone(true);
      }
    } catch (error) {
      console.error("Error en la subida:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#282929] text-white flex flex-col items-center justify-center p-6 font-['Open_Sans'] uppercase antialiased">
      <div className="max-w-md w-full space-y-12 text-center">
        <header className="space-y-2">
          <div className="text-[20px] font-['Poppins'] tracking-[0.4em] text-white uppercase">CLASSCODE</div>
          <p className="text-purple-400 text-[9px] font-black tracking-[0.3em] uppercase">LIVE EVENT EXPERIENCE</p>
        </header>

        <div className="bg-[#171717] rounded-[3rem] p-10 border border-white/5 shadow-2xl space-y-10 relative overflow-hidden">
          {done ? (
            <div className="space-y-6 py-10">
              <CheckCircle2 size={60} className="text-green-500 mx-auto" />
              <p className="text-[12px] font-black tracking-widest uppercase">¡CONTENIDO COMPARTIDO!</p>
              <button onClick={() => setDone(false)} className="text-[8px] text-purple-400 font-bold tracking-widest uppercase underline">Subir otra más</button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h2 className="text-[18px] font-bold tracking-tighter uppercase">EVENTO: {eventCode?.replace(/-/g, ' ')}</h2>
                <p className="text-[9px] text-gray-500 font-bold tracking-widest leading-relaxed uppercase">
                  TU CONTENIDO SE MOSTRARÁ EN LA GALERÍA DEL ORGANIZADOR AL INSTANTE.
                </p>
              </div>

              <label className="relative flex flex-col items-center justify-center bg-white/[0.03] border-2 border-dashed border-white/10 rounded-[2rem] py-16 cursor-pointer hover:bg-white/[0.05] transition-all group">
                {uploading ? (
                  <Loader2 size={40} className="text-purple-500 animate-spin" />
                ) : (
                  <>
                    <Camera size={40} className="text-gray-700 group-hover:text-purple-500 transition-colors" />
                    <span className="text-[10px] font-black tracking-[0.3em] mt-4 uppercase">SUBIR ARCHIVO</span>
                  </>
                )}
                <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*" disabled={uploading} />
              </label>
            </>
          )}
        </div>

        <footer className="opacity-30">
          <p className="text-[7px] font-black tracking-[0.4em] uppercase font-['Poppins']">POWERED BY CLASSCODE®</p>
        </footer>
      </div>
    </div>
  );
}

