import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase';
import { 
  doc, collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, 
  addDoc, serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  Search, LogOut, User, Calendar, MapPin, 
  Trash2, Plus, Edit3, LayoutGrid, ImageIcon, X, ChevronRight, QrCode,
  RefreshCcw, Menu, Save, Upload, MessageSquare, Send, Sun, Moon
} from 'lucide-react'; 
import CustomModal from './components/CustomModal'; 
import EventOrganizer from './components/EventOrganizer';
import LiveControlPanel from './components/LiveControlPanel';
import { motion, AnimatePresence } from 'framer-motion';

const ARGENTINE_PROVINCES = [
  {
    name: "BUENOS AIRES",
    localities: [
      "CAPITAL FEDERAL / CABA",
      "ZONA OESTE",
      "ZONA NORTE",
      "ZONA SUR",
      "LA PLATA",
      "MAR DEL PLATA",
      "BAHÍA BLANCA",
      "INTERIOR DE BUENOS AIRES"
    ]
  },
  { name: "CATAMARCA", localities: ["CATAMARCA CAPITAL", "INTERIOR DE CATAMARCA"] },
  { name: "CHACO", localities: ["RESISTENCIA", "SAENZ PEÑA", "INTERIOR DE CHACO"] },
  { name: "CHUBUT", localities: ["COMODORO RIVADAVIA", "TRELEW", "PUERTO MADRYN", "RAWSON"] },
  { name: "CÓRDOBA", localities: ["CÓRDOBA CAPITAL", "VILLA CARLOS PAZ", "RÍO CUARTO", "VILLA MARÍA", "ALTA GRACIA", "INTERIOR DE CÓRDOBA"] },
  { name: "CORRIENTES", localities: ["CORRIENTES CAPITAL", "GOYA", "LIBRES", "INTERIOR DE CORRIENTES"] },
  { name: "ENTRE RÍOS", localities: ["PARANÁ", "CONCORDIA", "GUALEGUAYCHÚ", "INTERIOR DE ENTRE RÍOS"] },
  { name: "FORMOSA", localities: ["FORMOSA CAPITAL", "INTERIOR DE FORMOSA"] },
  { name: "JUJUY", localities: ["SAN SALVADOR DE JUJUY", "SAN PEDRO", "INTERIOR DE JUJUY"] },
  { name: "LA PAMPA", localities: ["SANTA ROSA", "GENERAL PICO", "INTERIOR DE LA PAMPA"] },
  { name: "LA RIOJA", localities: ["LA RIOJA CAPITAL", "CHILECITO", "INTERIOR DE LA RIOJA"] },
  { name: "MENDOZA", localities: ["MENDOZA CAPITAL", "GUAYMALLÉN", "GODOY CRUZ", "SAN RAFAEL", "INTERIOR DE MENDOZA"] },
  { name: "MISIONES", localities: ["POSADAS", "OBERÁ", "EL ALDOR", "PUERTO IGUAZÚ"] },
  { name: "NEUQUÉN", localities: ["NEUQUÉN CAPITAL", "SAN MARTÍN DE LOS ANDES", "BARILOCHE / ZONA", "INTERIOR DE NEUQUÉN"] },
  { name: "RÍO NEGRO", localities: ["VIEDMA", "GENERAL ROCA", "CIPOLLETTI", "BARILOCHE"] },
  { name: "SALTA", localities: ["SALTA CAPITAL", "ORÁN", "TARTAGAL", "INTERIOR DE SALTA"] },
  { name: "SAN JUAN", localities: ["SAN JUAN CAPITAL", "RIVADAVIA", "RAWSON", "INTERIOR DE SAN JUAN"] },
  { name: "SAN LUIS", localities: ["SAN LUIS CAPITAL", "VILLA MERCEDES", "INTERIOR DE SAN LUIS"] },
  { name: "SANTA CRUZ", localities: ["RÍO GALLEGOS", "CALETA OLIVIA", "EL CALAFATE"] },
  { name: "SANTA FE", localities: ["ROSARIO", "SANTA FE CAPITAL", "RAFAELA", "VENADO TUERTO", "INTERIOR DE SANTA FE"] },
  { name: "SANTIAGO DEL ESTERO", localities: ["SANTIAGO CAPITAL", "LA BANDA", "INTERIOR DE SANTIAGO"] },
  { name: "TIERRA DEL FUEGO", localities: ["USHUAIA", "RÍO GRANDE"] },
  { name: "TUCUMÁN", localities: ["SAN MIGUEL DE TUCUMÁN", "YERBA BUENA", "TAFÍ VIEJO", "INTERIOR DE TUCUMÁN"] }
];

export default function ClientProfile() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  
  // Estado para el Modo Día/Noche local de la interfaz
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Estado formulario rápido de evento
  const [newEventForm, setNewEventForm] = useState({ title: '', category: 'EVENTO', date: '', location: '' });

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState({ name: '', location: '', interests: '', photoURL: '' });
  
  const [editForm, setEditForm] = useState({ name: '', province: '', locality: '', photoURL: '' });
  const [selectedProvinceObj, setSelectedProvinceObj] = useState(ARGENTINE_PROVINCES[0]);

  const [showLivePanel, setShowLivePanel] = useState(false);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: null });

  // Estados para la Mensajería Sincronizada
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [cargandoChat, setCargandoChat] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Cargar Datos del Perfil
        onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile(prev => ({ ...prev, ...data }));
            
            let prov = ARGENTINE_PROVINCES[0].name;
            let loc = "";
            if (data.location) {
              const parts = data.location.split(" - ");
              if (parts.length > 1) {
                prov = parts[0];
                loc = parts[1];
              } else {
                loc = data.location;
              }
            }
            const foundProv = ARGENTINE_PROVINCES.find(p => p.name === prov) || ARGENTINE_PROVINCES[0];
            setSelectedProvinceObj(foundProv);

            setEditForm({ 
              name: data.name || '', 
              province: foundProv.name, 
              locality: loc || foundProv.localities[0], 
              photoURL: data.photoURL || '' 
            });
          }
          setLoading(false);
        });

        // Cargar Eventos
        const qEvents = query(collection(db, "events_organizer"));
        onSnapshot(qEvents, (snap) => {
          const fetchedEvents = snap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(ev => ev.userId === user.uid);
          fetchedEvents.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setEvents(fetchedEvents);
        });

        // Sincronización Realtime del Chat Compartido
        const chatId = user.uid;
        const qMessages = query(
          collection(db, `chats/${chatId}/messages`), 
          orderBy('createdAt', 'asc')
        );

        const unsubscribeMessages = onSnapshot(qMessages, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMensajes(msgs);
          setCargandoChat(false);
        }, (error) => {
          console.error("Error al sincronizar chat compartido:", error);
          setCargandoChat(false);
        });

        return () => unsubscribeMessages();

      } else { 
        navigate('/'); 
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !auth.currentUser) return;

    try {
      const chatId = auth.currentUser.uid;
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text: nuevoMensaje.toUpperCase(),
        senderId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setNuevoMensaje('');
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  };

  const handleProvinceChange = (e) => {
    const provName = e.target.value;
    const provObj = ARGENTINE_PROVINCES.find(p => p.name === provName) || ARGENTINE_PROVINCES[0];
    setSelectedProvinceObj(provObj);
    setEditForm(prev => ({
      ...prev,
      province: provObj.name,
      locality: provObj.localities[0]
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, photoURL: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      const formattedLocation = `${editForm.province} - ${editForm.locality}`;
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        name: editForm.name,
        location: formattedLocation,
        photoURL: editForm.photoURL
      });
      setIsEditingProfile(false);
      setModal({ isOpen: true, title: "PERFIL ACTUALIZADO", message: "TUS DATOS SE HAN GUARDADO CORRECTAMENTE.", type: "success" });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setModal({ isOpen: true, title: "ERROR", message: "NO SE PUDO ACTUALIZAR EL PERFIL.", type: "warning" });
    }
  };

  const handleCreateNewEventSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser || !newEventForm.title.trim()) return;

    try {
      await addDoc(collection(db, "events_organizer"), {
        userId: auth.currentUser.uid,
        title: newEventForm.title.toUpperCase(),
        category: newEventForm.category.toUpperCase(),
        date: newEventForm.date,
        location: newEventForm.location.toUpperCase(),
        status: 'PLANIFICACION',
        createdAt: serverTimestamp()
      });
      setIsCreatingEvent(false);
      setNewEventForm({ title: '', category: 'EVENTO', date: '', location: '' });
      setModal({ isOpen: true, title: "EVENTO CREADO", message: "EL PROYECTO SE HA CREADO EXITOSAMENTE.", type: "success" });
    } catch (error) {
      console.error("Error al crear evento:", error);
      setModal({ isOpen: true, title: "ERROR", message: "NO SE PUDO CREAR EL EVENTO.", type: "warning" });
    }
  };

  const confirmDelete = (id, e) => {
    if (e) e.stopPropagation();
    setModal({
      isOpen: true,
      title: "ELIMINAR PROYECTO",
      message: "¿ESTÁS SEGURO? ESTA ACCIÓN ELIMINARÁ EL PROYECTO Y SU CONTENIDO PERMANENTEMENTE.",
      type: 'warning',
      onConfirm: async () => {
        await deleteDoc(doc(db, "events_organizer", id));
        setModal(prev => ({ ...prev, isOpen: false }));
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

  const currentEvent = events[selectedEventIndex] || events[0];

  const handleTogglePause = async () => {
    if (!currentEvent) return;
    const newStatus = currentEvent.status === 'paused' ? 'EN_CURSO' : 'paused';
    try {
      await updateDoc(doc(db, "events_organizer", currentEvent.id), { status: newStatus });
    } catch (err) { console.error(err); }
  };

  const handleConfirmFinish = () => {
    if (!currentEvent) return;
    setModal({
      isOpen: true,
      title: "FINALIZAR EVENTO",
      message: "¿ESTÁS SEGURO DE MARCAR ESTE EVENTO COMO FINALIZADO?",
      type: 'warning',
      onConfirm: async () => {
        await updateDoc(doc(db, "events_organizer", currentEvent.id), { status: 'FINALIZADO' });
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleCopyGuestLink = () => {
    if (!currentEvent) return;
    const link = `https://www.classcode.com.ar/guest-upload/${currentEvent.eventCode || currentEvent.id}`;
    navigator.clipboard.writeText(link);
    setModal({ isOpen: true, title: "GUEST LINK", message: "LINK DE SUBIDA COPIADO.", type: "success" });
  };

  if (loading) return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#070709] text-white/70' : 'bg-gray-100 text-gray-700'} flex items-center justify-center tracking-[0.4em] text-[10px] uppercase font-['Poppins']`}>
      Sincronizando experiencia...
    </div>
  );

  return (
    <div className={`min-h-screen w-full ${isDarkMode ? 'bg-[#070709] text-white' : 'bg-gray-100 text-gray-900'} font-['Open_Sans'] flex flex-col md:flex-row overflow-x-hidden uppercase antialiased relative text-left box-border m-0 p-0 transition-colors duration-300`}>
      
      {/* LUCES DINÁMICAS VIVAS DE FONDO (Sólo en Modo Oscuro) */}
      {isDarkMode && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            animate={{ x: [-100, 100, -100], y: [-70, 70, -70], scale: [1, 1.3, 1], opacity: [0.35, 0.55, 0.35] }} 
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} 
            className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-purple-600/40 rounded-full blur-[130px]" 
          />
          <motion.div 
            animate={{ x: [90, -90, 90], y: [80, -80, 80], scale: [1.2, 0.9, 1.2], opacity: [0.3, 0.5, 0.3] }} 
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} 
            className="absolute top-1/2 -right-20 w-[550px] h-[550px] bg-fuchsia-600/30 rounded-full blur-[140px]" 
          />
          <motion.div 
            animate={{ x: [-50, 50, -50], y: [60, -60, 60], scale: [0.9, 1.2, 0.9], opacity: [0.25, 0.45, 0.25] }} 
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} 
            className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-purple-900/40 rounded-full blur-[150px]" 
          />
        </div>
      )}

      {/* HEADER MOBILE GLASS */}
      <header className={`md:hidden fixed top-0 left-0 right-0 w-full ${isDarkMode ? 'bg-[#070709]/65 text-white border-white/10' : 'bg-white/80 text-gray-900 border-gray-200'} backdrop-blur-md border-b z-[100] px-8 py-5 flex justify-between items-center shadow-xl transition-colors duration-300`}>
        <div onClick={() => navigate('/home')} className="text-[18px] font-['Poppins'] font-normal tracking-[0.05em] uppercase cursor-pointer">
          CLASSCODE
        </div>
        <div className="flex items-center gap-4">
          {/* BOTÓN MODO DÍA / NOCHE SIN CONTENEDOR */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer p-1"
            title={isDarkMode ? "Cambiar a Modo Día" : "Cambiar a Modo Noche"}
          >
            {isDarkMode ? <Sun size={22} /> : <Moon size={22} className="text-purple-600" />}
          </button>
          
          <button onClick={() => setIsMobileMenuOpen(true)} className="hover:text-purple-300 transition-colors cursor-pointer">
            <Menu size={28} />
          </button>
        </div>
      </header>

      {/* MENÚ MOBILE */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] md:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-sm ${isDarkMode ? 'bg-[#070709]/90 text-white border-white/10' : 'bg-white/95 text-gray-900 border-gray-200'} backdrop-blur-xl border-l z-[120] p-10 flex flex-col md:hidden shadow-2xl box-border overflow-y-auto transition-colors duration-300`}>
              <button onClick={() => setIsMobileMenuOpen(false)} className="self-end mb-10 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                <X size={28} />
              </button>

              <nav className="flex-1 space-y-6">
                <button onClick={() => { navigate('/client-profile'); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 text-[11px] font-black tracking-widest text-purple-400 uppercase cursor-pointer w-full py-2">
                  <LayoutGrid size={18}/> ORGANIZADOR
                </button>
                <button onClick={() => { navigate('/home'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-4 text-[11px] font-black tracking-widest opacity-70 hover:opacity-100 uppercase cursor-pointer w-full py-2`}>
                  <Search size={18}/> EXPLORAR
                </button>
              </nav>

              <button onClick={() => { auth.signOut(); setIsMobileMenuOpen(false); }} className="flex items-center gap-5 opacity-50 hover:text-red-400 text-[10px] font-black tracking-widest uppercase mt-8 cursor-pointer">
                <LogOut size={18}/> SALIR
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SIDEBAR DESKTOP GLASS */}
      <aside className={`hidden md:flex w-72 ${isDarkMode ? 'bg-[#070709]/40 text-white border-white/10' : 'bg-white/50 text-gray-900 border-gray-200'} backdrop-blur-md border-r flex-col p-8 fixed h-full z-50 box-border shadow-2xl transition-colors duration-300`}>
        <header className="mb-10 text-left leading-none flex justify-between items-start">
          <div>
            <div onClick={() => navigate('/home')} className="text-[22px] font-['Poppins'] font-normal tracking-[0.05em] leading-none cursor-pointer uppercase">
              CLASSCODE
            </div>
            <p className="text-purple-400 text-[10px] font-bold tracking-[0.3em] mt-2.5 leading-none uppercase">
              EXPERIENCE
            </p>
          </div>
          
          {/* BOTÓN MODO DÍA / NOCHE SIN CONTENEDOR EN DESKTOP */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer p-1"
            title={isDarkMode ? "Cambiar a Modo Día" : "Cambiar a Modo Noche"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} className="text-purple-600" />}
          </button>
        </header>

        <nav className="flex-1 space-y-3 text-left">
          <button onClick={() => navigate('/client-profile')} className="flex items-center gap-3 text-purple-400 py-3 px-3 text-[10px] font-black tracking-widest leading-none transition-all cursor-pointer w-full">
            <LayoutGrid size={16} className="text-purple-400"/> ORGANIZADOR
          </button>
          <button onClick={() => navigate('/home')} className={`flex items-center gap-3 opacity-70 hover:opacity-100 py-3 px-3 text-[10px] font-black tracking-widest leading-none transition-all cursor-pointer w-full`}>
            <Search size={16}/> EXPLORAR
          </button>
        </nav>

        <button onClick={() => auth.signOut()} className={`flex items-center gap-4 opacity-50 hover:text-red-400 text-[10px] font-black tracking-widest transition-all mt-auto pt-6 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'} leading-none cursor-pointer`}>
          <LogOut size={16}/> CERRAR SESIÓN
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 md:ml-72 p-6 md:p-12 mt-16 md:mt-0 relative z-10 w-full max-w-[1400px] mx-auto space-y-8 box-border">
        
        {/* HEADER DE PERFIL EN GLASS REAL */}
        <header className={`flex justify-between items-center ${isDarkMode ? 'bg-[#070709]/50 border-white/15 text-white' : 'bg-white/60 border-gray-200 text-gray-900'} backdrop-blur-md border p-6 rounded-2xl shadow-2xl box-border transition-colors duration-300`}>
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl border ${isDarkMode ? 'border-white/20 bg-white/5' : 'border-gray-300 bg-gray-100'} overflow-hidden flex items-center justify-center flex-shrink-0 shadow-inner`}>
              {profile.photoURL ? (
                <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <User size={24} className={isDarkMode ? "text-white/60" : "text-gray-500"}/>
              )}
            </div>
            <div className="text-left leading-none min-w-0">
              <div className="flex items-center gap-3">
                <h2 className={`text-[14px] md:text-[16px] font-['Poppins'] truncate`}>
                  {profile.name || 'ORGANIZADOR'}
                </h2>
                <button onClick={() => setIsEditingProfile(true)} className={`${isDarkMode ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors cursor-pointer flex-shrink-0 p-1`}>
                  <Edit3 size={14} />
                </button>
              </div>
              {profile.location && (
                <p className={`text-[9px] ${isDarkMode ? 'text-white/80' : 'text-gray-600'} font-bold mt-2 flex items-center gap-1.5`}>
                  <MapPin size={11} className="text-purple-500"/> {profile.location}
                </p>
              )}
            </div>
          </div>
          
          <button onClick={() => setIsCreatingEvent(true)} className={`px-5 py-3 ${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white hover:bg-white/[0.08]' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'} backdrop-blur-md border rounded-xl text-[9px] font-black flex items-center gap-2 transition-all tracking-widest font-['Poppins'] cursor-pointer shadow-xl flex-shrink-0`}>
            <Plus size={14} className="text-purple-500"/> NUEVO EVENTO
          </button>
        </header>

        {/* GRILLA DE EVENTOS */}
        <section className="space-y-6">
          <div className="flex justify-between items-center border-l-2 border-purple-500 pl-4">
            <h3 className={`text-[10px] ${isDarkMode ? 'text-white/70' : 'text-gray-600'} uppercase tracking-[0.4em] font-black`}>mis proyectos</h3>
          </div>
          
          {events.length === 0 ? (
            <div className={`py-20 text-center border ${isDarkMode ? 'border-white/15 bg-[#070709]/40 text-white/70' : 'border-gray-200 bg-white/70 text-gray-600'} rounded-2xl backdrop-blur-md space-y-4 shadow-2xl transition-colors duration-300`}>
              <Calendar size={36} className="mx-auto opacity-40" />
              <p className="text-[9px] tracking-[0.3em] font-black uppercase">No hay eventos registrados</p>
              <button onClick={() => setIsCreatingEvent(true)} className={`px-6 py-3.5 ${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white hover:bg-white/[0.08]' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'} backdrop-blur-md border rounded-xl text-[9px] font-black tracking-widest transition-all font-['Poppins'] cursor-pointer shadow-xl`}>
                CREAR PRIMER EVENTO
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev, index) => (
                <div key={ev.id} onClick={() => navigate(`/organizer/${ev.id}`)} className={`${isDarkMode ? 'bg-[#070709]/50 border-white/15 hover:border-purple-400/50 hover:bg-[#070709]/70 text-white' : 'bg-white/80 border-gray-200 hover:border-purple-400/50 hover:bg-white text-gray-900'} backdrop-blur-md border rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xl cursor-pointer transition-all duration-300 group box-border`}>
                  <div className={`relative w-full h-36 ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-gray-100 border-gray-200'} overflow-hidden border-b flex items-center justify-center`}>
                    {ev.coverImage ? (
                      <img src={ev.coverImage} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" />
                    ) : (
                      <ImageIcon size={28} className="opacity-30" />
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="text-[7px] tracking-[0.3em] font-black px-3 py-1 bg-black/60 backdrop-blur-md border border-white/15 rounded-full text-white uppercase shadow-lg">
                        {ev.category || 'EVENTO'}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <button onClick={(e) => handleToggleStatus(ev, e)} className={`text-[7px] tracking-widest font-black px-3 py-1 rounded-full border backdrop-blur-md transition-all uppercase shadow-lg ${
                        ev.status === 'FINALIZADO' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' :
                        ev.status === 'EN_CURSO' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' :
                        'bg-white/10 text-white border-white/20'
                      }`}>
                        {ev.status}
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <h4 className="text-sm font-['Poppins'] group-hover:text-purple-400 flex items-center justify-between transition-colors">
                      {ev.title}
                      <ChevronRight size={16} className="opacity-40 group-hover:translate-x-1 transition-transform" />
                    </h4>
                    <div className={`space-y-1.5 text-[9px] ${isDarkMode ? 'text-white/80' : 'text-gray-600'} font-bold uppercase`}>
                      {ev.date && <p className="flex items-center gap-2"><Calendar size={12} className="text-purple-500"/> {ev.date}</p>}
                      {ev.location && <p className="flex items-center gap-2"><MapPin size={12} className="text-purple-500"/> {ev.location}</p>}
                    </div>

                    <div className={`pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'} flex items-center justify-between gap-3`}>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedEventIndex(index); setShowLivePanel(true); }} className={`flex-1 py-2.5 px-3 rounded-xl ${isDarkMode ? 'bg-white/[0.04] border-white/15 hover:bg-white/[0.08] text-white' : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-900'} backdrop-blur-md text-[8px] font-black tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg`}>
                        <QrCode size={13} className="text-purple-500"/> LIVE CONTROL
                      </button>
                      <button onClick={(e) => confirmDelete(ev.id, e)} className={`p-2.5 ${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white/80 hover:bg-red-500/20 hover:text-red-300' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-red-500/20 hover:text-red-600'} backdrop-blur-md rounded-xl transition-all cursor-pointer shadow-lg`}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECCIÓN DE MENSAJERÍA INTEGRADA */}
        <section className="space-y-6 pt-4">
          <div className="flex justify-between items-center border-l-2 border-purple-500 pl-4">
            <h3 className={`text-[10px] ${isDarkMode ? 'text-white/70' : 'text-gray-600'} uppercase tracking-[0.4em] font-black`}>mensajería directa</h3>
          </div>

          <div className={`${isDarkMode ? 'bg-[#070709]/50 border-white/15 text-white' : 'bg-white/80 border-gray-200 text-gray-900'} backdrop-blur-md border rounded-2xl p-6 flex flex-col h-[480px] shadow-2xl box-border transition-colors duration-300`}>
            <div className={`flex items-center gap-3 pb-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <h3 className="text-[11px] font-['Poppins'] font-bold tracking-widest uppercase">Chat de Soporte y Gestión</h3>
            </div>

            {/* Contenedor de Mensajes */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
              {cargandoChat ? (
                <div className="flex justify-center items-center h-full opacity-50 text-[10px] tracking-widest">
                  Sincronizando mensajes...
                </div>
              ) : mensajes.length === 0 ? (
                <div className="flex justify-center items-center h-full opacity-40 text-[9px] tracking-widest uppercase">
                  No hay mensajes en este chat todavía.
                </div>
              ) : (
                mensajes.map((msg) => {
                  const esMio = msg.senderId === auth.currentUser?.uid;
                  return (
                    <div key={msg.id} className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-[10px] shadow-lg ${
                        esMio 
                          ? 'bg-purple-600 text-white rounded-br-none border border-purple-400/40 backdrop-blur-md' 
                          : `${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white/90' : 'bg-gray-100 border-gray-200 text-gray-800'} rounded-bl-none backdrop-blur-md`
                      }`}>
                        <p className="tracking-wider leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input de Envío */}
            <form onSubmit={handleEnviarMensaje} className={`mt-4 flex gap-3 pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <input
                type="text"
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                placeholder="ESCRIBE UN MENSAJE..."
                className={`flex-1 ${isDarkMode ? 'bg-white/[0.03] border-white/15 text-white placeholder-white/40' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'} backdrop-blur-md border rounded-xl px-4 py-3 text-[10px] focus:outline-none focus:border-purple-500 uppercase shadow-inner transition-colors`}
              />
              <button type="submit" className={`${isDarkMode ? 'bg-white/[0.04] border-white/15 hover:bg-white/[0.08]' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'} backdrop-blur-md border text-white px-5 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-xl`}>
                <Send className="w-4 h-4 text-purple-500" />
              </button>
            </form>
          </div>
        </section>

      </main>

      {/* MODAL EDITAR PERFIL */}
      <AnimatePresence>
        {isEditingProfile && (
          <div 
            onClick={() => setIsEditingProfile(false)} 
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[250] flex items-center justify-center p-4 uppercase"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={`${isDarkMode ? 'bg-[#070709] border-white/15 text-white' : 'bg-white border-gray-200 text-gray-900'} backdrop-blur-2xl w-full max-w-lg p-6 md:p-8 rounded-3xl border relative shadow-2xl space-y-6`}
            >
              <button onClick={() => setIsEditingProfile(false)} className="absolute top-6 right-6 opacity-60 hover:opacity-100 transition-opacity cursor-pointer p-2 z-10"><X size={22} /></button>
              
              <h3 className={`text-[11px] font-['Poppins'] tracking-[0.3em] font-black border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'} pb-4`}>Editar Perfil</h3>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <label className={`text-[8px] ${isDarkMode ? 'text-white/80' : 'text-gray-600'} tracking-widest font-black`}>Nombre / Organizador</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={`w-full ${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} backdrop-blur-md border rounded-xl px-4 py-3 text-[10px] outline-none focus:border-purple-500 transition-colors shadow-inner`} required />
                </div>

                <div className="space-y-2">
                  <label className={`text-[8px] ${isDarkMode ? 'text-white/80' : 'text-gray-600'} tracking-widest font-black`}>Provincia</label>
                  <select value={editForm.province} onChange={handleProvinceChange} className={`w-full ${isDarkMode ? 'bg-[#0b0c10] border-white/15 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl px-4 py-3 text-[10px] outline-none focus:border-purple-500 transition-colors cursor-pointer shadow-inner`}>
                    {ARGENTINE_PROVINCES.map((prov) => (
                      <option key={prov.name} value={prov.name} className={`${isDarkMode ? 'bg-[#0b0c10] text-white' : 'bg-white text-gray-900'}`}>{prov.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={`text-[8px] ${isDarkMode ? 'text-white/80' : 'text-gray-600'} tracking-widest font-black`}>Localidad / Zona</label>
                  <select value={editForm.locality} onChange={(e) => setEditForm({ ...editForm, locality: e.target.value })} className={`w-full ${isDarkMode ? 'bg-[#0b0c10] border-white/15 text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded-xl px-4 py-3 text-[10px] outline-none focus:border-purple-500 transition-colors cursor-pointer shadow-inner`}>
                    {selectedProvinceObj.localities.map((loc) => (
                      <option key={loc} value={loc} className={`${isDarkMode ? 'bg-[#0b0c10] text-white' : 'bg-white text-gray-900'}`}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={`text-[8px] ${isDarkMode ? 'text-white/80' : 'text-gray-600'} tracking-widest font-black`}>Subir Foto de Perfil</label>
                  <div className="flex items-center gap-4">
                    <label className={`flex-1 flex items-center justify-center gap-2 ${isDarkMode ? 'bg-white/[0.04] border-white/25 text-white/90' : 'bg-gray-50 border-gray-300 text-gray-700'} backdrop-blur-md border border-dashed hover:border-purple-500 rounded-xl px-4 py-3 text-[9px] cursor-pointer transition-colors shadow-inner`}>
                      <Upload size={14} className="text-purple-500" />
                      <span>{editForm.photoURL ? "Cambiar imagen..." : "Seleccionar archivo..."}</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    {editForm.photoURL && (
                      <div className={`w-10 h-10 rounded-xl overflow-hidden border ${isDarkMode ? 'border-white/20' : 'border-gray-300'} flex-shrink-0 shadow-inner`}>
                        <img src={editForm.photoURL} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditingProfile(false)} className={`px-5 py-3 ${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white hover:bg-white/[0.08]' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'} backdrop-blur-md border rounded-xl text-[9px] font-black tracking-widest transition-all cursor-pointer shadow-lg`}>
                    Cancelar
                  </button>
                  <button type="submit" className={`px-6 py-3 ${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white hover:bg-white/[0.08]' : 'bg-gray-900 border-gray-900 text-white hover:bg-gray-800'} backdrop-blur-md border rounded-xl text-[9px] font-black tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-xl`}>
                    <Save size={14} className="text-purple-500" /> Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CREAR EVENTO */}
      <AnimatePresence>
        {isCreatingEvent && (
          <div 
            onClick={() => setIsCreatingEvent(false)} 
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-[250] flex items-center justify-center p-4 uppercase"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={`${isDarkMode ? 'bg-[#070709] border-white/15 text-white' : 'bg-white border-gray-200 text-gray-900'} backdrop-blur-2xl w-full max-w-lg p-6 md:p-8 rounded-3xl border relative shadow-2xl space-y-6`}
            >
              <button onClick={() => setIsCreatingEvent(false)} className="absolute top-6 right-6 opacity-60 hover:opacity-100 transition-opacity cursor-pointer p-2 z-10"><X size={22} /></button>
              
              <h3 className={`text-[11px] font-['Poppins'] tracking-[0.3em] font-black border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'} pb-4`}>NUEVO PROYECTO / EVENTO</h3>

              <form onSubmit={handleCreateNewEventSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className={`text-[8px] ${isDarkMode ? 'text-white/80' : 'text-gray-600'} tracking-widest font-black`}>Título del Evento</label>
                  <input 
                    type="text" 
                    value={newEventForm.title} 
                    onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })} 
                    placeholder="EJ: CUMPLEAÑOS / BODA" 
                    className={`w-full ${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white placeholder-white/30' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'} backdrop-blur-md border rounded-xl px-4 py-3 text-[10px] outline-none focus:border-purple-500 transition-colors shadow-inner uppercase`} 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-[8px] ${isDarkMode ? 'text-white/80' : 'text-gray-600'} tracking-widest font-black`}>Categoría</label>
                  <input 
                    type="text" 
                    value={newEventForm.category} 
                    onChange={(e) => setNewEventForm({ ...newEventForm, category: e.target.value })} 
                    placeholder="EJ: SOCIAL / CORPORATIVO" 
                    className={`w-full ${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white placeholder-white/30' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'} backdrop-blur-md border rounded-xl px-4 py-3 text-[10px] outline-none focus:border-purple-500 transition-colors shadow-inner uppercase`} 
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-[8px] ${isDarkMode ? 'text-white/80' : 'text-gray-600'} tracking-widest font-black`}>Fecha del Evento</label>
                  <input 
                    type="date" 
                    value={newEventForm.date} 
                    onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })} 
                    className={`w-full ${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} backdrop-blur-md border rounded-xl px-4 py-3 text-[10px] outline-none focus:border-purple-500 transition-colors shadow-inner cursor-pointer`} 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-[8px] ${isDarkMode ? 'text-white/80' : 'text-gray-600'} tracking-widest font-black`}>Ubicación / Salón</label>
                  <input 
                    type="text" 
                    value={newEventForm.location} 
                    onChange={(e) => setNewEventForm({ ...newEventForm, location: e.target.value })} 
                    placeholder="EJ: SALÓN LA PLATA" 
                    className={`w-full ${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white placeholder-white/30' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'} backdrop-blur-md border rounded-xl px-4 py-3 text-[10px] outline-none focus:border-purple-500 transition-colors shadow-inner uppercase`} 
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsCreatingEvent(false)} className={`px-5 py-3 ${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white hover:bg-white/[0.08]' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'} backdrop-blur-md border rounded-xl text-[9px] font-black tracking-widest transition-all cursor-pointer shadow-lg`}>
                    Cancelar
                  </button>
                  <button type="submit" className={`px-6 py-3 ${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white hover:bg-white/[0.08]' : 'bg-gray-900 border-gray-900 text-white hover:bg-gray-800'} backdrop-blur-md border rounded-xl text-[9px] font-black tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-xl`}>
                    <Save size={14} className="text-purple-500" /> Crear Evento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIVE CONTROL PANEL EN GLASS */}
      <AnimatePresence>
        {showLivePanel && (
          <div 
            onClick={() => setShowLivePanel(false)} 
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 md:p-8 overflow-y-auto"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={`${isDarkMode ? 'bg-[#070709] border-white/15 text-white' : 'bg-white border-gray-200 text-gray-900'} backdrop-blur-2xl w-full max-w-4xl p-6 md:p-8 rounded-3xl border relative shadow-2xl space-y-6 uppercase`}
            >
              <button onClick={() => setShowLivePanel(false)} className="absolute top-6 right-6 opacity-60 hover:opacity-100 transition-opacity cursor-pointer p-2 z-10"><X size={22} /></button>

              <div className="max-h-[80vh] overflow-y-auto pr-2">
                <LiveControlPanel 
                  currentEvent={currentEvent}
                  events={events}
                  selectedEventIndex={selectedEventIndex}
                  setSelectedEventIndex={setSelectedEventIndex}
                  onTogglePause={handleTogglePause}
                  onConfirmFinish={handleConfirmFinish}
                  onCopyGuestLink={handleCopyGuestLink}
                  onShareTV={() => {
                    const link = `https://www.classcode.com.ar/tv/${currentEvent?.id}`;
                    navigator.clipboard.writeText(link);
                    setModal({ isOpen: true, title: "TV LINK", message: "LINK DE TV COPIADO.", type: "success" });
                  }}
                  onOpenTV={() => navigate(`/tv/${currentEvent?.id}`)}
                  onOpenCreate={() => { setShowLivePanel(false); setIsCreatingEvent(true); }}
                  setPreviewImage={setPreviewImage}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREVIEW DE IMAGEN */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-lg p-4" onClick={() => setPreviewImage(null)}>
            <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl border border-white/20 shadow-2xl" />
              <button onClick={() => setPreviewImage(null)} className="absolute -top-4 -right-4 p-2 bg-black/90 text-white rounded-full border border-white/20 shadow-xl cursor-pointer"><X size={18}/></button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PERSONALIZADO */}
      <CustomModal 
        isOpen={modal.isOpen} 
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))} 
        onConfirm={modal.onConfirm} 
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
      />
    </div>
  );
}