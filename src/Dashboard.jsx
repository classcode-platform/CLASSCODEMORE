import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; 
import { doc, setDoc, collection, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, GraduationCap, Play, 
  Upload, X, Eye, Menu, Zap, CheckCircle2, 
  LayoutDashboard, LogOut, RefreshCcw, User, MessageSquare, Edit3, Camera, Award, MapPin, Share2, Search, QrCode
} from 'lucide-react'; 
import CustomModal from './components/CustomModal'; 
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  
  const [profile, setProfile] = useState({
    name: '', job: '', specialty: '', location: '', bio: '', videoLink: '', 
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`photo${i + 1}`, ''])),
    academyPoints: 0, verified: false, score: 0,
    completedCourses: [] 
  });

  const [uploadingStatus, setUploadingStatus] = useState({
    video: false, ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`photo${i + 1}`, false]))
  });

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'warning' });

  const CLOUD_NAME = "dsyfitywd";
  const UPLOAD_PRESET = "CLASSCODE"; 

  const RUBROS = {
    "📸 FOTOGRAFÍA": ["Fotografía Social", "Fotografía de Moda", "Fotografía Publicitaria", "Fotografía de Producto", "Fotografía Gastronómica", "Fotografía Inmobiliaria", "Fotografía Corporativa", "Fotografía Editorial", "Fotografía Deportiva", "Fotografía de Naturaleza", "Retrato", "Drone"],
    "🎥 AUDIOVISUAL": ["Filmmaker", "Dirección de Fotografía", "Edición de Video", "Color Grading", "Motion Graphics", "Animación 2D / 3D", "Streaming", "Operador de Cámara", "Drone", "Producción de Contenido"],
    "👗 MODELO": ["Moda", "Publicidad", "E-commerce", "Pasarela", "Presencia para Eventos", "Fitness", "Curvy", "Comercial", "Editorial", "Partes del cuerpo (Hands / Feet / Hair)"],
    "🎭 ESCÉNICO": ["Actor / Actriz", "Bailarín/a", "Cantante", "Músico", "Performer", "Comediante", "Improvisación", "Voz", "Locución", "Doblaje"],
    "📱 DIGITAL": ["Influencer", "UGC Creator", "Streamer", "Presentador/a de Contenido", "Community Creator", "Community Manager", "Social Media Manager", "Content Creator", "Podcaster"],
    "🎉 SHOW": ["Animación", "Magia", "Circo", "Personajes", "Shows Infantiles", "Shows Temáticos", "Zanquistas", "Comparsas", "Bandas", "DJs en Vivo", "Karaoke", "Humor"],
    "🎬 PRODUCCIÓN / DIRECCIÓN": ["Producción Audiovisual", "Producción de Moda", "Producción de Eventos", "Dirección General", "Dirección Creativa", "Dirección de Arte", "Dirección de Casting", "Asistencia de Producción"],
    "💄 MAKEUP / PELO": ["Makeup Social", "Makeup Editorial", "Makeup FX", "Makeup Artístico", "Hairstylist", "Barbería", "Caracterización"],
    "👠 ESTILISMO / MODA": ["Estilismo", "Vestuario", "Personal Shopper", "Asesoría de Imagen", "Diseño de Moda", "Sastrería"],
    "🎨 DISEÑO / ARTE": ["Diseño Gráfico", "Ilustración", "Branding", "Identidad Visual", "UX/UI", "Escenografía", "Escaparatismo", "Arte Digital"],
    "🎵 DJ / SONIDO": ["DJ", "Sonidista", "Operador de Audio", "Ingeniería de Sonido", "Musicalización", "Producción Musical", "Grabación", "Mezcla y Mastering"],
    "🍽️ CATERING / BARRA": ["Catering", "Barra", "Bartender", "Barista", "Coffee Break", "Pastelería", "Food Truck", "Chef Privado"],
    "🎉 PLANNER / EVENTOS": ["Wedding Planner", "Event Planner", "Coordinación de Eventos", "Organización Integral", "Maestro/a de Ceremonias", "Protocolo", "Logística"],
    "💡 TÉCNICA / ILUMINACIÓN": ["Iluminación", "Operador de Luces", "Pantallas LED", "Escenarios", "Estructuras", "Rigging", "Efectos Especiales", "Mapping"],
    "📍 LOCACIONES": ["Salones", "Quintas", "Estudios Fotográficos", "Estudios Audiovisuales", "Teatros", "Galpones", "Hoteles", "Rooftops", "Restaurantes", "Bares", "Espacios Corporativos", "Espacios al Aire Libre"]
  };
  
  const PROVINCIAS = ["Buenos Aires", "Capital Federal", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes", "Río Negro", "Neuquén", "Chubut", "Formosa", "Jujuy", "San Luis", "San Juan", "La Rioja", "La Pampa", "Santiago del Estero", "Catamarca", "Santa Cruz", "Tierra del Fuego"];

  const isGenericoDone = profile.completedCourses?.includes('cert_generico');
  const proCourseId = profile.job ? `cert_${profile.job.toLowerCase().replace(/\s/g, '')}` : null;
  const isProfessionalTestDone = proCourseId && profile.completedCourses?.includes(proCourseId);

  const calculateTotalScore = (currentProfile) => {
    let bonus = 0;
    if (currentProfile.name?.trim()) bonus += 15;
    if (currentProfile.job?.trim()) bonus += 15;
    const photoCount = Array.from({ length: 10 }, (_, i) => currentProfile[`photo${i + 1}`]).filter(Boolean).length;
    bonus += photoCount * 5; 
    return bonus + (currentProfile.academyBaseScore || 0);
  };

  useEffect(() => {
    let profUnsubscribe = () => {};
    let chatUnsubscribe = () => {};

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        profUnsubscribe = onSnapshot(doc(db, "professionals", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const photosData = {};
            data.photos?.forEach((url, i) => { if(i < 10) photosData[`photo${i+1}`] = url; });
            
            setProfile(prev => ({ 
              ...prev, 
              ...data, 
              ...photosData, 
              completedCourses: data.completedCourses || [],
              academyBaseScore: data.score || 0 
            }));
          } else {
            setProfile(prev => ({
              ...prev,
              name: user.displayName || 'NUEVO TALENTO',
              completedCourses: []
            }));
          }
          setLoading(false);
        });
        const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
        chatUnsubscribe = onSnapshot(q, (snap) => {
            setMessages(snap.docs.map(chatDoc => ({ id: chatDoc.id, ...chatDoc.data() })));
        });
      } else { navigate('/'); }
    });

    return () => {
      authUnsubscribe();
      profUnsubscribe();
      chatUnsubscribe();
    };
  }, [navigate]);

  const persistProfile = async (updates) => {
    const user = auth.currentUser;
    if (!user) return;
    const newProfile = { ...profile, ...updates };
    const photoList = Array.from({ length: 10 }, (_, i) => newProfile[`photo${i + 1}`]).filter(Boolean);
    const finalScore = calculateTotalScore(newProfile);

    const dataToSave = {
      ...updates,
      photos: photoList,
      score: finalScore,
      uid: user.uid
    };

    try {
      await setDoc(doc(db, "professionals", user.uid), dataToSave, { merge: true });
    } catch (e) { console.error("Error al persistir:", e); }
  };

  const handleSaveProfileData = async () => {
    await persistProfile(profile);
    setIsEditingProfile(false);
    setModal({ isOpen: true, type: 'success', title: "ÉXITO", message: "PERFIL ACTUALIZADO." });
  };

  const handleSwitchToClient = async () => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { role: 'client' });
      navigate('/client-profile');
    } catch (error) { console.error(error); }
  };

  const handleImageUpload = async (e, photoField) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingStatus(prev => ({ ...prev, [photoField]: true }));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
      const data = await response.json();
      if (data?.secure_url) {
        const updates = { [photoField]: data.secure_url };
        setProfile(prev => ({ ...prev, ...updates }));
        await persistProfile(updates);
      }
    } finally { setUploadingStatus(prev => ({ ...prev, [photoField]: false })); }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingStatus(prev => ({ ...prev, video: true }));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('resource_type', 'video');
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, { method: 'POST', body: formData });
      const data = await response.json();
      if (data?.secure_url) {
        const updates = { videoLink: data.secure_url };
        setProfile(prev => ({ ...prev, ...updates }));
        await persistProfile(updates);
      }
    } finally { setUploadingStatus(prev => ({ ...prev, video: false })); }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-['Poppins']">CARGANDO DASHBOARD...</div>;

  return (
    <div className="min-h-screen w-screen bg-[#0a0a0a] text-white font-['Open_Sans'] flex overflow-x-hidden uppercase antialiased relative text-left">
      
      {/* FONDO ANIMADO */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] md:blur-[150px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[90px] md:blur-[130px]" />
      </div>

      {/* TOPBAR MOBILE */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-b border-white/5 z-[100] px-8 py-6 flex justify-between items-center">
        <div onClick={() => navigate('/home')} className="text-[18px] font-['Poppins'] font-normal tracking-[0.05em] uppercase cursor-pointer text-white">CLASSCODE</div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white"><Menu size={28} /></button>
      </header>

      {/* MENU MOBILE SIDEBAR ANIMADO */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[110] md:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-[85%] bg-[#050505] z-[120] p-12 flex flex-col md:hidden shadow-2xl">
              <button onClick={() => setIsMobileMenuOpen(false)} className="self-end mb-12 text-gray-500 hover:text-white transition-colors"><X size={32} /></button>
              <button onClick={handleSwitchToClient} className="mb-12 w-full flex items-center justify-between bg-white/[0.03] border border-white/10 p-5 rounded-2xl group hover:bg-purple-500/10 transition-all">
                <div className="flex items-center gap-4 text-left leading-none">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400"><RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-700" /></div>
                  <div>
                    <p className="text-[7px] font-black text-gray-500 tracking-[0.2em]">SWITCH MOOD</p>
                    <p className="text-[11px] font-black text-white tracking-widest uppercase leading-none mt-1">MODO EXPERIENCE</p>
                  </div>
                </div>
              </button>
              <nav className="flex-1 space-y-12">
                <button onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }} className="flex items-center gap-6 text-[12px] font-black tracking-widest text-purple-500 uppercase"><LayoutDashboard size={22}/> DASHBOARD</button>
                <button onClick={() => { navigate('/academy'); setIsMobileMenuOpen(false); }} className="flex items-center gap-6 text-[12px] font-black tracking-widest text-gray-400 uppercase"><GraduationCap size={22}/> ACADEMY</button>
                <button onClick={() => { navigate(`/profile/${auth.currentUser?.uid}`); setIsMobileMenuOpen(false); }} className="flex items-center gap-6 text-[12px] font-black tracking-widest text-gray-400 uppercase"><Eye size={22}/> PERFIL PÚBLICO</button>
              </nav>
              <button onClick={() => { auth.signOut(); setIsMobileMenuOpen(false); }} className="flex items-center gap-6 text-gray-700 text-[10px] font-black tracking-widest uppercase"><LogOut size={20}/> SALIR</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex w-72 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex-col p-10 fixed h-full z-50">
        <header className="mb-12 text-left leading-none">
          <div onClick={() => navigate('/home')} className="text-[22px] font-['Poppins'] font-normal tracking-[0.05em] leading-none cursor-pointer uppercase text-white">CLASSCODE</div>
          <p className="text-purple-400 text-[10px] font-bold tracking-[0.3em] mt-2 leading-none uppercase">Talent Dashboard</p>
        </header>
        
        <div className="mb-12 text-left">
          <button onClick={handleSwitchToClient} className="w-full flex items-center justify-between bg-white/[0.03] border border-white/10 p-4 rounded-2xl group hover:bg-purple-500/10 transition-all leading-none">
            <div className="flex items-center gap-3 text-left leading-none">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <div>
                <p className="text-[6px] font-black text-gray-500 tracking-[0.2em] leading-none">SWITCH MOOD</p>
                <p className="text-[9px] font-black text-white tracking-widest uppercase mt-1 leading-none">MODO EXPERIENCE</p>
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 space-y-8 text-left">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-4 text-white text-[10px] font-black tracking-widest leading-none transition-all"><LayoutDashboard size={18} className="text-purple-500"/> DASHBOARD</button>
          <button onClick={() => navigate('/academy')} className="flex items-center gap-4 text-gray-500 hover:text-white text-[10px] font-black tracking-widest leading-none transition-all"><GraduationCap size={18}/> ACADEMY</button>
          <button onClick={() => navigate(`/profile/${auth.currentUser?.uid}`)} className="flex items-center gap-4 text-gray-500 hover:text-white text-[10px] font-black tracking-widest leading-none transition-all"><Eye size={18}/> PERFIL PÚBLICO</button>
        </nav>
        <button onClick={() => auth.signOut()} className="flex items-center gap-4 text-gray-700 hover:text-red-500 text-[10px] font-black tracking-widest transition-all mt-auto pt-8 border-t border-white/5 leading-none"><LogOut size={18}/> CERRAR SESIÓN</button>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 md:ml-72 p-4 md:p-8 mt-16 md:mt-0 relative z-10 w-full max-w-[1400px] mx-auto box-border overflow-x-hidden">
        
        {/* SECCIÓN ESTILO FACEBOOK */}
        <div className="w-full max-w-full bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-2xl p-4 md:p-8 mb-8 shadow-2xl box-border overflow-hidden">
          <div className="w-full max-w-[1200px] mx-auto box-border">
            
            {/* Banner / Showreel Container */}
            <div className="w-full h-[180px] md:h-[260px] bg-black relative overflow-hidden group box-border rounded-2xl border border-white/10">
              {profile.videoLink ? (
                <video 
                  src={profile.videoLink} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover pointer-events-none opacity-90" 
                />
              ) : (
                <div className="w-full h-full bg-[#070709] flex flex-col items-center justify-center p-6 text-center border border-white/5 box-border">
                  <Play size={28} className="text-white/20 mb-2" strokeWidth={1}/>
                  <span className="text-[8px] tracking-[0.4em] text-gray-500 font-black">SIN SHOWREEL CARGADO</span>
                </div>
              )}
              
              <label className="absolute bottom-4 right-4 bg-black/80 hover:bg-black text-white px-3 py-2 rounded-xl text-[8px] font-black tracking-widest cursor-pointer border border-white/10 transition-all flex items-center gap-2 shadow-xl z-20">
                <Upload size={14} /> {profile.videoLink ? 'CAMBIAR' : 'SUBIR'}
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              </label>
            </div>

            {/* Perfil Header */}
            <div className="pb-8 relative -mt-10 md:-mt-16 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 z-20 box-border w-full max-w-full">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left w-full md:w-auto min-w-0">
                
                {/* Foto de Perfil */}
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-black overflow-hidden bg-black shadow-2xl flex-shrink-0 group">
                  {profile.photo1 ? (
                    <img src={profile.photo1} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-gray-500"><User size={40}/></div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                    <Camera size={20} className="text-white"/>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'photo1')} className="hidden" />
                  </label>
                </div>

                <div className="space-y-2 pb-1 min-w-0 flex-1 w-full">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <h1 className="text-lg md:text-2xl font-['Poppins'] font-normal tracking-wide text-white truncate max-w-full">{profile.name || 'NUEVO TALENTO'}</h1>
                    <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase flex items-center gap-1.5 flex-shrink-0">
                      <CheckCircle2 size={12}/> TALENTO
                    </span>
                  </div>
                  <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.3em] font-bold truncate">{profile.job || 'ASIGNAR RUBRO'}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] text-gray-500 font-bold tracking-widest pt-1">
                    {profile.location && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-purple-400"/> {profile.location}</span>}
                    <span className="flex items-center gap-1.5"><Award size={14} className="text-purple-400"/> {calculateTotalScore(profile)} PTS</span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-center pb-2 flex-shrink-0">
                <button onClick={() => navigate(`/profile/${auth.currentUser?.uid}`)} className="p-4 bg-white/[0.03] hover:bg-white/15 rounded-2xl border border-white/10 transition-all text-white" title="Ver Perfil Público">
                  <Eye size={18} />
                </button>
                <button onClick={() => setIsEditingProfile(true)} className="px-6 py-4 rounded-2xl bg-purple-600 text-white font-black text-[10px] tracking-[0.3em] hover:bg-purple-500 transition-all shadow-xl flex items-center justify-center gap-2">
                  <Edit3 size={14}/> EDITAR PERFIL
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <main className="w-full max-w-full py-6 grid lg:grid-cols-12 gap-10 relative z-10 box-border">
          
          {/* COLUMNA IZQUIERDA */}
          <div className="lg:col-span-4 space-y-8 min-w-0 box-border">
            
            {/* ESTADO ACADÉMICO */}
            <div className="bg-[#050505] border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl box-border">
              <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.4em] font-black border-l-2 border-purple-500 pl-4">Estatus Academy</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 px-4 py-3 rounded-2xl box-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <Zap size={14} className={isGenericoDone ? "text-purple-400 flex-shrink-0" : "text-gray-600 flex-shrink-0"} />
                    <span className="text-[9px] font-black tracking-widest text-white truncate">NIVELACIÓN INGRESO</span>
                  </div>
                  {!isGenericoDone ? (
                    <button onClick={() => navigate('/academy-test/Generico')} className="text-[8px] font-black text-purple-400 hover:underline flex-shrink-0 ml-2">RENDIR</button>
                  ) : (
                    <span className="text-[8px] font-black text-green-400 flex-shrink-0 ml-2">APROBADO</span>
                  )}
                </div>

                {profile.job && (
                  <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 px-4 py-3 rounded-2xl box-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <Award size={14} className={isProfessionalTestDone ? "text-purple-400 flex-shrink-0" : "text-gray-600 flex-shrink-0"} />
                      <span className="text-[9px] font-black tracking-widest text-white truncate">TEST PROFESIONAL</span>
                    </div>
                    {!isProfessionalTestDone ? (
                      <button onClick={() => navigate(`/academy-test/${encodeURIComponent(profile.job)}`)} className="text-[8px] font-black text-purple-400 hover:underline flex-shrink-0 ml-2">RENDIR</button>
                    ) : (
                      <span className="text-[8px] font-black text-green-400 flex-shrink-0 ml-2">APROBADO</span>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => navigate('/academy')} className="w-full py-3 bg-white/5 hover:bg-white/15 border border-white/10 rounded-2xl text-[9px] font-black tracking-[0.3em] text-gray-300 transition-all flex items-center justify-center gap-2 box-border">
                <GraduationCap size={14}/> IR A CLASSCODE ACADEMY
              </button>
            </div>

            {/* BANDEJA DE MENSAJES */}
            <div className="bg-[#050505] border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl box-border">
              <div className="flex justify-between items-center border-l-2 border-purple-500 pl-4">
                <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.4em] font-black flex items-center gap-2"><MessageSquare size={12}/> Mensajes</h3>
                <span className="text-[9px] text-purple-400 font-black">{messages.length}</span>
              </div>
              <div className="space-y-3 max-h-[240px] overflow-y-auto no-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-center py-6 text-[8px] text-gray-600 uppercase font-black tracking-widest">No hay chats activos</div>
                ) : messages.map(chat => (
                  <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex justify-between items-center p-3.5 bg-white/[0.03] border border-white/10 hover:border-purple-500/30 rounded-2xl transition-all cursor-pointer box-border">
                     <div className="flex items-center gap-3 min-w-0">
                        {chat.clientPhoto ? <img src={chat.clientPhoto} className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0" alt="" /> : <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center flex-shrink-0"><User size={14}/></div>}
                        <div className="min-w-0">
                           <p className="text-[9px] font-black text-white uppercase tracking-wider truncate">{chat.clientName || "CLIENTE"}</p>
                           <p className="text-[7px] text-gray-400 font-bold uppercase mt-0.5">Ver chat</p>
                        </div>
                     </div>
                     <ArrowRight size={12} className="text-gray-500 flex-shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#050505] border border-white/5 rounded-2xl p-6 shadow-xl box-border">
               <button onClick={() => {
                 navigator.clipboard.writeText(`https://www.classcode.com.ar/profile/${auth.currentUser?.uid}`);
                 alert("¡Enlace de perfil copiado al portapapeles!");
               }} className="w-full group flex items-center justify-center gap-3 text-[9px] font-black tracking-[0.3em] text-gray-400 hover:text-white transition-all uppercase py-2 box-border">
                  <Share2 size={16} /> Compartir Perfil Público
               </button>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="lg:col-span-8 space-y-12 min-w-0 box-border">
            <section className="bg-[#050505] border border-white/5 rounded-2xl p-6 md:p-8 space-y-8 shadow-xl box-border">
              <div className="flex justify-between items-center border-l-2 border-purple-500 pl-4">
                <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.4em] font-black">Portfolio — Galería de Fotos</h3>
                <span className="text-[9px] text-purple-400 font-mono">{Array.from({ length: 10 }, (_, i) => profile[`photo${i + 1}`]).filter(Boolean).length}/10 FOTOS</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                  <div key={num} className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black group relative shadow-xl flex items-center justify-center box-border">
                    {profile[`photo${num}`] ? (
                      <>
                        <img src={profile[`photo${num}`]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                        <button onClick={async () => {
                          const updates = { [`photo${num}`]: '' };
                          setProfile(prev => ({ ...prev, ...updates }));
                          await persistProfile(updates);
                        }} className="absolute top-2 right-2 p-2 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 text-red-400 transition-all border border-white/10"><X size={12} /></button>
                      </>
                    ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all p-4 text-center">
                        <Upload size={20} className="text-gray-600 mb-2" />
                        <span className="text-[7px] font-black tracking-widest text-gray-500">SUBIR FOTO {num}</span>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, `photo${num}`)} className="hidden" />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* MODAL EDITAR PERFIL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 box-border overflow-x-hidden">
          <div className="bg-[#050505] w-full max-w-lg p-6 md:p-12 rounded-[2.5rem] border border-white/10 relative shadow-2xl uppercase max-h-[90vh] flex flex-col box-border">
            <button onClick={() => setIsEditingProfile(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={22} /></button>
            <h3 className="text-[11px] uppercase tracking-[0.5em] font-black text-white mb-8 text-center font-['Poppins']">Editar Perfil Profesional</h3>
            
            <div className="space-y-4 font-bold overflow-y-auto pr-2 flex-1 scrollbar-hide text-left box-border">
              <div className="space-y-1">
                <label className="text-[7px] text-gray-500 tracking-widest">Nombre Completo / Artístico</label>
                <input className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-purple-500 tracking-widest box-border" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[7px] text-gray-500 tracking-widest">Rubro Principal</label>
                  <select className="w-full bg-[#121215] border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-purple-500 tracking-widest box-border" 
                          value={profile.job || ""} 
                          onChange={e => setProfile({...profile, job: e.target.value, specialty: ""})}>
                    <option value="">SELECCIONAR</option>
                    {Object.keys(RUBROS).map(rubro => <option key={rubro} value={rubro}>{rubro}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] text-gray-500 tracking-widest">Provincia</label>
                  <select className="w-full bg-[#121215] border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-purple-500 tracking-widest box-border" 
                          value={profile.location || ""} 
                          onChange={e => setProfile({...profile, location: e.target.value})}>
                    <option value="">SELECCIONAR</option>
                    {PROVINCIAS.map(prov => <option key={prov} value={prov}>{prov.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              {profile.job && (
                <div className="space-y-1">
                  <label className="text-[7px] text-gray-500 tracking-widest">Especialidad</label>
                  <select className="w-full bg-[#121215] border border-white/10 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-purple-500 tracking-widest box-border" 
                          value={profile.specialty || ""} 
                          onChange={e => setProfile({...profile, specialty: e.target.value})}>
                    <option value="">SELECCIONAR ESPECIALIDAD</option>
                    {RUBROS[profile.job].map(spec => <option key={spec} value={spec}>{spec.toUpperCase()}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[7px] text-gray-500 tracking-widest">Biografía / Presentación</label>
                <textarea className="w-full bg-white/[0.03] border border-white/10 rounded-3xl p-4 text-[10px] text-white uppercase h-28 resize-none outline-none focus:border-purple-500 tracking-widest box-border" value={profile.bio || ''} onChange={e => setProfile({...profile, bio: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-white/5">
              <button onClick={() => setIsEditingProfile(false)} className="py-4 rounded-2xl bg-white/5 text-gray-400 font-black text-[9px] tracking-[0.3em] uppercase hover:bg-white/15 transition-all">DESCARTAR</button>
              <button onClick={handleSaveProfileData} className="py-4 rounded-2xl bg-purple-600 text-white font-black text-[9px] tracking-[0.3em] uppercase hover:bg-purple-500 transition-all shadow-xl">GUARDAR</button>
            </div>
          </div>
        </div>
      )}

      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} type={modal.type} />
      
      <footer className="bg-black py-20 px-6 border-t border-white/5 text-center relative z-10 w-full box-border font-['Poppins']">
        <div className="max-w-[1440px] mx-auto box-border">
          <h2 className="text-white text-3xl font-normal tracking-[0.1em] uppercase mb-4 opacity-30">CLASSCODE</h2>
          <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-gray-600 opacity-30">© 2026 — TODOS LOS DERECHOS RESERVADOS</p>
        </div>
      </footer>
    </div>
  );
}