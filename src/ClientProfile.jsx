import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, setDoc, collection, query, where, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  Search, LogOut, User, QrCode, Calendar, MapPin, 
  Trash2, Plus, Edit3, Share2, Power, Link as LinkIcon, Pause, Play, LayoutGrid, ImageIcon, X
} from 'lucide-react'; 
import CustomModal from './components/CustomModal'; 
import EventOrganizer from './components/EventOrganizer';
import LiveControlPanel from './components/LiveControlPanel';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientProfile() {
  const navigate = useNavigate();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [activeTab, setActiveTab] = useState('live'); 
  const [loading, setLoading] = useState(true);
  
  const [events, setEvents] = useState([]);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0); 
  const [profile, setProfile] = useState({ name: '', location: '', interests: '', photoURL: '' });
  const [previewImage, setPreviewImage] = useState(null);

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setProfile(prev => ({ ...prev, ...docSnap.data() }));
          }
          setLoading(false);
        });

        onSnapshot(query(collection(db, "events"), where("clientId", "==", user.uid)), (snap) => {
          const fetchedEvents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setEvents(fetchedEvents);
        });
      } else { 
        navigate('/'); 
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const currentEvent = events[selectedEventIndex] || events[0];

  const handleEventCreated = (newEvent) => {
    setIsCreatingEvent(false);
    setModal({ isOpen: true, title: "ÉXITO", message: `SISTEMA CREADO: ${newEvent.eventCode}`, type: "success" });
  };

  const copyGuestLink = () => {
    if (!currentEvent) return;
    navigator.clipboard.writeText(`https://www.classcode.com.ar/guest-upload/${currentEvent.eventCode || currentEvent.id}`);
    setModal({ isOpen: true, title: "GUEST LINK", message: "LINK DE SUBIDA COPIADO.", type: "success" });
  };

  const handleShareTV = () => {
    if (!currentEvent) return;
    navigator.clipboard.writeText(`https://www.classcode.com.ar/live-gallery/${currentEvent.eventCode || currentEvent.id}`);
    setModal({ isOpen: true, title: "LIVE GALLERY", message: "LINK DE PROYECCIÓN COPIADO.", type: "success" });
  };

  const handleOpenTV = () => {
    if (!currentEvent) return;
    navigate(`/live-gallery/${currentEvent.eventCode || currentEvent.id}`);
  };

  const togglePause = async () => {
    if (!currentEvent) return;
    const newStatus = currentEvent.status === 'paused' ? 'active' : 'paused';
    await updateDoc(doc(db, "events", currentEvent.id), { status: newStatus });
  };
  
  const confirmFinish = () => {
    if (!currentEvent) return;
    setModal({
      isOpen: true,
      title: "APAGAR SISTEMA",
      message: "¿TERMINAR RECEPCIÓN DE FOTOS? LOS INVITADOS YA NO PODRÁN SUBIR CONTENIDO.",
      type: 'warning',
      onConfirm: async () => {
        await updateDoc(doc(db, "events", currentEvent.id), { status: 'finished' });
        setModal({ isOpen: false });
      }
    });
  };

  const confirmDelete = (id, e) => {
    if (e) e.stopPropagation();
    setModal({
      isOpen: true,
      title: "ELIMINAR PROYECTO",
      message: "¿ESTÁS SEGURO? ESTA ACCIÓN ELIMINARÁ EL PROYECTO Y SU CONTENIDO PERMANENTEMENTE.",
      type: 'warning',
      onConfirm: async () => {
        await deleteDoc(doc(db, "events", id));
        setModal({ isOpen: false });
      }
    });
  };

  if (loading) return <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-['Poppins']">Sincronizando...</div>;

  return (
    <div className="min-h-screen bg-[#070709] text-white font-['Open_Sans'] flex overflow-x-hidden uppercase antialiased relative text-left">
      
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 bg-[#070709]/90 backdrop-blur-3xl border-r border-white/5 flex-col p-10 fixed h-full z-50">
        <header className="mb-12 text-left leading-none">
          <div onClick={() => navigate('/home')} className="text-[20px] font-['Poppins'] tracking-[0.05em] cursor-pointer text-white">CLASSCODE</div>
          <p className="text-gray-400 text-[8px] tracking-[0.3em] mt-2">Experience</p>
        </header>

        <nav className="flex-1 space-y-6 text-left font-['Poppins']">
          <button onClick={() => setActiveTab('live')} className={`flex items-center gap-4 text-[10px] tracking-widest transition-all ${activeTab === 'live' ? 'text-white' : 'text-gray-400'}`}>
            <QrCode size={18}/> LIVE CONTROL
          </button>
          <button onClick={() => setActiveTab('events')} className={`flex items-center gap-4 text-[10px] tracking-widest transition-all ${activeTab === 'events' ? 'text-white' : 'text-gray-400'}`}>
            <LayoutGrid size={18}/> MIS EVENTOS ({events.length})
          </button>
          <button onClick={() => navigate('/home')} className="flex items-center gap-4 text-gray-400 hover:text-white text-[10px] tracking-widest transition-all">
            <Search size={18}/> EXPLORAR
          </button>
        </nav>
        
        <button onClick={() => auth.signOut()} className="flex items-center gap-4 text-gray-600 hover:text-red-400 text-[10px] tracking-widest transition-all mt-auto pt-8 border-t border-white/5">
          <LogOut size={18}/> CERRAR SESIÓN
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-6 md:p-12 mt-16 md:mt-0 relative z-10 w-full max-w-[1400px] mx-auto space-y-8">
        
        <header className="flex justify-between items-center bg-[#0c0c0e] border border-white/5 p-5 md:p-6 rounded-3xl backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
              {profile.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" /> : <User size={24} className="text-gray-500"/>}
            </div>
            <div className="text-left leading-none">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] md:text-[16px] font-['Poppins'] text-white">{profile.name || 'ORGANIZADOR'}</h2>
                <button onClick={() => setIsEditingProfile(true)} className="text-gray-500 hover:text-white transition-colors"><Edit3 size={14} /></button>
              </div>
              <p className="text-[8px] text-gray-400 tracking-[0.3em] mt-1.5">{profile.location || 'BUENOS AIRES'}</p>
            </div>
          </div>
          
          <button onClick={() => setIsCreatingEvent(true)} className="px-5 py-3 bg-white text-black rounded-xl text-[9px] flex items-center gap-2 hover:bg-gray-200 transition-all tracking-widest font-['Poppins']">
            <Plus size={14}/> NUEVO EVENTO
          </button>
        </header>

        {activeTab === 'live' && (
          <LiveControlPanel 
            currentEvent={currentEvent}
            events={events}
            selectedEventIndex={selectedEventIndex}
            setSelectedEventIndex={setSelectedEventIndex}
            onTogglePause={togglePause}
            onConfirmFinish={confirmFinish}
            onCopyGuestLink={copyGuestLink}
            onShareTV={handleShareTV}
            onOpenTV={handleOpenTV}
            onOpenCreate={() => setIsCreatingEvent(true)}
            setPreviewImage={setPreviewImage}
          />
        )}

        {activeTab === 'events' && (
          <section className="space-y-6">
            <h3 className="text-[10px] text-gray-400 tracking-[0.4em]">Gestión de Eventos Creados</h3>
            
            {events.length === 0 ? (
              <div className="py-20 text-center border border-white/5 rounded-3xl bg-[#0c0c0e] space-y-4">
                <Calendar size={32} className="mx-auto text-white/20" />
                <p className="text-[9px] text-gray-500 tracking-[0.3em]">No hay eventos registrados</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((ev, idx) => (
                  <div key={ev.id} onClick={() => { setSelectedEventIndex(idx); setActiveTab('live'); }} className="bg-[#0c0c0e] border border-white/10 hover:border-white/30 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xl cursor-pointer transition-all group">
                    <div className="relative w-full h-36 bg-black/40 overflow-hidden border-b border-white/5 flex items-center justify-center">
                      <ImageIcon size={24} className="text-white/20" />
                      <div className="absolute top-3 left-3">
                        <span className="text-[7px] tracking-[0.3em] px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-gray-300">
                          {ev.category || 'EVENTO'}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <h4 className="text-sm font-['Poppins'] text-white group-hover:text-gray-200">{ev.eventName || ev.title}</h4>
                      <div className="space-y-1 text-[9px] text-gray-400">
                        {ev.date && <p className="flex items-center gap-2"><Calendar size={12}/> {ev.date}</p>}
                        {ev.location && <p className="flex items-center gap-2"><MapPin size={12}/> {ev.location}</p>}
                      </div>

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[8px] text-emerald-400 tracking-widest">VER LIVE CONTROL</span>
                        <button onClick={(e) => confirmDelete(ev.id, e)} className="p-2 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </main>

      {/* Modal Organizer */}
      <AnimatePresence>
        {isCreatingEvent && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[250] flex items-center justify-center p-4 uppercase">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <EventOrganizer 
                onClose={() => setIsCreatingEvent(false)} 
                onEventCreated={handleEventCreated} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewImage(null)} className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out">
            <button className="absolute top-8 right-8 text-white/50 hover:text-white p-2"><X size={28}/></button>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={previewImage} className="max-w-full max-h-[85vh] rounded-2xl border border-white/10 object-contain" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} onConfirm={modal.onConfirm} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
}