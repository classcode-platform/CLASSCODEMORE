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

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-black font-['Poppins']">CARGANDO ESTUDIO...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Open_Sans'] flex overflow-x-hidden uppercase antialiased relative selection:bg-white selection:text-black">
      {/* BACKGROUND AMBIENT GLOWS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-950/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-950/15 rounded-full blur-[140px]" />
      </div>

      {/* TOPBAR MOBILE */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-[#0a0a0ae6] backdrop-blur-2xl border-b border-white/10 z-[90] px-6 py-4 flex justify-between items-center">
        <div onClick={() => navigate('/home')} className="text-[18px] font-['Poppins'] font-normal tracking-[0.05em] uppercase cursor-pointer">CLASSCODE</div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-2 focus:outline-none"><Menu size={24} /></button>
      </header>

      {/* SIDEBAR DESKTOP - ESTILO HOME */}
      <aside className="hidden md:flex w-72 bg-[#080808]/80 backdrop-blur-3xl border-r border-white/10 flex-col p-8 fixed h-full z-50">
        <header className="mb-10 text-left">
          <div onClick={() => navigate('/home')} className="text-[20px] font-['Poppins'] font-normal tracking-[0.05em] cursor-pointer uppercase text-white">CLASSCODE</div>
          <p className="text-purple-400 text-[9px] font-bold tracking-[0.3em] mt-1 uppercase">Talent Studio</p>
        </header>
        
        <div className="mb-8 text-left">
          <button onClick={handleSwitchToClient} className="w-full flex items-center justify-between bg-white/[0.04] border border-white/10 p-3.5 rounded-2xl group hover:bg-white/[0.08] transition-all">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400"><RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" /></div>
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
        <div className="fixed inset-0 bg-[#050505] z-[300] flex flex-col p-6 text-left md:hidden overflow-y-auto">
          <div className="flex justify-between items-center mb-10">
            <div>
              <div onClick={() => { navigate('/home'); setIsMobileMenuOpen(false); }} className="text-[18px] font-['Poppins'] font-normal tracking-[0.05em] uppercase text-white cursor-pointer">CLASSCODE</div>
              <p className="text-purple-400 text-[9px] font-bold tracking-[0.3em] mt-1 uppercase">Talent Studio</p>
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

      {/* MAIN CONTENT - ESTILO VISUAL EDITORIAL MÁS RICO */}
      <main className="flex-1 md:ml-72 p-6 md:p-12 mt-16 md:mt-0 space-y-10 relative z-10 w-full max-w-[1500px] mx-auto">
        
        {/* HERO CARD DE IDENTIDAD (DISEÑO TIPO PORTADA) */}
        <section className="relative bg-[#101012] border border-white/10 rounded-[2.5rem] p-6 md:p-10 overflow-hidden shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
            <div className="relative group w-20 h-20 md:w-24 md:h-24 flex-shrink-0">
               <div className="w-full h-full rounded-2xl border-2 border-white/10 overflow-hidden bg-black shadow-inner">
                 {profile.photo1 ? <img src={profile.photo1} className="w-full h-full object-cover" alt="" /> : <User size={32} className="m-auto mt-6 text-gray-600"/>}
                 {uploadingStatus.photo1 && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[8px] tracking-widest text-purple-400">SUBIENDO</div>}
               </div>
               <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl cursor-pointer transition-all">
                  <Camera size={20} className="text-white"/>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'photo1')} className="hidden" />
               </label>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[18px] md:text-[24px] font-['Poppins'] font-normal tracking-[0.05em] text-white">{profile.name || 'NUEVO TALENTO'}</h1>
                <div className={`px-2.5 py-0.5 rounded-full border text-[7px] font-black tracking-widest ${isProfileVisible ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {isProfileVisible ? 'PUBLICADO' : 'OCULTO'}
                </div>
              </div>
              <p className="text-[9px] md:text-[11px] text-purple-400 font-bold tracking-[0.3em] uppercase">{profile.job || 'ASIGNAR RUBRO'}</p>
              <p className="text-[8px] text-gray-400 tracking-wider">{profile.location || 'UBICACIÓN NO ESPECIFICADA'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-white/10 relative z-10">
             <div className="text-left md:text-right pr-4">
                <p className="text-[16px] font-black text-white tracking-tighter">{calculateTotalScore(profile)} PTS</p>
                <p className="text-[7px] text-purple-400 font-black tracking-widest mt-0.5">REPUTACIÓN ÉLITE</p>
             </div>
             <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 bg-white text-black hover:bg-purple-200 px-5 py-3 rounded-xl font-black text-[9px] tracking-widest transition-all shadow-lg">
               <Edit3 size={14}/> EDITAR PERFIL
             </button>
          </div>
        </section>

        {/* GRID PRINCIPAL: ACADEMY & MENSAJES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ESTATUS DE CARRERA */}
          <div className="bg-[#101012] border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
             <div className="absolute top-0 right-0 p-6 opacity-5"><Award size={120} /></div>
             <div>
               <h3 className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase mb-6">Estatus Académico</h3>
               <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className={`p-3 rounded-xl ${isGenericoDone ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                       {isGenericoDone ? <CheckCircle2 size={20}/> : <Zap size={20} fill="currentColor"/>}
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-wider">Nivelación Ingreso</p>
                       <p className="text-[7px] text-gray-400 font-bold mt-1">{isGenericoDone ? 'VERIFICADO' : 'PENDIENTE DE TEST'}</p>
                    </div>
                    {!isGenericoDone && (
                      <button onClick={() => navigate('/academy-test/Generico')} className="ml-auto bg-amber-500/20 border border-amber-500/40 text-amber-400 p-2.5 rounded-xl hover:bg-amber-500 hover:text-black transition-all"><ArrowRight size={16}/></button>
                    )}
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className={`p-3 rounded-xl ${isProfessionalTestDone ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-gray-500 border border-white/5'}`}><Award size={20}/></div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-wider">Especialista</p>
                       <p className="text-[7px] text-gray-400 font-bold mt-1">{isProfessionalTestDone ? 'CERTIFICADO ÉLITE' : profile.job ? 'TEST DISPONIBLE' : 'SELECCIONAR RUBRO'}</p>
                    </div>
                    {(!isProfessionalTestDone && profile.job) && (
                       <button onClick={() => navigate(`/academy-test/${encodeURIComponent(profile.job)}`)} className="ml-auto bg-purple-600/30 border border-purple-500/40 text-purple-300 p-2.5 rounded-xl hover:bg-purple-600 hover:text-white transition-all"><Zap size={16} fill="currentColor"/></button>
                    )}
                  </div>
               </div>
            </div>
            <button onClick={() => navigate('/academy')} className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black tracking-[0.2em] transition-all flex items-center justify-center gap-2">
              <GraduationCap size={16}/> IR A CLASSCODE ACADEMY
            </button>
          </div>

          {/* MENSAJES */}
          <div className="lg:col-span-2 bg-[#101012] border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-xl flex flex-col">
             <div className="flex justify-between items-center border-b border-white/10 pb-4">
               <h3 className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase flex items-center gap-2"><MessageSquare size={14}/> Bandeja de Mensajes</h3>
               <span className="text-[8px] text-purple-400 font-black tracking-widest">{messages.length} CHATS</span>
             </div>
             <div className="space-y-3 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-[8px] text-gray-600 uppercase font-black tracking-widest">Sin conversaciones activas en este momento</div>
                ) : messages.map(chat => (
                  <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 hover:border-purple-500/40 rounded-2xl group transition-all cursor-pointer">
                     <div className="flex items-center gap-4">
                        {chat.clientPhoto ? <img src={chat.clientPhoto} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="" /> : <div className="w-10 h-10 rounded-xl bg-white/5 text-gray-400 flex items-center justify-center"><User size={16}/></div>}
                        <div>
                           <p className="text-[10px] font-black text-white uppercase tracking-wider">{chat.clientName || "CLIENTE"}</p>
                           <p className="text-[7px] text-purple-400 font-bold uppercase mt-0.5">Mensaje directo</p>
                        </div>
                     </div>
                     <ArrowRight size={14} className="text-gray-600 group-hover:text-purple-400 transition-all" />
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* SHOWREEL & PORTFOLIO VISUAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          
          {/* SHOWREEL */}
          <div className="bg-[#101012] border border-white/10 rounded-[2.5rem] p-6 space-y-4 shadow-xl flex flex-col justify-between">
            <h3 className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase">Showreel Principal</h3>
            <div className="aspect-[9/16] max-h-[400px] w-full bg-black rounded-2xl overflow-hidden border border-white/10 relative flex items-center justify-center group mx-auto">
               {profile.videoLink ? <video src={profile.videoLink} controls className="w-full h-full object-cover" /> : (
                 <div className="text-center opacity-40 group-hover:opacity-80 transition-opacity"><PlayCircle size={48} strokeWidth={1} className="text-white mx-auto"/><p className="text-[7px] font-black uppercase tracking-[0.4em] mt-3">CARGAR VIDEO REEL</p></div>
               )}
               <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            </div>
          </div>

          {/* PORTFOLIO GRID ESTILO EDITORIAL */}
          <div className="lg:col-span-2 bg-[#101012] border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase">Galería Portfolio (Hasta 10 Slots)</h3>
              <span className="text-[8px] text-purple-400 font-black tracking-widest">{Array.from({ length: 10 }, (_, i) => profile[`photo${i + 1}`]).filter(Boolean).length} / 10 CARGADAS</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                <div key={num} className="relative aspect-square bg-black/60 border border-white/10 rounded-2xl overflow-hidden group transition-all hover:border-purple-500/50 shadow-lg">
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
      </main>

      {/* MODAL EDIT PROFILE - NATIVO SEGURO SIN PANTALLA NEGRA */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#121215] border border-white/15 rounded-[2.5rem] p-6 md:p-10 max-w-lg w-full space-y-6 shadow-2xl relative my-auto uppercase">
            <button onClick={() => setIsEditingProfile(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
            <h3 className="text-[12px] font-['Poppins'] tracking-[0.3em] uppercase text-white border-b border-white/10 pb-4 font-bold text-left">Editar Identidad Profesional</h3>
            
            <div className="space-y-4 text-left max-h-[55vh] overflow-y-auto pr-2 no-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[7px] text-gray-400 font-black tracking-[0.3em] pl-1">Nombre Completo / Artístico</label>
                <input className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-[10px] font-bold uppercase outline-none focus:border-purple-500 text-white" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <label className="text-[7px] text-gray-400 font-black tracking-[0.3em] pl-1">Rubro Principal</label>
                <select className="w-full bg-[#18181b] border border-white/10 p-3.5 rounded-xl text-[10px] font-bold uppercase text-white outline-none focus:border-purple-500 mb-2" 
                        value={profile.job || ""} 
                        onChange={e => setProfile({...profile, job: e.target.value, specialty: ""})}>
                  <option value="">SELECCIONAR RUBRO</option>
                  {Object.keys(RUBROS).map(rubro => <option key={rubro} value={rubro}>{rubro}</option>)}
                </select>

                {profile.job && (
                  <select className="w-full bg-[#18181b] border border-white/10 p-3.5 rounded-xl text-[10px] font-bold uppercase text-white outline-none focus:border-purple-500" 
                          value={profile.specialty || ""} 
                          onChange={e => setProfile({...profile, specialty: e.target.value})}>
                    <option value="">SELECCIONAR ESPECIALIDAD</option>
                    {RUBROS[profile.job].map(spec => <option key={spec} value={spec}>{spec.toUpperCase()}</option>)}
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] text-gray-400 font-black tracking-[0.3em] pl-1">Provincia / Ubicación</label>
                <select className="w-full bg-[#18181b] border border-white/10 p-3.5 rounded-xl text-[10px] font-bold uppercase text-white outline-none focus:border-purple-500" 
                        value={profile.location || ""} 
                        onChange={e => setProfile({...profile, location: e.target.value})}>
                  <option value="">SELECCIONAR PROVINCIA</option>
                  {PROVINCIAS.map(prov => <option key={prov} value={prov}>{prov.toUpperCase()}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[7px] text-gray-400 font-black tracking-[0.3em] pl-1">Biografía / Resumen</label>
                <textarea className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-[10px] h-24 resize-none font-bold outline-none focus:border-purple-500 text-white font-['Open_Sans']" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setIsEditingProfile(false)} className="py-3.5 bg-white/5 text-gray-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all">DESCARTAR</button>
              <button onClick={handleSaveProfileData} className="py-3.5 bg-purple-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-purple-900/40 hover:bg-purple-500 transition-all">GUARDAR</button>
            </div>
          </div>
        </div>
      )}

      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
}