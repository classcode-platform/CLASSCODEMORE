import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; 
import { doc, setDoc, collection, query, where, onSnapshot, updateDoc, arrayRemove, deleteDoc, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  X, Search, LogOut, Bell, RefreshCcw, User, Heart, Menu,
  MessageSquare, ArrowRight, QrCode, Calendar, MapPin, LayoutDashboard,
  Upload, ImageIcon, GraduationCap, Trash2, Plus, Eye, Copy, Monitor, Edit3, Share2, Power, Link as LinkIcon, Camera, Pause, Play, Check
} from 'lucide-react'; 
import CustomModal from './components/CustomModal'; 
import { motion, AnimatePresence } from 'framer-motion';

// --- SHARE MODAL INTEGRADO ---
const ShareModal = ({ isOpen, onClose, userProfile }) => {
  const [copied, setCopied] = useState(false);
  const profileUrl = "https://www.classcode.com.ar"; 

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-['Open_Sans']">
      <div className="relative w-full max-w-sm bg-[#252526] border border-white/10 rounded-2xl shadow-2xl overflow-hidden uppercase">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
          <X size={20} />
        </button>
        <div className="p-8 flex flex-col items-center text-center uppercase">
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-[#333333] mx-auto mb-4 border-2 border-[#252526] ring-2 ring-purple-500/20 overflow-hidden shadow-xl">
                <img src={userProfile?.photoURL || "/api/placeholder/80/80"} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-[14px] font-bold text-white mb-1 font-['Poppins'] tracking-widest uppercase">
              {userProfile?.name || 'ORGANIZADOR'}
            </h3>
            <p className="text-[8px] tracking-[0.3em] text-purple-400 font-black">LIVE CONTROL ACTIVE</p>
          </div>
          <div className="bg-white p-2 rounded-xl mb-8 shadow-inner">
             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${profileUrl}`} alt="QR" className="w-32 h-32" />
          </div>
          <div className="w-full relative mb-6">
            <div className="flex items-center bg-[#1e1e1f] border border-white/10 rounded-xl p-1 pl-4">
              <span className="text-gray-400 text-[9px] truncate flex-1 text-left font-mono lowercase">{profileUrl}</span>
              <button onClick={handleCopy} className={`p-2 px-4 rounded-lg text-[9px] font-black tracking-widest transition-all duration-200 ${copied ? 'bg-green-500/20 text-green-400' : 'bg-[#333333] text-white'}`}>
                {copied ? <Check size={12}/> : <Copy size={12}/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ClientProfile() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingEventName, setIsEditingEventName] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [profile, setProfile] = useState({ name: '', location: '', interests: '', photoURL: '' });
  const [previewImage, setPreviewImage] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });

  const CLOUD_NAME = "dsyfitywd";
  const UPLOAD_PRESET = "CLASSCODE";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile(prev => ({ ...prev, ...data }));
            setFavorites(data.favorites || []);
          }
          setLoading(false);
        });
        onSnapshot(query(collection(db, "events"), where("clientId", "==", user.uid)), (snap) => {
          const fetchedEvents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setEvents(fetchedEvents);
          if (fetchedEvents.length > 0) setNewEventName(fetchedEvents[0].eventName);
        });
        onSnapshot(query(collection(db, "chats"), where("participants", "array-contains", user.uid)), (snap) => {
          setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
      } else { navigate('/'); }
    });
    return () => unsubscribe();
  }, [navigate]);

  // FUNCIONES DE COPIADO CORREGIDAS
  const copyGuestLink = () => {
    if (!events[0]) return;
    navigator.clipboard.writeText(`https://www.classcode.com.ar/guest-upload/${events[0].eventCode}`);
    setModal({ isOpen: true, title: "GUEST LINK", message: "LINK DE SUBIDA COPIADO.", type: "success" });
  };

  const handleShareTV = () => {
    if (!events[0]) return;
    navigator.clipboard.writeText(`https://www.classcode.com.ar/live-gallery/${events[0].eventCode}`);
    setModal({ isOpen: true, title: "LIVE GALLERY", message: "LINK DE PROYECCIÓN COPIADO.", type: "success" });
  };

  const handleSwitchToPro = async () => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { role: 'professional' });
      navigate('/dashboard');
    } catch (error) { console.error(error); }
  };

  const handleCreateEvent = async () => {
    if (!newEventName.trim()) return;
    const rawCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const eventCode = `LIVE-${rawCode}`;
    try {
      await addDoc(collection(db, "events"), {
        eventName: newEventName.toUpperCase(),
        clientId: auth.currentUser.uid,
        eventCode: eventCode,
        createdAt: new Date().toISOString(),
        status: "active",
        liveGallery: []
      });
      setIsCreatingEvent(false);
      setNewEventName('');
      setModal({ isOpen: true, title: "ÉXITO", message: `SISTEMA INICIADO: ${eventCode}`, type: "success" });
    } catch (e) { console.error(e); }
  };

  const togglePause = async () => {
    if (!events[0]) return;
    const newStatus = events[0].status === 'paused' ? 'active' : 'paused';
    await updateDoc(doc(db, "events", events[0].id), { status: newStatus });
  };
  
  const confirmFinish = () => {
    if (!events[0]) return;
    setModal({
      isOpen: true,
      title: "APAGAR SISTEMA",
      message: "¿TERMINAR RECEPCIÓN DE FOTOS? LOS INVITADOS YA NO PODRÁN SUBIR CONTENIDO.",
      type: 'warning',
      onConfirm: async () => {
        await updateDoc(doc(db, "events", events[0].id), { status: 'finished' });
        setModal({ isOpen: false });
      }
    });
  };

  const confirmDelete = () => {
    if (!events[0]) return;
    setModal({
      isOpen: true,
      title: "ELIMINAR PROYECTO",
      message: "¿ESTÁS SEGURO? ESTA ACCIÓN ELIMINARÁ EL PROYECTO Y TODA SU GALERÍA PERMANENTEMENTE.",
      type: 'warning',
      onConfirm: async () => {
        await deleteDoc(doc(db, "events", events[0].id));
        setModal({ isOpen: false });
      }
    });
  };

  const handleSaveProfile = async () => {
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), profile, { merge: true });
      setIsEditingProfile(false);
      setModal({ isOpen: true, title: "ÉXITO", message: "PERFIL ACTUALIZADO.", type: "success" });
    } catch (e) { console.error(e); }
  };

  const handleUpdateEventName = async () => {
    if (!newEventName.trim() || !events[0]) return;
    try {
      await updateDoc(doc(db, "events", events[0].id), { eventName: newEventName.toUpperCase() });
      setIsEditingEventName(false);
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-['Poppins']">Sincronizando...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] flex overflow-x-hidden uppercase antialiased relative text-left">
      
      {/* FONDO ANIMADO */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] md:blur-[150px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[90px] md:blur-[130px]" />
      </div>

      <header className="md:hidden fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-b border-white/5 z-[100] px-8 py-6 flex justify-between items-center">
        <div onClick={() => navigate('/home')} className="text-[18px] font-['Poppins'] font-normal tracking-[0.05em] uppercase cursor-pointer text-white">CLASSCODE</div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white"><Menu size={28} /></button>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[110] md:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-[85%] bg-[#050505] z-[120] p-12 flex flex-col md:hidden shadow-2xl">
              <button onClick={() => setIsMobileMenuOpen(false)} className="self-end mb-12 text-gray-500 hover:text-white transition-colors"><X size={32} /></button>
              <button onClick={handleSwitchToPro} className="mb-12 w-full flex items-center justify-between bg-white/[0.03] border border-white/10 p-5 rounded-2xl group hover:bg-purple-500/10 transition-all">
                <div className="flex items-center gap-4 text-left leading-none">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400"><RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-700" /></div>
                  <div>
                    <p className="text-[7px] font-black text-gray-500 tracking-[0.2em]">SWITCH MOOD</p>
                    <p className="text-[11px] font-black text-white tracking-widest uppercase leading-none mt-1">MODO TALENTO</p>
                  </div>
                </div>
              </button>
              <nav className="flex-1 space-y-12">
                <button onClick={() => navigate('/client-profile')} className="flex items-center gap-6 text-[12px] font-black tracking-widest text-purple-500 uppercase"><QrCode size={22}/> LIVE CONTROL</button>
                <button onClick={() => navigate('/home')} className="flex items-center gap-6 text-[12px] font-black tracking-widest text-gray-400 uppercase"><Search size={22}/> EXPLORAR</button>
                <button onClick={() => navigate('/academy')} className="flex items-center gap-6 text-[12px] font-black tracking-widest text-gray-400 uppercase"><GraduationCap size={22}/> ACADEMY</button>
              </nav>
              <button onClick={() => auth.signOut()} className="flex items-center gap-6 text-gray-700 text-[10px] font-black tracking-widest uppercase"><LogOut size={20}/> SALIR</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-72 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex-col p-10 fixed h-full z-50">
        <header className="mb-12 text-left leading-none">
          <div onClick={() => navigate('/home')} className="text-[22px] font-['Poppins'] font-normal tracking-[0.05em] leading-none cursor-pointer uppercase text-white">CLASSCODE</div>
          <p className="text-purple-400 text-[10px] font-bold tracking-[0.3em] mt-2 leading-none uppercase">Experience</p>
        </header>
        <div className="mb-12 text-left">
          <button onClick={handleSwitchToPro} className="w-full flex items-center justify-between bg-white/[0.03] border border-white/10 p-4 rounded-2xl group hover:bg-purple-500/10 transition-all leading-none">
            <div className="flex items-center gap-3 text-left leading-none">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <div>
                <p className="text-[6px] font-black text-gray-500 tracking-[0.2em] leading-none">SWITCH MOOD</p>
                <p className="text-[9px] font-black text-white tracking-widest uppercase mt-1 leading-none">MODO TALENTO</p>
              </div>
            </div>
          </button>
        </div>
        <nav className="flex-1 space-y-8 text-left">
          <button onClick={() => navigate('/client-profile')} className="flex items-center gap-4 text-white text-[10px] font-black tracking-widest leading-none transition-all"><QrCode size={18} className="text-purple-500"/> LIVE CONTROL</button>
          <button onClick={() => navigate('/home')} className="flex items-center gap-4 text-gray-500 hover:text-white text-[10px] font-black tracking-widest leading-none transition-all"><Search size={18}/> EXPLORAR</button>
          <button onClick={() => navigate('/academy')} className="flex items-center gap-4 text-gray-500 hover:text-white text-[10px] font-black tracking-widest leading-none transition-all"><GraduationCap size={18}/> ACADEMY</button>
        </nav>
        <button onClick={() => auth.signOut()} className="flex items-center gap-4 text-gray-700 hover:text-red-500 text-[10px] font-black tracking-widest transition-all mt-auto pt-8 border-t border-white/5 leading-none"><LogOut size={18}/> CERRAR SESIÓN</button>
      </aside>

      <main className="flex-1 md:ml-72 p-4 md:p-8 mt-16 md:mt-0 relative z-10 w-full max-w-[1400px] mx-auto">
        <header className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-4 rounded-2xl backdrop-blur-md mb-8 shadow-2xl">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-purple-500/20 overflow-hidden bg-white/5 shadow-inner">
              {profile.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" /> : <User size={24} className="m-auto mt-3 text-gray-700"/>}
            </div>
            <div className="text-left leading-none font-normal">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] md:text-[18px] font-['Poppins'] font-normal uppercase text-white/90 truncate max-w-[120px] md:max-w-none">{profile.name || 'ORGANIZADOR'}</h2>
                <button onClick={() => setIsEditingProfile(true)} className="text-gray-600 hover:text-purple-400 transition-colors"><Edit3 size={16} /></button>
              </div>
              <p className="text-[7px] md:text-[9px] text-purple-400 font-bold tracking-[0.3em] uppercase mt-1">{profile.location || 'BUENOS AIRES'}</p>
            </div>
          </div>
          <Bell size={20} className="text-gray-700 cursor-pointer hover:text-white transition-colors" />
        </header>

        <div className="space-y-8">
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-2xl p-5 md:p-8 relative overflow-hidden shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 text-left border-b border-white/5 pb-6">
              <h3 className="text-[9px] md:text-[10px] text-gray-500 font-black tracking-[0.4em] uppercase leading-none">Live Control Panel</h3>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 {events.length > 0 && (
                   <>
                      <button onClick={togglePause} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 hover:border-purple-500/30 text-purple-400 rounded-xl transition-all shadow-inner">
                         {events[0].status === 'paused' ? <Play size={18}/> : <Pause size={18}/>}
                      </button>
                      <button onClick={confirmFinish} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 hover:border-amber-500/30 text-gray-500 hover:text-amber-500 rounded-xl transition-all shadow-inner"><Power size={18}/></button>
                      <button onClick={confirmDelete} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 hover:border-red-500/30 text-gray-500 hover:text-red-500 rounded-xl transition-all shadow-inner"><Trash2 size={18}/></button>
                   </>
                 )}
                 <button onClick={() => { setNewEventName(''); setIsCreatingEvent(true); }} className="whitespace-nowrap px-6 py-3 bg-purple-600/20 border border-purple-500/30 rounded-xl text-[10px] font-black text-white flex items-center gap-3 hover:bg-purple-600 transition-all uppercase shadow-lg"><Plus size={16}/> Nuevo Evento</button>
              </div>
            </div>

            {events.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center gap-6 shadow-inner">
                  <div className="bg-white p-3 rounded-xl shadow-2xl border-2 border-white flex-shrink-0">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.classcode.com.ar/guest-upload/${events[0].eventCode}`} alt="QR" className="w-24 h-24 md:w-28 md:h-28 block" />
                    <p className="text-black text-[5px] font-bold mt-1 tracking-[0.2em] uppercase text-center leading-none">Scan to upload</p>
                  </div>
                  <div className="flex-1 space-y-4 text-center lg:text-left w-full leading-none">
                    <h4 className="text-[18px] md:text-[22px] font-['Poppins'] font-normal text-white uppercase">{events[0].eventName}</h4>
                    <div className="flex items-center justify-center lg:justify-start gap-3">
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${events[0].status === 'paused' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                      <p className="text-[8px] font-black tracking-[0.2em] text-purple-400 uppercase">{events[0].eventCode}</p>
                    </div>
                    {/* BOTONES CUADRADOS COMPACTOS (LOGICA DE LINKS CORREGIDA) */}
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                      <button onClick={copyGuestLink} className="w-12 h-12 flex flex-shrink-0 items-center justify-center bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all shadow-xl" title="Link para Invitados"><LinkIcon size={18}/></button>
                      <button onClick={handleShareTV} className="w-12 h-12 flex flex-shrink-0 items-center justify-center bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all shadow-xl" title="Compartir Galería"><Share2 size={18}/></button>
                      <button onClick={() => navigate(`/live-gallery/${events[0].eventCode}`)} className="w-12 h-12 flex flex-shrink-0 items-center justify-center bg-purple-600/20 border border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-600/40 transition-all shadow-lg" title="Ver Pantalla de Proyección"><Monitor size={18}/></button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h4 className="text-[9px] text-gray-500 font-black tracking-[0.4em] uppercase">Live Gallery</h4>
                    <span className="text-[9px] font-black text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full uppercase">{events[0].liveGallery?.length || 0} Items</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto scrollbar-custom pr-1">
                    {events[0].liveGallery?.map((url, i) => (
                      <motion.div key={i} whileHover={{ scale: 0.95 }} className="relative aspect-square rounded-xl overflow-hidden group border border-white/10 shadow-lg cursor-pointer" onClick={() => setPreviewImage(url)}>
                        <img src={url} className="w-full h-full object-cover" alt="Content" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all flex items-end justify-center pb-2">
                          <button onClick={async (e) => { e.stopPropagation(); await updateDoc(doc(db, "events", events[0].id), { liveGallery: arrayRemove(url) }); }} className="p-1.5 bg-red-600 rounded-full text-white shadow-xl active:scale-90"><Trash2 size={14} /></button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center opacity-40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center gap-6 bg-white/[0.01]">
                 <QrCode size={48} strokeWidth={1} className="text-gray-700"/>
                 <button onClick={() => setIsCreatingEvent(true)} className="px-10 py-3 bg-purple-600/20 border border-purple-500/40 text-white rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-purple-600 transition-all">Crear Nuevo Evento</button>
              </div>
            )}
          </section>

          {/* SECCIONES INFERIORES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-[#050505] p-6 rounded-2xl border border-white/5 space-y-6 shadow-2xl text-left border-t-purple-500/10">
              <h3 className="text-[9px] text-gray-500 font-black tracking-[0.5em] uppercase flex items-center gap-3 font-normal"><MessageSquare size={14} className="text-purple-500"/> MensajeS</h3>
              <div className="space-y-1">
                {messages.length === 0 ? <p className="text-[8px] text-gray-700 uppercase py-8 text-center tracking-widest font-black">Sin conversaciones activas</p> : messages.map(chat => (
                  <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex items-center justify-between p-4 hover:bg-white/[0.04] rounded-xl cursor-pointer group transition-all border-b border-white/5 last:border-0 leading-none">
                    <div className="flex items-center gap-4 leading-none">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[9px] font-black border border-white/5 uppercase text-gray-400 group-hover:text-white transition-colors">DN</div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black tracking-[0.15em] text-gray-300 group-hover:text-purple-400 uppercase leading-none">{chat.professionalName || 'TALENTO'}</p>
                        <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest leading-none">Consultas enviadas</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-gray-800 group-hover:text-purple-500 transition-all transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </section>
            
            <section className="bg-[#050505] p-6 rounded-2xl border border-white/5 space-y-6 shadow-2xl text-left border-t-pink-500/10 leading-none">
              <h3 className="text-[9px] text-gray-500 font-black tracking-[0.5em] uppercase flex items-center gap-3 font-normal"><Heart size={14} className="text-pink-500 fill-pink-500"/> Mis Favoritos</h3>
              <div className="grid grid-cols-1 gap-2">
                {favorites.length === 0 ? <p className="text-[8px] text-gray-700 uppercase py-8 text-center tracking-widest font-black">Sin talentos guardados</p> : favorites.map((fav, i) => (
                  <motion.div whileHover={{ x: 5 }} key={i} onClick={() => navigate(`/profile/${fav.id}`)} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-purple-500/10 transition-all truncate flex justify-between items-center group leading-none">
                     <span className="leading-none text-gray-300 group-hover:text-white">{fav.name || "Talento Pro"}</span>
                     <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0 text-purple-500" />
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* MODALES */}
      <AnimatePresence>
        {(isEditingProfile || isEditingEventName || isCreatingEvent) && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[250] flex items-center justify-center p-6 antialiased uppercase">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#050505] border border-white/10 rounded-2xl p-10 max-w-md w-full space-y-10 text-center shadow-2xl border-t-purple-500/20">
              <button onClick={() => { setIsEditingProfile(false); setIsEditingEventName(false); setIsCreatingEvent(false); }} className="absolute top-8 right-8 text-gray-500 hover:text-white p-2"><X size={24} /></button>
              {isEditingProfile ? (
                <>
                  <h3 className="text-[14px] font-['Poppins'] tracking-[0.3em] uppercase text-white border-b border-white/5 pb-6 text-left leading-none font-bold">Identidad Organizador</h3>
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative group w-28 h-28">
                      <div className="w-full h-full rounded-full border-2 border-purple-500/30 overflow-hidden bg-white/5 shadow-2xl flex items-center justify-center relative leading-none shadow-inner">
                        {profile.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" /> : <User size={40} className="text-gray-700"/>}
                        {uploading && <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] font-black tracking-widest text-purple-400">LOADING</div>}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-full leading-none">
                        <Camera size={28} className="text-white"/><input type="file" onChange={async (e) => {
                          const file = e.target.files[0]; if (!file) return; setUploading(true); const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', UPLOAD_PRESET);
                          try { const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData }); const data = await res.json();
                            if (data.secure_url) { setProfile(prev => ({ ...prev, photoURL: data.secure_url })); await updateDoc(doc(db, "users", auth.currentUser.uid), { photoURL: data.secure_url }); }
                          } catch (err) { console.error(err); } finally { setUploading(false); }
                        }} className="hidden" />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-8 text-left">
                    <div className="space-y-3"><label className="text-[8px] text-gray-600 font-black uppercase tracking-[0.3em] pl-1">Nombre Organizador</label><input className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:border-purple-500 transition-all text-white shadow-inner" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div>
                    <div className="space-y-3"><label className="text-[8px] text-gray-600 font-black uppercase tracking-[0.3em] pl-1">Sede Central</label><input className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-[12px] font-black uppercase outline-none focus:border-purple-500 transition-all text-white shadow-inner" value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4"><button onClick={() => setIsEditingProfile(false)} className="py-5 bg-white/5 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-white/10">DESCARTAR</button><button onClick={handleSaveProfile} className="py-5 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-900/40 hover:bg-purple-500 active:scale-95 transition-all">GUARDAR</button></div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto text-purple-400 border border-purple-500/20 shadow-inner leading-none"><Plus size={32}/></div>
                  <div className="space-y-3 text-center leading-none font-normal">
                    <h3 className="text-[18px] md:text-[20px] font-black tracking-[0.2em] uppercase text-white">Nuevo Evento</h3>
                    <p className="text-[9px] text-gray-500 uppercase tracking-[0.3em]">Live Gallery Config</p>
                  </div>
                  <input autoFocus className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl text-[14px] font-black uppercase text-center outline-none focus:border-purple-500 transition-all text-white shadow-inner" value={newEventName} onChange={e => setNewEventName(e.target.value)} placeholder="TÍTULO DEL EVENTO" />
                  <div className="grid grid-cols-2 gap-4"><button onClick={() => { setIsCreatingEvent(false); setIsEditingEventName(false); }} className="py-5 bg-white/5 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-white/10">CANCELAR</button><button onClick={isCreatingEvent ? handleCreateEvent : handleUpdateEventName} className="py-5 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-900/40 hover:bg-purple-500 active:scale-95 transition-all">ACEPTAR</button></div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE VISTA PREVIA DE IMAGEN */}
      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button className="absolute top-8 right-8 text-white/50 hover:text-white p-2"><X size={32}/></button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              src={previewImage} 
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* LLAMADA AL MODAL DE COMPARTIR */}
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} userProfile={profile} />

      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} onConfirm={modal.onConfirm} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
}