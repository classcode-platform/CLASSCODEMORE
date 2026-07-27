import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; 
import { doc, setDoc, collection, query, where, onSnapshot, updateDoc, arrayRemove, deleteDoc, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  X, Search, LogOut, Bell, RefreshCcw, User, Heart, Menu,
  MessageSquare, ArrowRight, QrCode, Calendar, MapPin, 
  Upload, ImageIcon, GraduationCap, Trash2, Plus, Monitor, Edit3, Share2, Power, Link as LinkIcon, Camera, Pause, Play, Check, LayoutGrid
} from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientProfile() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [profile, setProfile] = useState({ name: '', location: '', interests: '', photoURL: '' });
  const [previewImage, setPreviewImage] = useState(null);
  const [, setModal] = useState({ isOpen: false, title: '', message: '', type: 'warning' });

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
        });
        onSnapshot(query(collection(db, "chats"), where("participants", "array-contains", user.uid)), (snap) => {
          setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
      } else { navigate('/'); }
    });
    return () => unsubscribe();
  }, [navigate]);

  const copyGuestLink = () => {
    if (!events[0]) return;
    navigator.clipboard.writeText(`https://www.classcode.com.ar/guest-upload/${events[0].eventCode}`);
    alert("¡Link de subida copiado!");
  };

  const handleShareTV = () => {
    if (!events[0]) return;
    navigator.clipboard.writeText(`https://www.classcode.com.ar/live-gallery/${events[0].eventCode}`);
    alert("¡Link de proyección copiado!");
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
        title: newEventName.toUpperCase(),
        clientId: auth.currentUser.uid,
        eventCode: eventCode,
        createdAt: new Date().toISOString(),
        status: "active",
        liveGallery: []
      });
      setIsCreatingEvent(false);
      setNewEventName('');
    } catch (e) { console.error(e); }
  };

  const togglePause = async () => {
    if (!events[0]) return;
    const newStatus = events[0].status === 'paused' ? 'active' : 'paused';
    await updateDoc(doc(db, "events", events[0].id), { status: newStatus });
  };
  
  const confirmFinish = async () => {
    if (!events[0]) return;
    if (confirm("¿Terminar recepción de fotos? Los invitados ya no podrán subir contenido.")) {
      await updateDoc(doc(db, "events", events[0].id), { status: 'finished' });
    }
  };

  const confirmDelete = async () => {
    if (!events[0]) return;
    if (confirm("¿Estás seguro? Esta acción eliminará el proyecto y toda su galería permanentemente.")) {
      await deleteDoc(doc(db, "events", events[0].id));
    }
  };

  const handleSaveProfile = async () => {
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), profile, { merge: true });
      setIsEditingProfile(false);
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-['Poppins']">Sincronizando...</div>;

  return (
    <div className="min-h-screen bg-[#070709] text-white font-['Open_Sans'] flex overflow-x-hidden uppercase antialiased relative text-left">
      
      {/* FONDO */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/[0.01] rounded-full blur-[120px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/[0.01] rounded-full blur-[100px]" />
      </div>

      <header className="md:hidden fixed top-0 left-0 right-0 bg-[#070709]/80 backdrop-blur-xl border-b border-white/5 z-[100] px-8 py-6 flex justify-between items-center">
        <div onClick={() => navigate('/home')} className="text-[18px] font-['Poppins'] font-normal tracking-[0.05em] uppercase cursor-pointer text-white">CLASSCODE</div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white"><Menu size={28} /></button>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[110] md:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-[85%] bg-[#0c0c0e] z-[120] p-12 flex flex-col md:hidden shadow-2xl border-l border-white/10">
              <button onClick={() => setIsMobileMenuOpen(false)} className="self-end mb-12 text-gray-500 hover:text-white transition-colors"><X size={32} /></button>
              <button onClick={handleSwitchToPro} className="mb-12 w-full flex items-center justify-between bg-white/[0.03] border border-white/10 p-5 rounded-2xl group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4 text-left leading-none">
                  <div className="p-3 bg-white/5 rounded-xl text-white"><RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-700" /></div>
                  <div>
                    <p className="text-[7px] font-black text-gray-500 tracking-[0.2em]">SWITCH MOOD</p>
                    <p className="text-[11px] font-black text-white tracking-widest uppercase leading-none mt-1">MODO TALENTO</p>
                  </div>
                </div>
              </button>
              <nav className="flex-1 space-y-10 font-['Poppins']">
                <button onClick={() => navigate('/client-profile')} className="flex items-center gap-6 text-[11px] font-black tracking-widest text-white uppercase"><QrCode size={20}/> LIVE CONTROL</button>
                <button onClick={() => navigate('/organizer')} className="flex items-center gap-6 text-[11px] font-black tracking-widest text-gray-400 hover:text-white uppercase"><LayoutGrid size={20}/> ORGANIZADOR</button>
                <button onClick={() => navigate('/home')} className="flex items-center gap-6 text-[11px] font-black tracking-widest text-gray-400 hover:text-white uppercase"><Search size={20}/> EXPLORAR</button>
                <button onClick={() => navigate('/academy')} className="flex items-center gap-6 text-[11px] font-black tracking-widest text-gray-400 hover:text-white uppercase"><GraduationCap size={20}/> ACADEMY</button>
              </nav>
              <button onClick={() => auth.signOut()} className="flex items-center gap-6 text-gray-600 hover:text-red-400 text-[10px] font-black tracking-widest uppercase"><LogOut size={20}/> SALIR</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-72 bg-[#070709]/90 backdrop-blur-3xl border-r border-white/5 flex-col p-10 fixed h-full z-50">
        <header className="mb-12 text-left leading-none">
          <div onClick={() => navigate('/home')} className="text-[22px] font-['Poppins'] font-normal tracking-[0.05em] leading-none cursor-pointer uppercase text-white">CLASSCODE</div>
          <p className="text-gray-400 text-[9px] font-bold tracking-[0.3em] mt-2 leading-none uppercase">Experience</p>
        </header>
        <div className="mb-10 text-left">
          <button onClick={handleSwitchToPro} className="w-full flex items-center justify-between bg-white/[0.03] border border-white/10 p-4 rounded-2xl group hover:bg-white/10 transition-all leading-none">
            <div className="flex items-center gap-3 text-left leading-none">
              <div className="p-2 bg-white/5 rounded-xl text-white">
                <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <div>
                <p className="text-[6px] font-black text-gray-500 tracking-[0.2em] leading-none">SWITCH MOOD</p>
                <p className="text-[9px] font-black text-white tracking-widest uppercase mt-1 leading-none">MODO TALENTO</p>
              </div>
            </div>
          </button>
        </div>
        <nav className="flex-1 space-y-6 text-left font-['Poppins']">
          <button onClick={() => navigate('/client-profile')} className="flex items-center gap-4 text-white text-[10px] font-black tracking-widest leading-none transition-all"><QrCode size={18} className="text-white"/> LIVE CONTROL</button>
          <button onClick={() => navigate('/organizer')} className="flex items-center gap-4 text-gray-400 hover:text-white text-[10px] font-black tracking-widest leading-none transition-all"><LayoutGrid size={18}/> ORGANIZADOR</button>
          <button onClick={() => navigate('/home')} className="flex items-center gap-4 text-gray-400 hover:text-white text-[10px] font-black tracking-widest leading-none transition-all"><Search size={18}/> EXPLORAR</button>
          <button onClick={() => navigate('/academy')} className="flex items-center gap-4 text-gray-400 hover:text-white text-[10px] font-black tracking-widest leading-none transition-all"><GraduationCap size={18}/> ACADEMY</button>
        </nav>
        <button onClick={() => auth.signOut()} className="flex items-center gap-4 text-gray-600 hover:text-red-400 text-[10px] font-black tracking-widest transition-all mt-auto pt-8 border-t border-white/5 leading-none"><LogOut size={18}/> CERRAR SESIÓN</button>
      </aside>

      <main className="flex-1 md:ml-72 p-6 md:p-12 mt-16 md:mt-0 relative z-10 w-full max-w-[1400px] mx-auto">
        <header className="flex justify-between items-center bg-[#0c0c0e] border border-white/5 p-5 md:p-6 rounded-3xl backdrop-blur-md mb-8 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl border border-white/10 overflow-hidden bg-white/5 shadow-inner">
              {profile.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" /> : <User size={24} className="m-auto mt-3 text-gray-500"/>}
            </div>
            <div className="text-left leading-none font-normal">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] md:text-[18px] font-['Poppins'] font-normal uppercase text-white truncate max-w-[120px] md:max-w-none">{profile.name || 'ORGANIZADOR'}</h2>
                <button onClick={() => setIsEditingProfile(true)} className="text-gray-500 hover:text-white transition-colors"><Edit3 size={15} /></button>
              </div>
              <p className="text-[8px] md:text-[9px] text-gray-400 font-bold tracking-[0.3em] uppercase mt-1.5">{profile.location || 'BUENOS AIRES'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/organizer')} className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black tracking-widest text-white transition-all">
              <LayoutGrid size={14}/> VER TODOS LOS EVENTOS
            </button>
            <Bell size={20} className="text-gray-500 cursor-pointer hover:text-white transition-colors" />
          </div>
        </header>

        <div className="space-y-8">
          <section className="bg-[#0c0c0e] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 text-left border-b border-white/5 pb-6">
              <div>
                <h3 className="text-[10px] text-gray-400 font-black tracking-[0.4em] uppercase leading-none">Live Control Panel</h3>
                <p className="text-[8px] text-gray-500 font-bold tracking-widest mt-1">Gestión rápida de tu evento activo</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                 {events.length > 0 && (
                   <>
                      <button onClick={togglePause} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/30 text-white rounded-2xl transition-all shadow-inner" title="Pausar / Activar">
                         {events[0].status === 'paused' ? <Play size={16}/> : <Pause size={16}/>}
                      </button>
                      <button onClick={confirmFinish} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 hover:border-amber-500/30 text-gray-400 hover:text-amber-400 rounded-2xl transition-all shadow-inner" title="Finalizar Evento"><Power size={16}/></button>
                      <button onClick={confirmDelete} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 rounded-2xl transition-all shadow-inner" title="Eliminar"><Trash2 size={16}/></button>
                   </>
                 )}
                 <button onClick={() => { setNewEventName(''); setIsCreatingEvent(true); }} className="whitespace-nowrap px-6 py-3.5 bg-white text-black rounded-2xl text-[9px] font-black flex items-center gap-2 hover:bg-gray-200 transition-all uppercase tracking-widest shadow-xl"><Plus size={14}/> NUEVO EVENTO</button>
              </div>
            </div>

            {events.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center gap-6 shadow-inner">
                  <div className="bg-white p-3 rounded-2xl shadow-2xl border border-white flex-shrink-0">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.classcode.com.ar/guest-upload/${events[0].eventCode}`} alt="QR" className="w-24 h-24 md:w-28 md:h-28 block" />
                    <p className="text-black text-[5px] font-bold mt-1 tracking-[0.2em] uppercase text-center leading-none">Scan to upload</p>
                  </div>
                  <div className="flex-1 space-y-4 text-center lg:text-left w-full leading-none">
                    <h4 className="text-[18px] md:text-[22px] font-['Poppins'] font-normal text-white uppercase">{events[0].eventName || events[0].title}</h4>
                    <div className="flex items-center justify-center lg:justify-start gap-3">
                      <span className={`w-2 h-2 rounded-full animate-pulse ${events[0].status === 'paused' ? 'bg-amber-400' : 'bg-green-400'}`}></span>
                      <p className="text-[9px] font-black tracking-[0.2em] text-gray-400 uppercase">{events[0].eventCode}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
                      <button onClick={copyGuestLink} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl" title="Link para Invitados"><LinkIcon size={16}/></button>
                      <button onClick={handleShareTV} className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl" title="Compartir Galería"><Share2 size={16}/></button>
                      <button onClick={() => navigate(`/live-gallery/${events[0].eventCode}`)} className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-2xl hover:bg-gray-200 transition-all shadow-xl" title="Ver Pantalla de Proyección"><Monitor size={16}/></button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h4 className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase">Live Gallery</h4>
                    <span className="text-[9px] font-black text-white bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase">{events[0].liveGallery?.length || 0} Items</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-[300px] overflow-y-auto scrollbar-custom pr-1">
                    {events[0].liveGallery?.map((url, i) => (
                      <motion.div key={i} whileHover={{ scale: 0.95 }} className="relative aspect-square rounded-2xl overflow-hidden group border border-white/10 shadow-lg cursor-pointer" onClick={() => setPreviewImage(url)}>
                        <img src={url} className="w-full h-full object-cover" alt="Content" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center pb-2">
                          <button onClick={async (e) => { e.stopPropagation(); await updateDoc(doc(db, "events", events[0].id), { liveGallery: arrayRemove(url) }); }} className="p-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full shadow-xl"><Trash2 size={12} /></button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center opacity-40 border border-dashed border-white/10 rounded-3xl flex flex-col items-center gap-6 bg-black/20">
                 <QrCode size={48} strokeWidth={1} className="text-gray-500"/>
                 <button onClick={() => setIsCreatingEvent(true)} className="px-8 py-3.5 bg-white text-black rounded-2xl font-black text-[9px] tracking-widest uppercase hover:bg-gray-200 transition-all">CREAR NUEVO EVENTO</button>
              </div>
            )}
          </section>

          {/* SECCIONES INFERIORES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-[#0c0c0e] p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl text-left">
              <h3 className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase flex items-center gap-3 font-normal"><MessageSquare size={14} className="text-white"/> MENSAJES</h3>
              <div className="space-y-1">
                {messages.length === 0 ? <p className="text-[8px] text-gray-600 uppercase py-8 text-center tracking-widest font-black">Sin conversaciones activas</p> : messages.map(chat => (
                  <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex items-center justify-between p-4 hover:bg-white/[0.03] rounded-2xl cursor-pointer group transition-all border-b border-white/5 last:border-0 leading-none">
                    <div className="flex items-center gap-4 leading-none">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[9px] font-black border border-white/10 uppercase text-white">DN</div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black tracking-[0.15em] text-white uppercase leading-none">{chat.professionalName || 'TALENTO'}</p>
                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest leading-none">Consultas enviadas</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-gray-600 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </section>
            
            <section className="bg-[#0c0c0e] p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl text-left leading-none">
              <h3 className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase flex items-center gap-3 font-normal"><Heart size={14} className="text-white fill-white"/> MIS FAVORITOS</h3>
              <div className="grid grid-cols-1 gap-2">
                {favorites.length === 0 ? <p className="text-[8px] text-gray-600 uppercase py-8 text-center tracking-widest font-black">Sin talentos guardados</p> : favorites.map((fav, i) => (
                  <motion.div whileHover={{ x: 5 }} key={i} onClick={() => navigate(`/profile/${fav.id}`)} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/[0.06] transition-all truncate flex justify-between items-center group leading-none">
                     <span className="leading-none text-white">{fav.name || "Talento Pro"}</span>
                     <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0 text-white" />
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* MODAL PREVIEW IMAGEN */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
            <div className="relative max-w-4xl max-h-[90vh]">
              <button className="absolute -top-12 right-0 text-white p-2"><X size={24}/></button>
              <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] rounded-2xl border border-white/10 object-contain shadow-2xl" />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODALES EDICIÓN Y CREACIÓN */}
      <AnimatePresence>
        {(isEditingProfile || isCreatingEvent) && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[250] flex items-center justify-center p-6 antialiased uppercase">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0c0c0e] border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full space-y-8 text-center shadow-2xl relative">
              <button onClick={() => { setIsEditingProfile(false); setIsCreatingEvent(false); }} className="absolute top-8 right-8 text-gray-500 hover:text-white p-2"><X size={20} /></button>
              
              {isEditingProfile ? (
                <>
                  <h3 className="text-[13px] font-['Poppins'] tracking-[0.3em] uppercase text-white border-b border-white/5 pb-6 text-left leading-none font-normal">Identidad Organizador</h3>
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative group w-24 h-24">
                      <div className="w-full h-full rounded-2xl border border-white/10 overflow-hidden bg-white/5 shadow-xl flex items-center justify-center relative leading-none">
                        {profile.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" /> : <User size={36} className="text-gray-500"/>}
                        {uploading && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[9px] font-black tracking-widest text-white">CARGANDO</div>}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-2xl leading-none">
                        <Camera size={24} className="text-white"/><input type="file" onChange={async (e) => {
                          const file = e.target.files[0]; if (!file) return; setUploading(true); const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', UPLOAD_PRESET);
                          try { const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData }); const data = await res.json();
                            if (data.secure_url) { setProfile(prev => ({ ...prev, photoURL: data.secure_url })); await updateDoc(doc(db, "users", auth.currentUser.uid), { photoURL: data.secure_url }); }
                          } catch (err) { console.error(err); } finally { setUploading(false); }
                        }} className="hidden" />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-6 text-left">
                    <div className="space-y-2"><label className="text-[8px] text-gray-500 font-black uppercase tracking-[0.3em] pl-1">Nombre Organizador</label><input className="w-full bg-black border border-white/10 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-white transition-all text-white shadow-inner" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div>
                    <div className="space-y-2"><label className="text-[8px] text-gray-500 font-black uppercase tracking-[0.3em] pl-1">Sede Central</label><input className="w-full bg-black border border-white/10 p-4 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-white transition-all text-white shadow-inner" value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2"><button onClick={() => setIsEditingProfile(false)} className="py-4 bg-white/5 text-gray-400 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all hover:bg-white/10">DESCARTAR</button><button onClick={handleSaveProfile} className="py-4 bg-white text-black rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-gray-200 transition-all">GUARDAR</button></div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-white border border-white/10 shadow-inner leading-none"><Plus size={28}/></div>
                  <div className="space-y-2 text-center leading-none font-normal">
                    <h3 className="text-[16px] font-['Poppins'] tracking-[0.2em] uppercase text-white">Nuevo Evento</h3>
                    <p className="text-[8px] text-gray-500 uppercase tracking-[0.3em]">Live Gallery Config</p>
                  </div>
                  <input autoFocus className="w-full bg-black border border-white/10 p-5 rounded-2xl text-[12px] font-black uppercase text-center outline-none focus:border-white transition-all text-white tracking-widest" placeholder="NOMBRE DEL EVENTO" value={newEventName} onChange={e => setNewEventName(e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setIsCreatingEvent(false)} className="py-4 bg-white/5 text-gray-400 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10">CANCELAR</button>
                    <button onClick={handleCreateEvent} className="py-4 bg-white text-black rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-200 shadow-xl">INICIAR</button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}