import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; 
import { doc, setDoc, collection, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, GraduationCap, PlayCircle, 
  Upload, X, Eye, Menu, Zap, CheckCircle2, 
  LayoutDashboard, LogOut, RefreshCcw, User, MessageSquare, Edit3, Camera, Award, MapPin, Briefcase
} from 'lucide-react'; 
import CustomModal from './components/CustomModal'; 

export default function Dashboard() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  
  const [profile, setProfile] = useState({
    name: '', job: '', specialty: '', location: '', bio: '', instagram: '', videoLink: '', 
    coverPhoto: '', 
    photo1: '', photo2: '', photo3: '', photo4: '', photo5: '', 
    photo6: '', photo7: '', photo8: '', photo9: '', photo10: '',
    academyPoints: 0, verified: false, score: 0,
    completedCourses: [] 
  });

  const [uploadingStatus, setUploadingStatus] = useState({
    video: false, profile: false, cover: false,
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

  if (loading) return <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-black font-['Poppins']">CARGANDO PERFIL...</div>;

  return (
    <div className="min-h-screen bg-[#070709] text-white font-['Open_Sans'] flex overflow-x-hidden uppercase antialiased relative selection:bg-purple-500 selection:text-white">
      
      {/* TOPBAR MOBILE */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-[#0c0c0fe6] backdrop-blur-xl border-b border-white/10 z-[90] px-6 py-4 flex justify-between items-center">
        <div onClick={() => navigate('/home')} className="text-[16px] font-['Poppins'] font-normal tracking-[0.05em] uppercase cursor-pointer">CLASSCODE</div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-2 focus:outline-none"><Menu size={22} /></button>
      </header>

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex w-72 bg-[#0a0a0d] border-r border-white/10 flex-col p-8 fixed h-full z-50">
        <header className="mb-10 text-left">
          <div onClick={() => navigate('/home')} className="text-[20px] font-['Poppins'] font-normal tracking-[0.05em] cursor-pointer uppercase text-white">CLASSCODE</div>
          <p className="text-purple-400 text-[9px] font-bold tracking-[0.3em] mt-1 uppercase">Talent Profile</p>
        </header>
        
        <div className="mb-8 text-left">
          <button onClick={handleSwitchToClient} className="w-full flex items-center justify-between bg-white/[0.04] border border-white/10 p-3.5 rounded-xl group hover:bg-white/[0.08] transition-all">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" /></div>
              <div>
                <p className="text-[6px] font-black text-gray-400 tracking-[0.2em]">MODO</p>
                <p className="text-[9px] font-black text-white tracking-widest uppercase mt-0.5">EXPERIENCE</p>
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 space-y-6 text-left">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-4 text-white text-[10px] font-black tracking-widest w-full"><LayoutDashboard size={16} className="text-purple-400"/> DASHBOARD</button>
          <button onClick={() => navigate('/academy')} className="flex items-center gap-4 text-gray-400 hover:text-white text-[10px] font-black tracking-widest transition-all w-full"><GraduationCap size={16}/> ACADEMY</button>
          <button onClick={() => navigate(`/profile/${auth.currentUser?.uid}`)} className="flex items-center gap-4 text-gray-400 hover:text-white text-[10px] font-black tracking-widest transition-all w-full"><Eye size={16}/> PERFIL PÚBLICO</button>
        </nav>
        <button onClick={() => auth.signOut()} className="flex items-center gap-4 text-gray-500 hover:text-red-400 text-[10px] font-black tracking-widest transition-all pt-6 border-t border-white/10 w-full"><LogOut size={16}/> CERRAR SESIÓN</button>
      </aside>

      {/* MENU MOBILE SIDEBAR OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#070709] z-[300] flex flex-col p-6 text-left md:hidden overflow-y-auto">
          <div className="flex justify-between items-center mb-10">
            <div>
              <div onClick={() => { navigate('/home'); setIsMobileMenuOpen(false); }} className="text-[18px] font-['Poppins'] font-normal tracking-[0.05em] uppercase text-white cursor-pointer">CLASSCODE</div>
              <p className="text-purple-400 text-[9px] font-bold tracking-[0.3em] mt-1 uppercase">Talent Profile</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-white p-2.5 bg-white/10 rounded-full"><X size={20} /></button>
          </div>

          <nav className="flex-1 space-y-6 flex flex-col justify-center text-left">
            <button onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }} className="flex items-center gap-5 text-white text-[12px] font-black tracking-[0.2em]"><LayoutDashboard size={18} className="text-purple-400"/> DASHBOARD</button>
            <button onClick={() => { navigate('/academy'); setIsMobileMenuOpen(false); }} className="flex items-center gap-5 text-gray-400 hover:text-white text-[12px] font-black tracking-[0.2em]"><GraduationCap size={18}/> ACADEMY</button>
            <button onClick={() => { navigate(`/profile/${auth.currentUser?.uid}`); setIsMobileMenuOpen(false); }} className="flex items-center gap-5 text-gray-400 hover:text-white text-[12px] font-black tracking-[0.2em]"><Eye size={18}/> PERFIL PÚBLICO</button>
          </nav>

          <button onClick={() => { auth.signOut(); setIsMobileMenuOpen(false); }} className="flex items-center gap-5 text-gray-500 hover:text-red-400 text-[10px] font-black tracking-[0.2em] pt-6 border-t border-white/10 mt-auto"><LogOut size={16}/> CERRAR SESIÓN</button>
        </div>
      )}

      {/* MAIN CONTENT - ESTILO PERFIL TIPO RED SOCIAL (FACEBOOK STYLE CON SHOWREEL DE PORTADA) */}
      <main className="flex-1 md:ml-72 pb-24 mt-14 md:mt-0 w-full max-w-[1400px] mx-auto">
        
        {/* SECCIÓN DE PORTADA (SHOWREEL) Y CABECERA DE PERFIL */}
        <div className="relative bg-[#121217] border-b border-white/10 shadow-2xl">
          
          {/* PORTADA QUE ES EL SHOWREEL */}
          <div className="h-56 md:h-96 w-full bg-black relative overflow-hidden group">
            {profile.videoLink ? (
              <video src={profile.videoLink} controls className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-950/40 via-black to-indigo-950/40 flex flex-col items-center justify-center p-4">
                <PlayCircle size={48} strokeWidth={1} className="text-white/40 mb-2"/>
                <span className="text-[8px] font-black tracking-[0.4em] text-gray-400">SUBE TU SHOWREEL PARA DESTACARLO COMO PORTADA</span>
              </div>
            )}
            <label className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white px-4 py-2.5 rounded-xl text-[8px] font-black tracking-widest cursor-pointer border border-white/10 transition-all flex items-center gap-2 shadow-xl z-20">
              <Upload size={14} /> {profile.videoLink ? 'CAMBIAR SHOWREEL' : 'SUBIR SHOWREEL'}
              <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
            </label>
          </div>

          {/* CONTENEDOR DE LA INFO PRINCIPAL DEBAJO DE LA PORTADA */}
          <div className="max-w-[1200px] mx-auto px-6 md:px-12 pb-6 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 -mt-16 md:-mt-20">
              
              {/* FOTO DE PERFIL SUPUESTA */}
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left z-20">
                <div className="relative group w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#121217] overflow-hidden bg-black shadow-2xl flex-shrink-0">
                  {profile.photo1 ? <img src={profile.photo1} className="w-full h-full object-cover" alt="" /> : <User size={50} className="m-auto mt-10 text-gray-600"/>}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                    <Camera size={24} className="text-white"/>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'photo1')} className="hidden" />
                  </label>
                </div>

                <div className="space-y-1.5 pt-2 md:pt-0">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <h1 className="text-[20px] md:text-[26px] font-['Poppins'] font-normal tracking-[0.05em] text-white">{profile.name || 'NUEVO TALENTO'}</h1>
                    <div className={`px-2.5 py-0.5 rounded-full border text-[7px] font-black tracking-widest ${isProfileVisible ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                      {isProfileVisible ? 'PUBLICADO' : 'OCULTO'}
                    </div>
                  </div>
                  <p className="text-[10px] md:text-[12px] text-purple-400 font-bold tracking-[0.3em] uppercase">{profile.job || 'ASIGNAR RUBRO'}</p>
                  <div className="flex items-center justify-center md:justify-start gap-4 text-[8px] text-gray-400 font-bold tracking-wider pt-1">
                    {profile.location && <span className="flex items-center gap-1"><MapPin size={12} className="text-purple-400"/> {profile.location}</span>}
                    <span className="flex items-center gap-1"><Briefcase size={12} className="text-purple-400"/> {calculateTotalScore(profile)} PTS ÉLITE</span>
                  </div>
                </div>
              </div>

              {/* BOTÓN EDITAR PERFIL */}
              <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 bg-white text-black hover:bg-purple-200 px-6 py-3 rounded-xl font-black text-[9px] tracking-widest transition-all shadow-xl z-20">
                <Edit3 size={14}/> EDITAR PERFIL
              </button>

            </div>
          </div>
        </div>

        {/* CUERPO DEL PERFIL (ESTILO MURO / GRID DE RED SOCIAL) */}
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA: ACADEMY & INFO PERSONAL */}
          <div className="space-y-6">
            
            {/* BIO / PRESENTACIÓN */}
            <div className="bg-[#121217] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase border-b border-white/10 pb-3">Sobre Mí</h3>
              <p className="text-[10px] text-gray-300 leading-relaxed font-['Open_Sans']">
                {profile.bio || "Agregá una biografía a tu perfil desde el botón 'Editar perfil' para que los clientes conozcan tu experiencia y trayectoria."}
              </p>
            </div>

            {/* ESTATUS ACADÉMICO */}
            <div className="bg-[#121217] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
               <h3 className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase border-b border-white/10 pb-3">Estatus Académico</h3>
               <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className={`p-2.5 rounded-lg ${isGenericoDone ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                       {isGenericoDone ? <CheckCircle2 size={16}/> : <Zap size={16} fill="currentColor"/>}
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-wider">Nivelación Ingreso</p>
                       <p className="text-[7px] text-gray-400 font-bold mt-0.5">{isGenericoDone ? 'VERIFICADO' : 'PENDIENTE'}</p>
                    </div>
                    {!isGenericoDone && (
                      <button onClick={() => navigate('/academy-test/Generico')} className="ml-auto bg-amber-500/20 border border-amber-500/40 text-amber-400 p-2 rounded-lg hover:bg-amber-500 hover:text-black transition-all"><ArrowRight size={14}/></button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className={`p-2.5 rounded-lg ${isProfessionalTestDone ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-gray-500 border border-white/5'}`}><Award size={16}/></div>
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-wider">Especialista</p>
                       <p className="text-[7px] text-gray-400 font-bold mt-0.5">{isProfessionalTestDone ? 'CERTIFICADO ÉLITE' : profile.job ? 'DISPONIBLE' : 'SIN RUBRO'}</p>
                    </div>
                    {(!isProfessionalTestDone && profile.job) && (
                       <button onClick={() => navigate(`/academy-test/${encodeURIComponent(profile.job)}`)} className="ml-auto bg-purple-600/30 border border-purple-500/40 text-purple-300 p-2 rounded-lg hover:bg-purple-600 hover:text-white transition-all"><Zap size={14} fill="currentColor"/></button>
                    )}
                  </div>
               </div>
               <button onClick={() => navigate('/academy')} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[8px] font-black tracking-[0.2em] transition-all flex items-center justify-center gap-2 mt-2">
                 <GraduationCap size={14}/> ACADEMY
               </button>
            </div>

            {/* MENSAJES DIRECTOS */}
            <div className="bg-[#121217] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
               <div className="flex justify-between items-center border-b border-white/10 pb-3">
                 <h3 className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase flex items-center gap-2"><MessageSquare size={12}/> Mensajes</h3>
                 <span className="text-[8px] text-purple-400 font-black tracking-widest">{messages.length}</span>
               </div>
               <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar pr-1">
                  {messages.length === 0 ? (
                    <div className="text-center py-6 text-[8px] text-gray-600 uppercase font-black tracking-widest">Sin chats activos</div>
                  ) : messages.map(chat => (
                    <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/5 hover:border-purple-500/40 rounded-xl group transition-all cursor-pointer">
                       <div className="flex items-center gap-3">
                          {chat.clientPhoto ? <img src={chat.clientPhoto} className="w-8 h-8 rounded-lg object-cover border border-white/10" alt="" /> : <div className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 flex items-center justify-center"><User size={14}/></div>}
                          <div>
                             <p className="text-[9px] font-black text-white uppercase tracking-wider">{chat.clientName || "CLIENTE"}</p>
                             <p className="text-[7px] text-purple-400 font-bold uppercase mt-0.5">Mensaje</p>
                          </div>
                       </div>
                       <ArrowRight size={12} className="text-gray-600 group-hover:text-purple-400 transition-all" />
                    </div>
                  ))}
               </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: PORTFOLIO DE FOTOS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* PORTFOLIO GRID DE FOTOS */}
            <div className="bg-[#121217] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase">Galería de Fotos ({Array.from({ length: 10 }, (_, i) => profile[`photo${i + 1}`]).filter(Boolean).length}/10)</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                  <div key={num} className="relative aspect-square bg-black/60 border border-white/10 rounded-xl overflow-hidden group transition-all hover:border-purple-500/50 shadow-lg">
                    {profile[`photo${num}`] ? (
                      <>
                        <img src={profile[`photo${num}`]} className="w-full h-full object-cover" alt="" />
                        <button onClick={async () => {
                          const updates = { [`photo${num}`]: '' };
                          setProfile(prev => ({ ...prev, ...updates }));
                          await persistProfile(updates);
                        }} className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 text-red-400 transition-all"><X size={10} /></button>
                      </>
                    ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-500/5 transition-all">
                        <Upload size={16} className="text-gray-500 mb-1"/><span className="text-[6px] font-black text-gray-500 tracking-wider">SLOT {num}</span>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, `photo${num}`)} className="hidden" />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* MODAL EDIT PROFILE - SEGURO, AISLADO Y SIN PANTALLAS NEGRAS */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#141419] border border-white/15 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl relative my-auto uppercase">
            <button onClick={() => setIsEditingProfile(false)} className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
            <h3 className="text-[12px] font-['Poppins'] tracking-[0.3em] uppercase text-white border-b border-white/10 pb-3 font-bold text-left">Editar Perfil Profesional</h3>
            
            <div className="space-y-4 text-left max-h-[55vh] overflow-y-auto pr-1 no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[7px] text-gray-400 font-black tracking-[0.3em] pl-1">Nombre Completo / Artístico</label>
                <input className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-purple-500 text-white" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <label className="text-[7px] text-gray-400 font-black tracking-[0.3em] pl-1">Rubro Principal</label>
                <select className="w-full bg-[#18181d] border border-white/10 p-3.5 rounded-xl text-[10px] font-bold uppercase text-white outline-none focus:border-purple-500 mb-2" 
                        value={profile.job || ""} 
                        onChange={e => setProfile({...profile, job: e.target.value, specialty: ""})}>
                  <option value="">SELECCIONAR RUBRO</option>
                  {Object.keys(RUBROS).map(rubro => <option key={rubro} value={rubro}>{rubro}</option>)}
                </select>

                {profile.job && (
                  <select className="w-full bg-[#18181d] border border-white/10 p-3.5 rounded-xl text-[10px] font-bold uppercase text-white outline-none focus:border-purple-500" 
                          value={profile.specialty || ""} 
                          onChange={e => setProfile({...profile, specialty: e.target.value})}>
                    <option value="">SELECCIONAR ESPECIALIDAD</option>
                    {RUBROS[profile.job].map(spec => <option key={spec} value={spec}>{spec.toUpperCase()}</option>)}
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] text-gray-400 font-black tracking-[0.3em] pl-1">Provincia / Ubicación</label>
                <select className="w-full bg-[#18181d] border border-white/10 p-3.5 rounded-xl text-[10px] font-bold uppercase text-white outline-none focus:border-purple-500" 
                        value={profile.location || ""} 
                        onChange={e => setProfile({...profile, location: e.target.value})}>
                  <option value="">SELECCIONAR PROVINCIA</option>
                  {PROVINCIAS.map(prov => <option key={prov} value={prov}>{prov.toUpperCase()}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] text-gray-400 font-black tracking-[0.3em] pl-1">Biografía / Presentación</label>
                <textarea className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-[10px] h-24 resize-none font-bold outline-none focus:border-purple-500 text-white font-['Open_Sans']" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setIsEditingProfile(false)} className="py-3 bg-white/5 text-gray-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all">DESCARTAR</button>
              <button onClick={handleSaveProfileData} className="py-3 bg-purple-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-purple-900/40 hover:bg-purple-500 transition-all">GUARDAR</button>
            </div>
          </div>
        </div>
      )}

      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
}