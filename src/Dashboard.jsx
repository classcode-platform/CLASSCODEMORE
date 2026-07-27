import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; 
import { doc, setDoc, collection, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, GraduationCap, PlayCircle, 
  Upload, X, Eye, Menu, Zap, CheckCircle2, 
  LayoutDashboard, LogOut, Bell, RefreshCcw, User, MessageSquare, Edit3, Camera, Award
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
    name: '', job: '', specialty: '', location: '', bio: '', instagram: '', videoLink: '', 
    photo1: '', photo2: '', photo3: '', photo4: '', photo5: '', 
    photo6: '', photo7: '', photo8: '', photo9: '', photo10: '',
    academyPoints: 0, verified: false, score: 0,
    completedCourses: [] 
  });

  const [uploadingStatus, setUploadingStatus] = useState({
    video: false, profile: false,
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`photo${i + 1}`, false]))
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

  const isProfileVisible = Boolean(profile.name?.trim() && profile.job?.trim());

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

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-black font-['Poppins']">Sincronizando...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] flex overflow-x-hidden uppercase antialiased relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[130px]" />
      </div>

      {/* TOPBAR MOBILE */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 z-[90] px-6 py-5 flex justify-between items-center">
        <div onClick={() => navigate('/home')} className="text-[18px] font-['Poppins'] font-normal tracking-[0.05em] uppercase cursor-pointer">CLASSCODE</div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-2 focus:outline-none"><Menu size={28} /></button>
      </header>

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex w-72 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex-col p-10 fixed h-full z-50">
        <header className="mb-12 text-left leading-none">
          <div onClick={() => navigate('/home')} className="text-[22px] font-['Poppins'] font-normal tracking-[0.05em] leading-none cursor-pointer uppercase text-white">CLASSCODE</div>
          <p className="text-purple-400 text-[10px] font-bold tracking-[0.3em] mt-2 leading-none uppercase">Talent</p>
        </header>
        
        <div className="mb-12 text-left">
          <button onClick={handleSwitchToClient} className="w-full flex items-center justify-between bg-white/[0.03] border border-white/10 p-4 rounded-2xl group hover:bg-purple-500/15 transition-all leading-none">
            <div className="flex items-center gap-3 text-left leading-none">
              <div className="p-2 bg-purple-500/15 rounded-lg text-purple-400"><RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" /></div>
              <div>
                <p className="text-[6px] font-black text-gray-500 tracking-[0.2em] leading-none">SWITCH MOOD</p>
                <p className="text-[9px] font-black text-white tracking-widest uppercase mt-1 leading-none">MODO EXPERIENCE</p>
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 space-y-8 text-left">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-4 text-white text-[10px] font-black tracking-widest leading-none w-full"><LayoutDashboard size={18} className="text-purple-500"/> DASHBOARD</button>
          <button onClick={() => navigate('/academy')} className="flex items-center gap-4 text-gray-500 hover:text-white text-[10px] font-black tracking-widest leading-none transition-all w-full"><GraduationCap size={18}/> ACADEMY</button>
          <button onClick={() => navigate(`/profile/${auth.currentUser?.uid}`)} className="flex items-center gap-4 text-gray-500 hover:text-white text-[10px] font-black tracking-widest leading-none transition-all w-full"><Eye size={18}/> MI PERFIL PÚBLICO</button>
        </nav>
        <button onClick={() => auth.signOut()} className="flex items-center gap-4 text-gray-700 hover:text-red-500 text-[10px] font-black tracking-widest transition-all mt-auto pt-8 border-t border-white/5 leading-none w-full"><LogOut size={18}/> CERRAR SESIÓN</button>
      </aside>

      {/* MENU MOBILE SIDEBAR OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: "100%" }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: "100%" }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-[#0a0a0a] z-[300] flex flex-col p-8 text-left md:hidden overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-12">
              <div>
                <div onClick={() => { navigate('/home'); setIsMobileMenuOpen(false); }} className="text-[20px] font-['Poppins'] font-normal tracking-[0.05em] uppercase text-white cursor-pointer">CLASSCODE</div>
                <p className="text-purple-400 text-[10px] font-bold tracking-[0.3em] mt-1 uppercase">Talent</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-3 bg-white/5 rounded-full"><X size={24} /></button>
            </div>

            <div className="mb-8">
              <button onClick={() => { handleSwitchToClient(); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-between bg-white/[0.03] border border-white/10 p-4 rounded-2xl group transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/15 rounded-xl text-purple-400"><RefreshCcw size={16} /></div>
                  <div>
                    <p className="text-[7px] font-black text-gray-500 tracking-[0.2em]">SWITCH MOOD</p>
                    <p className="text-[10px] font-black text-white tracking-widest uppercase mt-1">MODO EXPERIENCE</p>
                  </div>
                </div>
              </button>
            </div>

            <nav className="flex-1 space-y-8 flex flex-col justify-center text-left">
              <button onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }} className="flex items-center gap-6 text-white text-[13px] font-black tracking-[0.2em]"><LayoutDashboard size={20} className="text-purple-500"/> DASHBOARD</button>
              <button onClick={() => { navigate('/academy'); setIsMobileMenuOpen(false); }} className="flex items-center gap-6 text-gray-400 hover:text-white text-[13px] font-black tracking-[0.2em] transition-all"><GraduationCap size={20}/> ACADEMY</button>
              <button onClick={() => { navigate(`/profile/${auth.currentUser?.uid}`); setIsMobileMenuOpen(false); }} className="flex items-center gap-6 text-gray-400 hover:text-white text-[13px] font-black tracking-[0.2em] transition-all"><Eye size={20}/> MI PERFIL PÚBLICO</button>
            </nav>

            <button onClick={() => { auth.signOut(); setIsMobileMenuOpen(false); }} className="flex items-center gap-6 text-gray-500 hover:text-red-500 text-[11px] font-black tracking-[0.2em] transition-all pt-6 border-t border-white/5 mt-auto"><LogOut size={18}/> CERRAR SESIÓN</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-72 p-6 md:p-16 mt-20 md:mt-0 space-y-8 relative z-10 w-full max-w-[1600px] mx-auto">
        <header className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] backdrop-blur-md">
          <div className="flex items-center gap-4 md:gap-6 text-left leading-none">
            <div className="relative group w-14 h-14 md:w-16 md:h-16 flex-shrink-0 leading-none">
               <div className="w-full h-full rounded-full border-2 border-purple-500/20 overflow-hidden bg-white/5 shadow-2xl leading-none">
                 {profile.photo1 ? <img src={profile.photo1} className="w-full h-full object-cover" alt="" /> : <User size={24} className="m-auto mt-4 text-gray-700"/>}
                 {uploadingStatus.photo1 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-pulse text-[8px]">...</div>}
               </div>
               <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-all leading-none">
                  <Camera size={18} className="text-white"/>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'photo1')} className="hidden" />
               </label>
            </div>
            <div className="text-left leading-none flex flex-col gap-2">
              <div className="flex items-center gap-3 leading-none">
                <h2 className="text-[16px] md:text-[20px] font-['Poppins'] font-normal tracking-[0.05em] uppercase text-white/90 truncate max-w-[150px] md:max-w-none leading-none">{profile.name || 'NUEVO TALENTO'}</h2>
                
                <div className={`px-3 py-1 rounded-full border ${isProfileVisible ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <p className={`text-[7px] font-black tracking-widest ${isProfileVisible ? 'text-green-500' : 'text-red-500'}`}>
                    {isProfileVisible ? 'VISIBLE' : 'OCULTO'}
                  </p>
                </div>
                <button onClick={() => setIsEditingProfile(true)} className="text-gray-400 hover:text-purple-400 transition-colors p-2 leading-none"><Edit3 size={18} /></button>
              </div>
              <p className="text-[8px] md:text-[10px] text-purple-400 font-bold tracking-[0.3em] uppercase leading-none">{profile.job || 'SIN CATEGORÍA'}</p>
            </div>
          </div>
          <div className="flex items-center gap-8 leading-none">
             <div className="text-right hidden sm:block leading-none">
                <p className="text-[14px] font-black text-white tracking-tighter italic leading-none">{calculateTotalScore(profile)} PTS</p>
                <p className="text-[7px] text-purple-400 font-black uppercase tracking-widest mt-1 leading-none">Reputación</p>
             </div>
             <Bell size={20} className="text-gray-400 cursor-pointer hover:text-white transition-colors" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left">
          <div className="space-y-12">
            <section className="bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 space-y-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Award size={100} /></div>
               <h3 className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase leading-none">Estatus de Carrera</h3>
               <div className="space-y-6 leading-none">
                  <div className="flex items-center gap-4 leading-none">
                    <div className={`p-4 rounded-2xl ${isGenericoDone ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-500'} leading-none`}>
                       {isGenericoDone ? <CheckCircle2 size={24}/> : <Zap size={24} fill="currentColor" className="animate-pulse"/>}
                    </div>
                    <div className="leading-none">
                       <p className="text-[11px] font-black uppercase tracking-widest italic leading-none">Nivelación Ingreso</p>
                       <p className="text-[8px] text-gray-400 uppercase font-bold mt-2 leading-none">{isGenericoDone ? 'VERIFICADO' : 'PENDIENTE'}</p>
                    </div>
                    {!isGenericoDone && (
                      <button onClick={() => navigate('/academy-test/Generico')} className="ml-auto bg-amber-500/20 border border-amber-500/40 text-amber-500 p-3 rounded-full hover:bg-amber-500 hover:text-black transition-all cursor-pointer relative z-30"><ArrowRight size={18}/></button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 leading-none">
                    <div className={`p-4 rounded-2xl ${isProfessionalTestDone ? 'bg-purple-500/15 text-purple-400' : 'bg-white/5 text-gray-400 border border-white/5'} leading-none`}><Award size={24}/></div>
                    <div className="leading-none">
                       <p className="text-[11px] font-black uppercase tracking-widest italic leading-none">Especialista {profile.job || ''}</p>
                       <p className="text-[8px] text-gray-400 uppercase font-bold mt-2 leading-none">{isProfessionalTestDone ? 'CERTIFICADO ELITE' : profile.job ? `INVITACIÓN AL TEST DE ${profile.job.toUpperCase()}` : 'ASIGNA RUBRO'}</p>
                    </div>
                    {(!isProfessionalTestDone && profile.job) && (
                       <button onClick={() => navigate(`/academy-test/${encodeURIComponent(profile.job)}`)} className="ml-auto bg-purple-600/20 border border-purple-500/40 text-purple-400 p-3 rounded-full hover:bg-purple-600 hover:text-white transition-all shadow-lg cursor-pointer relative z-30"><Zap size={18} fill="currentColor"/></button>
                    )}
                  </div>
               </div>
            </section>
            <section className="space-y-6 leading-none">
               <h3 className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase border-b border-white/5 pb-2 flex items-center gap-2 leading-none"><MessageSquare size={12}/> Mensajes</h3>
               <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2 leading-none">
                  {messages.length === 0 ? <p className="text-center py-10 text-[8px] text-gray-500 italic uppercase font-black tracking-widest leading-none">Sin conversaciones</p> : messages.map(chat => (
                    <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex justify-between items-center p-5 bg-white/[0.02] border border-white/5 hover:border-purple-500/30 rounded-[1.5rem] group transition-all cursor-pointer leading-none">
                       <div className="flex items-center gap-5 text-left leading-none">
                          {chat.clientPhoto ? <img src={chat.clientPhoto} className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all border border-white/5" alt="" /> : <div className="w-12 h-12 rounded-full bg-white/5 text-gray-400 flex items-center justify-center leading-none"><User size={18}/></div>}
                          <div className="leading-none">
                             <p className="text-[11px] font-black text-white uppercase tracking-tight leading-none">{chat.clientName || "USUARIO"}</p>
                             <p className="text-[8px] text-purple-400 font-black uppercase italic mt-1 leading-none">Nuevo mensaje</p>
                          </div>
                       </div>
                       <ArrowRight size={16} className="text-gray-600 group-hover:text-purple-500 transition-all leading-none" />
                    </div>
                  ))}
               </div>
            </section>
          </div>
          <div className="space-y-12">
            <div className="aspect-video bg-black rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-white/5 relative flex items-center justify-center group shadow-2xl leading-none">
               {profile.videoLink ? <video src={profile.videoLink} controls className="w-full h-full object-cover" /> : (
                 <div className="text-center opacity-40 group-hover:opacity-80 transition-opacity leading-none"><PlayCircle size={60} strokeWidth={1} className="text-white mx-auto leading-none"/><p className="text-[8px] font-black uppercase tracking-[0.5em] mt-4 italic leading-none">Cargar Showreel</p></div>
               )}
               <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10 leading-none" />
            </div>
            <section className="space-y-8 pb-32 leading-none">
              <h3 className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase border-b border-white/5 pb-2 text-left leading-none">Portfolio</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 leading-none">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                  <div key={num} className="relative aspect-square bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-3xl overflow-hidden group transition-all hover:border-purple-500/50 shadow-xl leading-none">
                    {profile[`photo${num}`] ? (
                      <>
                        <img src={profile[`photo${num}`]} className="w-full h-full object-cover" alt="" />
                        <button onClick={async () => {
                          const updates = { [`photo${num}`]: '' };
                          setProfile(prev => ({ ...prev, ...updates }));
                          await persistProfile(updates);
                        }} className="absolute top-2 right-2 p-2 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 text-red-500 transition-all leading-none"><X size={10} /></button>
                      </>
                    ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-500/5 transition-all leading-none">
                        <Upload size={20} className="text-gray-500 mb-2 leading-none"/><span className="text-[6px] font-black text-gray-500 uppercase tracking-widest italic">ESPACIO {num}</span>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, `photo${num}`)} className="hidden leading-none" />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* MODAL EDIT PROFILE - MODAL NATIVO ULTRA SEGURO CONTRA PANTALLA NEGRA */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#121214] border border-white/15 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-12 max-w-lg w-full space-y-8 shadow-2xl text-center relative my-auto uppercase">
            <button onClick={() => setIsEditingProfile(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><X size={22} /></button>
            <h3 className="text-[14px] font-['Poppins'] tracking-[0.3em] uppercase text-white border-b border-white/10 pb-4 text-left font-bold">Editar Identidad</h3>
            
            <div className="space-y-6 text-left max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <label className="text-[8px] text-gray-400 font-black uppercase tracking-[0.3em] pl-1">Nombre Profesional</label>
                <input className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-[11px] font-bold uppercase outline-none focus:border-purple-500 text-white" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
              </div>
              
              <div className="space-y-3">
                <label className="text-[8px] text-gray-400 font-black tracking-[0.3em] pl-1">Especialidad</label>
                <select className="w-full bg-[#1a1a1c] border border-white/10 p-4 rounded-2xl text-[11px] font-bold uppercase text-white outline-none focus:border-purple-500 mb-3" 
                        value={profile.job || ""} 
                        onChange={e => setProfile({...profile, job: e.target.value, specialty: ""})}>
                  <option value="">SELECCIONAR RUBRO</option>
                  {Object.keys(RUBROS).map(rubro => <option key={rubro} value={rubro}>{rubro}</option>)}
                </select>

                {profile.job && (
                  <select className="w-full bg-[#1a1a1c] border border-white/10 p-4 rounded-2xl text-[11px] font-bold uppercase text-white outline-none focus:border-purple-500" 
                          value={profile.specialty || ""} 
                          onChange={e => setProfile({...profile, specialty: e.target.value})}>
                    <option value="">SELECCIONAR ESPECIALIDAD</option>
                    {RUBROS[profile.job].map(spec => <option key={spec} value={spec}>{spec.toUpperCase()}</option>)}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[8px] text-gray-400 font-black tracking-[0.3em] pl-1">Ubicación</label>
                <select className="w-full bg-[#1a1a1c] border border-white/10 p-4 rounded-2xl text-[11px] font-bold uppercase text-white outline-none focus:border-purple-500" 
                        value={profile.location || ""} 
                        onChange={e => setProfile({...profile, location: e.target.value})}>
                  <option value="">SELECCIONAR PROVINCIA</option>
                  {PROVINCIAS.map(prov => <option key={prov} value={prov}>{prov.toUpperCase()}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] text-gray-400 font-black tracking-[0.3em] pl-1">Biografía</label>
                <textarea className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-[11px] h-28 resize-none font-bold outline-none focus:border-purple-500 text-white font-['Open_Sans']" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button onClick={() => setIsEditingProfile(false)} className="py-4 bg-white/5 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">DESCARTAR</button>
              <button onClick={handleSaveProfileData} className="py-4 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-900/40 hover:bg-purple-500 transition-all">GUARDAR</button>
            </div>
          </div>
        </div>
      )}

      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
}