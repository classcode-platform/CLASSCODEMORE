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
        className="relative w-full max-w-sm bg-[#070709] border border-white/15 rounded-3xl shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center backdrop-blur-2xl uppercase"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
        <div className="mb-6 text-center">
          <div className="w-20 h-20 rounded-full bg-white/10 p-1 mx-auto mb-3 border border-white/10">
            <div className="w-full h-full rounded-full bg-black overflow-hidden border-2 border-black">
              <img src={userProfile?.photos?.[0]} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
          <h3 className="text-lg font-['Poppins'] font-normal text-white tracking-wider">{userProfile?.name}</h3>
          <p className="text-[9px] tracking-[0.3em] text-gray-400 font-bold uppercase mt-1">{userProfile?.job}</p>
        </div>
        <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
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
        const data = docSnap.data();
        let profileData = data;
        
        if (data.profiles && data.profiles.length > 0) {
          const params = new URLSearchParams(window.location.search);
          const profileIndex = parseInt(params.get('index') || params.get('p')) || 0;
          profileData = data.profiles[profileIndex] || data.profiles[0];
          
          profileData = {
            ...data,
            ...profileData,
            photos: profileData.photos && profileData.photos.length > 0 ? profileData.photos : [profileData.photo1, profileData.photo2].filter(Boolean)
          };
        }
        
        setUser(profileData);
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

  if (!user) return <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white text-[10px] tracking-[0.4em] uppercase font-['Poppins']">Sincronizando...</div>;

  return (
    <div className="min-h-screen bg-[#070709] text-white font-['Open_Sans'] antialiased flex flex-col relative overflow-x-hidden uppercase selection:bg-white selection:text-black">
      
      {/* TOPBAR */}
      <nav className="p-6 md:p-8 w-full sticky top-0 z-50 bg-[#070709]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center w-full font-['Poppins']">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-bold"><ArrowLeft size={14}/> VOLVER</button>
          <div className="text-xl md:text-2xl tracking-[0.05em] uppercase absolute left-1/2 -translate-x-1/2 cursor-pointer font-normal" onClick={() => navigate('/home')}>CLASSCODE</div>
          <button onClick={() => navigate('/home')} className="text-white p-2 hover:bg-white/5 rounded-full transition-all"><Search size={20} /></button>
        </div>
      </nav>

      {/* SHOWREEL / BANNER PRINCIPAL */}
      <div className="w-full h-[180px] md:h-[240px] bg-black relative overflow-hidden border-b border-white/5">
        {user.videoLink ? (
          <video src={user.videoLink} autoPlay loop muted playsInline className="w-full h-full object-cover pointer-events-none opacity-90" />
        ) : (
          <div className="w-full h-full bg-[#070709] flex flex-col items-center justify-center p-6 text-center">
            <Play size={24} className="text-white/20 mb-2" strokeWidth={1}/>
            <span className="text-[8px] tracking-[0.4em] text-gray-600 font-black">SIN SHOWREEL DISPONIBLE</span>
          </div>
        )}
      </div>

      {/* PERFIL HEADER & ACCIONES */}
      <div className="max-w-[1200px] w-full mx-auto px-6 md:px-12 -mt-12 md:-mt-16 relative z-20 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pb-8 border-b border-white/5">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-[#070709] overflow-hidden bg-black shadow-2xl flex-shrink-0">
            <img src={user.photos?.[0]} className="w-full h-full object-cover" alt="" />
          </div>

          <div className="space-y-1.5 pb-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h1 className="text-2xl md:text-3xl font-['Poppins'] font-normal tracking-wide text-white">{user.name}</h1>
              {user.isPro ? (
                <span className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase flex items-center gap-1.5">
                  <ShieldCheck size={12}/> PRO
                </span>
              ) : user.verified ? (
                <span className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase flex items-center gap-1.5">
                  <ShieldCheck size={12}/> NIVELADO
                </span>
              ) : null}
            </div>
            <p className="text-gray-400 text-[10px] tracking-[0.3em] font-bold">{user.job || 'PROFESIONAL'}</p>
            <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] text-gray-500 font-bold tracking-widest pt-1">
              {user.location && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-white"/> {user.location}</span>}
              <span className="flex items-center gap-1.5"><Star size={14} className="text-white fill-white"/> {user.score || 0} PTS</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-center">
          <button onClick={handleToggleFavorite} className="p-4 bg-white/[0.03] hover:bg-white/10 rounded-2xl border border-white/10 transition-all">
            <Heart size={18} className={isFavorite ? 'fill-white text-white' : 'text-white'}/>
          </button>
          <button onClick={() => setShowModal(true)} className="flex-1 md:flex-initial px-8 py-4 rounded-2xl bg-white text-black font-black text-[10px] tracking-[0.3em] hover:bg-gray-200 transition-all shadow-xl">
            CONTACTAR
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL FLUIDO */}
      <main className="max-w-[1200px] mx-auto px-6 md:px-12 py-12 grid lg:grid-cols-12 gap-10 relative z-10 w-full flex-1">
        
        {/* COLUMNA IZQUIERDA: CERTIFICACIONES & COMPARTIR */}
        <div className="lg:col-span-4 space-y-6">
          {user.completedCourses && user.completedCourses.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[9px] text-gray-500 uppercase tracking-[0.4em] font-black pl-2 border-l border-white/40">Certificaciones</h3>
              <div className="space-y-2">
                {user.completedCourses.includes('cert_fotografia_triangulo') && (
                  <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl">
                    <Zap size={14} className="text-white" />
                    <span className="text-[9px] font-black tracking-widest text-white">TECH PRO EXPOSICIÓN</span>
                  </div>
                )}
                {user.completedCourses.includes('cert_generico') && (
                  <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl">
                    <Award size={14} className="text-white" />
                    <span className="text-[9px] font-black tracking-widest text-white">ÉTICA PROFESIONAL</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <button onClick={() => setShowShareModal(true)} className="w-full flex items-center justify-center gap-2 text-[9px] font-black tracking-[0.3em] text-gray-400 hover:text-white transition-all uppercase py-4 bg-white/[0.02] border border-white/5 rounded-2xl">
            <Share2 size={14} /> Compartir Perfil
          </button>
        </div>

        {/* COLUMNA DERECHA: PORTFOLIO LIMPIO */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-[9px] text-gray-500 uppercase tracking-[0.4em] font-black pl-2 border-l border-white/40">Portfolio</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {user.photos?.slice(1, 13).map((url, i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black group relative shadow-lg">
                <img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* CHAT FLOTANTE */}
      <AnimatePresence>
        {showChat && (
          <motion.aside initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className="fixed right-6 bottom-6 w-[360px] max-w-[95vw] h-[520px] bg-[#0c0c0e] border border-white/15 rounded-3xl shadow-2xl z-[60] flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b border-white/10 bg-black/40 flex justify-between items-center">
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white">Canal de Consulta</span>
              <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-white transition-colors"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-2xl max-w-[85%] text-[11px] leading-relaxed tracking-wide ${m.senderId === auth.currentUser?.uid ? 'bg-white text-black font-bold' : 'bg-white/[0.03] text-gray-300 border border-white/10'}`}>
                    <pre className="whitespace-pre-wrap font-sans uppercase">{m.text}</pre>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
            <form onSubmit={sendDirectMessage} className="p-4 bg-black/40 border-t border-white/10 flex gap-2">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="ESCRIBIR..." className="flex-1 bg-black border border-white/10 rounded-full py-3 px-5 text-[10px] text-white uppercase outline-none focus:border-white" />
              <button type="submit" className="p-3 bg-white text-black rounded-full hover:bg-gray-200 transition-all"><Send size={14}/></button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MODAL DE PRESUPUESTO */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0c0e] w-full max-w-lg p-8 md:p-12 rounded-3xl border border-white/15 relative shadow-2xl"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
              <h3 className="text-[11px] uppercase tracking-[0.4em] font-black text-white mb-8 text-center font-['Poppins']">Presupuesto</h3>
              <div className="space-y-4 font-bold">
                <input placeholder="TIPO DE EVENTO" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-white tracking-widest" onChange={e => setFormData({...formData, tipoEvento: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="FECHA" className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-white" onChange={e => setFormData({...formData, fecha: e.target.value})} />
                  <input placeholder="DURACIÓN" className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-white" onChange={e => setFormData({...formData, duracion: e.target.value})} />
                </div>
                <input placeholder="DIRECCIÓN EXACTA" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-white font-black tracking-widest" onChange={e => setFormData({...formData, direccion: e.target.value})} />
                <textarea placeholder="DETALLES ADICIONALES" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase h-28 resize-none outline-none focus:border-white tracking-widest" onChange={e => setFormData({...formData, detalles: e.target.value})} />
              </div>
              <button onClick={handleSendMessage} disabled={sending} className="w-full py-4 rounded-2xl bg-white text-black font-black text-[10px] tracking-[0.4em] uppercase mt-8 hover:bg-gray-200 active:scale-95 transition-all shadow-xl">
                {sending ? 'ENVIANDO...' : 'SOLICITAR PRESUPUESTO'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} userProfile={user} profileId={id} />
      
      <footer className="bg-black py-16 px-6 border-t border-white/5 text-center relative z-10 w-full font-['Poppins']">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="text-white text-2xl font-normal tracking-[0.1em] uppercase mb-3 opacity-30">CLASSCODE</h2>
          <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-gray-600 opacity-30">© 2026 — TODOS LOS DERECHOS RESERVADOS</p>
        </div>
      </footer>
    </div>
  );
}