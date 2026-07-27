import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, collection, query, where, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  Search, LogOut, User, Calendar, MapPin, 
  Trash2, Plus, Edit3, LayoutGrid, ImageIcon, X, ChevronRight, QrCode,
  RefreshCcw, Menu
} from 'lucide-react'; 
import CustomModal from './components/CustomModal'; 
import EventOrganizer from './components/EventOrganizer';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientProfile() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState({ name: '', location: '', interests: '', photoURL: '' });
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedEventForQr, setSelectedEventForQr] = useState(null);

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

  const handleSwitchToTalent = async () => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { role: 'talent' });
      navigate('/dashboard');
    } catch (error) { console.error(error); }
  };

  if (loading) return <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-['Poppins']">Sincronizando...</div>;

  return (
    <div className="min-h-screen w-full bg-[#070709] text-white font-['Open_Sans'] flex flex-col md:flex-row overflow-x-hidden uppercase antialiased relative text-left box-border m-0 p-0">
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] md:blur-[150px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[90px] md:blur-[130px]" />
      </div>

      <header className="md:hidden fixed top-0 left-0 right-0 w-full bg-black/60 backdrop-blur-xl border-b border-white/5 z-[100] px-8 py-6 flex justify-between items-center box-border">
        <div onClick={() => navigate('/home')} className="text-[18px] font-['Poppins'] font-normal tracking-[0.05em] uppercase cursor-pointer text-white">CLASSCODE</div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white cursor-pointer"><Menu size={28} /></button>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[110] md:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#050505] z-[120] p-12 flex flex-col md:hidden shadow-2xl box-border overflow-y-auto">
              <button onClick={() => setIsMobileMenuOpen(false)} className="self-end mb-12 text-gray-500 hover:text-white transition-colors cursor-pointer"><X size={32} /></button>
              
              <button onClick={handleSwitchToTalent} className="mb-12 w-full flex items-center justify-between bg-white/[0.03] border border-white/10 p-5 rounded-2xl group hover:bg-purple-500/10 transition-all box-border cursor-pointer">
                <div className="flex items-center gap-4 text-left leading-none">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400"><RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-700" /></div>
                  <div>
                    <p className="text-[7px] font-black text-gray-500 tracking-[0.2em]">SWITCH MOOD</p>
                    <p className="text-[11px] font-black text-white tracking-widest uppercase leading-none mt-1">MODO TALENT</p>
                  </div>
                </div>
              </button>

              <nav className="flex-1 space-y-12">
                <button onClick={() => { navigate('/client-profile'); setIsMobileMenuOpen(false); }} className="flex items-center gap-6 text-[12px] font-black tracking-widest text-purple-500 uppercase cursor-pointer"><LayoutGrid size={22}/> ORGANIZADOR</button>
                <button onClick={() => { navigate('/home'); setIsMobileMenuOpen(false); }} className="flex items-center gap-6 text-[12px] font-black tracking-widest text-gray-400 uppercase cursor-pointer"><Search size={22}/> EXPLORAR</button>
              </nav>

              <button onClick={() => { auth.signOut(); setIsMobileMenuOpen(false); }} className="flex items-center gap-6 text-gray-700 text-[10px] font-black tracking-widest uppercase mt-8 cursor-pointer"><LogOut size={20}/> SALIR</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-72 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex-col p-10 fixed h-full z-50 box-border">
        <header className="mb-12 text-left leading-none">
          <div onClick={() => navigate('/home')} className="text-[22px] font-['Poppins'] font-normal tracking-[0.05em] leading-none cursor-pointer uppercase text-white">CLASSCODE</div>
          <p className="text-purple-400 text-[10px] font-bold tracking-[0.3em] mt-2 leading-none uppercase">Experience</p>
        </header>
        
        <div className="mb-12 text-left">
          <button onClick={handleSwitchToTalent} className="w-full flex items-center justify-between bg-white/[0.03] border border-white/10 p-4 rounded-2xl group hover:bg-purple-500/10 transition-all leading-none box-border cursor-pointer">
            <div className="flex items-center gap-3 text-left leading-none">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <div>
                <p className="text-[6px] font-black text-gray-500 tracking-[0.2em] leading-none">SWITCH MOOD</p>
                <p className="text-[9px] font-black text-white tracking-widest uppercase mt-1 leading-none">MODO TALENT</p>
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 space-y-8 text-left">
          <button onClick={() => navigate('/client-profile')} className="flex items-center gap-4 text-white text-[10px] font-black tracking-widest leading-none transition-all cursor-pointer"><LayoutGrid size={18} className="text-purple-500"/> ORGANIZADOR</button>
          <button onClick={() => navigate('/home')} className="flex items-center gap-4 text-gray-500 hover:text-white text-[10px] font-black tracking-widest leading-none transition-all cursor-pointer"><Search size={18}/> EXPLORAR</button>
        </nav>

        <button onClick={() => auth.signOut()} className="flex items-center gap-4 text-gray-700 hover:text-red-500 text-[10px] font-black tracking-widest transition-all mt-auto pt-8 border-t border-white/5 leading-none cursor-pointer"><LogOut size={18}/> CERRAR SESIÓN</button>
      </aside>

      <main className="flex-1 md:ml-72 p-6 md:p-12 mt-16 md:mt-0 relative z-10 w-full max-w-[1400px] mx-auto space-y-8 box-border">
        
        <header className="flex justify-between items-center bg-[#0c0c0e]/80 border border-white/5 p-5 md:p-6 rounded-3xl backdrop-blur-md shadow-xl box-border">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center flex-shrink-0">
              {profile.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" /> : <User size={24} className="text-gray-500"/>}
            </div>
            <div className="text-left leading-none min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] md:text-[16px] font-['Poppins'] text-white truncate">{profile.name || 'ORGANIZADOR'}</h2>
                <button onClick={() => setIsEditingProfile(true)} className="text-gray-500 hover:text-white transition-colors cursor-pointer flex-shrink-0"><Edit3 size={14} /></button>
              </div>
              <p className="text-[8px] text-purple-400 font-bold tracking-[0.3em] mt-1.5 uppercase">MODO EXPERIENCE</p>
            </div>
          </div>
          
          <button onClick={() => setIsCreatingEvent(true)} className="px-5 py-3.5 bg-purple-600 text-white rounded-xl text-[9px] font-black flex items-center gap-2 hover:bg-purple-500 transition-all tracking-widest font-['Poppins'] cursor-pointer shadow-xl flex-shrink-0">
            <Plus size={14}/> NUEVO EVENTO
          </button>
        </header>

        <section className="space-y-6">
          <div className="flex justify-between items-center border-l-2 border-purple-500 pl-4">
            <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.4em] font-black">Panel Experience</h3>
          </div>
          
          {events.length === 0 ? (
            <div className="py-20 text-center border border-white/5 rounded-3xl bg-[#0c0c0e]/80 space-y-4 shadow-xl">
              <Calendar size={32} className="mx-auto text-white/20" />
              <p className="text-[9px] text-gray-500 tracking-[0.3em] font-black">No hay eventos registrados</p>
              <button onClick={() => setIsCreatingEvent(true)} className="px-6 py-3.5 bg-purple-600 text-white rounded-xl text-[9px] font-black tracking-widest hover:bg-purple-500 transition-all font-['Poppins'] cursor-pointer shadow-xl">
                CREAR PRIMER EVENTO
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => (
                <div 
                  key={ev.id} 
                  onClick={() => navigate(`/organizer/${ev.id}`)} 
                  className="bg-[#0c0c0e]/80 border border-white/10 hover:border-purple-500/30 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xl cursor-pointer transition-all group box-border"
                >
                  <div className="relative w-full h-36 bg-black/40 overflow-hidden border-b border-white/5 flex items-center justify-center">
                    {ev.coverImage ? (
                      <img src={ev.coverImage} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" />
                    ) : (
                      <ImageIcon size={24} className="text-white/20" />
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="text-[7px] tracking-[0.3em] font-black px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-gray-300 uppercase">
                        {ev.category || 'EVENTO'}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <button 
                        onClick={(e) => handleToggleStatus(ev, e)} 
                        className={`text-[7px] tracking-widest font-black px-2.5 py-1 rounded-full border backdrop-blur-md transition-all uppercase ${
                          ev.status === 'FINALIZADO' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          ev.status === 'EN_CURSO' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          'bg-black/60 text-gray-300 border-white/10'
                        }`}
                      >
                        {ev.status}
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <h4 className="text-sm font-['Poppins'] text-white group-hover:text-purple-300 flex items-center justify-between transition-colors">
                      {ev.title}
                      <ChevronRight size={16} className="text-white/40 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <div className="space-y-1 text-[9px] text-gray-400 font-bold uppercase">
                      {ev.date && <p className="flex items-center gap-2"><Calendar size={12} className="text-purple-400"/> {ev.date}</p>}
                      {ev.location && <p className="flex items-center gap-2"><MapPin size={12} className="text-purple-400"/> {ev.location}</p>}
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedEventForQr(ev); setShowQrModal(true); }} 
                        className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/10 text-[8px] font-black tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <QrCode size={13} className="text-purple-400"/> QR
                      </button>
                      <button 
                        onClick={(e) => confirmDelete(ev.id, e)} 
                        className="p-2.5 bg-white/[0.03] hover:bg-red-500/25 hover:text-red-400 border border-white/10 rounded-xl transition-all text-gray-500 cursor-pointer"
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

      </main>

      <AnimatePresence>
        {isCreatingEvent && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[250] flex items-center justify-center p-4 uppercase">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <EventOrganizer onClose={() => setIsCreatingEvent(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQrModal && selectedEventForQr && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0c0c0e] w-full max-w-sm p-8 rounded-[3rem] border border-white/10 relative shadow-2xl text-center space-y-6 uppercase"
            >
              <button onClick={() => setShowQrModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
              
              <div className="space-y-2">
                <span className="text-[8px] tracking-[0.3em] font-black text-gray-400">QR INVITADOS</span>
                <h3 className="text-xl font-['Poppins'] font-normal text-white">{selectedEventForQr.title}</h3>
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
              }} className="w-full py-3.5 rounded-xl bg-purple-600 text-white font-black text-[9px] tracking-widest uppercase hover:bg-purple-500 transition-all font-['Poppins'] cursor-pointer shadow-xl">
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