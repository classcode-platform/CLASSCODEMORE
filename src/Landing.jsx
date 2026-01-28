import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, GraduationCap, Image as ImageIcon, Download, X, Share, Sparkles, Send, Globe, ShieldCheck, 
  Instagram, Linkedin, MessageCircle 
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [email, setEmail] = useState('');

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
      } catch (error) { setIsSubmitting(false); }
    } else { navigate('/auth'); }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    alert("¡PRÓXIMAMENTE RECIBIRÁS THE SIGNAL!");
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] overflow-x-hidden antialiased relative selection:bg-purple-500/30">
      
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

      {/* LUCES ORBITALES DINÁMICAS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ scale: [1, 1.2, 1], x: [-100, 100, -100], y: [-50, 50, -50], rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
        <motion.div animate={{ scale: [1.1, 1, 1.1], x: [100, -100, 100], y: [50, -50, 50], rotate: [360, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} className="absolute w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
      </div>

      <header className="fixed top-0 left-0 w-full p-6 z-[100] flex justify-start items-center bg-black/20 backdrop-blur-md border-b border-white/5 font-['Poppins'] uppercase">
        <div className="text-[18px] md:text-[20px] font-normal tracking-[0.05em] text-white/90">CLASSCODE</div>
      </header>

      <main className="relative z-10 pt-28 md:pt-36 px-6 max-w-6xl mx-auto text-left leading-none font-normal">
        <section className="flex flex-col lg:flex-row items-center justify-between gap-8 py-4 md:py-8">
          <div className="w-full lg:w-1/2 space-y-6 text-center md:text-left">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="space-y-4">
              <h1 className="text-[2.2rem] md:text-[3.2rem] font-['Poppins'] font-light leading-[1.1] tracking-tight">Potenciá tu talento <br /><span className="text-purple-500 font-normal">o encontralo</span></h1>
              <p className="text-white/60 text-sm md:text-md font-light tracking-wide max-sm leading-relaxed mx-auto md:mx-0 normal-case font-['Open_Sans']">Plataforma integral para tu talento creativo.</p>
            </motion.div>
            <div className="flex flex-row gap-3 pt-2 w-full justify-center md:justify-start items-center">
              <button onClick={() => handleAction('client')} className="px-6 py-4 bg-white/5 border border-white/10 backdrop-blur-md text-white rounded-xl font-black text-[9px] tracking-widest uppercase hover:bg-white/10 transition-all">EXPLORAR</button>
              <button onClick={() => handleAction('professional')} className="px-6 py-4 bg-purple-600/20 border border-purple-500/30 backdrop-blur-md text-white rounded-xl font-black text-[9px] tracking-widest uppercase hover:bg-purple-600/40 transition-all">SOY TALENTO</button>
            </div>
          </div>
          <div className="w-full lg:w-[45%] relative group">
            <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-[#050505] shadow-2xl border border-white/5">
              <AnimatePresence mode="wait">
                {!imageError ? (
                  <motion.img key={currentPhoto} src={eventPhotos[currentPhoto]} onError={() => setImageError(true)} initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="w-full h-full object-cover brightness-90 group-hover:brightness-105 transition-all duration-1000" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon size={32} className="opacity-10" /></div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 pt-10">
          <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} className="bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between group h-[240px]">
            <div className="absolute top-6 right-8 opacity-20 group-hover:opacity-60 transition-all duration-700"><Sparkles size={24} className="text-indigo-400 stroke-[1.5]" /></div>
            <div className="relative z-10 text-left uppercase leading-none">
              <span className="text-[1.5rem] font-['Poppins'] font-light tracking-tight text-indigo-400 block mb-1">Vive</span>
              <h2 className="text-2xl md:text-3xl font-['Poppins'] font-normal tracking-[0.05em] text-white leading-none">LIVE GALLERY</h2>
            </div>
            <button onClick={() => handleAction('client', '/live-gallery')} className="flex items-center gap-4 text-[9px] font-black tracking-[0.4em] text-white hover:text-indigo-400 transition-all group/btn mb-2">EXPLORAR <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" /></button>
          </motion.div>
          <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} className="bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between group h-[240px]">
            <div className="absolute top-6 right-8 opacity-20 group-hover:opacity-60 transition-all duration-700"><GraduationCap size={30} className="text-purple-500 stroke-[1]" /></div>
            <div className="relative z-10 text-left uppercase leading-none">
              <span className="text-[1.5rem] font-['Poppins'] font-light tracking-tight text-purple-500 block mb-1">Descubre</span>
              <div className="flex flex-col items-end w-fit leading-none">
                <h2 className="text-2xl md:text-3xl font-['Poppins'] font-normal tracking-[0.05em] text-white leading-none">CLASSCODE</h2>
                <span className="text-[16px] md:text-[20px] font-['Poppins'] font-light text-white/90 w-full text-right lowercase first-letter:uppercase">Academy</span>
              </div>
            </div>
            <button onClick={() => handleAction('client', '/academy')} className="flex items-center gap-4 text-[9px] font-black tracking-[0.3em] text-white hover:text-purple-500 transition-all group/btn mb-2">INGRESAR <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" /></button>
          </motion.div>
        </div>
      </main>

      <footer className="relative bg-[#0a0a0a] border-t border-white/5 pt-24 pb-12 px-6 overflow-hidden uppercase font-normal">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-purple-600/5 blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24 text-center lg:text-left">
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-6">
                <h2 className="text-[26px] font-['Poppins'] tracking-[0.05em] text-white leading-none font-normal">CLASSCODE<sup className="text-[10px] ml-1 font-bold">®</sup></h2>
                <p className="text-purple-500 text-[9px] font-black tracking-[0.4em] mt-4 leading-none">Talento Argentino</p>
                <p className="text-gray-500 text-[11px] leading-relaxed max-w-sm normal-case font-light mx-auto lg:mx-0">Desarrollamos la arquitectura digital para que la conexión entre talento y mercado sea eficiente, verificada y de alta fidelidad.</p>
              </div>
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between lg:justify-start gap-12 lg:gap-24">
                <div className="flex gap-4">
                  <a href="https://www.instagram.com/classcodevisual/" target="_blank" rel="noreferrer" className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl hover:border-purple-500/50"><Instagram size={20} /></a>
                  <a href="#" className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl hover:border-purple-500/50"><Linkedin size={20} /></a>
                  <a href="#" className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl hover:border-purple-500/50"><MessageCircle size={20} /></a>
                </div>
                <div className="space-y-6">
                  <h4 className="text-white text-[9px] font-black tracking-[0.3em] opacity-40 uppercase leading-none">Soluciones</h4>
                  <nav className="flex flex-col gap-4 text-[10px] font-bold tracking-widest text-gray-500">
                    <button onClick={() => handleAction('client')} className="hover:text-purple-400 transition-all text-center lg:text-left leading-none uppercase">MARKETPLACE</button>
                    <button onClick={() => handleAction('client', '/academy')} className="hover:text-purple-400 transition-all text-center lg:text-left leading-none uppercase">ACADEMY</button>
                  </nav>
                </div>
                <div className="space-y-6">
                  <h4 className="text-white text-[9px] font-black tracking-[0.3em] opacity-40 uppercase leading-none">Legal</h4>
                  <nav className="flex flex-col gap-4 text-[10px] font-bold tracking-widest text-gray-500">
                    <button onClick={() => navigate('/terms')} className="hover:text-purple-400 transition-all text-center lg:text-left leading-none uppercase">TÉRMINOS</button>
                    <button onClick={() => navigate('/privacy')} className="hover:text-purple-400 transition-all text-center lg:text-left leading-none uppercase">PRIVACIDAD</button>
                  </nav>
                </div>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group leading-none">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Send size={80} /></div>
                <h4 className="text-[12px] font-black tracking-[0.4em] text-white mb-4 uppercase">Recibe Novedades</h4>
                <p className="text-gray-500 text-[10px] tracking-widest leading-relaxed mb-8 normal-case font-light">Actualizaciones para el talento argentino.</p>
                <form onSubmit={handleSubscribe} className="space-y-4 font-normal">
                  <input type="email" required placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-[10px] font-bold tracking-widest outline-none focus:border-purple-500/50 transition-all text-white shadow-inner uppercase font-['Poppins']" />
                  <button type="submit" className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-[10px] tracking-[0.3em] transition-all uppercase leading-none shadow-xl">SUSCRIBITE</button>
                </form>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 leading-none uppercase font-normal text-center md:text-left">
            <div className="flex items-center gap-3 text-gray-700 leading-none"><Globe size={14} className="text-purple-500/50" /><p className="text-[9px] font-black tracking-[0.4em] leading-none">© 2026 CLASSCODE • ARGENTINA</p></div>
            <div className="flex items-center gap-3 text-gray-800 leading-none"><ShieldCheck size={14} /><span className="text-[8px] font-bold tracking-[0.2em] leading-none uppercase">Encrypted Infrastructure</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}