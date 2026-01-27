import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; 
import { doc, setDoc, collection, query, where, onSnapshot, updateDoc, arrayRemove, deleteDoc, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  X, Search, LogOut, Bell, RefreshCcw, User, Heart, Menu,
  MessageSquare, ArrowRight, QrCode, Calendar, MapPin, LayoutDashboard,
  Upload, ImageIcon, GraduationCap, Trash2, Plus, Eye, Copy, Monitor, Edit3, Share2, Power, Link as LinkIcon, Camera, Pause, Play
} from 'lucide-react'; 
import CustomModal from './components/CustomModal'; 
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientProfile() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingEventName, setIsEditingEventName] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [profile, setProfile] = useState({ name: '', location: '', interests: '', photoURL: '' });
  
  // NUEVO: Estado para previsualizar imagen en grande
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

  // Lógica de Autosave para puntos (Sincroniza con Dashboard)
  const persistChanges = async (updatedFields) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), updatedFields);
    } catch (e) { console.error(e); }
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
    setModal({ isOpen: true, title: "STATUS", message: `SISTEMA ${newStatus === 'paused' ? 'PAUSADO' : 'REANUDADO'}.`, type: "success" });
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

  const copyGuestLink = () => {
    if (!events[0]) return;
    navigator.clipboard.writeText(`https://www.classcode.com.ar/guest-upload/${events[0].eventCode}`);
    setModal({ isOpen: true, title: "ÉXITO", message: "LINK DE SUBIDA COPIADO.", type: "success" });
  };

  const handleShareTV = () => {
    if (!events[0]) return;
    navigator.clipboard.writeText(`https://www.classcode.com.ar/live-gallery/${events[0].eventCode}`);
    setModal({ isOpen: true, title: "SHARE TV", message: "LINK DE PROYECCIÓN COPIADO.", type: "success" });
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
      setModal({ isOpen: true, title: "ÉXITO", message: "NOMBRE ACTUALIZADO.", type: "success" });
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-normal font-['Poppins']">Sincronizando...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] flex overflow-x-hidden uppercase antialiased relative text-left">
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] md:blur-[150px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[90px] md:blur-[130px]" />
      </div>

      {/* HEADER MOBILE GLASSMORPHISM (UNIFIED) */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-b border-white/5 z-[100] px-8 py-6 flex justify-between items-center">
        <div onClick={() => navigate('/home')} className="text-[18px] font-['Poppins'] font-normal tracking-[0.05em] uppercase cursor-pointer text-white">CLASSCODE</div>
        <div className="flex items-center gap-6">
           <button onClick={() => setIsMobileMenuOpen(true)} className="text-white"><Menu size={28} /></button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[110] md:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-[85%] bg-[#050505] z-[120] p-12 flex flex-col md:hidden shadow-2xl">
              <button onClick={() => setIsMobileMenuOpen(false)} className="self-end mb-12 text-gray-500 hover:text-white transition-colors"><X size={32} /></button>
              
              <button onClick={handleSwitchToPro} className="mb-12 w-full flex items-center justify-between bg-white/[0.03] border border-white/10 p-5 rounded-2xl group hover:bg-purple-500/10 transition-all">
                <div className="flex items-center gap-4 text-left leading-none">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                    <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
                  </div>
                  <div>
                    <p className="text-[7px] font-black text-gray-500 tracking-[0.2em]">SWITCH MOOD</p>
                    <p className="text-[11px] font-black text-white tracking-widest uppercase leading-none mt-1">MODO TALENTO</p>
                  </div>
                </div>
              </button>

              <nav className="flex-1 space-y-12">
                <button onClick={() => {navigate('/client-profile'); setIsMobileMenuOpen(false);}} className="flex items-center gap-6 text-[12px] font-black tracking-widest leading-none text-purple-500 uppercase"><QrCode size={22}/> LIVE CONTROL</button>
                <button onClick={() => {navigate('/home'); setIsMobileMenuOpen(false);}} className="flex items-center gap-6 text-[12px] font-black tracking-widest leading-none text-gray-400 uppercase"><Search size={22}/> EXPLORAR</button>
                <button onClick={() => {navigate('/academy'); setIsMobileMenuOpen(false);}} className="flex items-center gap-6 text-[12px] font-black tracking-widest leading-none text-gray-400 uppercase"><GraduationCap size={22}/> ACADEMY</button>
              </nav>
              <button onClick={() => auth.signOut()} className="flex items-center gap-6 text-gray-700 text-[10px] font-black tracking-widest leading-none uppercase"><LogOut size={20}/> SALIR</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ASIDE DESKTOP (UNIFIED STYLE) */}
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-72 p-4 md:p-12 mt-24 md:mt-0 relative z-10 w-full max-w-[1600px] mx-auto">
        
        {/* PROFILE HEADER GLASSMORPHISM */}
        <header className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] backdrop-blur-md mb-12 md:mb-20">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-purple-500/20 overflow-hidden bg-white/5 shadow-2xl relative flex-shrink-0">
              {profile.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" /> : <User size={28} className="m-auto mt-4 text-gray-700"/>}
            </div>
            <div className="text-left leading-none flex flex-col gap-1 md:gap-2 font-normal">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] md:text-[20px] font-['Poppins'] font-normal tracking-[0.05em] uppercase text-white/90 truncate max-w-[120px] md:max-w-none">{profile.name || 'ORGANIZADOR'}</h2>
                <button onClick={() => setIsEditingProfile(true)} className="text-gray-600 hover:text-purple-400 transition-colors"><Edit3 size={18} /></button>
              </div>
              <p className="text-[7px] md:text-[10px] text-purple-400 font-bold tracking-[0.3em] uppercase">{profile.location || 'BUENOS AIRES'}</p>
            </div>
          </div>
          <Bell size={20} className="text-gray-700 cursor-pointer hover:text-white transition-colors" />
        </header>

        <div className="space-y-12">
          {/* CONTROL PANEL SECTION */}
          <section className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-12 relative overflow-hidden shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 text-left border-b border-white/5 pb-8">
              <h3 className="text-[10px] md:text-[12px] text-gray-500 font-black tracking-[0.4em] uppercase leading-none">Live Control Panel</h3>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 {events.length > 0 && (
                   <>
                      <button onClick={togglePause} className="p-3 md:p-4 bg-white/5 border border-white/10 hover:border-purple-500/30 text-purple-400 rounded-2xl transition-all">
                         {events[0].status === 'paused' ? <Play size={18}/> : <Pause size={18}/>}
                      </button>
                      <button onClick={confirmFinish} className="p-3 md:p-4 bg-white/5 border border-white/10 hover:border-amber-500/30 text-gray-500 hover:text-amber-500 rounded-2xl transition-all"><Power size={18}/></button>
                      <button onClick={confirmDelete} className="p-3 md:p-4 bg-white/5 border border-white/10 hover:border-red-500/30 text-gray-500 hover:text-red-500 rounded-2xl transition-all"><Trash2 size={18}/></button>
                   </>
                 )}
                 <button onClick={() => { setNewEventName(''); setIsCreatingEvent(true); }} className="whitespace-nowrap px-6 md:px-8 py-3 md:py-4 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-[10px] font-black text-white flex items-center gap-3 hover:bg-purple-600 transition-all uppercase shadow-lg"><Plus size={16}/> Nuevo Evento</button>
              </div>
            </div>

            {events.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-12 items-start">
                <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-10 bg-white/[0.02] p-6 md:p-8 rounded-[2rem] border border-white/5 text-left w-full">
                  <div className="bg-white p-4 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl flex-shrink-0 border-4 border-white">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://www.classcode.com.ar/guest-upload/${events[0].eventCode}`} alt="QR" className="w-28 h-28 md:w-32 md:h-32 block" />
                    <p className="text-black text-[6px] font-bold mt-2 tracking-[0.2em] uppercase text-center leading-none">Scan to upload</p>
                  </div>
                  <div className="flex-1 space-y-6 md:space-y-8 text-center lg:text-left w-full leading-none">
                    <div className="group relative">
                      <div className="flex items-center justify-center lg:justify-start gap-4">
                         <h4 className="text-[20px] md:text-[28px] font-['Poppins'] font-normal tracking-[0.02em] text-white uppercase leading-tight">{events[0].eventName}</h4>
                         <button onClick={() => { setNewEventName(events[0].eventName); setIsEditingEventName(true); }} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-purple-400 transition-all"><Edit3 size={18}/></button>
                      </div>
                      <div className="flex items-center justify-center lg:justify-start gap-3 mt-3">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${events[0].status === 'finished' ? 'bg-red-500' : events[0].status === 'paused' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                        <p className={`text-[9px] font-black tracking-[0.2em] uppercase ${events[0].status === 'finished' ? 'text-red-500' : events[0].status === 'paused' ? 'text-amber-500' : 'text-green-500'}`}>{events[0].eventCode}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-6 w-full leading-none">
                      <div className="flex items-center gap-4 bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl w-fit mx-auto lg:mx-0">
                         <ImageIcon size={24} className="text-purple-500" />
                         <div className="text-left leading-none">
                           <p className="text-[18px] md:text-[22px] font-black text-white leading-none">{events[0].liveGallery?.length || 0}</p>
                           <p className="text-[7px] md:text-[8px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Recibidas</p>
                         </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 w-full max-w-[300px] mx-auto lg:mx-0">
                        <button onClick={copyGuestLink} className="py-5 bg-white/5 border border-white/10 hover:bg-white/10 transition-all rounded-xl flex items-center justify-center text-gray-400 hover:text-white shadow-inner"><LinkIcon size={22}/></button>
                        <button onClick={handleShareTV} className="py-5 bg-white/5 border border-white/10 hover:bg-white/10 transition-all rounded-xl flex items-center justify-center text-gray-400 hover:text-white shadow-inner"><Share2 size={22}/></button>
                        <button onClick={() => navigate(`/live-gallery/${events[0].eventCode}`)} className="py-5 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600 rounded-xl transition-all flex items-center justify-center text-purple-400 hover:text-white shadow-lg"><Monitor size={22}/></button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 text-left border-t border-white/5 pt-10 xl:border-0 xl:pt-0">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <h4 className="text-[10px] text-gray-500 font-black tracking-[0.4em] uppercase leading-none">Live Gallery</h4>
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-4 py-1.5 rounded-full">{events[0].liveGallery?.length || 0} Items</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[450px] overflow-y-auto scrollbar-custom pr-2 leading-none font-normal">
                    {events[0].liveGallery?.map((url, i) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        key={i} 
                        className="relative aspect-square rounded-xl overflow-hidden group border border-white/10 shadow-lg cursor-pointer"
                        onClick={() => setPreviewImage(url)}
                      >
                        <img src={url} className="w-full h-full object-cover" alt="Gallery Content" />
                        
                        {/* Overlay: Siempre visible en mobile, hover en desktop */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-2">
                          <button 
                            onClick={async (e) => { 
                              e.stopPropagation(); 
                              await updateDoc(doc(db, "events", events[0].id), { 
                                liveGallery: arrayRemove(url) 
                              }); 
                            }} 
                            className="p-2.5 bg-red-600 rounded-full text-white shadow-xl active:scale-90 transition-transform"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-32 text-center opacity-40 border-2 border-dashed border-white/10 rounded-[2rem] md:rounded-[3rem] flex flex-col items-center gap-8 bg-white/[0.01]">
                 <QrCode size={64} strokeWidth={1} className="text-gray-700"/>
                 <button onClick={() => setIsCreatingEvent(true)} className="px-12 py-5 bg-purple-600/20 border border-purple-500/40 text-white rounded-2xl font-black text-[11px] tracking-widest uppercase hover:bg-purple-600 transition-all shadow-2xl">Crear Nuevo Evento</button>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            <section className="bg-[#050505] p-8 md:p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl text-left border-t-purple-500/10">
              <h3 className="text-[10px] text-gray-500 font-black tracking-[0.5em] uppercase flex items-center gap-3 leading-none font-normal"><MessageSquare size={16} className="text-purple-500"/> MensajeS</h3>
              <div className="space-y-1">
                {messages.length === 0 ? <p className="text-[9px] text-gray-700 uppercase py-12 text-center tracking-widest font-black">Sin conversaciones activas</p> : messages.map(chat => (
                  <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex items-center justify-between p-5 hover:bg-white/[0.04] rounded-[1.5rem] cursor-pointer group transition-all border-b border-white/5 last:border-0 leading-none">
                    <div className="flex items-center gap-5 leading-none">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black border border-white/5 uppercase text-gray-400 group-hover:text-white transition-colors">DN</div>
                      <div className="space-y-2">
                        <p className="text-[11px] font-black tracking-[0.15em] text-gray-300 group-hover:text-purple-400 uppercase leading-none">{chat.professionalName || 'TALENTO'}</p>
                        <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest leading-none">Consultas enviadas</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-800 group-hover:text-purple-500 transition-all transform group-hover:translate-x-2" />
                  </div>
                ))}
              </div>
            </section>
            
            <section className="bg-[#050505] p-8 md:p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl text-left border-t-pink-500/10 leading-none">
              <h3 className="text-[10px] text-gray-500 font-black tracking-[0.5em] uppercase flex items-center gap-3 leading-none"><Heart size={16} className="text-pink-500 fill-pink-500"/> Mis Favoritos</h3>
              <div className="grid grid-cols-1 gap-3">
                {favorites.length === 0 ? <p className="text-[9px] text-gray-700 uppercase py-12 text-center tracking-widest font-black">Sin talentos guardados</p> : favorites.map((fav, i) => (
                  <motion.div whileHover={{ x: 10 }} key={i} onClick={() => navigate(`/profile/${fav.id}`)} className="p-5 bg-white/[0.02] border border-white/5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-purple-500/10 transition-all truncate flex justify-between items-center group leading-none">
                     <span className="leading-none text-gray-300 group-hover:text-white">{fav.name || "Talento Pro"}</span>
                     <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all transform -translate-x-4 group-hover:translate-x-0" />
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {(isEditingProfile || isEditingEventName || isCreatingEvent) && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center p-6 antialiased uppercase">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#050505] border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 max-w-md w-full space-y-12 shadow-2xl text-center relative leading-none border-t-purple-500/20">
              <button onClick={() => { setIsEditingProfile(false); setIsEditingEventName(false); setIsCreatingEvent(false); }} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><X size={24} /></button>
              {isEditingProfile ? (
                <>
                  <h3 className="text-[14px] font-['Poppins'] tracking-[0.3em] uppercase text-white border-b border-white/5 pb-6 text-left leading-none font-bold">Identidad Organizador</h3>
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative group w-28 h-28">
                      <div className="w-full h-full rounded-full border-2 border-purple-500/30 overflow-hidden bg-white/5 shadow-2xl flex items-center justify-center relative leading-none">
                        {profile.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" /> : <User size={40} className="text-gray-700"/>}
                        {uploading && <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] font-black tracking-widest text-purple-400">LOADING</div>}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-full leading-none">
                        <Camera size={28} className="text-white"/><input type="file" onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          setUploading(true);
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('upload_preset', UPLOAD_PRESET);
                          try {
                            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
                            const data = await res.json();
                            if (data.secure_url) {
                               setProfile(prev => ({ ...prev, photoURL: data.secure_url }));
                               await updateDoc(doc(db, "users", auth.currentUser.uid), { photoURL: data.secure_url });
                            }
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
                  <div className="w-16 h-16 bg-purple-500/10 rounded-3xl flex items-center justify-center mx-auto text-purple-400 border border-purple-500/20 leading-none shadow-inner"><Plus size={32}/></div>
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
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
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

      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} onConfirm={modal.onConfirm} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
}