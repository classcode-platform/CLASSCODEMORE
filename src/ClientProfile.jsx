import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, collection, query, where, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  Search, LogOut, User, Calendar, MapPin, 
  Trash2, Plus, Edit3, LayoutGrid, ImageIcon, X, ChevronRight, QrCode, RefreshCcw
} from 'lucide-react'; 
import CustomModal from './components/CustomModal'; 
import EventOrganizer from './components/EventOrganizer';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientProfile() {
  const navigate = useNavigate();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  
  // Switch de Modos: 'experience' o 'talent'
  const [profileMode, setProfileMode] = useState('experience'); 
  const [loading, setLoading] = useState(true);
  
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState({ name: '', location: '', interests: '', photoURL: '' });
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedEventForQr, setSelectedEventForQr] = useState(null);

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Cargar datos del perfil de usuario
        onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setProfile(prev => ({ ...prev, ...docSnap.data() }));
          }
          setLoading(false);
        });

        // Consulta unificada a 'events_organizer' para el contador y grilla real
        const qEvents = query(collection(db, "events_organizer"), where("userId", "==", user.uid));
        onSnapshot(qEvents, (snap) => {
          const fetchedEvents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          fetchedEvents.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setEvents(fetchedEvents);
        });
      } else { 
        navigate('/'); 
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const confirmDelete = (id, e) => {
    if (e) e.stopPropagation();
    setModal({
      isOpen: true,
      title: "ELIMINAR PROYECTO",
      message: "¿ESTÁS SEGURO? ESTA ACCIÓN ELIMINARÁ EL PROYECTO Y SU CONTENIDO PERMANENTEMENTE.",
      type: 'warning',
      onConfirm: async () => {
        await deleteDoc(doc(db, "events_organizer", id));
        setModal({ isOpen: false });
      }
    });
  };

  const handleToggleStatus = async (ev, e) => {
    if (e) e.stopPropagation();
    const nextStatus = ev.status === 'PLANIFICACION' ? 'EN_CURSO' : ev.status === 'EN_CURSO' ? 'FINALIZADO' : 'PLANIFICACION';
    try {
      await updateDoc(doc(db, "events_organizer", ev.id), { status: nextStatus });
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-['Poppins']">Sincronizando...</div>;

  return (
    <div className="min-h-screen bg-[#070709] text-white font-['Open_Sans'] flex overflow-x-hidden uppercase antialiased relative text-left">
      
      {/* Sidebar de Navegación con Switch de Estilo Pill Elegante */}
      <aside className="hidden md:flex w-72 bg-[#070709]/90 backdrop-blur-3xl border-r border-white/5 flex-col p-10 fixed h-full z-50">
        <header className="mb-10 text-left leading-none">
          <div onClick={() => navigate('/home')} className="text-[20px] font-['Poppins'] tracking-[0.05em] cursor-pointer text-white">CLASSCODE</div>
          
          {/* SWITCH DE MODOS: ESTILO PILL / BOTÓN ÚNICO ELEGANTE */}
          <div className="mt-6 text-left">
            <button 
              onClick={() => setProfileMode(profileMode === 'experience' ? 'talent' : 'experience')} 
              className="w-full flex items-center justify-between bg-white/[0.03] border border-white/10 p-3.5 rounded-full group hover:bg-purple-500/10 transition-all leading-none box-border cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left leading-none">
                <div className="p-2 bg-purple-500/10 rounded-full text-purple-400">
                  <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                </div>
                <div>
                  <p className="text-[6px] font-black text-gray-500 tracking-[0.2em] leading-none">MODO</p>
                  <p className="text-[9px] font-black text-white tracking-widest uppercase mt-1 leading-none">{profileMode === 'experience' ? 'LIVE EXPERIENCE' : 'TALENT'}</p>
                </div>
              </div>
              <div className="w-7 h-3.5 bg-purple-600/30 rounded-full relative p-0.5 border border-purple-500/50 flex items-center">
                <div className={`w-2.5 h-2.5 bg-purple-400 rounded-full shadow-md transform transition-transform ${profileMode === 'talent' ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
              </div>
            </button>
          </div>
        </header>

        <nav className="flex-1 space-y-6 text-left font-['Poppins']">
          <button 
            onClick={() => setProfileMode('experience')} 
            className={`flex items-center gap-4 text-[10px] tracking-widest transition-all ${profileMode === 'experience' ? 'text-white' : 'text-gray-400'}`}
          >
            <LayoutGrid size={18}/> ORGANIZADOR ({events.length})
          </button>
          
          <button onClick={() => navigate('/home')} className="flex items-center gap-4 text-gray-400 hover:text-white text-[10px] tracking-widest transition-all">
            <Search size={18}/> EXPLORAR
          </button>
        </nav>
        
        <button onClick={() => auth.signOut()} className="flex items-center gap-4 text-gray-600 hover:text-red-400 text-[10px] tracking-widest transition-all mt-auto pt-8 border-t border-white/5">
          <LogOut size={18}/> CERRAR SESIÓN
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-6 md:p-12 mt-16 md:mt-0 relative z-10 w-full max-w-[1400px] mx-auto space-y-8">
        
        {/* Header del Perfil */}
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
              <p className="text-[8px] text-gray-400 tracking-[0.3em] mt-1.5">MODO: {profileMode.toUpperCase()}</p>
            </div>
          </div>
          
          <button onClick={() => setIsCreatingEvent(true)} className="px-5 py-3 bg-white text-black rounded-xl text-[9px] flex items-center gap-2 hover:bg-gray-200 transition-all tracking-widest font-['Poppins']">
            <Plus size={14}/> NUEVO EVENTO
          </button>
        </header>

        {/* VISTA SEGÚN EL MODO SELECCIONADO */}
        {profileMode === 'experience' ? (
          <section className="space-y-6">
            <h3 className="text-[10px] text-gray-400 tracking-[0.4em]">Panel Experience ({events.length})[cite: 4]</h3>
            
            {events.length === 0 ? (
              <div className="py-20 text-center border border-white/5 rounded-3xl bg-[#0c0c0e] space-y-4">
                <Calendar size={32} className="mx-auto text-white/20" />
                <p className="text-[9px] text-gray-500 tracking-[0.3em]">No hay eventos registrados</p>
                <button onClick={() => setIsCreatingEvent(true)} className="px-6 py-3 bg-white text-black rounded-xl text-[9px] tracking-widest hover:bg-gray-200 transition-all font-['Poppins']">
                  CREAR PRIMER EVENTO
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((ev) => (
                  <div 
                    key={ev.id} 
                    onClick={() => navigate(`/organizer/${ev.id}`)} 
                    className="bg-[#0c0c0e] border border-white/10 hover:border-white/30 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xl cursor-pointer transition-all group"
                  >
                    <div className="relative w-full h-36 bg-black/40 overflow-hidden border-b border-white/5 flex items-center justify-center">
                      {ev.coverImage ? (
                        <img src={ev.coverImage} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" />
                      ) : (
                        <ImageIcon size={24} className="text-white/20" />
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="text-[7px] tracking-[0.3em] px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-gray-300">
                          {ev.category || 'EVENTO'}[cite: 4]
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <button 
                          onClick={(e) => handleToggleStatus(ev, e)} 
                          className={`text-[7px] tracking-widest font-black px-2.5 py-1 rounded-full border backdrop-blur-md transition-all ${
                            ev.status === 'FINALIZADO' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            ev.status === 'EN_CURSO' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                            'bg-black/60 text-gray-300 border-white/10'
                          }`}
                        >
                          {ev.status}[cite: 4]
                        </button>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <h4 className="text-sm font-['Poppins'] text-white group-hover:text-gray-200 flex items-center justify-between">
                        {ev.title}[cite: 4]
                        <ChevronRight size={16} className="text-white/40 group-hover:translate-x-1 transition-transform" />
                      </h4>
                      <div className="space-y-1 text-[9px] text-gray-400">
                        {ev.date && <p className="flex items-center gap-2"><Calendar size={12}/> {ev.date}[cite: 4]</p>}
                        {ev.location && <p className="flex items-center gap-2"><MapPin size={12}/> {ev.location}[cite: 4]</p>}
                      </div>

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedEventForQr(ev); setShowQrModal(true); }} 
                          className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/10 text-[8px] font-black tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                          <QrCode size={13}/> QR
                        </button>
                        <button 
                          onClick={(e) => confirmDelete(ev.id, e)} 
                          className="p-2.5 bg-white/[0.03] hover:bg-red-500/25 hover:text-red-400 border border-white/10 rounded-xl transition-all text-gray-500"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-6">
            <h3 className="text-[10px] text-gray-400 tracking-[0.4em]">Panel Talent[cite: 4]</h3>
            <div className="py-20 text-center border border-white/5 rounded-3xl bg-[#0c0c0e] space-y-4">
              <User size={32} className="mx-auto text-white/20" />
              <p className="text-[9px] text-gray-500 tracking-[0.3em]">Vista Talent Activa</p>
            </div>
          </section>
        )}

      </main>

      {/* Modal Creador de Eventos */}
      <AnimatePresence>
        {isCreatingEvent && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[250] flex items-center justify-center p-4 uppercase">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <EventOrganizer onClose={() => setIsCreatingEvent(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal QR */}
      <AnimatePresence>
        {showQrModal && selectedEventForQr && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0c0c0e] w-full max-w-sm p-8 rounded-[3rem] border border-white/10 relative shadow-2xl text-center space-y-6"
            >
              <button onClick={() => setShowQrModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
              
              <div className="space-y-2">
                <span className="text-[8px] tracking-[0.3em] font-black text-gray-400">QR INVITADOS</span>
                <h3 className="text-xl font-['Poppins'] font-normal text-white">{selectedEventForQr.title}[cite: 4]</h3>
              </div>

              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl flex items-center justify-center shadow-xl">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://www.classcode.com.ar/guest/${selectedEventForQr.id}`} 
                  alt="QR Invitados" 
                  className="w-full h-full object-contain"
                />
              </div>

              <button onClick={() => {
                navigator.clipboard.writeText(`https://www.classcode.com.ar/guest/${selectedEventForQr.id}`);
                setModal({ isOpen: true, title: "GUEST LINK", message: "LINK DE SUBIDA COPIADO.", type: "success" });
                setShowQrModal(false);
              }} className="w-full py-3.5 rounded-xl bg-white text-black font-black text-[9px] tracking-widest uppercase hover:bg-gray-200 transition-all font-['Poppins']">
                COPIAR LINK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} onConfirm={modal.onConfirm} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
}