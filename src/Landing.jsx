import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, GraduationCap, Image as ImageIcon, Download, X, Share, Sparkles, Layout, Zap
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [imageError, setImageError] = useState(false);

  // --- LÓGICA PWA ---
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIphone = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIphone);
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  const eventPhotos = [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&auto=format&fit=crop"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setImageError(false);
      setCurrentPhoto((prev) => (prev + 1) % eventPhotos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [eventPhotos.length]);

  const handleAction = async (role, targetPath = null) => {
    const user = auth.currentUser;
    const pendingRole = role || 'client';
    localStorage.setItem('pendingRole', pendingRole);

    if (user) {
      setIsSubmitting(true);
      try {
        await setDoc(doc(db, "users", user.uid), { 
          role: pendingRole, 
          email: user.email,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        navigate(targetPath || (pendingRole === 'professional' ? '/dashboard' : '/home'));
      } catch (error) {
        setIsSubmitting(false);
      }
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] overflow-x-hidden antialiased relative">
      
      {/* PWA BANNER */}
      <AnimatePresence>
        {(showInstallBtn || (isIOS && !window.navigator.standalone)) && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-8 left-0 right-0 z-[150] px-6">
            <div className="max-w-md mx-auto bg-black/60 backdrop-blur-3xl border border-white/10 p-5 rounded-[2.5rem] shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center text-purple-400"><Download size={20} /></div>
                <div className="text-left font-['Poppins'] uppercase">
                  <p className="text-[10px] font-black tracking-[0.2em] leading-none">CLASSCODE APP</p>
                  <p className="text-[8px] text-gray-400 font-bold tracking-widest mt-1">Instalar en tu pantalla</p>
                </div>
              </div>
              {isIOS ? (
                <div className="flex items-center gap-2 text-[8px] font-black text-purple-400 uppercase tracking-widest">
                  <span>TOCA</span> <Share size={14} /> <span>Y LUEGO "A INICIO"</span>
                </div>
              ) : (
                <button onClick={handleInstallClick} className="bg-white text-black px-6 py-3 rounded-xl text-[9px] font-black tracking-widest hover:bg-purple-500 hover:text-white transition-all uppercase">INSTALAR</button>
              )}
              <button onClick={() => {setShowInstallBtn(false); setIsIOS(false);}} className="ml-4 text-gray-600"><X size={18}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LUCES DINÁMICAS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-purple-600/15 rounded-full blur-[100px] md:blur-[150px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-indigo-600/15 rounded-full blur-[90px] md:blur-[130px]" />
      </div>

      <header className="fixed top-0 left-0 w-full p-6 md:p-8 z-[100] flex justify-start items-center bg-transparent backdrop-blur-md border-b border-white/5">
        <div className="text-[18px] md:text-[22px] font-['Poppins'] font-normal tracking-[0.05em] uppercase text-white/90">CLASSCODE</div>
      </header>

      <main className="relative z-10 pt-32 md:pt-40 px-6 max-w-7xl mx-auto text-left">
        <section className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 py-8 md:py-16">
          <div className="w-full lg:w-1/2 space-y-10 flex flex-col items-center md:items-start text-center md:text-left">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <h1 className="text-[2.2rem] md:text-[3rem] lg:text-[3.6rem] font-['Poppins'] font-light leading-[1.1] tracking-tight">Potenciá tu talento <br /><span className="text-purple-500 font-normal">o encontralo</span></h1>
              <p className="text-white/60 text-sm md:text-lg font-light tracking-wide max-w-md leading-relaxed mx-auto md:mx-0">Plataforma integral para tu talento creativo.</p>
            </motion.div>
            <div className="flex flex-row gap-4 pt-4 w-full justify-center md:justify-start items-center">
              <button onClick={() => handleAction('client')} className="px-6 md:px-10 py-5 bg-white/5 border border-white/10 backdrop-blur-md text-white rounded-2xl font-black text-[10px] md:text-[11px] tracking-widest uppercase hover:bg-white/10 transition-all whitespace-nowrap">EXPLORAR TALENTOS</button>
              <button onClick={() => handleAction('professional')} className="px-6 md:px-10 py-5 bg-purple-600/20 border border-purple-500/30 backdrop-blur-md text-white rounded-2xl font-black text-[10px] md:text-[11px] tracking-widest uppercase hover:bg-purple-600/40 transition-all flex items-center gap-2 whitespace-nowrap uppercase">SOY TALENTO <ArrowRight size={14} className="hidden sm:block" /></button>
            </div>
          </div>
          <div className="w-full lg:w-1/2 relative group">
            <div className="relative aspect-video rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden bg-[#050505] shadow-[0_0_80px_rgba(0,0,0,0.9)] border-none">
              <AnimatePresence mode="wait">
                {!imageError ? (
                  <motion.img key={currentPhoto} src={eventPhotos[currentPhoto]} onError={() => setImageError(true)} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 0.85, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="w-full h-full object-cover brightness-90 group-hover:brightness-105 transition-all duration-1000" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon size={32} className="opacity-10" /></div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* --- SECCIÓN DUAL: LIVE Y ACADEMY (SIMÉTRICOS Y CENTRADOS) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-32 pt-8">
          
          {/* LIVE GALLERY PAD */}
          <motion.div 
            whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }}
            className="bg-white/[0.02] backdrop-blur-3xl rounded-[3.5rem] p-10 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between group h-[280px] w-full"
          >
            <div className="absolute top-8 right-12 opacity-20 group-hover:opacity-60 transition-all duration-700">
              <Sparkles size={28} className="text-indigo-400 stroke-[1.5]" />
            </div>
            
            <div className="relative z-10 text-left pt-2">
              <span className="text-[1.8rem] md:text-[2.2rem] font-['Poppins'] font-light tracking-tight text-indigo-400 leading-none mb-1 block">Vive</span>
              <h2 className="text-3xl md:text-5xl font-['Poppins'] font-normal tracking-[0.05em] uppercase text-white leading-none">LIVE GALLERY</h2>
              <p className="mt-4 text-white/40 text-[9px] uppercase tracking-[0.3em] leading-relaxed font-bold max-w-xs">Experiencias en tiempo real.</p>
            </div>
            
            <button onClick={() => handleAction('client', '/live-gallery')} className="flex items-center gap-5 text-[10px] font-black tracking-[0.4em] uppercase text-white hover:text-indigo-400 transition-all group/btn mb-2">
              EXPLORAR <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
            </button>
          </motion.div>

          {/* ACADEMY PAD (LOGO ORIGINAL SIMÉTRICO) */}
          <motion.div 
            whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }}
            className="bg-white/[0.02] backdrop-blur-3xl rounded-[3.5rem] p-10 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between group h-[280px] w-full"
          >
            <div className="absolute top-8 right-12 opacity-20 group-hover:opacity-60 transition-all duration-700">
              <GraduationCap size={46} className="text-purple-500 md:w-[48px] md:h-[48px] stroke-[1]" />
            </div>

            <div className="relative z-10 text-left pt-2">
              <span className="text-[1.8rem] md:text-[2.2rem] font-['Poppins'] font-light tracking-tight text-purple-500 leading-none mb-1 block">Descubre</span>
              <div className="flex flex-col items-start">
                <div className="flex flex-col items-end w-fit cursor-default">
                  <h2 className="text-3xl md:text-5xl font-['Poppins'] font-normal tracking-[0.05em] uppercase text-white leading-none">
                    CLASSCODE
                  </h2>
                  <div className="w-full flex justify-end">
                    <span className="text-[18px] md:text-[28px] font-['Poppins'] font-light tracking-[0.05em] text-white/90 -mt-1.5 w-[50%] text-center">
                      Academy
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => handleAction('client', '/academy')} className="flex items-center gap-5 text-[10px] font-black tracking-[0.4em] uppercase text-white hover:text-purple-500 transition-all group/btn mb-2">
              INGRESAR <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
            </button>
          </motion.div>

        </div>
      </main>

      <footer className="p-12 text-center opacity-20 border-t border-white/5">
        <p className="text-[10px] tracking-[0.6em] font-['Poppins'] uppercase text-white/50">CLASSCODE © 2026</p>
      </footer>
    </div>
  );
}