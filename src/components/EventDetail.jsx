import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from "../firebase";
import { doc, getDoc, collection, onSnapshot, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, LayoutGrid, DollarSign, Plus, Trash2, Edit3, Image as ImageIcon, Check, X, Calendar, MapPin, Upload } from 'lucide-react';

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('guests');

  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);

  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [editBudgetValues, setEditBudgetValues] = useState({ concept: '', estimated: 0, actual: 0 });

  const [newGuest, setNewGuest] = useState({ name: '', table: 'Mesa 1', status: 'PENDIENTE' });
  const [newTable, setNewTable] = useState({ name: 'Mesa Principal', capacity: 10 });
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
      setTables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    if (!newGuest.name) return;
    await addDoc(collection(db, "events_organizer", eventId, "guests"), {
      name: newGuest.name.toUpperCase(),
      table: newGuest.table,
      status: newGuest.status
    });
    setNewGuest({ name: '', table: tables[0]?.name || 'Mesa 1', status: 'PENDIENTE' });
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTable.name) return;
    await addDoc(collection(db, "events_organizer", eventId, "tables"), {
      name: newTable.name.toUpperCase(),
      capacity: Number(newTable.capacity)
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
      alert("La imagen es muy pesada. Elegí una menor a 1MB para optimizar el almacenamiento.");
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

  if (!event) return <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white text-[10px] tracking-[0.4em] uppercase font-['Poppins']">Cargando...</div>;

  const totalEstimated = budgetItems.reduce((acc, item) => acc + (Number(item.estimated) || 0), 0);
  const totalActual = budgetItems.reduce((acc, item) => acc + (Number(item.actual) || 0), 0);
  const confirmedGuestsCount = guests.filter(g => g.status === 'CONFIRMADO').length;

  return (
    <div className="min-h-screen bg-[#070709] text-white font-['Open_Sans'] antialiased flex flex-col items-center uppercase selection:bg-white selection:text-black">
      
      {/* TOPBAR LIMPIA */}
      <nav className="w-full border-b border-white/5 bg-[#070709]/90 backdrop-blur-xl sticky top-0 z-50 px-6 py-6 flex justify-center">
        <div className="max-w-[1200px] w-full flex justify-between items-center font-['Poppins']">
          <button onClick={() => navigate('/organizer')} className="text-gray-400 hover:text-white flex items-center gap-2 text-[9px] tracking-[0.3em] font-bold transition-colors">
            <ArrowLeft size={14}/> VOLVER
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-base font-normal tracking-[0.05em] text-white uppercase">CLASSCODE</span>
          </div>

          <span className="text-[8px] tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-300">{event.category}</span>
        </div>
      </nav>

      {/* PORTADA */}
      <div className="w-full max-w-[1200px] px-6 mt-8">
        <div className="relative w-full min-h-[280px] bg-[#0c0c0e] border border-white/10 rounded-[2.5rem] overflow-hidden group shadow-2xl flex flex-col justify-end">
          {event.coverImage ? (
            <img src={event.coverImage} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-r from-white/[0.02] to-white/[0.06]">
              <span className="text-[9px] text-gray-500 tracking-[0.3em] font-bold">SIN IMAGEN DE PORTADA</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/60 to-transparent pointer-events-none"></div>

          <div className="relative z-10 p-8 md:p-12 w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-3 max-w-2xl">
              <h1 className="text-2xl md:text-4xl font-['Poppins'] font-normal text-white leading-tight">{event.title}</h1>
              <div className="flex flex-wrap gap-4 text-[10px] text-gray-300 font-bold pt-1">
                {event.date && <span className="flex items-center gap-1.5"><Calendar size={13}/> {event.date}</span>}
                {event.location && <span className="flex items-center gap-1.5"><MapPin size={13}/> {event.location}</span>}
              </div>
            </div>
            
            <button onClick={() => setShowPhotoModal(true)} className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-[9px] font-black tracking-widest flex items-center gap-2 backdrop-blur-md transition-all shrink-0">
              <ImageIcon size={14}/> EDITAR PORTADA
            </button>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="w-full max-w-[1200px] px-6 mt-8">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide font-['Poppins'] justify-start md:justify-center">
          <button onClick={() => setActiveTab('guests')} className={`px-6 py-4 rounded-2xl text-[9px] font-black tracking-widest transition-all flex items-center gap-2 shadow-lg ${activeTab === 'guests' ? 'bg-white text-black' : 'bg-[#0c0c0e] text-gray-400 hover:text-white border border-white/10'}`}>
            <Users size={14}/> INVITADOS ({guests.length} / {confirmedGuestsCount} CONFIRM.)
          </button>
          <button onClick={() => setActiveTab('tables')} className={`px-6 py-4 rounded-2xl text-[9px] font-black tracking-widest transition-all flex items-center gap-2 shadow-lg ${activeTab === 'tables' ? 'bg-white text-black' : 'bg-[#0c0c0e] text-gray-400 hover:text-white border border-white/10'}`}>
            <LayoutGrid size={14}/> MESAS ({tables.length})
          </button>
          <button onClick={() => setActiveTab('budget')} className={`px-6 py-4 rounded-2xl text-[9px] font-black tracking-widest transition-all flex items-center gap-2 shadow-lg ${activeTab === 'budget' ? 'bg-white text-black' : 'bg-[#0c0c0e] text-gray-400 hover:text-white border border-white/10'}`}>
            <DollarSign size={14}/> PRESUPUESTO (REAL: ${totalActual} / EST: ${totalEstimated})
          </button>
        </div>
      </div>

      <main className="w-full max-w-[1200px] px-6 py-8 flex-1 space-y-8">
        
        {activeTab === 'guests' && (
          <div className="space-y-6">
            <form onSubmit={handleAddGuest} className="bg-[#0c0c0e] border border-white/10 p-6 rounded-[2rem] grid md:grid-cols-4 gap-4 font-bold items-center shadow-xl">
              <input placeholder="NOMBRE Y APELLIDO" value={newGuest.name} onChange={e => setNewGuest({...newGuest, name: e.target.value})} className="bg-black border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-white tracking-widest" required />
              <select value={newGuest.table} onChange={e => setNewGuest({...newGuest, table: e.target.value})} className="bg-black border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-white tracking-widest">
                {tables.length === 0 ? <option>Sin mesas creadas</option> : tables.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
              <select value={newGuest.status} onChange={e => setNewGuest({...newGuest, status: e.target.value})} className="bg-black border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-white tracking-widest">
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="CONFIRMADO">CONFIRMADO</option>
              </select>
              <button type="submit" className="py-4 bg-white text-black rounded-2xl text-[9px] font-black tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                <Plus size={14}/> AGREGAR INVITADO
              </button>
            </form>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {guests.map(g => (
                <div key={g.id} className="bg-[#0c0c0e] border border-white/10 p-6 rounded-3xl flex justify-between items-center shadow-xl">
                  <div className="space-y-1">
                    <h4 className="font-['Poppins'] font-normal text-white text-sm">{g.name}</h4>
                    <p className="text-[9px] text-gray-400 font-bold tracking-widest">{g.table} — <span className={g.status === 'CONFIRMADO' ? 'text-green-400' : 'text-amber-400'}>{g.status}</span></p>
                  </div>
                  <button onClick={() => handleDelete('guests', g.id)} className="p-2.5 bg-white/[0.03] hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 rounded-xl transition-all">
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="space-y-6">
            <form onSubmit={handleAddTable} className="bg-[#0c0c0e] border border-white/10 p-6 rounded-[2rem] grid md:grid-cols-3 gap-4 font-bold items-center shadow-xl">
              <input placeholder="NOMBRE DE MESA (EJ: FAMILIA)" value={newTable.name} onChange={e => setNewTable({...newTable, name: e.target.value})} className="bg-black border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-white tracking-widest" required />
              <input type="number" placeholder="CAPACIDAD (EJ: 10)" value={newTable.capacity} onChange={e => setNewTable({...newTable, capacity: e.target.value})} className="bg-black border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-white tracking-widest" required />
              <button type="submit" className="py-4 bg-white text-black rounded-2xl text-[9px] font-black tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                <Plus size={14}/> CREAR MESA
              </button>
            </form>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map(t => {
                const assignedGuests = guests.filter(g => g.table === t.name);
                return (
                  <div key={t.id} className="bg-[#0c0c0e] border border-white/10 p-6 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex justify-between items-center">
                      <h4 className="font-['Poppins'] font-normal text-white text-base">{t.name}</h4>
                      <button onClick={() => handleDelete('tables', t.id)} className="p-2 bg-white/[0.03] hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 rounded-xl transition-all">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold tracking-widest">Asignados: {assignedGuests.length} / {t.capacity}</p>
                    <div className="space-y-2 pt-2 border-t border-white/5 max-h-40 overflow-y-auto">
                      {assignedGuests.map(ag => (
                        <div key={ag.id} className="text-[10px] text-gray-300 bg-white/[0.03] px-3 py-2 rounded-xl border border-white/5 flex justify-between items-center">
                          <span>{ag.name}</span>
                          <span className={`text-[8px] font-black tracking-widest px-2 py-0.5 rounded-md ${ag.status === 'CONFIRMADO' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{ag.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-6">
            <form onSubmit={handleAddBudget} className="bg-[#0c0c0e] border border-white/10 p-6 rounded-[2rem] grid md:grid-cols-4 gap-4 font-bold items-center shadow-xl">
              <input placeholder="CONCEPTO (EJ: CATERING)" value={newBudget.concept} onChange={e => setNewBudget({...newBudget, concept: e.target.value})} className="bg-black border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-white tracking-widest" required />
              <input type="number" placeholder="ESTIMADO ($)" value={newBudget.estimated} onChange={e => setNewBudget({...newBudget, estimated: e.target.value})} className="bg-black border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-white tracking-widest" />
              <input type="number" placeholder="REAL ($)" value={newBudget.actual} onChange={e => setNewBudget({...newBudget, actual: e.target.value})} className="bg-black border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-white tracking-widest" />
              <button type="submit" className="py-4 bg-white text-black rounded-2xl text-[9px] font-black tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                <Plus size={14}/> AGREGAR GASTO
              </button>
            </form>

            <div className="bg-[#0c0c0e] border border-white/10 rounded-[2.5rem] p-6 overflow-x-auto shadow-xl space-y-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] text-gray-400 tracking-[0.3em] font-black">
                    <th className="pb-4">Concepto</th>
                    <th className="pb-4">Estimado</th>
                    <th className="pb-4">Real</th>
                    <th className="pb-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[10px] font-bold">
                  {budgetItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-500 tracking-widest">No hay gastos registrados</td>
                    </tr>
                  ) : (
                    budgetItems.map(b => {
                      const isEditing = editingBudgetId === b.id;
                      return (
                        <tr key={b.id}>
                          <td className="py-4 text-white">
                            {isEditing ? (
                              <input value={editBudgetValues.concept} onChange={e => setEditBudgetValues({...editBudgetValues, concept: e.target.value})} className="bg-black border border-white/20 rounded-xl p-2 text-white outline-none w-full" />
                            ) : b.concept}
                          </td>
                          <td className="py-4 text-gray-300">
                            {isEditing ? (
                              <input type="number" value={editBudgetValues.estimated} onChange={e => setEditBudgetValues({...editBudgetValues, estimated: e.target.value})} className="bg-black border border-white/20 rounded-xl p-2 text-white outline-none w-24" />
                            ) : `$${b.estimated}`}
                          </td>
                          <td className="py-4 text-white">
                            {isEditing ? (
                              <input type="number" value={editBudgetValues.actual} onChange={e => setEditBudgetValues({...editBudgetValues, actual: e.target.value})} className="bg-black border border-white/20 rounded-xl p-2 text-white outline-none w-24" />
                            ) : `$${b.actual}`}
                          </td>
                          <td className="py-4 text-right flex items-center justify-end gap-2">
                            {isEditing ? (
                              <>
                                <button onClick={() => handleUpdateBudget(b.id)} className="p-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl"><Check size={14}/></button>
                                <button onClick={() => setEditingBudgetId(null)} className="p-2 bg-white/5 text-gray-400 border border-white/10 rounded-xl"><X size={14}/></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { setEditingBudgetId(b.id); setEditBudgetValues({ concept: b.concept, estimated: b.estimated, actual: b.actual }); }} className="p-2 bg-white/[0.03] hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-xl transition-all"><Edit3 size={14}/></button>
                                <button onClick={() => handleDelete('budget', b.id)} className="p-2 bg-white/[0.03] hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"><Trash2 size={14}/></button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* FILA DE TOTALES GENERALES */}
              {budgetItems.length > 0 && (
                <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-black tracking-widest px-2">
                  <span className="text-gray-400">TOTALES GENERALES:</span>
                  <div className="flex gap-6">
                    <span className="text-gray-300">ESTIMADO: <span className="text-white">${totalEstimated}</span></span>
                    <span className="text-gray-300">REAL: <span className="text-white">${totalActual}</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <AnimatePresence>
        {showPhotoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c0c0e] w-full max-w-md p-8 rounded-[3rem] border border-white/10 relative shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setShowPhotoModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
              
              <div className="space-y-2 text-center">
                <span className="text-[8px] tracking-[0.3em] font-black text-gray-400">CUSTOMIZACIÓN</span>
                <h3 className="text-xl font-['Poppins'] font-normal text-white">Imagen de Portada</h3>
              </div>

              <form onSubmit={handleUpdateCover} className="space-y-4 font-bold">
                <div className="space-y-2">
                  <label className="text-[8px] tracking-[0.3em] text-gray-400">Subir desde el ordenador</label>
                  <label className="w-full bg-white/[0.03] border border-white/10 hover:border-white/30 rounded-2xl p-4 flex items-center justify-center gap-2 cursor-pointer transition-all text-[10px] text-gray-300">
                    <Upload size={16} />
                    <span>Seleccionar archivo...</span>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-4 text-gray-500 text-[8px] tracking-widest">O PEGAR URL</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <input placeholder="https://..." value={coverUrl.startsWith('data:') ? '' : coverUrl} onChange={e => setCoverUrl(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-white tracking-widest" />
                
                {coverUrl && (
                  <div className="w-full h-24 rounded-xl overflow-hidden border border-white/10 mt-2">
                    <img src={coverUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <button type="submit" className="w-full py-4 bg-white text-black rounded-2xl text-[9px] font-black tracking-[0.3em] uppercase hover:bg-gray-200 transition-all shadow-xl">
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