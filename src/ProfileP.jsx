import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { doc, getDoc, collection, serverTimestamp, setDoc, addDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
// 1. IMPORTAMOS TODOS LOS ICONOS JUNTOS AQUÍ
import { ArrowLeft, MapPin, User, Search, X, Heart, Send, Share2, Trophy, Copy, Check, Instagram, Linkedin } from 'lucide-react';

// --- COMPONENTE SHARE MODAL (INTEGRADO AQUÍ) ---
const ShareModal = ({ isOpen, onClose, userProfile }) => {
  const [copied, setCopied] = useState(false);
  const profileUrl = window.location.href; 

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-['Open_Sans']">
      <div className="relative w-full max-w-sm bg-[#252526] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
          <X size={20} />
        </button>
        <div className="p-8 flex flex-col items-center text-center">
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-[#333333] mx-auto mb-4 border-2 border-[#252526] ring-2 ring-white/20 overflow-hidden">
                <img src={userProfile?.photos?.[0] || "/api/placeholder/80/80"} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1 font-['Poppins'] uppercase">{userProfile?.name || 'Usuario'}</h3>
            <p className="text-[10px] tracking-widest text-purple-400 font-bold uppercase">{userProfile?.job || 'PROFESIONAL'}</p>
          </div>
          <div className="bg-white p-2 rounded-xl mb-8">
             <div className="w-32 h-32 bg-gray-100 flex items-center justify-center">
                <span className="text-black text-xs font-mono font-bold">QR CODE</span>
             </div>
          </div>
          <div className="w-full relative mb-6">
            <div className="flex items-center bg-[#1e1e1f] border border-white/10 rounded-xl p-1 pl-4">
              <span className="text-gray-400 text-[10px] truncate flex-1 text-left font-mono">{profileUrl}</span>
              <button onClick={handleCopy} className={`p-2 px-4 rounded-lg text-[10px] font-bold tracking-widest transition-all duration-200 uppercase ${copied ? 'bg-green-500/20 text-green-400' : 'bg-[#333333] text-white hover:bg-[#3e3e3e]'}`}>
                {copied ? <div className="flex gap-2 items-center"><Check size={12}/> COPIADO</div> : <div className="flex gap-2 items-center"><Copy size={12}/> COPIAR</div>}
              </button>
            </div>
          </div>
          <div className="flex gap-6 justify-center">
            <button className="text-gray-400 hover:text-white transition-transform hover:scale-110"><Instagram size={20} /></button>
            <button className="text-gray-400 hover:text-white transition-transform hover:scale-110"><Linkedin size={20} /></button>
            <button className="text-gray-400 hover:text-white transition-transform hover:scale-110"><Share2 size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL PROFILE P ---
export default function ProfileP() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false); // Modal Presupuesto
  const [showShareModal, setShowShareModal] = useState(false); // Modal Compartir
  const [sending, setSending] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentChatId, setCurrentChatId] = useState(null);
  const scrollRef = useRef();

  const [formData, setFormData] = useState({
    tipoEvento: '', fecha: '', duracion: '', direccion: '', localidad: '', detalles: '', email: auth.currentUser?.email || ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "professionals", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUser(docSnap.data());
          setTimeout(() => setIsVisible(true), 100); 
        }
        const currentUser = auth.currentUser;
        if (currentUser) {
          const favRef = doc(db, "users", currentUser.uid, "favorites", id);
          const favSnap = await getDoc(favRef);
          if (favSnap.exists()) setIsFavorite(true);
        }
      } catch (error) { console.error(error); }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!showChat || !currentChatId) return;
    const q = query(collection(db, "chats", currentChatId, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsubscribe();
  }, [showChat, currentChatId]);

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleToggleFavorite = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return alert("Inicia sesión para guardar favoritos.");
    const favRef = doc(db, "users", currentUser.uid, "favorites", id);
    try {
      if (isFavorite) {
        await deleteDoc(favRef);
        setIsFavorite(false);
      } else {
        await setDoc(favRef, { 
          name: user.name, 
          job: user.job, 
          photo: user.photos?.[0] || '', 
          id: id,
          savedAt: serverTimestamp() 
        });
        setIsFavorite(true);
      }
    } catch (error) { console.error("Error en Favoritos:", error); }
  };

  const handleSendMessage = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return navigate('/');
    if (!formData.tipoEvento || !formData.fecha || !formData.direccion || !formData.email) return alert("Completá todos los campos.");
    setSending(true);
    try {
      const chatId = [currentUser.uid, id].sort().join("_");
      setCurrentChatId(chatId);
      const clientSnap = await getDoc(doc(db, "users", currentUser.uid));
      const clientData = clientSnap.data() || {};
      const ficha = `SOLICITUD DE PRESUPUESTO\nEVENTO: ${formData.tipoEvento}\nFECHA: ${formData.fecha}\nDIRECCIÓN: ${formData.direccion}\nEMAIL: ${formData.email}\nINFO: ${formData.detalles}`.toUpperCase();
      await setDoc(doc(db, "chats", chatId), {
        participants: [currentUser.uid, id],
        lastMessage: `PRESUPUESTO: ${formData.tipoEvento}`,
        updatedAt: serverTimestamp(),
        professionalId: id,
        professionalName: user.name,
        professionalPhoto: user.photos?.[0] || '',
        clientId: currentUser.uid,
        clientName: clientData.name || currentUser.displayName || 'CLIENTE',
        clientPhoto: clientData.photoURL || '',
      }, { merge: true });
      await addDoc(collection(db, "chats", chatId, "messages"), { text: ficha, senderId: currentUser.uid, createdAt: serverTimestamp() });
      setShowModal(false);
      setShowChat(true); 
    } catch (error) { console.error(error); }
    setSending(false);
  };

  const sendDirectMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await addDoc(collection(db, "chats", currentChatId, "messages"), { text: newMessage.toUpperCase(), senderId: auth.currentUser.uid, createdAt: serverTimestamp() });
    setNewMessage('');
  };

  if (!user) return <div className="min-h-screen bg-[#282929] flex items-center justify-center text-white text-[10px] tracking-widest uppercase font-['Poppins']">Cargando...</div>;

  return (
    <div className={`min-h-screen bg-[#282929] text-white font-['Open_Sans'] antialiased transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      <nav className="p-10 max-w-7xl mx-auto flex justify-between items-center sticky top-0 z-40 bg-[#282929]/90 backdrop-blur-sm">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white flex items-center gap-2 text-[9px] uppercase tracking-[0.35em] font-['Poppins']"><ArrowLeft size={12}/> VOLVER</button>
        <div className="text-[14px] tracking-[0.35em] uppercase font-['Poppins'] absolute left-1/2 -translate-x-1/2">CLASSCODE</div>
        <button onClick={() => navigate('/home')} className="text-gray-400 p-2"><Search size={18} /></button>
      </nav>

      <main className="max-w-6xl mx-auto px-10 py-10 grid md:grid-cols-12 gap-20 pb-40">
        <div className="md:col-span-4 space-y-12">
          <div className="aspect-square w-full bg-[#1e1e1e] rounded-[2.5rem] overflow-hidden border border-white/5 relative shadow-2xl">
            <img src={user.photos?.[0]} className="w-full h-full object-cover" alt="" />
            <button onClick={handleToggleFavorite} className="absolute top-4 right-4 bg-black/50 p-3 rounded-full border border-white/10 transition-all hover:scale-110 z-10">
              <Heart size={20} className={isFavorite ? 'fill-purple-500 text-purple-500' : 'text-white'}/>
            </button>
          </div>
          <div className="space-y-6">
            <h1 className="text-2xl font-bold uppercase font-['Poppins']">{user.name}</h1>
            <p className="text-purple-400 tracking-[0.35em] uppercase text-[9px] font-bold">{user.job}</p>
            
            <div className="flex items-center gap-3 bg-white/5 w-fit px-4 py-2 rounded-full border border-white/5">
                <Trophy size={14} className="text-yellow-500" />
                <span className="text-[9px] font-bold tracking-widest text-gray-300">NIVEL {Math.floor((user.score || 0) / 100)}</span>
                <span className="text-[9px] font-black tracking-widest text-white">| {user.score || 0} XP</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-500 text-[11px]"><MapPin size={12}/> {user.location}</div>
            <button onClick={() => setShowModal(true)} className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-900 text-white font-bold text-[10px] tracking-widest uppercase mt-4 shadow-lg shadow-purple-900/20">CONTACTAR</button>
          </div>
        </div>

        <div className="md:col-span-8 space-y-24">
          {user.videoLink && (
            <section className="space-y-6">
              <h3 className="text-[9px] text-gray-500 uppercase tracking-widest font-bold border-b border-white/5 pb-2">Material Showreel</h3>
              <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
                <video src={user.videoLink} controls className="w-full h-full object-cover" />
              </div>
            </section>
          )}

          <section className="space-y-12">
            <h3 className="text-[9px] text-gray-500 uppercase tracking-widest font-bold border-b border-white/5 pb-2">Portfolio Visual</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {user.photos?.slice(1, 11).map((url, i) => (
                <div key={i} className="aspect-square rounded-[2rem] overflow-hidden border border-white/5 shadow-lg bg-[#1e1e1e]">
                  <img src={url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt="" />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-10">
            <div className="space-y-6">
              <h3 className="text-[9px] text-gray-500 uppercase tracking-widest font-bold border-b border-white/5 pb-2">Biografía</h3>
              <p className="text-gray-300 leading-relaxed font-light text-base uppercase tracking-widest">{user.bio}</p>
            </div>
            
            <button onClick={handleShare} className="flex items-center gap-3 text-[8px] font-black tracking-[0.3em] text-gray-600 hover:text-white transition-all uppercase pt-4 group">
              <div className="p-2 rounded-full border border-white/5 group-hover:border-purple-500/50 transition-colors">
                <Share2 size={12} />
              </div>
              Compartir Perfil
            </button>
          </section>
        </div>
      </main>

      <aside className={`fixed right-8 bottom-8 h-[500px] bg-[#282929] border border-white/10 rounded-[2.5rem] transition-all duration-500 z-50 flex flex-col shadow-2xl ${showChat ? 'w-[350px] opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
          <span className="text-[9px] font-bold tracking-widest uppercase text-purple-400">Terminal de Chat</span>
          <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-white"><X size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-2xl max-w-[90%] text-[10px] border ${m.senderId === auth.currentUser?.uid ? 'bg-purple-600/10 border-purple-500/20 text-white' : 'bg-black/20 border-white/5 text-gray-400'}`}>
                <pre className="whitespace-pre-wrap font-sans uppercase">{m.text}</pre>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
        <form onSubmit={sendDirectMessage} className="p-4 bg-black/20 border-t border-white/5 flex gap-2">
          <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="ESCRIBIR..." className="flex-1 bg-black/40 border border-white/5 rounded-full py-2 px-4 text-[9px] outline-none text-white uppercase" />
          <button type="submit" className="p-2 bg-purple-600 rounded-full"><Send size={14}/></button>
        </form>
      </aside>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
          <div className="bg-[#282929] w-full max-w-lg p-10 rounded-[3rem] border border-white/10 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={24} /></button>
            <h3 className="text-[12px] uppercase tracking-[0.3em] font-bold text-white mb-8 text-center italic font-['Poppins']">Solicitud de Presupuesto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="TIPO DE EVENTO" className="col-span-2 bg-black/20 border border-white/5 rounded-xl p-4 text-[10px] text-white uppercase outline-none focus:border-purple-500" onChange={e => setFormData({...formData, tipoEvento: e.target.value})} />
              <input type="date" className="bg-black/20 border border-white/5 rounded-xl p-4 text-[10px] text-gray-500 uppercase outline-none focus:border-purple-500 font-sans" onChange={e => setFormData({...formData, fecha: e.target.value})} />
              <input placeholder="DURACIÓN" className="bg-black/20 border border-white/5 rounded-xl p-4 text-[10px] text-white uppercase outline-none" onChange={e => setFormData({...formData, duracion: e.target.value})} />
              <input placeholder="DIRECCIÓN EXACTA" className="col-span-2 bg-black/20 border border-white/5 rounded-xl p-4 text-[10px] text-white uppercase outline-none focus:border-purple-500" onChange={e => setFormData({...formData, direccion: e.target.value})} />
              <textarea placeholder="DETALLES ADICIONALES..." className="col-span-2 bg-black/20 border border-white/5 rounded-xl p-4 text-[10px] text-white uppercase h-24 resize-none outline-none focus:border-purple-500" onChange={e => setFormData({...formData, detalles: e.target.value})} />
            </div>
            <button onClick={handleSendMessage} disabled={sending} className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-800 text-white font-bold text-[10px] tracking-[0.3em] uppercase mt-8 transition-all hover:scale-[1.02]">
              {sending ? 'ENVIANDO...' : 'SOLICITAR PRESUPUESTO'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL INTEGRADO DE COMPARTIR */}
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        userProfile={user} 
      />

    </div>
  );
}