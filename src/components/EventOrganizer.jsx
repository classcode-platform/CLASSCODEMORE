import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Calendar, MapPin, QrCode, Trash2, X, ChevronRight, Image as ImageIcon, ExternalLink, Sparkles } from 'lucide-react';
import CustomModal from './CustomModal';

const MACRO_CATEGORIES = [
  "CAMPAÑA",
  "EVENTOS SOCIALES",
  "RECITALES Y SHOWS",
  "PRODUCCIÓN AUDIOVISUAL",
  "CORPORATIVOS"
];

export default function EventOrganizer() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });

  const [formData, setFormData] = useState({
    title: '',
    category: 'EVENTOS SOCIALES',
    date: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    
    let q;
    if (clientId) {
      q = query(
        collection(db, "events_organizer"),
        where("userId", "==", auth.currentUser.uid),
        where("clientId", "==", clientId)
      );
    } else {
      q = query(
        collection(db, "events_organizer"),
        where("userId", "==", auth.currentUser.uid)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setEvents(docs);
    }, (error) => {
      console.error("Error cargando eventos:", error);
    });

    return () => unsubscribe();
  }, [clientId]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      alert("Completá al menos el título y la fecha.");
      return;
    }

    if (!auth.currentUser) {
      alert("Debes iniciar sesión para crear un evento.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "events_organizer"), {
        userId: auth.currentUser.uid,
        clientId: clientId || '',
        title: formData.title.toUpperCase(),
        category: formData.category,
        date: formData.date,
        location: formData.location ? formData.location.toUpperCase() : '',
        notes: formData.notes ? formData.notes.toUpperCase() : '',
        coverImage: '',
        status: 'PLANIFICACION',
        createdAt: serverTimestamp()
      });
      
      setFormData({ title: '', category: 'EVENTOS SOCIALES', date: '', location: '', notes: '' });
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error al crear:", error);
      alert("Error al guardar en Firebase.");
    }
    setLoading(false);
  };

  const handleDeleteEvent = async (id, e) => {
    e.stopPropagation();
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

  const copyGuestLink = (id) => {
    navigator.clipboard.writeText(`https://www.classcode.com.ar/guest/${id}`);
    setModal({ isOpen: true, title: "GUEST LINK", message: "LINK DE SUBIDA COPIADO.", type: "success" });
  };

  const handleOpenLiveGallery = (id, e) => {
    if (e) e.stopPropagation();
    navigate(`/live-gallery/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] antialiased flex flex-col relative uppercase selection:bg-white selection:text-black text-left overflow-hidden">
      
      {/* LUCES DINÁMICAS DE FONDO */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [-60, 60, -60], y: [-40, 40, -40], scale: [1, 1.3, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} className="absolute top-[-10%] left-[-10%] w-[350px] md:w-[700px] h-[350px] md:h-[700px] bg-purple-600/15 rounded-full blur-[120px] md:blur-[180px]" />
        <motion.div animate={{ x: [60, -60, 60], y: [40, -40, 40], scale: [1.3, 1, 1.3] }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-10%] right-[-10%] w-[300px] md:w-[650px] h-[300px] md:h-[650px] bg-indigo-600/15 rounded-full blur-[110px] md:blur-[160px]" />
      </div>

      {/* NAVBAR CON GLASSORPHISM */}
      <nav className="p-6 md:p-10 w-full sticky top-0 z-50 bg-[#0a0a0a]/60 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center w-full">
          <button 
            onClick={() => navigate('/client-profile')} 
            className="text-gray-400 hover:text-white flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-bold font-['Poppins'] transition-colors cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md"
          >
            <ArrowLeft size={14}/> VOLVER
          </button>
          
          <div className="font-['Poppins']">
            <span className="text-base font-normal tracking-[0.05em] uppercase leading-none">CLASSCODE</span>
          </div>

          <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 rounded-xl bg-white/90 hover:bg-white text-black font-black text-[9px] tracking-widest transition-all flex items-center gap-2 font-['Poppins'] cursor-pointer shadow-xl backdrop-blur-md">
            <Plus size={14} /> NUEVO EVENTO
          </button>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 md:px-12 py-12 flex-1 w-full space-y-10 relative z-10">
        
        <div className="flex flex-col gap-2">
          <span className="text-[9px] tracking-[0.4em] text-gray-400 font-bold">MÓDULO DE GESTIÓN</span>
          <h1 className="text-2xl font-['Poppins'] font-normal tracking-wide text-white">ORGANIZADOR DE EVENTOS</h1>
        </div>

        {events.length === 0 ? (
          <div className="py-24 text-center border border-white/10 rounded-3xl bg-white/[0.02] backdrop-blur-xl space-y-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
            <Calendar size={32} className="mx-auto text-white/20" />
            <p className="text-[10px] text-gray-400 font-bold tracking-[0.3em]">No hay eventos registrados</p>
            <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-white/90 hover:bg-white text-black rounded-2xl text-[9px] font-black tracking-widest font-['Poppins'] cursor-pointer shadow-lg transition-all">
              CREAR EVENTO
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <motion.div 
                key={ev.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.03] border border-white/10 hover:border-white/30 rounded-3xl overflow-hidden flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all group backdrop-blur-xl"
              >
                <div className="relative w-full h-44 bg-black/40 overflow-hidden border-b border-white/10 flex items-center justify-center">
                  {ev.coverImage ? (
                    <img src={ev.coverImage} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" />
                  ) : (
                    <ImageIcon size={24} className="text-white/20" />
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="text-[8px] tracking-[0.3em] font-black px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-gray-300">
                      {ev.category}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <button 
                      onClick={(e) => handleToggleStatus(ev, e)} 
                      className={`text-[8px] tracking-widest font-black px-2.5 py-1 rounded-full border backdrop-blur-xl transition-all cursor-pointer ${
                        ev.status === 'FINALIZADO' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        ev.status === 'EN_CURSO' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-black/40 text-gray-300 border-white/10'
                      }`}
                    >
                      {ev.status}
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-lg font-['Poppins'] font-normal tracking-wide text-white group-hover:text-gray-200">
                      {ev.title}
                    </h3>
                    <div className="space-y-1.5 text-[10px] text-gray-400 font-bold tracking-wider">
                      {ev.date && <p className="flex items-center gap-2"><Calendar size={13} className="text-white"/> {ev.date}</p>}
                      {ev.location && <p className="flex items-center gap-2"><MapPin size={13} className="text-white"/> {ev.location}</p>}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setSelectedEvent(ev); setShowQrModal(true); }} 
                        className="flex-1 py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black tracking-widest flex items-center justify-center gap-2 transition-all font-['Poppins'] cursor-pointer backdrop-blur-md"
                      >
                        <QrCode size={14}/> QR INVITADOS
                      </button>
                      <button 
                        onClick={(e) => handleOpenLiveGallery(ev.id, e)} 
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer backdrop-blur-md text-gray-300 hover:text-white"
                        title="Abrir Live Gallery / Proyección"
                      >
                        <ExternalLink size={16}/>
                      </button>
                      <button 
                        onClick={(e) => handleDeleteEvent(ev.id, e)} 
                        className="p-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 rounded-xl transition-all cursor-pointer backdrop-blur-md"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Crear Evento */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e0e10]/80 backdrop-blur-2xl w-full max-w-lg p-10 rounded-[3rem] border border-white/15 relative shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-6"
            >
              <button onClick={() => setShowCreateModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors cursor-pointer p-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"><X size={20} /></button>
              <h3 className="text-[11px] uppercase tracking-[0.4em] font-black text-center font-['Poppins']">Nuevo Evento</h3>
              
              <form onSubmit={handleCreateEvent} className="space-y-4 font-bold">
                <div className="space-y-2">
                  <label className="text-[8px] tracking-[0.3em] text-gray-400">Categoría</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-white tracking-widest cursor-pointer backdrop-blur-md"
                  >
                    {MACRO_CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[#0a0a0a] text-white">{cat}</option>)}
                  </select>
                </div>

                <input placeholder="TÍTULO" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-white tracking-widest placeholder:text-gray-600 backdrop-blur-md" required 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-white backdrop-blur-md" required 
                  />
                  <input placeholder="UBICACIÓN" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-white tracking-widest placeholder:text-gray-600 backdrop-blur-md" 
                  />
                </div>

                <textarea placeholder="NOTAS..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-4 text-[10px] text-white uppercase h-24 resize-none outline-none focus:border-white tracking-widest placeholder:text-gray-600 backdrop-blur-md" 
                />

                <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-white/90 hover:bg-white text-black font-black text-[10px] tracking-[0.4em] uppercase transition-all font-['Poppins'] cursor-pointer shadow-xl backdrop-blur-md">
                  {loading ? 'GUARDANDO...' : 'CREAR'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal QR de Invitados */}
      <AnimatePresence>
        {showQrModal && selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e0e10]/80 backdrop-blur-2xl w-full max-w-sm p-8 rounded-[3rem] border border-white/15 relative shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-center space-y-6"
            >
              <button onClick={() => setShowQrModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors cursor-pointer p-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"><X size={18} /></button>
              
              <div className="space-y-2">
                <span className="text-[8px] tracking-[0.3em] font-black text-gray-400">QR INVITADOS</span>
                <h3 className="text-xl font-['Poppins'] font-normal text-white">{selectedEvent.title}</h3>
              </div>

              <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl flex items-center justify-center shadow-xl">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://www.classcode.com.ar/guest/${selectedEvent.id}`} 
                  alt="QR Invitados" 
                  className="w-full h-full object-contain"
                />
              </div>

              <button onClick={() => { copyGuestLink(selectedEvent.id); setShowQrModal(false); }} className="w-full py-3.5 rounded-xl bg-white/90 hover:bg-white text-black font-black text-[9px] tracking-widest uppercase transition-all font-['Poppins'] cursor-pointer shadow-xl backdrop-blur-md">
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