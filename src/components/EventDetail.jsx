import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from "../firebase";
import { doc, getDoc, collection, onSnapshot, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, LayoutGrid, DollarSign, Plus, Trash2, Edit3, Image as ImageIcon, Check, X, Calendar, MapPin, Upload, Utensils, CheckSquare, Square, CheckCircle2, PhoneCall } from 'lucide-react';

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('tables');

  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [layoutMode, setLayoutMode] = useState('tables');

  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [editBudgetValues, setEditBudgetValues] = useState({ concept: '', estimated: 0, actual: 0 });

  const [newGuest, setNewGuest] = useState({ name: '', table: '', status: 'PENDIENTE', phone: '', contacted: false, confirmed: false });
  const [newTable, setNewTable] = useState({ name: '', capacity: 10 });
  const [newBudget, setNewBudget] = useState({ concept: '', estimated: '', actual: '', hired: false });
  const [newTaskText, setNewTaskText] = useState('');
  
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');

  // Estados para editar la ubicación
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationValue, setLocationValue] = useState('');

  // Estados para editar la fecha
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateValue, setDateValue] = useState('');

  useEffect(() => {
    if (!eventId) return;
    const fetchEvent = async () => {
      const docSnap = await getDoc(doc(db, "events_organizer", eventId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEvent(data);
        setCoverUrl(data.coverImage || '');
        setLocationValue(data.location || '');
        setDateValue(data.date || '');
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

    const unsubTasks = onSnapshot(collection(db, "events_organizer", eventId, "tasks"), (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubGuests();
      unsubTables();
      unsubBudget();
      unsubTasks();
    };
  }, [eventId]);

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuest.name || !newGuest.table) return;
    await addDoc(collection(db, "events_organizer", eventId, "guests"), {
      name: newGuest.name.trim().toUpperCase(),
      table: newGuest.table.trim().toUpperCase(),
      status: newGuest.status,
      phone: newGuest.phone.trim(),
      contacted: newGuest.contacted,
      confirmed: newGuest.status === 'CONFIRMADO'
    });
    setNewGuest({ name: '', table: tables[0]?.name || '', status: 'PENDIENTE', phone: '', contacted: false, confirmed: false });
  };

  const handleToggleGuestField = async (guestId, field, currentValue) => {
    try {
      const docRef = doc(db, "events_organizer", eventId, "guests", guestId);
      const updates = { [field]: !currentValue };
      if (field === 'confirmed') {
        updates.status = !currentValue ? 'CONFIRMADO' : 'PENDIENTE';
      }
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error al actualizar invitado:", error);
    }
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
      actual: Number(newBudget.actual) || 0,
      hired: false
    });
    setNewBudget({ concept: '', estimated: '', actual: '', hired: false });
  };

  const handleToggleBudgetHired = async (id, currentHired) => {
    try {
      await updateDoc(doc(db, "events_organizer", eventId, "budget", id), {
        hired: !currentHired
      });
    } catch (error) {
      console.error("Error al actualizar contratación:", error);
    }
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

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    await addDoc(collection(db, "events_organizer", eventId, "tasks"), {
      text: newTaskText.trim().toUpperCase(),
      completed: false
    });
    setNewTaskText('');
  };

  const handleToggleTask = async (id, currentCompleted) => {
    try {
      await updateDoc(doc(db, "events_organizer", eventId, "tasks", id), {
        completed: !currentCompleted
      });
    } catch (error) {
      console.error("Error al actualizar tarea:", error);
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

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    try {
      const formattedLocation = locationValue.trim().toUpperCase();
      await updateDoc(doc(db, "events_organizer", eventId), { location: formattedLocation });
      setEvent({ ...event, location: formattedLocation });
      setShowLocationModal(false);
    } catch (error) {
      console.error("Error al actualizar ubicación:", error);
    }
  };

  const handleUpdateDate = async (e) => {
    e.preventDefault();
    try {
      const formattedDate = dateValue.trim().toUpperCase();
      await updateDoc(doc(db, "events_organizer", eventId), { date: formattedDate });
      setEvent({ ...event, date: formattedDate });
      setShowDateModal(false);
    } catch (error) {
      console.error("Error al actualizar fecha:", error);
    }
  };

  const handleDelete = async (subcol, id) => {
    await deleteDoc(doc(db, "events_organizer", eventId, subcol, id));
  };

  if (!event) return (
    <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white/70 tracking-[0.4em] text-[9px] uppercase font-['Poppins']">
      CARGANDO...
    </div>
  );

  const totalEstimated = budgetItems.reduce((acc, item) => acc + (Number(item.estimated) || 0), 0);
  const totalActual = budgetItems.reduce((acc, item) => acc + (Number(item.actual) || 0), 0);
  const totalHiredCost = budgetItems.reduce((acc, item) => acc + (item.hired ? (Number(item.actual) || Number(item.estimated) || 0) : 0), 0);

  const totalCapacity = tables.reduce((acc, t) => acc + (Number(t.capacity) || 0), 0);
  const totalOccupied = guests.length; 
  const globalOccupancyPercentage = totalCapacity > 0 ? Math.min(100, Math.round((totalOccupied / totalCapacity) * 100)) : 0;
  const completedTasksCount = tasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen w-full bg-[#070709] text-white font-['Open_Sans'] flex flex-col items-center overflow-x-hidden uppercase antialiased relative text-left box-border m-0 p-0 selection:bg-white selection:text-black">
      
      {/* LUCES DINÁMICAS SUTIBLES DE FONDO */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ x: [-80, 80, -80], y: [-50, 50, -50], opacity: [0.2, 0.35, 0.2] }} 
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-purple-600/25 rounded-full blur-[140px]" 
        />
        <motion.div 
          animate={{ x: [70, -70, 70], y: [60, -60, 60], opacity: [0.15, 0.3, 0.15] }} 
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-fuchsia-600/20 rounded-full blur-[150px]" 
        />
      </div>

      {/* TOPBAR GLASS ESTILIZADA */}
      <nav className="w-full bg-white/[0.04] backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex justify-center shadow-sm">
        <div className="max-w-[1000px] w-full flex justify-between items-center">
          <button onClick={() => navigate('/client-profile')} className="text-white/60 hover:text-white flex items-center gap-1.5 text-[8px] tracking-[0.25em] font-black transition-colors cursor-pointer">
            <ArrowLeft size={14}/> VOLVER
          </button>
          
          <div className="text-[14px] font-['Poppins'] font-normal tracking-[0.05em] uppercase text-white">
            CLASSCODE
          </div>

          <span className="text-[7px] tracking-widest px-3 py-1 bg-white/5 border border-white/15 rounded-full text-white/80 font-black">
            {event.category || 'EVENTO'}
          </span>
        </div>
      </nav>

      {/* PORTADA EN GLASS SUTIL Y FINO */}
      <div className="w-full max-w-[1000px] px-4 sm:px-8 mt-6 relative z-10">
        <div className="relative w-full min-h-[200px] sm:min-h-[240px] bg-white/[0.04] backdrop-blur-2xl border border-white/15 rounded-2xl overflow-hidden group shadow-lg flex flex-col justify-end">
          {event.coverImage ? (
            <img src={event.coverImage} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
              <span className="text-[8px] text-white/40 tracking-[0.3em] font-black">SIN IMAGEN DE PORTADA</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/50 to-transparent pointer-events-none"></div>

          <div className="relative z-10 p-5 sm:p-8 w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="space-y-2 max-w-xl">
              <h2 className="text-lg sm:text-2xl font-['Poppins'] font-normal text-white tracking-wide leading-tight">{event.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-[8px] text-white/80 font-bold">
                
                {/* FECHA EDITABLE */}
                <button onClick={() => setShowDateModal(true)} className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 px-2.5 py-1 rounded-lg transition-all cursor-pointer text-white/90">
                  <Calendar size={12} className="text-purple-300"/> 
                  <span>{event.date || 'AGREGAR FECHA'}</span>
                  <Edit3 size={10} className="text-white/40 ml-1"/>
                </button>
                
                {/* UBICACIÓN EDITABLE */}
                <button onClick={() => setShowLocationModal(true)} className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 px-2.5 py-1 rounded-lg transition-all cursor-pointer text-white/90">
                  <MapPin size={12} className="text-purple-300"/> 
                  <span>{event.location || 'AGREGAR UBICACIÓN'}</span>
                  <Edit3 size={10} className="text-white/40 ml-1"/>
                </button>
              </div>
            </div>
            
            <button onClick={() => setShowPhotoModal(true)} className="w-full sm:w-auto px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/20 text-white rounded-xl text-[8px] font-black tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm">
              <ImageIcon size={13} className="text-purple-300"/> EDITAR PORTADA
            </button>
          </div>
        </div>
      </div>

      {/* PESTAÑAS AMPLIADAS (INCLUYENDO TAREAS/PENDIENTES) */}
      <div className="w-full max-w-[1000px] px-4 sm:px-8 mt-6 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-['Poppins']">
          <button onClick={() => setActiveTab('tables')} className={`py-3 px-3 rounded-xl text-[8px] font-black tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${activeTab === 'tables' ? 'bg-white/15 border-white/30 text-white shadow-sm' : 'bg-white/[0.04] backdrop-blur-xl border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08]'}`}>
            <LayoutGrid size={13}/> <span className="truncate">PLANO</span>
          </button>
          <button onClick={() => setActiveTab('guests')} className={`py-3 px-3 rounded-xl text-[8px] font-black tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${activeTab === 'guests' ? 'bg-white/15 border-white/30 text-white shadow-sm' : 'bg-white/[0.04] backdrop-blur-xl border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08]'}`}>
            <Users size={13}/> <span className="truncate">INVITADOS ({guests.length})</span>
          </button>
          <button onClick={() => setActiveTab('budget')} className={`py-3 px-3 rounded-xl text-[8px] font-black tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${activeTab === 'budget' ? 'bg-white/15 border-white/30 text-white shadow-sm' : 'bg-white/[0.04] backdrop-blur-xl border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08]'}`}>
            <DollarSign size={13}/> <span className="truncate">GASTOS</span>
          </button>
          <button onClick={() => setActiveTab('tasks')} className={`py-3 px-3 rounded-xl text-[8px] font-black tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${activeTab === 'tasks' ? 'bg-white/15 border-white/30 text-white shadow-sm' : 'bg-white/[0.04] backdrop-blur-xl border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08]'}`}>
            <CheckSquare size={13}/> <span className="truncate">PENDIENTES ({completedTasksCount}/{tasks.length})</span>
          </button>
        </div>
      </div>

      <main className="w-full max-w-[1000px] px-4 sm:px-8 py-6 sm:py-8 flex-1 space-y-6 relative z-10 box-border">
        
        {/* TAB 1: PLANO GLOBAL */}
        {activeTab === 'tables' && (
          <div className="space-y-5">
            <form onSubmit={handleAddTable} className="bg-white/[0.04] backdrop-blur-2xl border border-white/15 p-4 sm:p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 font-bold items-center shadow-md">
              <input placeholder="NOMBRE (EJ: MESA 1)" value={newTable.name} onChange={e => setNewTable({...newTable, name: e.target.value})} className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-3 text-[9px] text-white outline-none focus:border-white/40 tracking-widest uppercase placeholder:text-white/30" required />
              <input type="number" placeholder="CAPACIDAD (EJ: 10)" value={newTable.capacity} onChange={e => setNewTable({...newTable, capacity: e.target.value})} className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-3 text-[9px] text-white outline-none focus:border-white/40 tracking-widest uppercase placeholder:text-white/30" required />
              <button type="submit" className="w-full py-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white rounded-xl text-[8px] font-black tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer font-['Poppins']">
                <Plus size={13}/> CREAR SECTOR
              </button>
            </form>

            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/15 rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg relative overflow-hidden">
              
              <div className="flex flex-col gap-3 border-b border-white/10 pb-4 font-['Poppins']">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[7px] tracking-[0.3em] font-black text-white/50 uppercase">DISTRIBUCIÓN</span>
                    <h3 className="text-base sm:text-lg font-normal text-white uppercase tracking-wide">Plano Global</h3>
                  </div>

                  <div className="flex items-center gap-3 bg-white/[0.06] border border-white/15 px-3.5 py-2 rounded-xl shrink-0">
                    <div className="space-y-0.5 text-right">
                      <span className="text-[6px] text-white/50 font-black tracking-widest block">OCUPADOS</span>
                      <span className="text-[9px] font-black text-white">{totalOccupied}/{totalCapacity}</span>
                    </div>
                    <div className="h-4 w-[1px] bg-white/15"></div>
                    <div className="space-y-0.5">
                      <span className="text-[6px] text-white/50 font-black tracking-widest block">TOTAL</span>
                      <span className="text-[9px] font-black text-purple-300">{globalOccupancyPercentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 bg-white/[0.06] border border-white/15 p-1 rounded-xl">
                  <button onClick={() => setLayoutMode('tables')} className={`py-2 text-[7px] font-black tracking-widest rounded-lg transition-all cursor-pointer ${layoutMode === 'tables' ? 'bg-white/20 text-white border border-white/30' : 'text-white/60 hover:text-white'}`}>
                    MESAS
                  </button>
                  <button onClick={() => setLayoutMode('auditorium')} className={`py-2 text-[7px] font-black tracking-widest rounded-lg transition-all cursor-pointer ${layoutMode === 'auditorium' ? 'bg-white/20 text-white border border-white/30' : 'text-white/60 hover:text-white'}`}>
                    TEATRO
                  </button>
                  <button onClick={() => setLayoutMode('standing')} className={`py-2 text-[7px] font-black tracking-widest rounded-lg transition-all cursor-pointer ${layoutMode === 'standing' ? 'bg-white/20 text-white border border-white/30' : 'text-white/60 hover:text-white'}`}>
                    CAMPO
                  </button>
                </div>
              </div>

              {tables.length === 0 ? (
                <div className="py-12 text-center text-white/40 tracking-widest text-[8px] font-black">
                  NO HAY SECTORES REGISTRADOS
                </div>
              ) : (
                <>
                  {layoutMode === 'tables' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                      {tables.map((t) => {
                        const assignedGuests = guests.filter(g => g.table?.trim().toUpperCase() === t.name?.trim().toUpperCase());
                        const capacity = Number(t.capacity) || 10;
                        
                        return (
                          <div key={t.id} className="bg-white/[0.03] backdrop-blur-xl border border-white/15 rounded-2xl p-4 space-y-3 shadow-md flex flex-col items-center relative group">
                            
                            <div className="w-full flex justify-between items-center border-b border-white/10 pb-2.5">
                              <span className="font-['Poppins'] text-[11px] font-normal text-white uppercase">{t.name}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[7px] text-white/70 font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/10">{assignedGuests.length}/{capacity}</span>
                                <button onClick={() => handleDelete('tables', t.id)} className="p-1.5 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-300 border border-white/10 rounded-lg transition-all cursor-pointer">
                                  <Trash2 size={12}/>
                                </button>
                              </div>
                            </div>

                            <div className="relative w-36 h-36 my-1 flex items-center justify-center">
                              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/20 flex flex-col items-center justify-center text-center z-10 p-1">
                                <Utensils size={12} className="text-purple-300 mb-0.5" />
                                <span className="text-[6px] font-black text-white truncate max-w-[45px]">{t.name}</span>
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
                                    className={`absolute w-5 h-5 rounded-full flex items-center justify-center text-[6px] font-black border transition-all ${
                                      assignedGuest
                                        ? assignedGuest.status === 'CONFIRMADO'
                                          ? 'bg-white/20 text-white border-white/40 scale-110 z-20'
                                          : 'bg-amber-500/20 text-amber-300 border-amber-400/40 scale-110 z-20'
                                        : 'bg-white/5 text-white/30 border-white/10'
                                    }`}
                                  >
                                    {idx + 1}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="w-full bg-[#070709]/50 border border-white/10 rounded-xl p-2 space-y-1 max-h-20 overflow-y-auto scrollbar-hide">
                              {assignedGuests.length === 0 ? (
                                <p className="text-[6px] text-white/30 text-center tracking-widest py-0.5 font-bold">MESA LIBRE</p>
                              ) : (
                                assignedGuests.map(g => (
                                  <div key={g.id} className="flex justify-between items-center text-[7px] text-white font-bold px-1">
                                    <span className="truncate max-w-[100px]">{g.name}</span>
                                    <span className={`text-[6px] px-1 rounded font-black ${g.status === 'CONFIRMADO' ? 'bg-white/15 text-white border border-white/25' : 'bg-amber-500/20 text-amber-300'}`}>{g.status}</span>
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
                    <div className="space-y-3 pt-1">
                      <div className="w-full bg-white/[0.06] border border-white/15 py-2.5 rounded-xl text-center text-[7px] tracking-[0.3em] font-black text-white/80">
                        ESCENARIO PRINCIPAL
                      </div>

                      <div className="grid gap-3">
                        {tables.map((t) => {
                          const assignedGuests = guests.filter(g => g.table?.trim().toUpperCase() === t.name?.trim().toUpperCase());
                          const capacity = Number(t.capacity) || 20;

                          return (
                            <div key={t.id} className="bg-white/[0.03] backdrop-blur-xl border border-white/15 rounded-xl p-4 space-y-3">
                              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                                <h4 className="font-['Poppins'] text-xs font-normal text-white uppercase">{t.name}</h4>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[7px] text-white/70 font-bold bg-white/5 px-2 py-0.5 rounded-full border border-white/10">{assignedGuests.length}/{capacity}</span>
                                  <button onClick={() => handleDelete('tables', t.id)} className="p-1.5 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-300 border border-white/10 rounded-lg transition-all cursor-pointer">
                                    <Trash2 size={12}/>
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
                                      className={`w-6 h-6 rounded-md flex flex-col items-center justify-center text-[6px] font-black border transition-all ${
                                        guestInSeat 
                                          ? guestInSeat.status === 'CONFIRMADO' 
                                            ? 'bg-white/20 text-white border-white/40' 
                                            : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                                          : 'bg-white/5 text-white/30 border-white/10'
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
                    <div className="space-y-3 pt-1">
                      <div className="w-full bg-white/[0.06] border border-white/15 py-2.5 rounded-xl text-center text-[7px] tracking-[0.3em] font-black text-white/80">
                        ACCESO GENERAL / CAMPO
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {tables.map((t) => {
                          const assignedGuests = guests.filter(g => g.table?.trim().toUpperCase() === t.name?.trim().toUpperCase());
                          const capacity = Number(t.capacity) || 100;
                          const percentage = Math.min(100, Math.round((assignedGuests.length / capacity) * 100));

                          return (
                            <div key={t.id} className="bg-white/[0.03] backdrop-blur-xl border border-white/15 rounded-xl p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <h4 className="font-['Poppins'] text-xs font-normal text-white uppercase">{t.name}</h4>
                                <button onClick={() => handleDelete('tables', t.id)} className="p-1.5 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-300 border border-white/10 rounded-lg transition-all cursor-pointer">
                                  <Trash2 size={12}/>
                                </button>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-[7px] font-black text-white/70">
                                  <span>ASISTENTES: {assignedGuests.length}</span>
                                  <span className="text-purple-300">{percentage}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#070709] rounded-full overflow-hidden border border-white/10">
                                  <div className="h-full bg-white/60 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                </div>
                              </div>

                              <div className="max-h-24 overflow-y-auto scrollbar-hide space-y-1 pt-2 border-t border-white/10">
                                {assignedGuests.length === 0 ? (
                                  <p className="text-[6px] text-white/30 tracking-widest text-center font-bold">SIN REGISTROS</p>
                                ) : (
                                  assignedGuests.map(ag => (
                                    <div key={ag.id} className="text-[7px] text-white bg-white/[0.05] px-2.5 py-1 rounded-lg border border-white/10 flex justify-between items-center font-bold">
                                      <span className="truncate">{ag.name}</span>
                                      <span className={`text-[6px] px-1 rounded font-black ${ag.status === 'CONFIRMADO' ? 'bg-white/15 text-white border border-white/25' : 'bg-amber-500/20 text-amber-300'}`}>{ag.status}</span>
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

        {/* TAB 2: INVITADOS (CON TELÉFONO Y BOTONES DE ESTADO INTERACTIVOS) */}
        {activeTab === 'guests' && (
          <div className="space-y-5">
            <form onSubmit={handleAddGuest} className="bg-white/[0.04] backdrop-blur-2xl border border-white/15 p-4 sm:p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-bold items-center shadow-md">
              <input placeholder="NOMBRE Y APELLIDO" value={newGuest.name} onChange={e => setNewGuest({...newGuest, name: e.target.value})} className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-3 text-[9px] text-white outline-none focus:border-white/40 tracking-widest uppercase placeholder:text-white/30" required />
              <input placeholder="TELÉFONO / CONTACTO" value={newGuest.phone} onChange={e => setNewGuest({...newGuest, phone: e.target.value})} className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-3 text-[9px] text-white outline-none focus:border-white/40 tracking-widest uppercase placeholder:text-white/30" />
              <select value={newGuest.table} onChange={e => setNewGuest({...newGuest, table: e.target.value})} className="w-full bg-[#121318] border border-white/15 rounded-xl px-3.5 py-3 text-[9px] text-white outline-none focus:border-white/40 tracking-widest uppercase cursor-pointer">
                {tables.length === 0 ? <option value="">SIN SECTORES</option> : tables.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
              <select value={newGuest.status} onChange={e => setNewGuest({...newGuest, status: e.target.value})} className="w-full bg-[#121318] border border-white/15 rounded-xl px-3.5 py-3 text-[9px] text-white outline-none focus:border-white/40 tracking-widest uppercase cursor-pointer">
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="CONFIRMADO">CONFIRMADO</option>
              </select>
              <button type="submit" className="w-full py-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white rounded-xl text-[8px] font-black tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer font-['Poppins']">
                <Plus size={13}/> AÑADIR
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {guests.length === 0 ? (
                <div className="col-span-full py-12 text-center text-white/40 tracking-widest text-[8px] font-black">
                  NO HAY INVITADOS CARGADOS
                </div>
              ) : (
                guests.map(g => (
                  <div key={g.id} className="bg-white/[0.04] backdrop-blur-2xl border border-white/15 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-sm">
                    <div className="space-y-1">
                      <h4 className="font-['Poppins'] font-normal text-white text-[11px]">{g.name}</h4>
                      <p className="text-[7px] text-white/60 font-bold tracking-widest uppercase">{g.table || 'SIN MESA'}</p>
                      {g.phone && (
                        <p className="text-[7px] text-purple-300 font-bold flex items-center gap-1">
                          <PhoneCall size={10} /> {g.phone}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleToggleGuestField(g.id, 'contacted', g.contacted)}
                          className={`px-2.5 py-1 rounded-lg text-[7px] font-black tracking-widest border transition-all cursor-pointer ${
                            g.contacted ? 'bg-blue-500/30 text-blue-300 border-blue-400/50' : 'bg-white/10 text-white/60 border-white/20'
                          }`}
                        >
                          {g.contacted ? 'CONTACTADO' : 'NO CONTACTADO'}
                        </button>

                        <button 
                          onClick={() => handleToggleGuestField(g.id, 'confirmed', g.status === 'CONFIRMADO')}
                          className={`px-2.5 py-1 rounded-lg text-[7px] font-black tracking-widest border transition-all cursor-pointer ${
                            g.status === 'CONFIRMADO' ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50' : 'bg-white/10 text-white/60 border-white/20'
                          }`}
                        >
                          {g.status === 'CONFIRMADO' ? 'CONFIRMADO' : 'SIN CONFIRMAR'}
                        </button>
                      </div>

                      <button onClick={() => handleDelete('guests', g.id)} className="p-2 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-300 border border-white/10 rounded-lg transition-all cursor-pointer">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GASTOS Y CONTRATACIONES */}
        {activeTab === 'budget' && (
          <div className="space-y-5">
            <form onSubmit={handleAddBudget} className="bg-white/[0.04] backdrop-blur-2xl border border-white/15 p-4 sm:p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3 font-bold items-center shadow-md">
              <input placeholder="CONCEPTO (EJ: CATERING, DJ)" value={newBudget.concept} onChange={e => setNewBudget({...newBudget, concept: e.target.value})} className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-3 text-[9px] text-white outline-none focus:border-white/40 tracking-widest uppercase placeholder:text-white/30" required />
              <input type="number" placeholder="ESTIMADO ($)" value={newBudget.estimated} onChange={e => setNewBudget({...newBudget, estimated: e.target.value})} className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-3 text-[9px] text-white outline-none focus:border-white/40 tracking-widest uppercase placeholder:text-white/30" />
              <input type="number" placeholder="REAL ($)" value={newBudget.actual} onChange={e => setNewBudget({...newBudget, actual: e.target.value})} className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-3 text-[9px] text-white outline-none focus:border-white/40 tracking-widest uppercase placeholder:text-white/30" />
              <button type="submit" className="w-full py-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white rounded-xl text-[8px] font-black tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer font-['Poppins']">
                <Plus size={13}/> AGREGAR GASTO
              </button>
            </form>

            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/15 rounded-2xl p-4 sm:p-6 overflow-x-auto shadow-lg space-y-4">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/10 text-[7px] text-white/50 tracking-[0.3em] font-black">
                    <th className="pb-3">CONCEPTO</th>
                    <th className="pb-3">ESTIMADO</th>
                    <th className="pb-3">REAL</th>
                    <th className="pb-3">ESTADO</th>
                    <th className="pb-3 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[9px] font-bold">
                  {budgetItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-white/40 tracking-widest">SIN GASTOS REGISTRADOS</td>
                    </tr>
                  ) : (
                    budgetItems.map(b => {
                      const isEditing = editingBudgetId === b.id;
                      return (
                        <tr key={b.id}>
                          <td className="py-3.5 text-white">
                            {isEditing ? (
                              <input value={editBudgetValues.concept} onChange={e => setEditBudgetValues({...editBudgetValues, concept: e.target.value})} className="bg-white/10 border border-white/30 rounded-lg p-2 text-white outline-none w-full" />
                            ) : b.concept}
                          </td>
                          <td className="py-3.5 text-white/80">
                            {isEditing ? (
                              <input type="number" value={editBudgetValues.estimated} onChange={e => setEditBudgetValues({...editBudgetValues, estimated: e.target.value})} className="bg-white/10 border border-white/30 rounded-lg p-2 text-white outline-none w-20" />
                            ) : `$${Number(b.estimated || 0).toLocaleString()}`}
                          </td>
                          <td className="py-3.5 text-white">
                            {isEditing ? (
                              <input type="number" value={editBudgetValues.actual} onChange={e => setEditBudgetValues({...editBudgetValues, actual: e.target.value})} className="bg-white/10 border border-white/30 rounded-lg p-2 text-white outline-none w-20" />
                            ) : `$${Number(b.actual || 0).toLocaleString()}`}
                          </td>
                          <td className="py-3.5">
                            <button 
                              onClick={() => handleToggleBudgetHired(b.id, b.hired)}
                              className={`px-2.5 py-1 rounded-lg text-[7px] font-black tracking-widest border transition-all cursor-pointer flex items-center gap-1 w-fit ${
                                b.hired ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50' : 'bg-white/10 text-white/60 border-white/20'
                              }`}
                            >
                              <CheckCircle2 size={11} /> {b.hired ? 'CONTRATADO' : 'PENDIENTE'}
                            </button>
                          </td>
                          <td className="py-3.5 text-right flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <button onClick={() => handleUpdateBudget(b.id)} className="p-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-lg cursor-pointer"><Check size={13}/></button>
                                <button onClick={() => setEditingBudgetId(null)} className="p-1.5 bg-white/10 text-white/70 border border-white/20 rounded-lg cursor-pointer"><X size={13}/></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { setEditingBudgetId(b.id); setEditBudgetValues({ concept: b.concept, estimated: b.estimated, actual: b.actual }); }} className="p-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 rounded-lg transition-all cursor-pointer"><Edit3 size={13}/></button>
                                <button onClick={() => handleDelete('budget', b.id)} className="p-1.5 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-300 border border-white/10 rounded-lg transition-all cursor-pointer"><Trash2 size={13}/></button>
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
                  <div className="flex gap-4">
                    <span className="text-white/60">TOTAL CONTRATADO: <span className="text-emerald-300">${totalHiredCost.toLocaleString()}</span></span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-white/50">EST: <span className="text-white">${totalEstimated.toLocaleString()}</span></span>
                    <span className="text-white/50">REAL: <span className="text-purple-300">${totalActual.toLocaleString()}</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: TAREAS / PENDIENTES */}
        {activeTab === 'tasks' && (
          <div className="space-y-5">
            <form onSubmit={handleAddTask} className="bg-white/[0.04] backdrop-blur-2xl border border-white/15 p-4 sm:p-5 rounded-2xl flex gap-3 font-bold items-center shadow-md">
              <input placeholder="NUEVA TAREA O PENDIENTE..." value={newTaskText} onChange={e => setNewTaskText(e.target.value)} className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-3 text-[9px] text-white outline-none focus:border-white/40 tracking-widest uppercase placeholder:text-white/30" required />
              <button type="submit" className="px-6 py-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white rounded-xl text-[8px] font-black tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer font-['Poppins'] shrink-0">
                <Plus size={13}/> AGREGAR
              </button>
            </form>

            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/15 rounded-2xl p-5 space-y-3 shadow-lg">
              {tasks.length === 0 ? (
                <div className="py-12 text-center text-white/40 tracking-widest text-[8px] font-black">
                  NO HAY TAREAS PENDIENTES
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.06] transition-all">
                      <div onClick={() => handleToggleTask(task.id, task.completed)} className="flex items-center gap-3 cursor-pointer flex-1">
                        {task.completed ? <CheckSquare size={16} className="text-purple-400 flex-shrink-0" /> : <Square size={16} className="text-white/40 flex-shrink-0" />}
                        <span className={`text-[10px] tracking-wider uppercase ${task.completed ? 'line-through text-white/40' : 'text-white font-medium'}`}>
                          {task.text}
                        </span>
                      </div>
                      <button onClick={() => handleDelete('tasks', task.id)} className="text-white/40 hover:text-red-300 p-1.5 transition-colors cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* MODAL CONFIGURACIÓN DE PORTADA EN GLASS */}
      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 uppercase">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0c10]/90 backdrop-blur-3xl w-full max-w-md p-6 sm:p-7 rounded-2xl border border-white/20 relative shadow-xl space-y-5"
            >
              <button onClick={() => setShowPhotoModal(false)} className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors cursor-pointer p-1.5"><X size={18} /></button>
              
              <div className="space-y-1 text-center">
                <span className="text-[7px] tracking-[0.3em] font-black text-white/50 uppercase">CONFIGURACIÓN</span>
                <h3 className="text-base font-['Poppins'] font-normal text-white uppercase">Imagen de Portada</h3>
              </div>

              <form onSubmit={handleUpdateCover} className="space-y-4 font-bold">
                <div className="space-y-1.5">
                  <label className="text-[7px] tracking-[0.3em] text-white/70 font-black">Archivo local</label>
                  <label className="w-full bg-white/[0.06] border border-dashed border-white/25 hover:border-white/50 rounded-xl p-3.5 flex items-center justify-center gap-2 cursor-pointer transition-all text-[8px] text-white">
                    <Upload size={13} className="text-purple-300" />
                    <span>SELECCIONAR ARCHIVO...</span>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-3 text-white/40 text-[7px] tracking-widest font-black">O URL DE IMAGEN</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <input placeholder="https://..." value={coverUrl.startsWith('data:') ? '' : coverUrl} onChange={e => setCoverUrl(e.target.value)} className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-3 text-[9px] text-white outline-none focus:border-white/40 tracking-widest uppercase placeholder:text-white/30" />
                
                {coverUrl && (
                  <div className="w-full h-20 rounded-xl overflow-hidden border border-white/15 mt-1 bg-black/50">
                    <img src={coverUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <button type="submit" className="w-full py-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white rounded-xl text-[8px] font-black tracking-[0.3em] uppercase transition-all shadow-sm cursor-pointer">
                  GUARDAR PORTADA
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CONFIGURACIÓN DE UBICACIÓN */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 uppercase">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0c10]/90 backdrop-blur-3xl w-full max-w-md p-6 sm:p-7 rounded-2xl border border-white/20 relative shadow-xl space-y-5"
            >
              <button onClick={() => setShowLocationModal(false)} className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors cursor-pointer p-1.5"><X size={18} /></button>
              
              <div className="space-y-1 text-center">
                <span className="text-[7px] tracking-[0.3em] font-black text-white/50 uppercase">CONFIGURACIÓN</span>
                <h3 className="text-base font-['Poppins'] font-normal text-white uppercase">Ubicación del Evento</h3>
              </div>

              <form onSubmit={handleUpdateLocation} className="space-y-4 font-bold">
                <div className="space-y-1.5">
                  <label className="text-[7px] tracking-[0.3em] text-white/70 font-black">Lugar / Dirección</label>
                  <input 
                    placeholder="EJ: SALÓN PALACIO - AV. RIVADAVIA 123" 
                    value={locationValue} 
                    onChange={e => setLocationValue(e.target.value)} 
                    className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-3 text-[9px] text-white outline-none focus:border-white/40 tracking-widest uppercase placeholder:text-white/30" 
                    required 
                  />
                </div>

                <button type="submit" className="w-full py-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white rounded-xl text-[8px] font-black tracking-[0.3em] uppercase transition-all shadow-sm cursor-pointer">
                  GUARDAR UBICACIÓN
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CONFIGURACIÓN DE FECHA */}
      <AnimatePresence>
        {showDateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 uppercase">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0c10]/90 backdrop-blur-3xl w-full max-w-md p-6 sm:p-7 rounded-2xl border border-white/20 relative shadow-xl space-y-5"
            >
              <button onClick={() => setShowDateModal(false)} className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors cursor-pointer p-1.5"><X size={18} /></button>
              
              <div className="space-y-1 text-center">
                <span className="text-[7px] tracking-[0.3em] font-black text-white/50 uppercase">CONFIGURACIÓN</span>
                <h3 className="text-base font-['Poppins'] font-normal text-white uppercase">Fecha del Evento</h3>
              </div>

              <form onSubmit={handleUpdateDate} className="space-y-4 font-bold">
                <div className="space-y-1.5">
                  <label className="text-[7px] tracking-[0.3em] text-white/70 font-black">Fecha / Horario</label>
                  <input 
                    placeholder="EJ: 15 DE OCTUBRE, 21:00 HS" 
                    value={dateValue} 
                    onChange={e => setDateValue(e.target.value)} 
                    className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-3 text-[9px] text-white outline-none focus:border-white/40 tracking-widest uppercase placeholder:text-white/30" 
                    required 
                  />
                </div>

                <button type="submit" className="w-full py-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white rounded-xl text-[8px] font-black tracking-[0.3em] uppercase transition-all shadow-sm cursor-pointer">
                  GUARDAR FECHA
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}