import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { doc, collection, serverTimestamp, setDoc, addDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Search, X, Heart, Send, Share2, Star, ShieldCheck, Zap, Award, Play } from 'lucide-react';

// --- SHARE MODAL ---
const ShareModal = ({ isOpen, onClose, userProfile, profileId }) => {
  const [copied, setCopied] = useState(false);
  const profileUrl = `https://www.classcode.com.ar/profile/${profileId}`; 
  
  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center backdrop-blur-2xl uppercase"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        <div className="mb-8 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-1 mx-auto mb-4">
            <div className="w-full h-full rounded-full bg-black overflow-hidden border-2 border-black">
              <img src={userProfile?.photos?.[0]} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
          <h3 className="text-xl font-['Poppins'] font-normal text-white tracking-wider">{userProfile?.name}</h3>
          <p className="text-[9px] tracking-[0.3em] text-purple-400 font-bold uppercase mt-1">{userProfile?.job}</p>
        </div>
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 mb-8">
          <span className="text-[10px] text-gray-400 truncate flex-1 font-mono">{profileUrl}</span>
          <button onClick={handleCopy} className="p-2 px-4 rounded-xl bg-white text-black text-[9px] font-black tracking-widest">{copied ? 'OK' : 'COPY'}</button>
        </div>
      </motion.div>
    </div>
  );
};

export default function ProfileP() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentChatId, setCurrentChatId] = useState(null);
  const scrollRef = useRef();
  
  const [formData, setFormData] = useState({ 
    tipoEvento: '', fecha: '', duracion: '', direccion: '', detalles: ''
  });

  useEffect(() => {
    const docRef = doc(db, "professionals", id);
    const unsubscribeUser = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setUser(docSnap.data());
      }
    });

    let unsubscribeFav = () => {};
    if (auth.currentUser) {
      const favRef = doc(db, "users", auth.currentUser.uid, "favorites", id);
      unsubscribeFav = onSnapshot(favRef, (favSnap) => {
        setIsFavorite(favSnap.exists());
      });
    }

    return () => {
      unsubscribeUser();
      unsubscribeFav();
    };
  }, [id]);

  useEffect(() => {
    if (!showChat || !currentChatId) return;
    const q = query(collection(db, "chats", currentChatId, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  }, [showChat, currentChatId]);

  const handleToggleFavorite = async () => {
    if (!auth.currentUser) return alert("Inicia sesión.");
    const favRef = doc(db, "users", auth.currentUser.uid, "favorites", id);
    try {
      if (isFavorite) { 
        await deleteDoc(favRef); 
      } else { 
        await setDoc(favRef, { 
          name: user.name, 
          job: user.job, 
          photo: user.photos?.[0], 
          id, 
          savedAt: serverTimestamp() 
        }); 
      }
    } catch (e) { console.error(e); }
  };

  const handleSendMessage = async () => {
    const userAuth = auth.currentUser;
    if (!userAuth) return navigate('/');
    if (!formData.tipoEvento || !formData.fecha || !formData.direccion || !formData.duracion) {
      return alert("POR FAVOR, COMPLETÁ TODOS LOS CAMPOS OBLIGATORIOS.");
    }

    setSending(true);
    try {
      const chatId = [userAuth.uid, id].sort().join("_");
      setCurrentChatId(chatId);
      const ficha = `SOLICITUD DE PRESUPUESTO\n--------------------------\nEVENTO: ${formData.tipoEvento}\nFECHA: ${formData.fecha}\nUBICACIÓN: ${formData.direccion}\nDURACIÓN: ${formData.duracion}\nINFO: ${formData.detalles || 'SIN DETALLES'}`.toUpperCase();
      await setDoc(doc(db, "chats", chatId), {
        participants: [userAuth.uid, id],
        lastMessage: `PRESUPUESTO: ${formData.tipoEvento}`,
        updatedAt: serverTimestamp(),
        professionalId: id, professionalName: user.name, professionalPhoto: user.photos?.[0],
        clientId: userAuth.uid, clientName: userAuth.displayName || 'CLIENTE'
      }, { merge: true });
      await addDoc(collection(db, "chats", chatId, "messages"), { text: ficha, senderId: userAuth.uid, createdAt: serverTimestamp() });
      setShowModal(false); 
      setShowChat(true); 
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const sendDirectMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await addDoc(collection(db, "chats", currentChatId, "messages"), { text: newMessage.toUpperCase(), senderId: auth.currentUser.uid, createdAt: serverTimestamp() });
    setNewMessage('');
  };

  if (!user) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-[10px] tracking-[0.4em] uppercase font-['Poppins']">Sincronizando...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] antialiased flex flex-col relative overflow-x-hidden uppercase">
      
      {/* FONDO AMBIENTAL */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [-50, 50], y: [-30, 30] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[180px]" />
      </div>

      {/* TOPBAR */}
      <nav className="p-6 md:p-10 w-full sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center w-full font-['Poppins']">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-bold"><ArrowLeft size={14}/> VOLVER</button>
          <div className="text-xl md:text-2xl tracking-[0.05em] uppercase absolute left-1/2 -translate-x-1/2 cursor-pointer font-normal" onClick={() => navigate('/home')}>CLASSCODE</div>
          <button onClick={() => navigate('/home')} className="text-purple-400 p-2 hover:bg-white/5 rounded-full transition-all"><Search size={20} /></button>
        </div>
      </nav>

      {/* SECCIÓN ESTILO FACEBOOK: BANNER / SHOWREEL SUPERIOR */}
      <div className="w-full bg-[#121216] border-b border-white/10 shadow-2xl relative">
        <div className="max-w-[1200px] mx-auto">
          {/* Banner / Showreel Container */}
          <div className="w-full h-[280px] md:h-[420px] bg-black relative overflow-hidden group">
            {user.videoLink ? (
              <video src={user.videoLink} controls className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-950/30 via-black to-indigo-950/30 flex flex-col items-center justify-center p-6 text-center">
                <Play size={40} className="text-white/20 mb-3" strokeWidth={1}/>
                <span className="text-[9px] tracking-[0.4em] text-gray-500 font-black">SIN SHOWREEL DISPONIBLE</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-transparent to-black/30 pointer-events-none" />
          </div>

          {/* Perfil Header superpuesto / alineado al banner */}
          <div className="px-6 md:px-12 pb-8 relative -mt-16 md:-mt-24 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 z-20">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
              <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-[#121216] overflow-hidden bg-black shadow-2xl flex-shrink-0">
                <img src={user.photos?.[0]} className="w-full h-full object-cover" alt="" />
              </div>

              <div className="space-y-2 pb-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h1 className="text-2xl md:text-4xl font-['Poppins'] font-light tracking-tight text-white">{user.name}</h1>
                  {user.isPro ? (
                    <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      <ShieldCheck size={12} className="fill-amber-500/20"/> PRO
                    </span>
                  ) : user.verified ? (
                    <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                      <ShieldCheck size={12} className="fill-purple-500/20"/> NIVELADO
                    </span>
                  ) : null}
                </div>
                <p className="text-purple-400 text-[10px] md:text-xs tracking-[0.4em] font-black">{user.job || 'PROFESIONAL'}</p>
                <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] text-gray-400 font-bold tracking-widest pt-1">
                  {user.location && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-purple-500"/> {user.location}</span>}
                  <span className="flex items-center gap-1.5"><Star size={14} className="text-amber-400 fill-amber-400"/> {user.score || 0} PTS</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-center pb-2">
              <button onClick={handleToggleFavorite} className="p-4 bg-white/[0.05] hover:bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 transition-all">
                <Heart size={20} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}/>
              </button>
              <button onClick={() => setShowModal(true)} className="flex-1 md:flex-initial px-8 py-4 rounded-2xl bg-white text-black font-black text-[10px] tracking-[0.3em] hover:bg-gray-200 transition-all shadow-xl">
                CONTACTAR
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-[1200px] mx-auto px-6 md:px-12 py-12 grid lg:grid-cols-12 gap-10 relative z-10 w-full">
        
        {/* COLUMNA IZQUIERDA: CERTIFICACIONES Y BIO */}
        <div className="lg:col-span-4 space-y-8">
          {user.completedCourses && user.completedCourses.length > 0 && (
            <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
              <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.4em] font-black border-l-2 border-purple-500 pl-4">Certificaciones Classcode®</h3>
              <div className="space-y-3">
                {user.completedCourses.includes('cert_fotografia_triangulo') && (
                  <div className="flex items-center gap-3 bg-purple-500/5 border border-purple-500/20 px-4 py-3 rounded-2xl">
                    <Zap size={14} className="text-purple-400 fill-purple-400/20" />
                    <span className="text-[9px] font-black tracking-widest text-white">TECH PRO EXPOSICIÓN</span>
                  </div>
                )}
                {user.completedCourses.includes('cert_generico') && (
                  <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/20 px-4 py-3 rounded-2xl">
                    <Award size={14} className="text-blue-400" />
                    <span className="text-[9px] font-black tracking-widest text-white">ÉTICA</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 shadow-xl">
             <button onClick={() => setShowShareModal(true)} className="w-full group flex items-center justify-center gap-3 text-[9px] font-black tracking-[0.3em] text-gray-400 hover:text-white transition-all uppercase py-2">
                <Share2 size={16} /> Compartir Perfil Profesional
             </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: PORTFOLIO */}
        <div className="lg:col-span-8 space-y-12">
          <section className="bg-[#121216] border border-white/10 rounded-3xl p-6 md:p-8 space-y-8 shadow-xl">
            <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.4em] font-black border-l-2 border-purple-500 pl-4">Portfolio</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {user.photos?.slice(1, 13).map((url, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02] backdrop-blur-sm group relative shadow-xl">
                  <img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* CHAT FLOTANTE */}
      <AnimatePresence>
        {showChat && (
          <motion.aside initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className="fixed right-6 bottom-6 w-[360px] max-w-[95vw] h-[550px] bg-[#0d0d0d] border border-white/10 rounded-[3rem] shadow-2xl z-[60] flex flex-col overflow-hidden backdrop-blur-3xl"
          >
            <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-purple-400">Canal de Consulta</span>
              <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-[1.5rem] max-w-[85%] text-[11px] leading-relaxed tracking-wide ${m.senderId === auth.currentUser?.uid ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 border border-white/5'}`}>
                    <pre className="whitespace-pre-wrap font-sans uppercase">{m.text}</pre>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
            <form onSubmit={sendDirectMessage} className="p-5 bg-white/5 border-t border-white/5 flex gap-3">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="ESCRIBIR..." className="flex-1 bg-black border border-white/10 rounded-full py-4 px-6 text-[10px] text-white uppercase outline-none focus:border-purple-500/50" />
              <button type="submit" className="p-4 bg-purple-600 text-white rounded-full hover:bg-purple-500 shadow-xl shadow-purple-900/20"><Send size={16}/></button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MODAL DE PRESUPUESTO */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] w-full max-w-lg p-10 md:p-14 rounded-[4rem] border border-white/10 relative backdrop-blur-3xl"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
              <h3 className="text-[11px] uppercase tracking-[0.5em] font-black text-white mb-10 text-center font-['Poppins']">Presupuesto</h3>
              <div className="space-y-4 font-bold">
                <input placeholder="TIPO DE EVENTO" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-purple-500 tracking-widest" onChange={e => setFormData({...formData, tipoEvento: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="FECHA / FECHAS" className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-purple-500" onChange={e => setFormData({...formData, fecha: e.target.value})} />
                  <input placeholder="DURACIÓN ESTIMADA" className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-purple-500" onChange={e => setFormData({...formData, duracion: e.target.value})} />
                </div>
                <input placeholder="DIRECCIÓN EXACTA DEL EVENTO" className="w-full bg-white/[0.03] border border-purple-500/30 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-purple-500 font-black tracking-widest" onChange={e => setFormData({...formData, direccion: e.target.value})} />
                <textarea placeholder="DETALLES ADICIONALES (EQUIPO, REQUERIMIENTOS...)" className="w-full bg-white/[0.03] border border-white/10 rounded-3xl p-5 text-[10px] text-white uppercase h-32 resize-none outline-none focus:border-purple-500 tracking-widest" onChange={e => setFormData({...formData, detalles: e.target.value})} />
              </div>
              <button onClick={handleSendMessage} disabled={sending} className="w-full py-5 rounded-3xl bg-white text-black font-black text-[10px] tracking-[0.4em] uppercase mt-10 hover:bg-gray-200 active:scale-95 transition-all shadow-2xl">
                {sending ? 'ENVIANDO...' : 'SOLICITAR PRESUPUESTO'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} userProfile={user} profileId={id} />
      
      <footer className="bg-black py-20 px-6 border-t border-white/5 text-center relative z-10 w-full font-['Poppins']">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="text-white text-3xl font-normal tracking-[0.1em] uppercase mb-4 opacity-30">CLASSCODE</h2>
          <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-gray-600 opacity-30">© 2026 — TODOS LOS DERECHOS RESERVADOS</p>
        </div>
      </footer>
    </div>
  );
}