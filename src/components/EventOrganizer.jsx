import React, { useState, useEffect } from 'react';
import { db } from "../firebase";
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, LayoutGrid, DollarSign, Plus, Trash2, Edit3, Image as ImageIcon, Check, X, Calendar, MapPin, Upload, Utensils, ChevronRight } from 'lucide-react';

export default function EventsOrganizer() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [event, setEvent] = useState(null);

  // Formulario directo para crear sin modales
  const [newEvent, setNewEvent] = useState({ title: '', category: 'EVENTO', date: '', location: '', coverImage: '' });

  const [activeTab, setActiveTab] = useState('tables');
  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [layoutMode, setLayoutMode] = useState('tables');

  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [editBudgetValues, setEditBudgetValues] = useState({ concept: '', estimated: 0, actual: 0 });

  const [newGuest, setNewGuest] = useState({ name: '', table: '', status: 'PENDIENTE' });
  const [newTable, setNewTable] = useState({ name: '', capacity: 10 });
  const [newBudget, setNewBudget] = useState({ concept: '', estimated: '', actual: '' });
  
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');

  useEffect(() => {
    const unsubEvents = onSnapshot(collection(db, "events_organizer"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEvents(list);
    });
    return () => unsubEvents();
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setEvent(null);
      return;
    }

    const currentEventData = events.find(ev => ev.id === selectedEventId);
    if (currentEventData) {
      setEvent(currentEventData);
      setCoverUrl(currentEventData.coverImage || '');
    }

    const unsubGuests = onSnapshot(collection(db, "events_organizer", selectedEventId, "guests"), (snap) => {
      setGuests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubTables = onSnapshot(collection(db, "events_organizer", selectedEventId, "tables"), (snap) => {
      const tablesList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTables(tablesList);
      
      if (tablesList.length > 0 && !newGuest.table) {
        setNewGuest(prev => ({ ...prev, table: tablesList[0].name }));
      }
    });

    const unsubBudget = onSnapshot(collection(db, "events_organizer", selectedEventId, "budget"), (snap) => {
      setBudgetItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubGuests();
      unsubTables();
      unsubBudget();
    };
  }, [selectedEventId, events]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title) return;
    try {
      const docRef = await addDoc(collection(db, "events_organizer"), {
        title: newEvent.title.toUpperCase(),
        category: newEvent.category.toUpperCase(),
        date: newEvent.date,
        location: newEvent.location.toUpperCase(),
        coverImage: newEvent.coverImage || ''
      });
      setNewEvent({ title: '', category: 'EVENTO', date: '', location: '', coverImage: '' });
      setSelectedEventId(docRef.id); // Entra directamente al evento creado
    } catch (error) {
      console.error("Error al crear evento:", error);
    }
  };

  const handleDeleteEvent = async (id, e) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar este evento por completo y sus datos asociados?")) return;
    try {
      await deleteDoc(doc(db, "events_organizer", id));
      if (selectedEventId === id) setSelectedEventId(null);
    } catch (error) {
      console.error("Error al eliminar evento:", error);
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuest.name || !newGuest.table || !selectedEventId) return;
    await addDoc(collection(db, "events_organizer", selectedEventId, "guests"), {
      name: newGuest.name.trim().toUpperCase(),
      table: newGuest.table.trim().toUpperCase(),
      status: newGuest.status
    });
    setNewGuest({ name: '', table: tables[0]?.name || '', status: 'PENDIENTE' });
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTable.name || !selectedEventId) return;
    const formattedTableName = newTable.name.trim().toUpperCase();
    await addDoc(collection(db, "events_organizer", selectedEventId, "tables"), {
      name: formattedTableName,
      capacity: Number(newTable.capacity) || 10
    });
    setNewTable({ name: '', capacity: 10 });
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    if (!newBudget.concept || !selectedEventId) return;
    await addDoc(collection(db, "events_organizer", selectedEventId, "budget"), {
      concept: newBudget.concept.toUpperCase(),
      estimated: Number(newBudget.estimated) || 0,
      actual: Number(newBudget.actual) || 0
    });
    setNewBudget({ concept: '', estimated: '', actual: '' });
  };

  const handleUpdateBudget = async (id) => {
    try {
      await updateDoc(doc(db, "events_organizer", selectedEventId, "budget", id), {
        concept: editBudgetValues.concept.toUpperCase(),
        estimated: Number(editBudgetValues.estimated) || 0,
        actual: Number(editBudgetValues.actual) || 0
      });
      setEditingBudgetId(null);
    } catch (error) {
      console.error("Error al actualizar presupuesto:", error);
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1048576) {
      alert("La imagen es muy pesada. Elegí una menor a 1MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateCover = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "events_organizer", selectedEventId), { coverImage: coverUrl });
      setEvent({ ...event, coverImage: coverUrl });
      setShowPhotoModal(false);
    } catch (error) {
      console.error("Error al actualizar portada:", error);
    }
  };

  const handleDelete = async (subcol, id) => {
    await deleteDoc(doc(db, "events_organizer", selectedEventId, subcol, id));
  };

  if (!selectedEventId) {
    return (
      <div className="min-h-screen bg-[#070709] text-white font-['Open_Sans'] antialiased flex flex-col items-center uppercase selection:bg-white selection:text-black relative overflow-hidden p-4 sm:p-8">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ x: [-80, 80, -80], y: [-60, 60, -60], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-[-15%] left-[-10%] w-[400px] md:w-[700px] h-[400px] md:h-[700px] bg-purple-600/10 rounded-full blur-[140px] md:blur-[200px]" />
          <motion.div animate={{ x: [80, -80, 80], y: [60, -60, 60], scale: [1.2, 1, 1.2] }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-15%] right-[-10%] w-[350px] md:w-[650px] h-[350px] md:h-[650px] bg-indigo-600/10 rounded-full blur-[130px] md:blur-[190px]" />
        </div>

        <nav className="w-full max-w-[1200px] flex justify-between items-center py-4 px-6 bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-2xl mb-8 z-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <h1 className="text-sm sm:text-base text-white uppercase font-['Poppins'] font-normal tracking-[0.05em]">
            CLASSCODE <span className="text-white/40 text-xs">/ EVENTOS</span>
          </h1>
        </nav>

        <main className="w-full max-w-[1200px] z-10 space-y-6">
          {/* Formulario directo de creación rápida sin modales */}
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 sm:p-6 rounded-[2.5rem] shadow-[0_16px_48px_0_rgba(0,0,0,0.4)] space-y-4">
            <div className="space-y-1">
              <span className="text-[7px] tracking-[0.3em] font-bold text-white/40">ACCESO RÁPIDO</span>
              <h3 className="text-lg font-['Poppins'] font-normal text-white">Crear Nuevo Evento</h3>
            </div>

            <form onSubmit={handleCreateEvent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-bold">
              <input placeholder="TÍTULO DEL EVENTO" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="bg-white/[0.03] border border-white/15 rounded-xl p-3.5 text-[9px] text-white outline-none focus:border-white tracking-widest uppercase placeholder:text-white/30 backdrop-blur-md" required />
              <input placeholder="CATEGORÍA (BODA, XV...)" value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})} className="bg-white/[0.03] border border-white/15 rounded-xl p-3.5 text-[9px] text-white outline-none focus:border-white tracking-widest uppercase placeholder:text-white/30 backdrop-blur-md" />
              <input placeholder="FECHA (EJ: 12 OCT 2026)" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="bg-white/[0.03] border border-white/15 rounded-xl p-3.5 text-[9px] text-white outline-none focus:border-white tracking-widest uppercase placeholder:text-white/30 backdrop-blur-md" />
              <button type="submit" className="py-3.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl text-[8px] font-black tracking-[0.3em] uppercase transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer">
                <Plus size={13}/> CREAR Y GESTIONAR
              </button>
            </form>
          </div>

          <div className="flex justify-between items-center px-2 pt-4">
            <h2 className="text-xl font-['Poppins'] tracking-wide text-white/90">Mis Eventos</h2>
            <span className="text-[8px] font-bold text-white/60 bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
              TOTAL: {events.length}
            </span>
          </div>

          {events.length === 0 ? (
            <div className="w-full py-16 border border-white/10 bg-white/[0.01] backdrop-blur-2xl rounded-[2.5rem] text-center text-white/40 text-[9px] font-bold tracking-widest shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
              <p>NO HAY EVENTOS REGISTRADOS</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((ev) => (
                <div 
                  key={ev.id} 
                  onClick={() => setSelectedEventId(ev.id)}
                  className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-white/30 rounded-[2rem] overflow-hidden group cursor-pointer transition-all duration-500 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between relative hover:bg-white/[0.05]"
                >
                  <div className="relative h-36 bg-black/40 overflow-hidden border-b border-white/10">
                    {ev.coverImage ? (
                      <img src={ev.coverImage} alt={ev.title} className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30 text-[8px] tracking-widest font-bold">SIN IMAGEN</div>
                    )}
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-[7px] font-black text-white/90">
                      {ev.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-['Poppins'] text-sm font-normal text-white truncate">{ev.title}</h3>
                      <div className="flex flex-wrap gap-2 text-[8px] text-white/50 font-bold pt-1">
                        {ev.date && <span className="flex items-center gap-1"><Calendar size={11}/> {ev.date}</span>}
                        {ev.location && <span className="flex items-center gap-1"><MapPin size={11}/> {ev.location}</span>}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex justify-between items-center text-[8px] font-black">
                      <span className="text-white/60 group-hover:text-white transition-colors flex items-center gap-1">
                        ADMINISTRAR <ChevronRight size={12}/>
                      </span>
                      <button onClick={(e) => handleDeleteEvent(ev.id, e)} className="p-2 bg-white/[0.04] hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/10 rounded-xl transition-all backdrop-blur-md">
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  const totalEstimated = budgetItems.reduce((acc, item) => acc + (Number(item.estimated) || 0), 0);
  const totalActual = budgetItems.reduce((acc, item) => acc + (Number(item.actual) || 0), 0);
  const totalCapacity = tables.reduce((acc, t) => acc + (Number(t.capacity) || 0), 0);
  const totalOccupied = guests.length; 
  const globalOccupancyPercentage = totalCapacity > 0 ? Math.min(100, Math.round((totalOccupied / totalCapacity) * 100)) : 0;

  return (
    <div className="min-h-screen bg-[#070709] text-white font-['Open_Sans'] antialiased flex flex-col items-center uppercase selection:bg-white selection:text-black relative overflow-hidden">
      {/* Resto de la interfaz de gestión del evento seleccionado queda intacto */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [-80, 80, -80], y: [-60, 60, -60], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-[-15%] left-[-10%] w-[400px] md:w-[700px] h-[400px] md:h-[700px] bg-purple-600/10 rounded-full blur-[140px] md:blur-[200px]" />
        <motion.div animate={{ x: [80, -80, 80], y: [60, -60, 60], scale: [1.2, 1, 1.2] }} transition={{ duration: 24, repeat: Infinity, ease: "linear" }} className="absolute bottom-[-15%] right-[-10%] w-[350px] md:w-[650px] h-[350px] md:h-[650px] bg-indigo-600/10 rounded-full blur-[130px] md:blur-[190px]" />
      </div>

      <nav className="w-full border-b border-white/10 bg-white/[0.02] backdrop-blur-2xl sticky top-0 z-50 px-4 sm:px-8 py-4 flex justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        <div className="max-w-[1200px] w-full flex justify-between items-center">
          <button onClick={() => setSelectedEventId(null)} className="text-white/60 hover:text-white flex items-center gap-1.5 text-[8px] tracking-[0.3em] font-bold transition-colors cursor-pointer">
            <ArrowLeft size={13}/> VOLVER A LISTA
          </button>
          
          <div className="flex flex-col items-center">
            <h1 className="text-sm sm:text-base text-white uppercase font-['Poppins'] font-normal tracking-[0.05em] leading-none">
              CLASSCODE
            </h1>
          </div>

          <span className="text-[7px] tracking-widest px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full text-white/80 font-bold backdrop-blur-md">
            {event?.category || 'EVENTO'}
          </span>
        </div>
      </nav>

      <div className="w-full max-w-[1200px] px-4 sm:px-8 mt-6 relative z-10">
        <div className="relative w-full min-h-[240px] sm:min-h-[280px] bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden group shadow-[0_16px_40px_rgba(0,0,0,0.4)] flex flex-col justify-end">
          {event?.coverImage ? (
            <img src={event.coverImage} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-600/5 to-indigo-600/5">
              <span className="text-[8px] text-white/40 tracking-[0.3em] font-bold">SIN IMAGEN</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/60 to-transparent pointer-events-none"></div>

          <div className="relative z-10 p-6 sm:p-10 w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-xl sm:text-3xl font-['Poppins'] font-normal text-white tracking-wide leading-tight">{event?.title}</h2>
              <div className="flex flex-wrap gap-3 text-[9px] text-white/70 font-bold pt-1">
                {event?.date && <span className="flex items-center gap-1.5"><Calendar size={12}/> {event.date}</span>}
                {event?.location && <span className="flex items-center gap-1.5"><MapPin size={12}/> {event.location}</span>}
              </div>
            </div>
            
            <button onClick={() => setShowPhotoModal(true)} className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[8px] font-black tracking-[0.2em] flex items-center justify-center gap-2 backdrop-blur-md transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
              <ImageIcon size={13}/> EDITAR PORTADA
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px] px-4 sm:px-8 mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3 font-['Poppins']">
          <button onClick={() => setActiveTab('tables')} className={`py-3.5 px-2 sm:px-6 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-black tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg backdrop-blur-md cursor-pointer ${activeTab === 'tables' ? 'bg-white/20 text-white border border-white/30 shadow-[0_0_25px_rgba(255,255,255,0.15)]' : 'bg-white/[0.02] text-white/50 hover:text-white border border-white/10'}`}>
            <LayoutGrid size={13}/> <span className="truncate">PLANO</span>
          </button>
          <button onClick={() => setActiveTab('guests')} className={`py-3.5 px-2 sm:px-6 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-black tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg backdrop-blur-md cursor-pointer ${activeTab === 'guests' ? 'bg-white/20 text-white border border-white/30 shadow-[0_0_25px_rgba(255,255,255,0.15)]' : 'bg-white/[0.02] text-white/50 hover:text-white border border-white/10'}`}>
            <Users size={13}/> <span className="truncate">INVITADOS</span>
          </button>
          <button onClick={() => setActiveTab('budget')} className={`py-3.5 px-2 sm:px-6 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-black tracking-widest transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg backdrop-blur-md cursor-pointer ${activeTab === 'budget' ? 'bg-white/20 text-white border border-white/30 shadow-[0_0_25px_rgba(255,255,255,0.15)]' : 'bg-white/[0.02] text-white/50 hover:text-white border border-white/10'}`}>
            <DollarSign size={13}/> <span className="truncate">GASTOS</span>
          </button>
        </div>
      </div>

      <main className="w-full max-w-[1200px] px-4 sm:px-8 py-6 sm:py-8 flex-1 space-y-6 relative z-10">
        {activeTab === 'tables' && (
          <div className="space-y-6">
            <form onSubmit={handleAddTable} className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-4 sm:p-6 rounded-[1.75rem] sm:rounded-[2rem] grid grid-cols-1 sm:grid-cols-3 gap-3 font-bold items-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
              <input placeholder="NOMBRE (EJ: MESA 1)" value={newTable.name} onChange={e => setNewTable({...newTable, name: e.target.value})} className="bg-white/[0.03] border border-white/15 rounded-xl p-3.5 text-[9px] text-white outline-none focus:border-white tracking-widest uppercase placeholder:text-white/30 backdrop-blur-md" required />
              <input type="number" placeholder="CAPACIDAD (EJ: 10)" value={newTable.capacity} onChange={e => setNewTable({...newTable, capacity: e.target.value})} className="bg-white/[0.03] border border-white/15 rounded-xl p-3.5 text-[9px] text-white outline-none focus:border-white tracking-widest uppercase placeholder:text-white/30 backdrop-blur-md" required />
              <button type="submit" className="py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-[8px] font-black tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg backdrop-blur-md">
                <Plus size={13}/> CREAR SECTOR
              </button>
            </form>

            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 space-y-6 shadow-[0_16px_48px_0_rgba(0,0,0,0.4)] relative overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 font-['Poppins']">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[7px] tracking-[0.3em] font-bold text-white/40 uppercase">DISTRIBUCIÓN</span>
                    <h3 className="text-lg sm:text-xl font-normal text-white uppercase tracking-wide">Plano Global</h3>
                  </div>

                  <div className="flex items-center gap-4 bg-white/[0.04] border border-white/10 px-4 py-2.5 rounded-xl shrink-0 shadow-inner backdrop-blur-md">
                    <div className="space-y-0.5 text-right">
                      <span className="text-[6px] text-white/40 font-bold tracking-widest block">OCUPADOS</span>
                      <span className="text-[10px] font-black text-white">{totalOccupied}/{totalCapacity}</span>
                    </div>
                    <div className="h-5 w-[1px] bg-white/10"></div>
                    <div className="space-y-0.5">
                      <span className="text-[6px] text-white/40 font-bold tracking-widest block">TOTAL</span>
                      <span className="text-[10px] font-black text-white/80">{globalOccupancyPercentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 bg-white/[0.04] border border-white/10 p-1 rounded-xl backdrop-blur-md">
                  <button onClick={() => setLayoutMode('tables')} className={`py-2 text-[7px] font-black tracking-widest rounded-lg transition-all cursor-pointer ${layoutMode === 'tables' ? 'bg-white/20 text-white border border-white/20 shadow-md' : 'text-white/40 hover:text-white'}`}>
                    MESAS
                  </button>
                  <button onClick={() => setLayoutMode('auditorium')} className={`py-2 text-[7px] font-black tracking-widest rounded-lg transition-all cursor-pointer ${layoutMode === 'auditorium' ? 'bg-white/20 text-white border border-white/20 shadow-md' : 'text-white/40 hover:text-white'}`}>
                    TEATRO
                  </button>
                  <button onClick={() => setLayoutMode('standing')} className={`py-2 text-[7px] font-black tracking-widest rounded-lg transition-all cursor-pointer ${layoutMode === 'standing' ? 'bg-white/20 text-white border border-white/20 shadow-md' : 'text-white/40 hover:text-white'}`}>
                    CAMPO
                  </button>
                </div>
              </div>

              {tables.length === 0 ? (
                <div className="py-12 text-center text-white/45 tracking-widest text-[9px] font-bold">
                  SIN SECTORES CREADOS
                </div>
              ) : (
                <>
                  {layoutMode === 'tables' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                      {tables.map((t) => {
                        const assignedGuests = guests.filter(g => g.table?.trim().toUpperCase() === t.name?.trim().toUpperCase());
                        const capacity = Number(t.capacity) || 10;
                        
                        return (
                          <div key={t.id} className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 space-y-3 shadow-xl flex flex-col items-center relative group">
                            <div className="w-full flex justify-between items-center border-b border-white/10 pb-2.5">
                              <span className="font-['Poppins'] text-[11px] font-normal text-white uppercase">{t.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[7px] text-white/70 font-bold bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/10">{assignedGuests.length}/{capacity}</span>
                                <button onClick={() => handleDelete('tables', t.id)} className="p-1.5 bg-white/[0.04] hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/10 rounded-lg transition-all cursor-pointer backdrop-blur-md">
                                  <Trash2 size={11}/>
                                </button>
                              </div>
                            </div>

                            <div className="relative w-36 h-36 my-1.5 flex items-center justify-center">
                              <div className="w-14 h-14 rounded-full bg-white/[0.06] border border-white/20 flex flex-col items-center justify-center text-center shadow-inner z-10 p-1 backdrop-blur-md">
                                <Utensils size={11} className="text-white/90 mb-0.5" />
                                <span className="text-[6px] font-bold text-white truncate max-w-[45px]">{t.name}</span>
                              </div>

                              {Array.from({ length: capacity }).map((_, idx) => {
                                const angle = (idx * 360) / capacity;
                                const radian = (angle * Math.PI) / 180;
                                const radius = 52;
                                const x = Math.cos(radian) * radius;
                                const y = Math.sin(radian) * radius;
                                const assignedGuest = assignedGuests[idx];

                                return (
                                  <div
                                    key={idx}
                                    title={assignedGuest ? `${assignedGuest.name} (${assignedGuest.status})` : `Asiento ${idx + 1}`}
                                    style={{ transform: `translate(${x}px, ${y}px)` }}
                                    className={`absolute w-5 h-5 rounded-full flex items-center justify-center text-[6px] font-black border transition-all shadow-md backdrop-blur-md ${
                                      assignedGuest
                                        ? assignedGuest.status === 'CONFIRMADO'
                                          ? 'bg-white/30 text-white border-white/50 scale-110 z-20 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                                          : 'bg-amber-500/30 text-amber-300 border-amber-500/50 scale-110 z-20'
                                        : 'bg-white/[0.03] text-white/40 border-white/10'
                                    }`}
                                  >
                                    {idx + 1}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="w-full bg-[#070709]/50 border border-white/10 rounded-xl p-2 space-y-1 max-h-20 overflow-y-auto scrollbar-hide backdrop-blur-md">
                              {assignedGuests.length === 0 ? (
                                <p className="text-[6px] text-white/45 text-center tracking-widest py-1 font-bold">LIBRE</p>
                              ) : (
                                assignedGuests.map(g => (
                                  <div key={g.id} className="flex justify-between items-center text-[7px] text-white/80 font-bold px-1">
                                    <span className="truncate max-w-[100px]">{g.name}</span>
                                    <span className={`text-[6px] px-1 rounded font-black ${g.status === 'CONFIRMADO' ? 'bg-white/20 text-white border border-white/30' : 'bg-amber-500/20 text-amber-300'}`}>{g.status}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {layoutMode === 'auditorium' && (
                    <div className="space-y-4 py-1">
                      <div className="w-full bg-white/[0.06] border border-white/20 py-2.5 rounded-xl text-center text-[7px] tracking-[0.3em] font-black text-white shadow-inner backdrop-blur-md">
                        ESCENARIO
                      </div>

                      <div className="grid gap-4">
                        {tables.map((t) => {
                          const assignedGuests = guests.filter(g => g.table?.trim().toUpperCase() === t.name?.trim().toUpperCase());
                          const capacity = Number(t.capacity) || 20;

                          return (
                            <div key={t.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl">
                              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                                <h4 className="font-['Poppins'] text-xs font-normal text-white uppercase">{t.name}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[7px] text-white/70 font-bold">{assignedGuests.length}/{capacity}</span>
                                  <button onClick={() => handleDelete('tables', t.id)} className="p-1 bg-white/[0.04] hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/10 rounded-lg transition-all cursor-pointer backdrop-blur-md">
                                    <Trash2 size={11}/>
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto scrollbar-hide p-0.5 justify-center">
                                {Array.from({ length: capacity }).map((_, idx) => {
                                  const guestInSeat = assignedGuests[idx];
                                  return (
                                    <div 
                                      key={idx}
                                      title={guestInSeat ? `${guestInSeat.name} (${guestInSeat.status})` : `Butaca ${idx + 1}`}
                                      className={`w-6 h-6 rounded-md flex flex-col items-center justify-center text-[6px] font-black border transition-all backdrop-blur-md ${
                                        guestInSeat 
                                          ? guestInSeat.status === 'CONFIRMADO' 
                                            ? 'bg-white/30 text-white border-white/50 shadow-[0_0_8px_rgba(255,255,255,0.3)]' 
                                            : 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                                          : 'bg-white/[0.03] text-white/40 border-white/10'
                                      }`}
                                    >
                                      {idx + 1}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {layoutMode === 'standing' && (
                    <div className="space-y-4 py-1">
                      <div className="w-full bg-white/[0.06] border border-white/20 py-2.5 rounded-xl text-center text-[7px] tracking-[0.3em] font-black text-white shadow-inner backdrop-blur-md">
                        ACCESO GENERAL
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {tables.map((t) => {
                          const assignedGuests = guests.filter(g => g.table?.trim().toUpperCase() === t.name?.trim().toUpperCase());
                          const capacity = Number(t.capacity) || 100;
                          const percentage = Math.min(100, Math.round((assignedGuests.length / capacity) * 100));

                          return (
                            <div key={t.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl">
                              <div className="flex justify-between items-center">
                                <h4 className="font-['Poppins'] text-xs font-normal text-white uppercase">{t.name}</h4>
                                <button onClick={() => handleDelete('tables', t.id)} className="p-1 bg-white/[0.04] hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/10 rounded-lg transition-all cursor-pointer backdrop-blur-md">
                                  <Trash2 size={11}/>
                                </button>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-[7px] font-bold text-white/70">
                                  <span>ASISTENTES: {assignedGuests.length}</span>
                                  <span className="text-white">{percentage}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
                                  <div className="h-full bg-white/80 transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${percentage}%` }}></div>
                                </div>
                              </div>

                              <div className="max-h-24 overflow-y-auto scrollbar-hide space-y-1 pt-2 border-t border-white/10">
                                {assignedGuests.length === 0 ? (
                                  <p className="text-[6px] text-white/45 tracking-widest text-center font-bold">SIN REGISTROS</p>
                                ) : (
                                  assignedGuests.map(ag => (
                                    <div key={ag.id} className="text-[7px] text-white/80 bg-white/[0.03] px-2 py-1 rounded-lg border border-white/10 flex justify-between items-center font-bold">
                                      <span className="truncate">{ag.name}</span>
                                      <span className={`text-[6px] px-1 rounded font-black ${ag.status === 'CONFIRMADO' ? 'bg-white/20 text-white border border-white/30' : 'bg-amber-500/20 text-amber-300'}`}>{ag.status}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'guests' && (
          <div className="space-y-5">
            <form onSubmit={handleAddGuest} className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-4 sm:p-6 rounded-[1.75rem] sm:rounded-[2rem] grid grid-cols-1 sm:grid-cols-4 gap-3 font-bold items-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
              <input placeholder="NOMBRE Y APELLIDO" value={newGuest.name} onChange={e => setNewGuest({...newGuest, name: e.target.value})} className="bg-white/[0.03] border border-white/15 rounded-xl p-3.5 text-[9px] text-white outline-none focus:border-white tracking-widest uppercase placeholder:text-white/30 backdrop-blur-md" required />
              <select value={newGuest.table} onChange={e => setNewGuest({...newGuest, table: e.target.value})} className="bg-[#0e0e10]/80 border border-white/15 rounded-xl p-3.5 text-[9px] text-white outline-none focus:border-white tracking-widest uppercase cursor-pointer backdrop-blur-md">
                {tables.length === 0 ? <option value="">SIN SECTORES</option> : tables.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
              <select value={newGuest.status} onChange={e => setNewGuest({...newGuest, status: e.target.value})} className="bg-[#0e0e10]/80 border border-white/15 rounded-xl p-3.5 text-[9px] text-white outline-none focus:border-white tracking-widest uppercase cursor-pointer backdrop-blur-md">
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="CONFIRMADO">CONFIRMADO</option>
              </select>
              <button type="submit" className="py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-[8px] font-black tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg backdrop-blur-md">
                <Plus size={13}/> AGREGAR
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {guests.map(g => (
                <div key={g.id} className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 rounded-2xl flex justify-between items-center shadow-xl">
                  <div className="space-y-1">
                    <h4 className="font-['Poppins'] font-normal text-white text-[11px]">{g.name}</h4>
                    <p className="text-[7px] text-white/50 font-bold tracking-widest">{g.table} — <span className={g.status === 'CONFIRMADO' ? 'text-white font-black' : 'text-amber-400'}>{g.status}</span></p>
                  </div>
                  <button onClick={() => handleDelete('guests', g.id)} className="p-2 bg-white/[0.04] hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/10 rounded-xl transition-all cursor-pointer backdrop-blur-md">
                    <Trash2 size={13}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-5">
            <form onSubmit={handleAddBudget} className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-4 sm:p-6 rounded-[1.75rem] sm:rounded-[2rem] grid grid-cols-1 sm:grid-cols-4 gap-3 font-bold items-center shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
              <input placeholder="CONCEPTO (EJ: CATERING)" value={newBudget.concept} onChange={e => setNewBudget({...newBudget, concept: e.target.value})} className="bg-white/[0.03] border border-white/15 rounded-xl p-3.5 text-[9px] text-white outline-none focus:border-white tracking-widest uppercase placeholder:text-white/30 backdrop-blur-md" required />
              <input type="number" placeholder="ESTIMADO ($)" value={newBudget.estimated} onChange={e => setNewBudget({...newBudget, estimated: e.target.value})} className="bg-white/[0.03] border border-white/15 rounded-xl p-3.5 text-[9px] text-white outline-none focus:border-white tracking-widest uppercase placeholder:text-white/30 backdrop-blur-md" />
              <input type="number" placeholder="REAL ($)" value={newBudget.actual} onChange={e => setNewBudget({...newBudget, actual: e.target.value})} className="bg-white/[0.03] border border-white/15 rounded-xl p-3.5 text-[9px] text-white outline-none focus:border-white tracking-widest uppercase placeholder:text-white/30 backdrop-blur-md" />
              <button type="submit" className="py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-[8px] font-black tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg backdrop-blur-md">
                <Plus size={13}/> AGREGAR GASTO
              </button>
            </form>

            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 sm:p-6 overflow-x-auto shadow-[0_16px_48px_0_rgba(0,0,0,0.4)] space-y-4">
              <table className="w-full text-left border-collapse min-w-[320px]">
                <thead>
                  <tr className="border-b border-white/10 text-[7px] text-white/40 tracking-[0.3em] font-bold">
                    <th className="pb-3">CONCEPTO</th>
                    <th className="pb-3">ESTIMADO</th>
                    <th className="pb-3">REAL</th>
                    <th className="pb-3 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[9px] font-bold">
                  {budgetItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-white/45 tracking-widest">SIN GASTOS</td>
                    </tr>
                  ) : (
                    budgetItems.map(b => {
                      const isEditing = editingBudgetId === b.id;
                      return (
                        <tr key={b.id}>
                          <td className="py-3.5 text-white">
                            {isEditing ? (
                              <input value={editBudgetValues.concept} onChange={e => setEditBudgetValues({...editBudgetValues, concept: e.target.value})} className="bg-white/[0.05] border border-white/30 rounded-lg p-2 text-white outline-none w-full backdrop-blur-md" />
                            ) : b.concept}
                          </td>
                          <td className="py-3.5 text-white/70">
                            {isEditing ? (
                              <input type="number" value={editBudgetValues.estimated} onChange={e => setEditBudgetValues({...editBudgetValues, estimated: e.target.value})} className="bg-white/[0.05] border border-white/30 rounded-lg p-2 text-white outline-none w-20 backdrop-blur-md" />
                            ) : `$${b.estimated}`}
                          </td>
                          <td className="py-3.5 text-white">
                            {isEditing ? (
                              <input type="number" value={editBudgetValues.actual} onChange={e => setEditBudgetValues({...editBudgetValues, actual: e.target.value})} className="bg-white/[0.05] border border-white/30 rounded-lg p-2 text-white outline-none w-20 backdrop-blur-md" />
                            ) : `$${b.actual}`}
                          </td>
                          <td className="py-3.5 text-right flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <button onClick={() => handleUpdateBudget(b.id)} className="p-1.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg cursor-pointer backdrop-blur-md"><Check size={13}/></button>
                                <button onClick={() => setEditingBudgetId(null)} className="p-1.5 bg-white/10 text-white/60 border border-white/10 rounded-lg cursor-pointer backdrop-blur-md"><X size={13}/></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { setEditingBudgetId(b.id); setEditBudgetValues({ concept: b.concept, estimated: b.estimated, actual: b.actual }); }} className="p-1.5 bg-white/[0.04] hover:bg-white/10 text-white/50 hover:text-white border border-white/10 rounded-lg transition-all cursor-pointer backdrop-blur-md"><Edit3 size={13}/></button>
                                <button onClick={() => handleDelete('budget', b.id)} className="p-1.5 bg-white/[0.04] hover:bg-red-500/20 text-white/50 hover:text-red-400 border border-white/10 rounded-lg transition-all cursor-pointer backdrop-blur-md"><Trash2 size={13}/></button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {budgetItems.length > 0 && (
                <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[8px] font-black tracking-widest px-1 gap-2">
                  <span className="text-white/60">TOTALES:</span>
                  <div className="flex gap-4">
                    <span className="text-white/50">EST: <span className="text-white">${totalEstimated}</span></span>
                    <span className="text-white/50">REAL: <span className="text-white">${totalActual}</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/[0.04] backdrop-blur-3xl w-full max-w-md p-6 sm:p-8 rounded-[2.5rem] border border-white/15 relative shadow-[0_16px_48px_0_rgba(0,0,0,0.5)] space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setShowPhotoModal(false)} className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors cursor-pointer p-2 rounded-full bg-white/[0.05] border border-white/10"><X size={16} /></button>
              
              <div className="space-y-1 text-center">
                <span className="text-[7px] tracking-[0.3em] font-bold text-white/40 uppercase">CONFIGURACIÓN</span>
                <h3 className="text-lg font-['Poppins'] font-normal text-white uppercase">Portada</h3>
              </div>

              <form onSubmit={handleUpdateCover} className="space-y-4 font-bold">
                <div className="space-y-1.5">
                  <label className="text-[7px] tracking-[0.3em] text-white/40 font-bold">Archivo local</label>
                  <label className="w-full bg-white/[0.03] border border-white/15 hover:border-white/40 rounded-xl p-3.5 flex items-center justify-center gap-2 cursor-pointer transition-all text-[9px] text-white/80 backdrop-blur-md">
                    <Upload size={14} className="text-white" />
                    <span>SELECCIONAR...</span>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-3 text-white/40 text-[7px] tracking-widest font-bold">O URL</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <input placeholder="https://..." value={coverUrl.startsWith('data:') ? '' : coverUrl} onChange={e => setCoverUrl(e.target.value)} className="w-full bg-white/[0.03] border border-white/15 rounded-xl p-3.5 text-[9px] text-white outline-none focus:border-white tracking-widest uppercase placeholder:text-white/30 backdrop-blur-md" />
                
                {coverUrl && (
                  <div className="w-full h-20 rounded-xl overflow-hidden border border-white/15 mt-1 shadow-inner">
                    <img src={coverUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <button type="submit" className="w-full py-3.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl text-[8px] font-black tracking-[0.3em] uppercase transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md cursor-pointer">
                  GUARDAR
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}