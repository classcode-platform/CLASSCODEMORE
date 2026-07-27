import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Calendar, MapPin, QrCode, Trash2, X, ChevronRight } from 'lucide-react';

const MACRO_CATEGORIES = [
  "CAMPAÑA",
  "EVENTOS SOCIALES",
  "RECITALES Y SHOWS",
  "PRODUCCIÓN AUDIOVISUAL",
  "CORPORATIVOS"
];

export default function EventOrganizer() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'EVENTOS SOCIALES',
    date: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "events_organizer"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEvents(docs);
    }, (error) => {
      console.error("Error cargando eventos:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) return alert("Completá al menos el título y la fecha.");

    setLoading(true);
    try {
      await addDoc(collection(db, "events_organizer"), {
        userId: auth.currentUser.uid,
        title: formData.title.toUpperCase(),
        category: formData.category,
        date: formData.date,
        location: formData.location.toUpperCase(),
        notes: formData.notes.toUpperCase(),
        status: 'PLANIFICACION',
        createdAt: serverTimestamp()
      });
      setFormData({ title: '', category: 'EVENTOS SOCIALES', date: '', location: '', notes: '' });
      setShowCreateModal(false);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleDeleteEvent = async (id, e) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar este proyecto?")) return;
    try {
      await deleteDoc(doc(db, "events_organizer", id));
    } catch (e) { console.error(e); }
  };

  const handleToggleStatus = async (event, e) => {
    e.stopPropagation();
    const nextStatus = event.status === 'PLANIFICACION' ? 'EN_CURSO' : event.status === 'EN_CURSO' ? 'FINALIZADO' : 'PLANIFICACION';
    try {
      await updateDoc(doc(db, "events_organizer", event.id), { status: nextStatus });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white font-['Open_Sans'] antialiased flex flex-col relative uppercase selection:bg-white selection:text-black">
      
      {/* TOPBAR */}
      <nav className="p-6 md:p-10 w-full sticky top-0 z-50 bg-[#070709]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center w-full font-['Poppins']">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-bold">
            <ArrowLeft size={14}/> VOLVER
          </button>
          <div className="text-lg md:text-xl tracking-[0.05em] uppercase font-normal">CLASSCODE ORGANIZADOR</div>
          <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 rounded-xl bg-white text-black font-black text-[9px] tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2">
            <Plus size={14} /> NUEVO
          </button>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-[1200px] mx-auto px-6 md:px-12 py-12 flex-1 w-full space-y-10">
        
        {events.length === 0 ? (
          <div className="py-24 text-center border border-white/5 rounded-3xl bg-[#0c0c0e] space-y-4">
            <Calendar size={32} className="mx-auto text-white/20" />
            <p className="text-[10px] text-gray-500 font-bold tracking-[0.3em]">No hay proyectos registrados</p>
            <button onClick={() => setShowCreateModal(true)} className="px-6 py-3 bg-white text-black rounded-2xl text-[9px] font-black tracking-widest">
              CREAR PROYECTO
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <motion.div 
                key={ev.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/organizer/${ev.id}`)}
                className="bg-[#0c0c0e] border border-white/10 hover:border-white/30 rounded-3xl p-6 flex flex-col justify-between gap-6 relative shadow-xl cursor-pointer transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] tracking-[0.3em] font-black px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-300">
                      {ev.category}
                    </span>
                    <button 
                      onClick={(e) => handleToggleStatus(ev, e)} 
                      className={`text-[8px] tracking-widest font-black px-2.5 py-1 rounded-full border transition-all ${
                        ev.status === 'FINALIZADO' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        ev.status === 'EN_CURSO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-white/5 text-gray-400 border-white/10'
                      }`}
                    >
                      {ev.status}
                    </button>
                  </div>
                  <h3 className="text-lg font-['Poppins'] font-normal tracking-wide text-white group-hover:text-gray-200 flex items-center justify-between">
                    {ev.title}
                    <ChevronRight size={16} className="text-white/40 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <div className="space-y-1.5 text-[10px] text-gray-400 font-bold tracking-wider">
                    {ev.date && <p className="flex items-center gap-2"><Calendar size={13} className="text-white"/> {ev.date}</p>}
                    {ev.location && <p className="flex items-center gap-2"><MapPin size={13} className="text-white"/> {ev.location}</p>}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); setShowQrModal(true); }} 
                    className="flex-1 py-3 px-4 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/10 text-[9px] font-black tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <QrCode size={14}/> QR
                  </button>
                  <button 
                    onClick={(e) => handleDeleteEvent(ev.id, e)} 
                    className="p-3 bg-white/[0.03] hover:bg-red-500/20 hover:text-red-400 border border-white/10 rounded-xl transition-all"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL CREAR */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0c0e] w-full max-w-lg p-10 rounded-[3rem] border border-white/10 relative shadow-2xl space-y-6"
            >
              <button onClick={() => setShowCreateModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={22} /></button>
              <h3 className="text-[11px] uppercase tracking-[0.4em] font-black text-center font-['Poppins']">Nuevo Proyecto</h3>
              
              <form onSubmit={handleCreateEvent} className="space-y-4 font-bold">
                <div className="space-y-2">
                  <label className="text-[8px] tracking-[0.3em] text-gray-400">Categoría</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-white tracking-widest"
                  >
                    {MACRO_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <input placeholder="TÍTULO" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-white tracking-widest" required 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                    className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-white" required 
                  />
                  <input placeholder="UBICACIÓN" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-white tracking-widest" 
                  />
                </div>

                <textarea placeholder="NOTAS..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-3xl p-4 text-[10px] text-white uppercase h-24 resize-none outline-none focus:border-white tracking-widest" 
                />

                <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-white text-black font-black text-[10px] tracking-[0.4em] uppercase hover:bg-gray-200 transition-all">
                  {loading ? 'GUARDANDO...' : 'CREAR'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL QR */}
      <AnimatePresence>
        {showQrModal && selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0c0e] w-full max-w-sm p-8 rounded-[3rem] border border-white/10 relative shadow-2xl text-center space-y-6"
            >
              <button onClick={() => setShowQrModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
              
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

              <button onClick={() => {
                navigator.clipboard.writeText(`https://www.classcode.com.ar/guest/${selectedEvent.id}`);
                alert("¡Link copiado!");
              }} className="w-full py-3.5 rounded-xl bg-white text-black font-black text-[9px] tracking-widest uppercase hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                COPIAR LINK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}