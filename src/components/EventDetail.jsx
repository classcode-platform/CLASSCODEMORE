import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from "../firebase";
import { doc, getDoc, collection, onSnapshot, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, LayoutGrid, DollarSign, Plus, Trash2, Edit3, Image as ImageIcon, Check, X, Calendar, MapPin, Upload, Utensils } from 'lucide-react';

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
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
    if (!eventId) return;
    const fetchEvent = async () => {
      const docSnap = await getDoc(doc(db, "events_organizer", eventId));
      if (docSnap.exists()) {
        setEvent(docSnap.data());
        setCoverUrl(docSnap.data().coverImage || '');
      }
    };
    fetchEvent();

    const unsubGuests = onSnapshot(collection(db, "events_organizer", eventId, "guests"), (snap) => {
      setGuests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubTables = onSnapshot(collection(db, "events_organizer", eventId, "tables"), (snap) => {
      const tablesList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTables(tablesList);
      
      if (tablesList.length > 0 && !newGuest.table) {
        setNewGuest(prev => ({ ...prev, table: tablesList[0].name }));
      }
    });

    const unsubBudget = onSnapshot(collection(db, "events_organizer", eventId, "budget"), (snap) => {
      setBudgetItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubGuests();
      unsubTables();
      unsubBudget();
    };
  }, [eventId]);

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuest.name || !newGuest.table) return;
    await addDoc(collection(db, "events_organizer", eventId, "guests"), {
      name: newGuest.name.trim().toUpperCase(),
      table: newGuest.table.trim().toUpperCase(),
      status: newGuest.status
    });
    setNewGuest({ name: '', table: tables[0]?.name || '', status: 'PENDIENTE' });
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTable.name) return;
    const formattedTableName = newTable.name.trim().toUpperCase();
    await addDoc(collection(db, "events_organizer", eventId, "tables"), {
      name: formattedTableName,
      capacity: Number(newTable.capacity) || 10
    });
    setNewTable({ name: '', capacity: 10 });
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    if (!newBudget.concept) return;
    await addDoc(collection(db, "events_organizer", eventId, "budget"), {
      concept: newBudget.concept.toUpperCase(),
      estimated: Number(newBudget.estimated) || 0,
      actual: Number(newBudget.actual) || 0
    });
    setNewBudget({ concept: '', estimated: '', actual: '' });
  };

  const handleUpdateBudget = async (id) => {
    try {
      await updateDoc(doc(db, "events_organizer", eventId, "budget", id), {
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
      await updateDoc(doc(db, "events_organizer", eventId), { coverImage: coverUrl });
      setEvent({ ...event, coverImage: coverUrl });
      setShowPhotoModal(false);
    } catch (error) {
      console.error("Error al actualizar portada:", error);
    }
  };

  const handleDelete = async (subcol, id) => {
    await deleteDoc(doc(db, "events_organizer", eventId, subcol, id));
  };

  if (!event) return (
    <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white/70 tracking-[0.4em] text-[10px] uppercase font-['Poppins']">
      CARGANDO...
    </div>
  );

  const totalEstimated = budgetItems.reduce((acc, item) => acc + (Number(item.estimated) || 0), 0);
  const totalActual = budgetItems.reduce((acc, item) => acc + (Number(item.actual) || 0), 0);

  const totalCapacity = tables.reduce((acc, t) => acc + (Number(t.capacity) || 0), 0);
  const totalOccupied = guests.length; 
  const globalOccupancyPercentage = totalCapacity > 0 ? Math.min(100, Math.round((totalOccupied / totalCapacity) * 100)) : 0;

  return (
    <div className="min-h-screen w-full bg-[#070709] text-white font-['Open_Sans'] flex flex-col items-center overflow-x-hidden uppercase antialiased relative text-left box-border m-0 p-0 selection:bg-white selection:text-black">
      
      {/* LUCES DINÁMICAS VIVAS DE FONDO (Idénticas a ClientProfile) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ 
            x: [-100, 100, -100], 
            y: [-70, 70, -70], 
            scale: [1, 1.3, 1],
            opacity: [0.35, 0.55, 0.35]
          }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-purple-600/40 rounded-full blur-[130px]" 
        />
        <motion.div 
          animate={{ 
            x: [90, -90, 90], 
            y: [80, -80, 80], 
            scale: [1.2, 0.9, 1.2],
            opacity: [0.3, 0.5, 0.3]
          }} 
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute top-1/2 -right-20 w-[550px] h-[550px] bg-fuchsia-600/30 rounded-full blur-[140px]" 
        />
        <motion.div 
          animate={{ 
            x: [-50, 50, -50], 
            y: [60, -60, 60], 
            scale: [0.9, 1.2, 0.9],
            opacity: [0.25, 0.45, 0.25]
          }} 
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-purple-900/40 rounded-full blur-[150px]" 
        />
      </div>

      {/* TOPBAR GLASS */}
      <nav className="w-full bg-white/[0.07] backdrop-blur-2xl border-b border-white/20 sticky top-0 z-50 px-6 md:px-12 py-5 flex justify-center shadow-xl">
        <div className="max-w-[1400px] w-full flex justify-between items-center">
          <button onClick={() => navigate('/client-profile')} className="text-white/70 hover:text-white flex items-center gap-2 text-[9px] tracking-[0.3em] font-black transition-colors cursor-pointer">
            <ArrowLeft size={16}/> VOLVER
          </button>
          
          <div className="text-[18px] font-['Poppins'] font-normal tracking-[0.05em] uppercase text-white">
            CLASSCODE
          </div>

          <span className="text-[7px] tracking-widest px-3.5 py-1.5 bg-white/10 border border-white/25 rounded-full text-white font-black shadow-md">
            {event.category || 'EVENTO'}
          </span>
        </div>
      </nav>

      {/* PORTADA EN GLASS REAL */}
      <div className="w-full max-w-[1400px] px-6 md:px-12 mt-8 relative z-10">
        <div className="relative w-full min-h-[260px] md:min-h-[320px] bg-white/[0.07] backdrop-blur-3xl border border-white/25 rounded-2xl overflow-hidden group shadow-2xl flex flex-col justify-end">
          {event.coverImage ? (
            <img src={event.coverImage} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
              <span className="text-[9px] text-white/50 tracking-[0.3em] font-black">SIN IMAGEN DE PORTADA</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/60 to-transparent pointer-events-none"></div>

          <div className="relative z-10 p-6 md:p-10 w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-xl md:text-3xl font-['Poppins'] font-normal text-white tracking-wide leading-tight">{event.title}</h2>
              <div className="flex flex-wrap gap-4 text-[9px] text-white/90 font-bold">
                {event.date && <span className="flex items-center gap-2"><Calendar size={13} className="text-purple-400"/> {event.date}</span>}
                {event.location && <span className="flex items-center gap-2"><MapPin size={13} className="text-purple-400"/> {event.location}</span>}
              </div>
            </div>
            
            <button onClick={() => setShowPhotoModal(true)} className="px-5 py-3 bg-white/[0.12] backdrop-blur-md hover:bg-white/[0.2] border border-white/30 text-white rounded-xl text-[9px] font-black tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-xl">
              <ImageIcon size={15} className="text-purple-300"/> EDITAR PORTADA
            </button>
          </div>
        </div>
      </div>

      {/* PESTAÑAS CON ESTILO GLASS */}
      <div className="w-full max-w-[1400px] px-6 md:px-12 mt-8 relative z-10">
        <div className="grid grid-cols-3 gap-3 font-['Poppins']">
          <button onClick={() => setActiveTab('tables')} className={`py-4 px-4 rounded-xl text-[9px] font-black tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer border ${activeTab === 'tables' ? 'bg-purple-600 border-purple-400/50 text-white shadow-purple-600/30' : 'bg-white/[0.07] backdrop-blur-3xl border-white/20 text-white/70 hover:text-white hover:bg-white/[0.11]'}`}>
            <LayoutGrid size={15}/> <span className="truncate">PLANO</span>
          </button>
          <button onClick={() => setActiveTab('guests')} className={`py-4 px-4 rounded-xl text-[9px] font-black tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer border ${activeTab === 'guests' ? 'bg-purple-600 border-purple-400/50 text-white shadow-purple-600/30' : 'bg-white/[0.07] backdrop-blur-3xl border-white/20 text-white/70 hover:text-white hover:bg-white/[0.11]'}`}>
            <Users size={15}/> <span className="truncate">INVITADOS</span>
          </button>
          <button onClick={() => setActiveTab('budget')} className={`py-4 px-4 rounded-xl text-[9px] font-black tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer border ${activeTab === 'budget' ? 'bg-purple-600 border-purple-400/50 text-white shadow-purple-600/30' : 'bg-white/[0.07] backdrop-blur-3xl border-white/20 text-white/70 hover:text-white hover:bg-white/[0.11]'}`}>
            <DollarSign size={15}/> <span className="truncate">GASTOS</span>
          </button>
        </div>
      </div>

      <main className="w-full max-w-[1400px] px-6 md:px-12 py-8 flex-1 space-y-8 relative z-10 box-border">
        
        {/* TAB 1: PLANO GLOBAL */}
        {activeTab === 'tables' && (
          <div className="space-y-6">
            <form onSubmit={handleAddTable} className="bg-white/[0.07] backdrop-blur-3xl border border-white/25 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 font-bold items-center shadow-2xl">
              <input placeholder="NOMBRE (EJ: MESA 1)" value={newTable.name} onChange={e => setNewTable({...newTable, name: e.target.value})} className="w-full bg-white/[0.08] backdrop-blur-md border border-white/25 rounded-xl px-4 py-3.5 text-[10px] text-white outline-none focus:border-purple-400 tracking-widest uppercase placeholder:text-white/40 shadow-inner" required />
              <input type="number" placeholder="CAPACIDAD (EJ: 10)" value={newTable.capacity} onChange={e => setNewTable({...newTable, capacity: e.target.value})} className="w-full bg-white/[0.08] backdrop-blur-md border border-white/25 rounded-xl px-4 py-3.5 text-[10px] text-white outline-none focus:border-purple-400 tracking-widest uppercase placeholder:text-white/40 shadow-inner" required />
              <button type="submit" className="w-full py-3.5 bg-purple-600 backdrop-blur-md border border-purple-400/50 text-white rounded-xl text-[9px] font-black tracking-widest hover:bg-purple-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl font-['Poppins']">
                <Plus size={15}/> CREAR SECTOR
              </button>
            </form>

            <div className="bg-white/[0.07] backdrop-blur-3xl border border-white/25 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              
              <div className="flex flex-col gap-4 border-b border-white/20 pb-5 font-['Poppins']">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[7px] tracking-[0.4em] font-black text-purple-300 uppercase">DISTRIBUCIÓN</span>
                    <h3 className="text-lg md:text-xl font-normal text-white uppercase tracking-wide">Plano Global</h3>
                  </div>

                  <div className="flex items-center gap-4 bg-white/[0.08] backdrop-blur-md border border-white/20 px-4 py-3 rounded-xl shrink-0 shadow-inner">
                    <div className="space-y-0.5 text-right">
                      <span className="text-[6px] text-white/60 font-black tracking-widest block">OCUPADOS</span>
                      <span className="text-[10px] font-black text-white">{totalOccupied}/{totalCapacity}</span>
                    </div>
                    <div className="h-5 w-[1px] bg-white/20"></div>
                    <div className="space-y-0.5">
                      <span className="text-[6px] text-white/60 font-black tracking-widest block">TOTAL</span>
                      <span className="text-[10px] font-black text-purple-300">{globalOccupancyPercentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 bg-white/[0.08] backdrop-blur-md border border-white/20 p-1.5 rounded-xl">
                  <button onClick={() => setLayoutMode('tables')} className={`py-2.5 text-[8px] font-black tracking-widest rounded-lg transition-all cursor-pointer ${layoutMode === 'tables' ? 'bg-purple-600 text-white shadow-lg border border-purple-400/50' : 'text-white/70 hover:text-white'}`}>
                    MESAS
                  </button>
                  <button onClick={() => setLayoutMode('auditorium')} className={`py-2.5 text-[8px] font-black tracking-widest rounded-lg transition-all cursor-pointer ${layoutMode === 'auditorium' ? 'bg-purple-600 text-white shadow-lg border border-purple-400/50' : 'text-white/70 hover:text-white'}`}>
                    TEATRO
                  </button>
                  <button onClick={() => setLayoutMode('standing')} className={`py-2.5 text-[8px] font-black tracking-widest rounded-lg transition-all cursor-pointer ${layoutMode === 'standing' ? 'bg-purple-600 text-white shadow-lg border border-purple-400/50' : 'text-white/70 hover:text-white'}`}>
                    CAMPO
                  </button>
                </div>
              </div>

              {tables.length === 0 ? (
                <div className="py-16 text-center text-white/50 tracking-widest text-[9px] font-black">
                  NO HAY SECTORES REGISTRADOS
                </div>
              ) : (
                <>
                  {layoutMode === 'tables' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                      {tables.map((t) => {
                        const assignedGuests = guests.filter(g => g.table?.trim().toUpperCase() === t.name?.trim().toUpperCase());
                        const capacity = Number(t.capacity) || 10;
                        
                        return (
                          <div key={t.id} className="bg-white/[0.05] backdrop-blur-xl border border-white/20 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col items-center relative group">
                            
                            <div className="w-full flex justify-between items-center border-b border-white/15 pb-3">
                              <span className="font-['Poppins'] text-[12px] font-normal text-white uppercase">{t.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[7px] text-white/80 font-bold bg-white/10 px-2.5 py-1 rounded-full border border-white/20">{assignedGuests.length}/{capacity}</span>
                                <button onClick={() => handleDelete('tables', t.id)} className="p-2 bg-white/10 hover:bg-red-500/30 text-white/70 hover:text-red-300 border border-white/20 rounded-xl transition-all cursor-pointer shadow-lg">
                                  <Trash2 size={13}/>
                                </button>
                              </div>
                            </div>

                            <div className="relative w-40 h-40 my-2 flex items-center justify-center">
                              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/30 flex flex-col items-center justify-center text-center shadow-inner z-10 p-1">
                                <Utensils size={14} className="text-purple-300 mb-0.5" />
                                <span className="text-[7px] font-black text-white truncate max-w-[55px]">{t.name}</span>
                              </div>

                              {Array.from({ length: capacity }).map((_, idx) => {
                                const angle = (idx * 360) / capacity;
                                const radian = (angle * Math.PI) / 180;
                                const radius = 58;
                                const x = Math.cos(radian) * radius;
                                const y = Math.sin(radian) * radius;
                                const assignedGuest = assignedGuests[idx];

                                return (
                                  <div
                                    key={idx}
                                    title={assignedGuest ? `${assignedGuest.name} (${assignedGuest.status})` : `Asiento ${idx + 1}`}
                                    style={{ transform: `translate(${x}px, ${y}px)` }}
                                    className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-[7px] font-black border transition-all shadow-md ${
                                      assignedGuest
                                        ? assignedGuest.status === 'CONFIRMADO'
                                          ? 'bg-purple-600 text-white border-purple-300 scale-110 z-20 shadow-purple-600/50'
                                          : 'bg-amber-500/30 text-amber-300 border-amber-400/60 scale-110 z-20'
                                        : 'bg-white/10 text-white/40 border-white/20'
                                    }`}
                                  >
                                    {idx + 1}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="w-full bg-[#070709]/60 border border-white/15 rounded-xl p-2.5 space-y-1.5 max-h-24 overflow-y-auto scrollbar-hide">
                              {assignedGuests.length === 0 ? (
                                <p className="text-[7px] text-white/40 text-center tracking-widest py-1 font-bold">MESA LIBRE</p>
                              ) : (
                                assignedGuests.map(g => (
                                  <div key={g.id} className="flex justify-between items-center text-[8px] text-white font-bold px-1.5 py-0.5">
                                    <span className="truncate max-w-[120px]">{g.name}</span>
                                    <span className={`text-[6px] px-1.5 py-0.5 rounded-md font-black ${g.status === 'CONFIRMADO' ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50' : 'bg-amber-500/20 text-amber-300'}`}>{g.status}</span>
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
                    <div className="space-y-4 pt-2">
                      <div className="w-full bg-white/[0.08] backdrop-blur-md border border-white/25 py-3 rounded-xl text-center text-[8px] tracking-[0.4em] font-black text-purple-300 shadow-inner">
                        ESCENARIO PRINCIPAL
                      </div>

                      <div className="grid gap-4">
                        {tables.map((t) => {
                          const assignedGuests = guests.filter(g => g.table?.trim().toUpperCase() === t.name?.trim().toUpperCase());
                          const capacity = Number(t.capacity) || 20;

                          return (
                            <div key={t.id} className="bg-white/[0.05] backdrop-blur-xl border border-white/20 rounded-2xl p-5 space-y-4">
                              <div className="flex justify-between items-center border-b border-white/15 pb-3">
                                <h4 className="font-['Poppins'] text-sm font-normal text-white uppercase">{t.name}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-[7px] text-white/80 font-bold bg-white/10 px-2.5 py-1 rounded-full border border-white/20">{assignedGuests.length}/{capacity}</span>
                                  <button onClick={() => handleDelete('tables', t.id)} className="p-2 bg-white/10 hover:bg-red-500/30 text-white/70 hover:text-red-300 border border-white/20 rounded-xl transition-all cursor-pointer shadow-lg">
                                    <Trash2 size={13}/>
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto scrollbar-hide p-1 justify-center">
                                {Array.from({ length: capacity }).map((_, idx) => {
                                  const guestInSeat = assignedGuests[idx];
                                  return (
                                    <div 
                                      key={idx}
                                      title={guestInSeat ? `${guestInSeat.name} (${guestInSeat.status})` : `Butaca ${idx + 1}`}
                                      className={`w-7 h-7 rounded-lg flex flex-col items-center justify-center text-[7px] font-black border transition-all ${
                                        guestInSeat 
                                          ? guestInSeat.status === 'CONFIRMADO' 
                                            ? 'bg-purple-600 text-white border-purple-300 shadow-purple-600/50' 
                                            : 'bg-amber-500/30 text-amber-300 border-amber-400/50'
                                          : 'bg-white/10 text-white/40 border-white/20'
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
                    <div className="space-y-4 pt-2">
                      <div className="w-full bg-white/[0.08] backdrop-blur-md border border-white/25 py-3 rounded-xl text-center text-[8px] tracking-[0.4em] font-black text-purple-300 shadow-inner">
                        ACCESO GENERAL / CAMPO
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tables.map((t) => {
                          const assignedGuests = guests.filter(g => g.table?.trim().toUpperCase() === t.name?.trim().toUpperCase());
                          const capacity = Number(t.capacity) || 100;
                          const percentage = Math.min(100, Math.round((assignedGuests.length / capacity) * 100));

                          return (
                            <div key={t.id} className="bg-white/[0.05] backdrop-blur-xl border border-white/20 rounded-2xl p-5 space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-['Poppins'] text-sm font-normal text-white uppercase">{t.name}</h4>
                                <button onClick={() => handleDelete('tables', t.id)} className="p-2 bg-white/10 hover:bg-red-500/30 text-white/70 hover:text-red-300 border border-white/20 rounded-xl transition-all cursor-pointer shadow-lg">
                                  <Trash2 size={13}/>
                                </button>
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex justify-between text-[8px] font-black text-white/80">
                                  <span>ASISTENTES: {assignedGuests.length}</span>
                                  <span className="text-purple-300">{percentage}%</span>
                                </div>
                                <div className="w-full h-2 bg-[#070709] rounded-full overflow-hidden border border-white/20">
                                  <div className="h-full bg-purple-600 transition-all duration-500 shadow-[0_0_12px_rgba(147,51,234,0.6)]" style={{ width: `${percentage}%` }}></div>
                                </div>
                              </div>

                              <div className="max-h-28 overflow-y-auto scrollbar-hide space-y-1.5 pt-3 border-t border-white/15">
                                {assignedGuests.length === 0 ? (
                                  <p className="text-[7px] text-white/40 tracking-widest text-center font-bold">SIN REGISTROS</p>
                                ) : (
                                  assignedGuests.map(ag => (
                                    <div key={ag.id} className="text-[8px] text-white bg-white/[0.08] px-3 py-1.5 rounded-xl border border-white/15 flex justify-between items-center font-bold">
                                      <span className="truncate">{ag.name}</span>
                                      <span className={`text-[6px] px-1.5 py-0.5 rounded font-black ${ag.status === 'CONFIRMADO' ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50' : 'bg-amber-500/20 text-amber-300'}`}>{ag.status}</span>
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

        {/* TAB 2: INVITADOS */}
        {activeTab === 'guests' && (
          <div className="space-y-6">
            <form onSubmit={handleAddGuest} className="bg-white/[0.07] backdrop-blur-3xl border border-white/25 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 font-bold items-center shadow-2xl">
              <input placeholder="NOMBRE Y APELLIDO" value={newGuest.name} onChange={e => setNewGuest({...newGuest, name: e.target.value})} className="w-full bg-white/[0.08] backdrop-blur-md border border-white/25 rounded-xl px-4 py-3.5 text-[10px] text-white outline-none focus:border-purple-400 tracking-widest uppercase placeholder:text-white/40 shadow-inner" required />
              <select value={newGuest.table} onChange={e => setNewGuest({...newGuest, table: e.target.value})} className="w-full bg-[#121318] border border-white/25 rounded-xl px-4 py-3.5 text-[10px] text-white outline-none focus:border-purple-400 tracking-widest uppercase cursor-pointer shadow-inner">
                {tables.length === 0 ? <option value="">SIN SECTORES</option> : tables.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
              <select value={newGuest.status} onChange={e => setNewGuest({...newGuest, status: e.target.value})} className="w-full bg-[#121318] border border-white/25 rounded-xl px-4 py-3.5 text-[10px] text-white outline-none focus:border-purple-400 tracking-widest uppercase cursor-pointer shadow-inner">
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="CONFIRMADO">CONFIRMADO</option>
              </select>
              <button type="submit" className="w-full py-3.5 bg-purple-600 backdrop-blur-md border border-purple-400/50 text-white rounded-xl text-[9px] font-black tracking-widest hover:bg-purple-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl font-['Poppins']">
                <Plus size={15}/> AGREGAR
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {guests.map(g => (
                <div key={g.id} className="bg-white/[0.07] backdrop-blur-3xl border border-white/25 p-5 rounded-2xl flex justify-between items-center shadow-xl">
                  <div className="space-y-1">
                    <h4 className="font-['Poppins'] font-normal text-white text-[12px]">{g.name}</h4>
                    <p className="text-[8px] text-white/70 font-bold tracking-widest">{g.table} — <span className={g.status === 'CONFIRMADO' ? 'text-purple-300 font-black' : 'text-amber-400'}>{g.status}</span></p>
                  </div>
                  <button onClick={() => handleDelete('guests', g.id)} className="p-2.5 bg-white/[0.08] hover:bg-red-500/30 text-white/80 hover:text-red-300 border border-white/25 rounded-xl transition-all cursor-pointer shadow-lg">
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GASTOS */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <form onSubmit={handleAddBudget} className="bg-white/[0.07] backdrop-blur-3xl border border-white/25 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 font-bold items-center shadow-2xl">
              <input placeholder="CONCEPTO (EJ: CATERING)" value={newBudget.concept} onChange={e => setNewBudget({...newBudget, concept: e.target.value})} className="w-full bg-white/[0.08] backdrop-blur-md border border-white/25 rounded-xl px-4 py-3.5 text-[10px] text-white outline-none focus:border-purple-400 tracking-widest uppercase placeholder:text-white/40 shadow-inner" required />
              <input type="number" placeholder="ESTIMADO ($)" value={newBudget.estimated} onChange={e => setNewBudget({...newBudget, estimated: e.target.value})} className="w-full bg-white/[0.08] backdrop-blur-md border border-white/25 rounded-xl px-4 py-3.5 text-[10px] text-white outline-none focus:border-purple-400 tracking-widest uppercase placeholder:text-white/40 shadow-inner" />
              <input type="number" placeholder="REAL ($)" value={newBudget.actual} onChange={e => setNewBudget({...newBudget, actual: e.target.value})} className="w-full bg-white/[0.08] backdrop-blur-md border border-white/25 rounded-xl px-4 py-3.5 text-[10px] text-white outline-none focus:border-purple-400 tracking-widest uppercase placeholder:text-white/40 shadow-inner" />
              <button type="submit" className="w-full py-3.5 bg-purple-600 backdrop-blur-md border border-purple-400/50 text-white rounded-xl text-[9px] font-black tracking-widest hover:bg-purple-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl font-['Poppins']">
                <Plus size={15}/> AGREGAR GASTO
              </button>
            </form>

            <div className="bg-white/[0.07] backdrop-blur-3xl border border-white/25 rounded-2xl p-6 md:p-8 overflow-x-auto shadow-2xl space-y-6">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/20 text-[8px] text-white/60 tracking-[0.3em] font-black">
                    <th className="pb-4">CONCEPTO</th>
                    <th className="pb-4">ESTIMADO</th>
                    <th className="pb-4">REAL</th>
                    <th className="pb-4 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-[10px] font-bold">
                  {budgetItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-white/50 tracking-widest">SIN GASTOS REGISTRADOS</td>
                    </tr>
                  ) : (
                    budgetItems.map(b => {
                      const isEditing = editingBudgetId === b.id;
                      return (
                        <tr key={b.id}>
                          <td className="py-4 text-white">
                            {isEditing ? (
                              <input value={editBudgetValues.concept} onChange={e => setEditBudgetValues({...editBudgetValues, concept: e.target.value})} className="bg-white/10 border border-purple-400 rounded-xl p-2.5 text-white outline-none w-full shadow-inner" />
                            ) : b.concept}
                          </td>
                          <td className="py-4 text-white/80">
                            {isEditing ? (
                              <input type="number" value={editBudgetValues.estimated} onChange={e => setEditBudgetValues({...editBudgetValues, estimated: e.target.value})} className="bg-white/10 border border-purple-400 rounded-xl p-2.5 text-white outline-none w-24 shadow-inner" />
                            ) : `$${b.estimated}`}
                          </td>
                          <td className="py-4 text-white">
                            {isEditing ? (
                              <input type="number" value={editBudgetValues.actual} onChange={e => setEditBudgetValues({...editBudgetValues, actual: e.target.value})} className="bg-white/10 border border-purple-400 rounded-xl p-2.5 text-white outline-none w-24 shadow-inner" />
                            ) : `$${b.actual}`}
                          </td>
                          <td className="py-4 text-right flex items-center justify-end gap-2">
                            {isEditing ? (
                              <>
                                <button onClick={() => handleUpdateBudget(b.id)} className="p-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 rounded-xl cursor-pointer shadow-lg"><Check size={14}/></button>
                                <button onClick={() => setEditingBudgetId(null)} className="p-2 bg-white/10 text-white/80 border border-white/20 rounded-xl cursor-pointer shadow-lg"><X size={14}/></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { setEditingBudgetId(b.id); setEditBudgetValues({ concept: b.concept, estimated: b.estimated, actual: b.actual }); }} className="p-2.5 bg-white/[0.08] hover:bg-white/[0.15] text-white/80 hover:text-white border border-white/25 rounded-xl transition-all cursor-pointer shadow-lg"><Edit3 size={14}/></button>
                                <button onClick={() => handleDelete('budget', b.id)} className="p-2.5 bg-white/[0.08] hover:bg-red-500/30 text-white/80 hover:text-red-300 border border-white/25 rounded-xl transition-all cursor-pointer shadow-lg"><Trash2 size={14}/></button>
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
                <div className="pt-4 border-t border-white/20 flex flex-col md:flex-row justify-between items-start md:items-center text-[9px] font-black tracking-widest px-1 gap-3">
                  <span className="text-white/70">TOTALES:</span>
                  <div className="flex gap-6">
                    <span className="text-white/60">EST: <span className="text-white">${totalEstimated}</span></span>
                    <span className="text-white/60">REAL: <span className="text-purple-300">${totalActual}</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* MODAL CONFIGURACIÓN DE PORTADA EN GLASS */}
      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 uppercase">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0c10]/85 backdrop-blur-3xl w-full max-w-lg p-6 md:p-8 rounded-2xl border border-white/25 relative shadow-2xl space-y-6"
            >
              <button onClick={() => setShowPhotoModal(false)} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors cursor-pointer p-2 z-10"><X size={22} /></button>
              
              <div className="space-y-1 text-center">
                <span className="text-[7px] tracking-[0.3em] font-black text-purple-300 uppercase">CONFIGURACIÓN</span>
                <h3 className="text-lg font-['Poppins'] font-normal text-white uppercase">Imagen de Portada</h3>
              </div>

              <form onSubmit={handleUpdateCover} className="space-y-5 font-bold">
                <div className="space-y-2">
                  <label className="text-[8px] tracking-[0.3em] text-white/80 font-black">Archivo local</label>
                  <label className="w-full bg-white/[0.08] backdrop-blur-md border border-dashed border-white/35 hover:border-purple-400 rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer transition-all text-[9px] text-white shadow-inner">
                    <Upload size={15} className="text-purple-400" />
                    <span>SELECCIONAR ARCHIVO...</span>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-white/20"></div>
                  <span className="flex-shrink mx-3 text-white/50 text-[7px] tracking-widest font-black">O URL DE IMAGEN</span>
                  <div className="flex-grow border-t border-white/20"></div>
                </div>

                <input placeholder="https://..." value={coverUrl.startsWith('data:') ? '' : coverUrl} onChange={e => setCoverUrl(e.target.value)} className="w-full bg-white/[0.08] backdrop-blur-md border border-white/25 rounded-xl px-4 py-3.5 text-[10px] text-white outline-none focus:border-purple-400 tracking-widest uppercase placeholder:text-white/40 shadow-inner" />
                
                {coverUrl && (
                  <div className="w-full h-24 rounded-xl overflow-hidden border border-white/25 mt-2 shadow-inner bg-black/50">
                    <img src={coverUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <button type="submit" className="w-full py-3.5 bg-purple-600 backdrop-blur-md border border-purple-400/50 text-white rounded-xl text-[9px] font-black tracking-[0.3em] uppercase hover:bg-purple-500 transition-all shadow-xl cursor-pointer">
                  GUARDAR PORTADA
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}