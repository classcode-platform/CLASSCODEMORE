import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Calendar, MapPin, QrCode, Trash2, X, ChevronRight, Image as ImageIcon, Play, Pause, Square, Copy, ExternalLink } from 'lucide-react';
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
  
  const [activeEventId, setActiveEventId] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
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

  useEffect(() => {
    if (!activeEventId) return;
    const qPhotos = query(collection(db, "photos"), where("eventId", "==", activeEventId));
    const unsubscribePhotos = onSnapshot(qPhotos, (snapshot) => {
      const fetchedPhotos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPhotos(fetchedPhotos);
    }, (error) => {
      console.error("Error al cargar fotos:", error);
    });

    return () => unsubscribePhotos();
  }, [activeEventId]);

  const currentEvent = events.find(ev => ev.id === activeEventId);

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
        if (activeEventId === id) setActiveEventId(null);
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

  const handleShareTV = (id) => {
    navigator.clipboard.writeText(`https://www.classcode.com.ar/live-gallery/${id}`);
    setModal({ isOpen: true, title: "LIVE GALLERY", message: "LINK DE PROYECCIÓN COPIADO.", type: "success" });
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
            onClick={() => {
              if (activeEventId) {
                setActiveEventId(null);
              } else {
                navigate('/client-profile');
              }
            }} 
            className="text-gray-400 hover:text-white flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-bold font-['Poppins'] transition-colors cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md"
          >
            <ArrowLeft size={14}/> {activeEventId ? 'VOLVER A LISTADO' : 'VOLVER'}
          </button>
          
          <div className="font-['Poppins']">
            <span className="text-base font-normal tracking-[0.05em] uppercase leading-none">CLASSCODE</span>
          </div>

          <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 rounded-xl bg-white/90 hover:bg-white text-black font-black text-[9px] tracking-widest transition-all flex items-center gap-2 font-['Poppins'] cursor-pointer shadow-xl backdrop-blur-md">
            <Plus size={14} /> NUEVO
          </button>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 md:px-12 py-12 flex-1 w-full space-y-10 relative z-10">
        
        {/* VISTA 1: GRILLA DE EVENTOS */}
        {!activeEventId ? (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-['Poppins'] font-normal tracking-wide text-white">ORGANIZADOR</h1>
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
                    onClick={() => setActiveEventId(ev.id)}
                    className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/30 rounded-3xl overflow-hidden flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] cursor-pointer transition-all group backdrop-blur-xl"
                  >
                    <div className="relative w-full h-40 bg-black/40 overflow-hidden border-b border-white/10 flex items-center justify-center">
                      {ev.coverImage ? (
                        <img src={ev.coverImage} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" />
                      ) : (
                        <ImageIcon size={20} className="text-white/20" />
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

                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h3 className="text-lg font-['Poppins'] font-normal tracking-wide text-white group-hover:text-gray-200 flex items-center justify-between">
                          {ev.title}
                          <ChevronRight size={16} className="text-white/40 group-hover:translate-x-1 transition-transform" />
                        </h3>
                        <div className="space-y-1.5 text-[10px] text-gray-400 font-bold tracking-wider">
                          {ev.date && <p className="flex items-center gap-2"><Calendar size={13} className="text-white"/> {ev.date}</p>}
                          {ev.location && <p className="flex items-center gap-2"><MapPin size={13} className="text-white"/> {ev.location}</p>}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); setShowQrModal(true); }} 
                          className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black tracking-widest flex items-center justify-center gap-2 transition-all font-['Poppins'] cursor-pointer backdrop-blur-md"
                        >
                          <QrCode size={14}/> QR
                        </button>
                        <button 
                          onClick={(e) => handleDeleteEvent(ev.id, e)} 
                          className="p-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 rounded-xl transition-all cursor-pointer backdrop-blur-md"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* VISTA 2: PANEL DE CONTROL EN VIVO DEL EVENTO */
          currentEvent && (
            <div className="space-y-10">
              <div className="bg-white/[0.03] border border-white/10 p-6 md:p-8 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 backdrop-blur-xl">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] tracking-[0.3em] font-black px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-300 backdrop-blur-md">
                      {currentEvent.category || 'EVENTO'}
                    </span>
                    <span className={`text-[8px] tracking-widest font-black px-3 py-1 rounded-full border backdrop-blur-md ${
                      currentEvent.status === 'FINALIZADO' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      currentEvent.status === 'EN_CURSO' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-white/5 text-gray-300 border-white/10'
                    }`}>
                      {currentEvent.status}
                    </span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-['Poppins'] font-normal text-white">{currentEvent.title}</h1>
                  <div className="flex flex-wrap items-center gap-6 text-[10px] text-gray-400 font-bold tracking-wider">
                    {currentEvent.date && <p className="flex items-center gap-2"><Calendar size={13} className="text-white"/> {currentEvent.date}</p>}
                    {currentEvent.location && <p className="flex items-center gap-2"><MapPin size={13} className="text-white"/> {currentEvent.location}</p>}
                  </div>
                </div>

                {/* Botonera de Control en Vivo */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => handleToggleStatus(currentEvent)} 
                    className={`flex-1 md:flex-none px-5 py-3 rounded-xl border text-[9px] font-black tracking-widest flex items-center justify-center gap-2 transition-all font-['Poppins'] cursor-pointer backdrop-blur-md ${
                      currentEvent.status === 'EN_CURSO' 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    {currentEvent.status === 'EN_CURSO' ? <Pause size={14}/> : <Play size={14}/>}
                    {currentEvent.status === 'EN_CURSO' ? 'PAUSAR' : 'INICIAR'}
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedEvent(currentEvent);
                      setShowQrModal(true);
                    }} 
                    className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black tracking-widest flex items-center justify-center gap-2 transition-all font-['Poppins'] cursor-pointer backdrop-blur-md"
                  >
                    <QrCode size={14}/> QR
                  </button>

                  <button 
                    onClick={() => {
                      setModal({
                        isOpen: true,
                        title: "APAGAR SISTEMA",
                        message: "¿TERMINAR RECEPCIÓN DE FOTOS? LOS INVITADOS YA NO PODRÁN SUBIR CONTENIDO.",
                        type: 'warning',
                        onConfirm: async () => {
                          await updateDoc(doc(db, "events_organizer", currentEvent.id), { status: 'FINALIZADO' });
                          setModal({ isOpen: false });
                        }
                      });
                    }} 
                    className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-[9px] font-black tracking-widest flex items-center justify-center gap-2 transition-all font-['Poppins'] cursor-pointer backdrop-blur-md"
                  >
                    <Square size={14}/> APAGAR
                  </button>

                  <button 
                    onClick={() => copyGuestLink(currentEvent.id)} 
                    className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black tracking-widest flex items-center justify-center gap-2 transition-all font-['Poppins'] cursor-pointer backdrop-blur-md"
                  >
                    <Copy size={14}/> GUEST LINK
                  </button>

                  <button 
                    onClick={() => handleShareTV(currentEvent.id)} 
                    className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-white/90 hover:bg-white text-black text-[9px] font-black tracking-widest flex items-center justify-center gap-2 transition-all font-['Poppins'] cursor-pointer shadow-xl backdrop-blur-md"
                  >
                    <ExternalLink size={14}/> PROYECTAR
                  </button>
                </div>
              </div>

              {/* Grilla de Fotos en Vivo */}
              <div className="space-y-6">
                <h3 className="text-[10px] text-gray-400 tracking-[0.4em] font-bold">CONTENIDO SUBIDO ({photos.length})</h3>

                {photos.length === 0 ? (
                  <div className="py-24 text-center border border-white/10 rounded-3xl bg-white/[0.02] backdrop-blur-xl space-y-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
                    <ImageIcon size={32} className="mx-auto text-white/20" />
                    <p className="text-[9px] text-gray-500 tracking-[0.3em] font-bold">No hay fotos recibidas todavía</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {photos.map((photo) => (
                      <div 
                        key={photo.id} 
                        onClick={() => setPreviewImage(photo.url || photo.imageURL)}
                        className="relative aspect-square bg-white/[0.03] border border-white/10 hover:border-white/30 rounded-2xl overflow-hidden cursor-pointer group shadow-xl backdrop-blur-xl"
                      >
                        <img 
                          src={photo.url || photo.imageURL} 
                          alt="Upload" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <span className="text-[8px] tracking-widest font-black px-3 py-1.5 bg-black/80 border border-white/20 rounded-xl">VER</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
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

      {/* Modal QR Unificado */}
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

      {/* Visor de Imágenes en Pantalla Completa */}
      <AnimatePresence>
        {previewImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewImage(null)} className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 cursor-zoom-out">
            <button className="absolute top-8 right-8 text-white/50 hover:text-white p-2 cursor-pointer bg-white/5 border border-white/10 rounded-full backdrop-blur-md"><X size={24}/></button>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={previewImage} className="max-w-full max-h-[85vh] rounded-2xl border border-white/15 object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} onConfirm={modal.onConfirm} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
}