import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from "../firebase";
import { doc, getDoc, collection, onSnapshot, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, LayoutGrid, DollarSign, Plus, Trash2, QrCode, X, Check, Clock } from 'lucide-react';

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('guests'); // 'guests' | 'tables' | 'budget'

  // Estados para datos internos
  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);

  // Inputs temporales
  const [newGuest, setNewGuest] = useState({ name: '', table: 'Mesa 1', status: 'PENDIENTE' });
  const [newTable, setNewTable] = useState({ name: 'Mesa Principal', capacity: 10 });
  const [newBudget, setNewBudget] = useState({ concept: '', estimated: '', actual: '' });

  useEffect(() => {
    if (!eventId) return;
    // Cargar datos del evento principal
    const fetchEvent = async () => {
      const docSnap = await getDoc(doc(db, "events_organizer", eventId));
      if (docSnap.exists()) setEvent(docSnap.data());
    };
    fetchEvent();

    // Subscripciones a subcolecciones
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

  // Funciones de adición
  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuest.name) return;
    await addDoc(collection(db, "events_organizer", eventId, "guests"), {
      name: newGuest.name.toUpperCase(),
      table: newGuest.table,
      status: newGuest.status
    });
    setNewGuest({ name: '', table: 'Mesa 1', status: 'PENDIENTE' });
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

  const handleDelete = async (subcol, id) => {
    await deleteDoc(doc(db, "events_organizer", eventId, subcol, id));
  };

  if (!event) return <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white text-[10px] tracking-[0.4em] uppercase font-['Poppins']">Cargando organizador...</div>;

  return (
    <div className="min-h-screen bg-[#070709] text-white font-['Open_Sans'] antialiased flex flex-col relative uppercase selection:bg-white selection:text-black">
      
      {/* TOPBAR */}
      <nav className="p-6 md:p-10 w-full sticky top-0 z-50 bg-[#070709]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center w-full font-['Poppins']">
          <button onClick={() => navigate('/organizer')} className="text-gray-400 hover:text-white flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-bold">
            <ArrowLeft size={14}/> VOLVER AL PANEL
          </button>
          <div className="text-lg md:text-xl tracking-[0.05em] uppercase font-normal">{event.title}</div>
          <span className="text-[8px] tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-300">{event.category}</span>
        </div>
      </nav>

      {/* PESTAÑAS DE NAVEGACIÓN INTERNA */}
      <div className="w-full bg-[#0c0c0e] border-b border-white/5 px-6 md:px-12 py-4">
        <div className="max-w-[1200px] mx-auto flex gap-4 overflow-x-auto scrollbar-hide font-['Poppins']">
          <button onClick={() => setActiveTab('guests')} className={`px-6 py-3 rounded-2xl text-[9px] font-black tracking-widest transition-all flex items-center gap-2 ${activeTab === 'guests' ? 'bg-white text-black shadow-xl' : 'bg-white/[0.03] text-gray-400 hover:text-white border border-white/10'}`}>
            <Users size={14}/> LISTA DE INVITADOS ({guests.length})
          </button>
          <button onClick={() => setActiveTab('tables')} className={`px-6 py-3 rounded-2xl text-[9px] font-black tracking-widest transition-all flex items-center gap-2 ${activeTab === 'tables' ? 'bg-white text-black shadow-xl' : 'bg-white/[0.03] text-gray-400 hover:text-white border border-white/10'}`}>
            <LayoutGrid size={14}/> MESAS Y ASIENTOS ({tables.length})
          </button>
          <button onClick={() => setActiveTab('budget')} className={`px-6 py-3 rounded-2xl text-[9px] font-black tracking-widest transition-all flex items-center gap-2 ${activeTab === 'budget' ? 'bg-white text-black shadow-xl' : 'bg-white/[0.03] text-gray-400 hover:text-white border border-white/10'}`}>
            <DollarSign size={14}/> PRESUPUESTO Y GASTOS
          </button>
        </div>
      </div>

      {/* CONTENIDO SEGÚN PESTAÑA ACTIVA */}
      <main className="max-w-[1200px] mx-auto px-6 md:px-12 py-12 flex-1 w-full space-y-8">
        
        {/* VISTA 1: INVITADOS */}
        {activeTab === 'guests' && (
          <div className="space-y-8">
            <form onSubmit={handleAddGuest} className="bg-[#0c0c0e] border border-white/10 p-6 rounded-3xl grid md:grid-cols-4 gap-4 font-bold items-center">
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
                    <p className="text-[9px] text-gray-400 font-bold tracking-widest">📍 {g.table} — <span className={g.status === 'CONFIRMADO' ? 'text-green-400' : 'text-amber-400'}>{g.status}</span></p>
                  </div>
                  <button onClick={() => handleDelete('guests', g.id)} className="p-2.5 bg-white/[0.03] hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 rounded-xl transition-all">
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA 2: MESAS Y ASIENTOS */}
        {activeTab === 'tables' && (
          <div className="space-y-8">
            <form onSubmit={handleAddTable} className="bg-[#0c0c0e] border border-white/10 p-6 rounded-3xl grid md:grid-cols-3 gap-4 font-bold items-center">
              <input placeholder="NOMBRE DE MESA (EJ: MESA FAMILIA)" value={newTable.name} onChange={e => setNewTable({...newTable, name: e.target.value})} className="bg-black border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-white tracking-widest" required />
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
                    <p className="text-[9px] text-gray-400 font-bold tracking-widest">Capacidad: {assignedGuests.length} / {t.capacity} Asientos</p>
                    <div className="space-y-2 pt-2 border-t border-white/5 max-h-40 overflow-y-auto">
                      {assignedGuests.map(ag => (
                        <div key={ag.id} className="text-[10px] text-gray-300 bg-white/[0.03] px-3 py-2 rounded-xl border border-white/5 flex justify-between">
                          <span>{ag.name}</span>
                          <span className={ag.status === 'CONFIRMADO' ? 'text-green-400' : 'text-amber-400'}>●</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VISTA 3: PRESUPUESTO */}
        {activeTab === 'budget' && (
          <div className="space-y-8">
            <form onSubmit={handleAddBudget} className="bg-[#0c0c0e] border border-white/10 p-6 rounded-3xl grid md:grid-cols-4 gap-4 font-bold items-center">
              <input placeholder="CONCEPTO (EJ: CATERING / FOTO)" value={newBudget.concept} onChange={e => setNewBudget({...newBudget, concept: e.target.value})} className="bg-black border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-white tracking-widest" required />
              <input type="number" placeholder="COSTO ESTIMADO ($)" value={newBudget.estimated} onChange={e => setNewBudget({...newBudget, estimated: e.target.value})} className="bg-black border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-white tracking-widest" />
              <input type="number" placeholder="COSTO REAL ($)" value={newBudget.actual} onChange={e => setNewBudget({...newBudget, actual: e.target.value})} className="bg-black border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:border-white tracking-widest" />
              <button type="submit" className="py-4 bg-white text-black rounded-2xl text-[9px] font-black tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                <Plus size={14}/> AGREGAR GASTO
              </button>
            </form>

            <div className="bg-[#0c0c0e] border border-white/10 rounded-3xl p-6 overflow-x-auto shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[9px] text-gray-400 tracking-[0.3em] font-black">
                    <th className="pb-4">Concepto</th>
                    <th className="pb-4">Estimado</th>
                    <th className="pb-4">Real</th>
                    <th className="pb-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[10px] font-bold">
                  {budgetItems.map(b => (
                    <tr key={b.id}>
                      <td className="py-4 text-white">{b.concept}</td>
                      <td className="py-4 text-gray-300">${b.estimated}</td>
                      <td className="py-4 text-white">${b.actual}</td>
                      <td className="py-4 text-right">
                        <button onClick={() => handleDelete('budget', b.id)} className="p-2 bg-white/[0.03] hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 rounded-xl transition-all">
                          <Trash2 size={14}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}