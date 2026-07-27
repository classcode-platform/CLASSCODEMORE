import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; 
import { doc, setDoc, collection, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, GraduationCap, Play, 
  Upload, X, Eye, Menu, Zap, 
  LayoutDashboard, LogOut, RefreshCcw, User, MessageSquare, Edit3, Camera, Award, MapPin, Plus,
  Camera as CameraIcon, Video as VideoIcon, User as UserIcon, Theater, Smartphone, PartyPopper, 
  Clapperboard, Sparkles, Shirt, Palette, Music, Utensils, CalendarDays, Home as HomeIcon
} from 'lucide-react'; 
import CustomModal from './components/CustomModal'; 
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  
  const [profiles, setProfiles] = useState([]);
  const [activeProfileIndex, setActiveProfileIndex] = useState(0);

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
    "FOTOGRAFÍA": ["Fotografía Social", "Fotografía de Moda", "Fotografía Publicitaria", "Fotografía de Producto", "Fotografía Gastronómica", "Fotografía Inmobiliaria", "Fotografía Corporativa", "Fotografía Editorial", "Fotografía Deportiva", "Fotografía de Naturaleza", "Retrato", "Drone"],
    "AUDIOVISUAL": ["Filmmaker", "Dirección de Fotografía", "Edición de Video", "Color Grading", "Motion Graphics", "Animación 2D / 3D", "Streaming", "Operador de Cámara", "Drone", "Producción de Contenido"],
    "MODELO": ["Moda", "Publicidad", "E-commerce", "Pasarela", "Presencia para Eventos", "Fitness", "Curvy", "Comercial", "Editorial", "Partes del cuerpo (Hands / Feet / Hair)"],
    "ESCÉNICO": ["Actor / Actriz", "Bailarín/a", "Cantante", "Músico", "Performer", "Comediante", "Improvisación", "Voz", "Locución", "Doblaje"],
    "DIGITAL": ["Influencer", "UGC Creator", "Streamer", "Presentador/a de Contenido", "Community Creator", "Community Manager", "Social Media Manager", "Content Creator", "Podcaster"],
    "SHOW": ["Animación", "Magia", "Circo", "Personajes", "Shows Infantiles", "Shows Temáticos", "Zanquistas", "Comparsas", "Bandas", "DJs en Vivo", "Karaoke", "Humor"],
    "PRODUCCIÓN / DIRECCIÓN": ["Producción Audiovisual", "Producción de Moda", "Producción de Eventos", "Dirección General", "Dirección Creativa", "Dirección de Arte", "Dirección de Casting", "Asistencia de Producción"],
    "MAKEUP / PELO": ["Makeup Social", "Makeup Editorial", "Makeup FX", "Makeup Artístico", "Hairstylist", "Barbería", "Caracterización"],
    "ESTILISMO / MODA": ["Estilismo", "Vestuario", "Personal Shopper", "Asesoría de Imagen", "Diseño de Moda", "Sastrería"],
    "DISEÑO / ARTE": ["Diseño Gráfico", "Ilustración", "Branding", "Identidad Visual", "UX/UI", "Escenografía", "Escaparatismo", "Arte Digital"],
    "DJ / SONIDO": ["DJ", "Sonidista", "Operador de Audio", "Ingeniería de Sonido", "Musicalización", "Producción Musical", "Grabación", "Mezcla y Mastering"],
    "CATERING / BARRA": ["Catering", "Barra", "Bartender", "Barista", "Coffee Break", "Pastelería", "Food Truck", "Chef Privado"],
    "PLANNER / EVENTOS": ["Wedding Planner", "Event Planner", "Coordinación de Eventos", "Organización Integral", "Maestro/a de Ceremonias", "Protocolo", "Logística"],
    "TÉCNICA / ILUMINACIÓN": ["Iluminación", "Operador de Luces", "Pantallas LED", "Escenarios", "Estructuras", "Rigging", "Efectos Especiales", "Mapping"],
    "LOCACIONES": ["Salones", "Quintas", "Estudios Fotográficos", "Estudios Audiovisuales", "Teatros", "Galpones", "Hoteles", "Rooftops", "Restaurantes", "Bares", "Espacios Corporativos", "Espacios al Aire Libre"]
  };
  
  const RUBRO_ICONS = {
    "FOTOGRAFÍA": CameraIcon, "AUDIOVISUAL": VideoIcon, "MODELO": UserIcon, "ESCÉNICO": Theater,
    "DIGITAL": Smartphone, "SHOW": PartyPopper, "PRODUCCIÓN / DIRECCIÓN": Clapperboard, "MAKEUP / PELO": Sparkles,
    "ESTILISMO / MODA": Shirt, "DISEÑO / ARTE": Palette, "DJ / SONIDO": Music, "CATERING / BARRA": Utensils,
    "PLANNER / EVENTOS": CalendarDays, "TÉCNICA / ILUMINACIÓN": Zap, "LOCACIONES": HomeIcon
  };

  const PROVINCIAS = ["Buenos Aires", "Capital Federal", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes", "Río Negro", "Neuquén", "Chubut", "Formosa", "Jujuy", "San Luis", "San Juan", "La Rioja", "La Pampa", "Santiago del Estero", "Catamarca", "Santa Cruz", "Tierra del Fuego"];

  const isGenericoDone = profile.completedCourses?.includes('cert_generico');
  const proCourseId = profile.job ? `cert_${profile.job.toLowerCase().replace(/[\s/]/g, '')}` : null;
  const isProfessionalTestDone = proCourseId && profile.completedCourses?.includes(proCourseId);

  const calculateTotalScore = (currentProfile) => {
    let bonus = 0;
    if (currentProfile.name?.trim()) bonus += 15;
    if (currentProfile.job?.trim()) bonus += 15;
    const photoCount = Array.from({ length: 10 }, (_, i) => currentProfile[`photo${i + 1}`]).filter(Boolean).length;
    bonus += photoCount * 5; 
    return bonus + (currentProfile.academyBaseScore || 0);
  };

  const loadProfileDataIntoState = (profilesList, index) => {
    const target = profilesList[index] || profilesList[0];
    if (!target) return;

    const photosData = {};
    for (let i = 1; i <= 10; i++) {
      photosData[`photo${i}`] = (target.photos && target.photos[i - 1]) || target[`photo${i}`] || '';
    }

    setProfile({
      name: target.name || '',
      job: target.job || '',
      specialty: target.specialty || '',
      location: target.location || '',
      bio: target.bio || '',
      videoLink: target.videoLink || '',
      completedCourses: target.completedCourses || [],
      academyBaseScore: target.academyBaseScore || 0,
      ...photosData
    });
  };

  useEffect(() => {
    let profUnsubscribe = () => {};
    let chatUnsubscribe = () => {};

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        profUnsubscribe = onSnapshot(doc(db, "professionals", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            let listProfiles = data.profiles && data.profiles.length > 0 ? data.profiles : [data];
            setProfiles(listProfiles);
            loadProfileDataIntoState(listProfiles, activeProfileIndex);
          } else {
            const initialProf = {
              name: user.displayName || 'NUEVO TALENTO',
              job: '', specialty: '', location: '', bio: '', videoLink: '', completedCourses: [], academyBaseScore: 0
            };
            setProfiles([initialProf]);
            setProfile(initialProf);
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

  useEffect(() => {
    if (profiles.length > 0) {
      loadProfileDataIntoState(profiles, activeProfileIndex);
    }
  }, [activeProfileIndex, profiles]);

  const persistProfile = async (updatedFields) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const mergedCurrentProfile = { ...profile, ...updatedFields };
    const photoList = Array.from({ length: 10 }, (_, i) => mergedCurrentProfile[`photo${i + 1}`]).filter(Boolean);
    const finalScore = calculateTotalScore(mergedCurrentProfile);

    const updatedProfiles = [...profiles];
    updatedProfiles[activeProfileIndex] = { 
      ...mergedCurrentProfile, 
      photos: photoList,
      score: finalScore
    };

    setProfiles(updatedProfiles);
    setProfile(mergedCurrentProfile);

    const dataToSave = {
      ...mergedCurrentProfile,
      photos: photoList,
      score: finalScore,
      profiles: updatedProfiles,
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

  const handleAddNewProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const newBlankProfile = {
      name: profile.name || 'NUEVO TALENTO',
      job: '', specialty: '', location: profile.location || '', bio: '', videoLink: '',
      photos: [],
      completedCourses: [],
      academyBaseScore: 0
    };
    
    for (let i = 1; i <= 10; i++) newBlankProfile[`photo${i}`] = '';

    const updatedProfiles = [...profiles, newBlankProfile];
    const newIndex = updatedProfiles.length - 1;

    setProfiles(updatedProfiles);
    setActiveProfileIndex(newIndex);
    setProfile(newBlankProfile);

    const dataToSave = {
      ...newBlankProfile,
      profiles: updatedProfiles,
      uid: user.uid
    };

    try {
      await setDoc(doc(db, "professionals", user.uid), dataToSave, { merge: true });
      setModal({ isOpen: true, type: 'success', title: "NUEVO PERFIL", message: "SE CREÓ UN NUEVO PERFIL PROFESIONAL." });
    } catch (e) {
      console.error("Error al crear perfil:", e);
    }
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

    if (!file.type.startsWith('video/')) {
      setModal({ isOpen: true, type: 'warning', title: 'FORMATO INCORRECTO', message: 'Por favor selecciona un archivo de video válido.' });
      return;
    }

    setUploadingStatus(prev => ({ ...prev, video: true }));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, { 
        method: 'POST', 
        body: formData 
      });
      
      const data = await response.json();
      
      if (data?.secure_url) {
        const updates = { videoLink: data.secure_url };
        setProfile(prev => ({ ...prev, ...updates }));
        await persistProfile(updates);
        setModal({ isOpen: true, type: 'success', title: 'SHOWREEL', message: 'Video subido y actualizado correctamente.' });
      } else {
        setModal({ isOpen: true, type: 'warning', title: 'ERROR DE SUBIDA', message: data.error?.message || 'No se pudo subir el video.' });
      }
    } catch (err) {
      setModal({ isOpen: true, type: 'warning', title: 'ERROR DE RED', message: 'Ocurrió un error de conexión al intentar subir el video.' });
    } finally { 
      setUploadingStatus(prev => ({ ...prev, video: false })); 
    }
  };

  const handleViewPublicProfile = () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    navigate(`/profile/${userId}?index=${activeProfileIndex}`);
  };

  if (loading) return <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-['Poppins'] overflow-x-hidden box-border">CARGANDO DASHBOARD...</div>;

  const currentJobIcon = profile.job && RUBRO_ICONS[profile.job] ? React.createElement(RUBRO_ICONS[profile.job], { size: 14, className: "text-purple-400 flex-shrink-0" }) : null;

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white font-['Open_Sans'] flex flex-col md:flex-row overflow-x-hidden uppercase antialiased relative text-left box-border m-0 p-0">
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] md:blur-[150px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[90px] md:blur-[130px]" />
      </div>

      <header className="md:hidden fixed top-0 left-0 right-0 w-full bg-[#070709]/60 backdrop-blur-md border-b border-white/10 z-[100] px-8 py-5 flex justify-between items-center shadow-xl">
        <div onClick={() => navigate('/home')} className="text-[18px] font-['Poppins'] font-normal tracking-[0.05em] uppercase cursor-pointer text-white">CLASSCODE</div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white hover:text-purple-300 transition-colors cursor-pointer"><Menu size={28} /></button>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] md:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#070709]/90 backdrop-blur-xl border-l border-white/10 z-[120] p-10 flex flex-col md:hidden shadow-2xl box-border overflow-y-auto">
              <button onClick={() => setIsMobileMenuOpen(false)} className="self-end mb-10 text-white/60 hover:text-white transition-colors cursor-pointer"><X size={28} /></button>
              
              <button onClick={handleSwitchToClient} className="mb-10 w-full flex items-center justify-between bg-white/[0.04] backdrop-blur-md border border-white/10 p-4 rounded-xl group hover:bg-white/[0.08] transition-all cursor-pointer shadow-lg">
                <div className="flex items-center gap-4 text-left leading-none">
                  <div className="p-2.5 bg-purple-500/15 rounded-lg text-purple-300 border border-purple-500/30">
                    <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                  </div>
                  <div>
                    <p className="text-[7px] font-black text-purple-300 tracking-[0.2em]">SWITCH MOOD</p>
                    <p className="text-[11px] font-black text-white tracking-widest uppercase leading-none mt-1">MODO EXPERIENCE</p>
                  </div>
                </div>
              </button>

              <nav className="flex-1 space-y-6">
                <button onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 text-[11px] font-black tracking-widest text-purple-300 uppercase cursor-pointer w-full py-2"><LayoutDashboard size={18}/> DASHBOARD</button>
                <button onClick={() => { navigate('/academy'); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 text-[11px] font-black tracking-widest text-white/70 hover:text-white uppercase cursor-pointer w-full py-2"><GraduationCap size={18}/> ACADEMY</button>
                <button onClick={() => { handleAddNewProfile(); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 text-[11px] font-black tracking-widest text-white/70 hover:text-white uppercase cursor-pointer w-full py-2"><Plus size={18}/> NUEVO RUBRO</button>
              </nav>

              <button onClick={() => { auth.signOut(); setIsMobileMenuOpen(false); }} className="flex items-center gap-5 text-white/50 hover:text-red-300 text-[10px] font-black tracking-widest uppercase mt-8 cursor-pointer"><LogOut size={18}/> SALIR</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-72 bg-[#070709]/40 backdrop-blur-md border-r border-white/10 flex-col p-8 fixed h-full z-50 box-border shadow-2xl">
        <header className="mb-10 text-left leading-none">
          <div onClick={() => navigate('/home')} className="text-[22px] font-['Poppins'] font-normal tracking-[0.05em] leading-none cursor-pointer uppercase text-white">CLASSCODE</div>
          <p className="text-purple-300 text-[10px] font-bold tracking-[0.3em] mt-2.5 leading-none uppercase">Talent</p>
        </header>
        
        <div className="mb-10 text-left">
          <button onClick={handleSwitchToClient} className="w-full flex items-center justify-between bg-white/[0.04] backdrop-blur-md border border-white/10 p-4 rounded-xl group hover:bg-white/[0.08] transition-all cursor-pointer shadow-lg">
            <div className="flex items-center gap-3 text-left leading-none">
              <div className="p-2.5 bg-purple-500/15 rounded-lg text-purple-300 border border-purple-500/30">
                <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <div>
                <p className="text-[6px] font-black text-purple-300 tracking-[0.2em] leading-none">SWITCH MOOD</p>
                <p className="text-[9px] font-black text-white tracking-widest uppercase mt-1 leading-none">MODO EXPERIENCE</p>
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 space-y-3 text-left">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 text-purple-300 py-3 px-3 text-[10px] font-black tracking-widest leading-none transition-all cursor-pointer w-full"><LayoutDashboard size={16} className="text-purple-300"/> DASHBOARD</button>
          <button onClick={() => navigate('/academy')} className="flex items-center gap-3 text-white/70 hover:text-white py-3 px-3 text-[10px] font-black tracking-widest leading-none transition-all cursor-pointer w-full"><GraduationCap size={16}/> ACADEMY</button>
          <button onClick={handleAddNewProfile} className="flex items-center gap-3 text-white/70 hover:text-white py-3 px-3 text-[10px] font-black tracking-widest leading-none transition-all cursor-pointer w-full"><Plus size={16}/> NUEVO RUBRO</button>
        </nav>

        <button onClick={() => auth.signOut()} className="flex items-center gap-4 text-white/50 hover:text-red-300 text-[10px] font-black tracking-widest transition-all mt-auto pt-6 border-t border-white/10 leading-none cursor-pointer"><LogOut size={16}/> CERRAR SESIÓN</button>
      </aside>

      <div className="flex-1 md:ml-72 flex flex-col min-h-screen relative z-10 w-full max-w-full box-border overflow-x-hidden">
        
        <div className="flex-1 p-6 md:p-12 mt-16 md:mt-0 w-full max-w-[1400px] mx-auto box-border overflow-x-hidden space-y-8">
          
          {profiles.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <span className="text-[8px] font-black tracking-widest text-white/70">PERFILES ACTIVOS:</span>
              {profiles.map((p, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveProfileIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-[8px] font-black tracking-widest border transition-all uppercase cursor-pointer shadow-lg ${activeProfileIndex === idx ? 'bg-white/[0.08] border-purple-400 text-purple-300 backdrop-blur-md' : 'bg-white/[0.03] backdrop-blur-md border-white/10 text-white/70 hover:text-white'}`}>
                  {p.job || `PERFIL ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          <div className="w-full bg-[#070709]/50 backdrop-blur-md border border-white/15 rounded-2xl p-6 md:p-8 shadow-2xl box-border overflow-hidden">
            <div className="w-full mx-auto box-border">
              
              <label className="w-full h-[180px] md:h-[260px] bg-black/40 relative overflow-hidden group block rounded-xl border border-white/10 cursor-pointer shadow-inner">
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
                    <Play size={28} className="text-white/40 mb-2" strokeWidth={1}/>
                    <span className="text-[8px] tracking-[0.4em] text-white/70 font-black">
                      {uploadingStatus.video ? 'SUBIENDO VIDEO...' : 'SIN SHOWREEL CARGADO'}
                    </span>
                  </div>
                )}
                
                <div className="absolute bottom-4 right-4 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] text-white px-4 py-2.5 rounded-xl text-[8px] font-black tracking-widest border border-white/15 transition-all flex items-center gap-2 shadow-xl z-20 cursor-pointer">
                  <Upload size={14} className="text-purple-400" /> {uploadingStatus.video ? 'SUBIENDO...' : (profile.videoLink ? 'CAMBIAR' : 'SUBIR')}
                </div>
                
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              </label>

              <div className="pb-4 relative -mt-10 md:-mt-16 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 z-20 box-border w-full">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left w-full md:w-auto min-w-0">
                  
                  <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl border border-white/25 overflow-hidden bg-black/50 shadow-2xl flex-shrink-0 group">
                    {profile.photo1 ? (
                      <img src={profile.photo1} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/60"><User size={40}/></div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                      <Camera size={20} className="text-purple-400"/>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'photo1')} className="hidden" />
                    </label>
                  </div>

                  <div className="space-y-2 pb-1 min-w-0 flex-1 w-full">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <h1 className="text-lg md:text-2xl font-['Poppins'] font-normal tracking-wide text-white truncate max-w-full">{profile.name || 'NUEVO TALENTO'}</h1>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      {currentJobIcon}
                      <p className="text-white/80 text-[10px] md:text-xs tracking-[0.3em] font-bold truncate">{profile.job || 'ASIGNAR RUBRO'}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] text-white/80 font-bold tracking-widest pt-1">
                      {profile.location && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-purple-400"/> {profile.location}</span>}
                      <span className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-full shadow-inner">
                        <div className="flex items-center text-purple-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`text-xs ${i < Math.min(5, Math.max(1, Math.round(calculateTotalScore(profile) / 40))) ? 'opacity-100' : 'opacity-30'}`}>★</span>
                          ))}
                        </div>
                        <span className="font-mono text-[9px]">{calculateTotalScore(profile)} PTS</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-center pb-2 flex-shrink-0">
                  <button onClick={handleViewPublicProfile} className="px-4 py-3.5 rounded-xl bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] border border-white/15 transition-all text-white flex items-center gap-2 text-[9px] font-black tracking-widest cursor-pointer shadow-xl font-['Poppins']" title="Ver perfil público">
                    <Eye size={14} className="text-purple-400" /> <span className="hidden md:inline">VER PÚBLICO</span>
                  </button>
                  <button onClick={() => setIsEditingProfile(true)} className="px-6 py-3.5 rounded-xl bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] border border-white/15 text-white font-black text-[9px] tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer font-['Poppins']">
                    <Edit3 size={14} className="text-purple-400"/> EDITAR PERFIL
                  </button>
                </div>
              </div>
            </div>
          </div>

          <main className="w-full py-6 grid lg:grid-cols-12 gap-10 relative z-10 box-border">
            
            <div className="lg:col-span-4 space-y-8 min-w-0 box-border">
              
              <div className="bg-[#070709]/50 backdrop-blur-md border border-white/15 rounded-2xl p-6 space-y-6 shadow-2xl box-border">
                <div className="flex justify-between items-center border-l-2 border-purple-500 pl-4">
                  <h3 className="text-[10px] text-white/70 uppercase tracking-[0.4em] font-black">Estatus Academy</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white/[0.04] backdrop-blur-md border border-white/15 px-4 py-3 rounded-xl box-border shadow-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <Zap size={14} className={isGenericoDone ? "text-purple-400 flex-shrink-0" : "text-white/30 flex-shrink-0"} />
                      <span className="text-[9px] font-black tracking-widest text-white truncate">NIVELACIÓN INGRESO</span>
                    </div>
                    {!isGenericoDone ? (
                      <button onClick={() => navigate('/academy-test/Generico')} className="text-[8px] font-black text-purple-300 hover:text-white flex-shrink-0 ml-2 cursor-pointer uppercase tracking-widest">RENDIR</button>
                    ) : (
                      <span className="text-[8px] font-black text-emerald-300 flex-shrink-0 ml-2">APROBADO</span>
                    )}
                  </div>

                  {profile.job && (
                    <div className="flex items-center justify-between bg-white/[0.04] backdrop-blur-md border border-white/15 px-4 py-3 rounded-xl box-border shadow-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <Award size={14} className={isProfessionalTestDone ? "text-purple-400 flex-shrink-0" : "text-white/30 flex-shrink-0"} />
                        <span className="text-[9px] font-black tracking-widest text-white truncate">TEST PROFESIONAL</span>
                      </div>
                      {!isProfessionalTestDone ? (
                        <button onClick={() => navigate(`/academy-test/${encodeURIComponent(profile.job)}`)} className="text-[8px] font-black text-purple-300 hover:text-white flex-shrink-0 ml-2 cursor-pointer uppercase tracking-widest">RENDIR</button>
                      ) : (
                        <span className="text-[8px] font-black text-emerald-300 flex-shrink-0 ml-2">APROBADO</span>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => navigate('/academy')} className="w-full py-3.5 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08] border border-white/15 rounded-xl text-[9px] font-black tracking-widest text-white transition-all flex items-center justify-center gap-2 box-border cursor-pointer shadow-xl font-['Poppins']">
                  <GraduationCap size={14} className="text-purple-400"/> IR A CLASSCODE ACADEMY
                </button>
              </div>

              <div className="bg-[#070709]/50 backdrop-blur-md border border-white/15 rounded-2xl p-6 space-y-6 shadow-2xl box-border">
                <div className="flex justify-between items-center border-l-2 border-purple-500 pl-4">
                  <h3 className="text-[10px] text-white/70 uppercase tracking-[0.4em] font-black flex items-center gap-2"><MessageSquare size={12}/> Mensajes</h3>
                  <span className="text-[9px] text-purple-400 font-black">{messages.length}</span>
                </div>
                <div className="space-y-3 max-h-[240px] overflow-y-auto no-scrollbar">
                  {messages.length === 0 ? (
                    <div className="text-center py-6 text-[8px] text-white/50 uppercase font-black tracking-widest">No hay chats activos</div>
                  ) : messages.map(chat => (
                    <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex justify-between items-center p-3.5 bg-white/[0.04] backdrop-blur-md border border-white/15 hover:border-purple-400/50 rounded-xl transition-all cursor-pointer box-border shadow-lg">
                       <div className="flex items-center gap-3 min-w-0">
                          {chat.clientPhoto ? <img src={chat.clientPhoto} className="w-8 h-8 rounded-xl object-cover border border-white/15 flex-shrink-0 shadow-inner" alt="" /> : <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/15 text-white/60 flex items-center justify-center flex-shrink-0 shadow-inner"><User size={14}/></div>}
                          <div className="min-w-0">
                             <p className="text-[9px] font-black text-white uppercase tracking-wider truncate">{chat.clientName || "CLIENTE"}</p>
                             <p className="text-[7px] text-white/60 font-bold uppercase mt-0.5">Ver chat</p>
                          </div>
                       </div>
                       <ArrowRight size={12} className="text-white/40 flex-shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="lg:col-span-8 space-y-12 min-w-0 box-border">
              <section className="bg-[#070709]/50 backdrop-blur-md border border-white/15 rounded-2xl p-6 md:p-8 space-y-8 shadow-2xl box-border">
                <div className="flex justify-between items-center border-l-2 border-purple-500 pl-4">
                  <h3 className="text-[10px] text-white/70 uppercase tracking-[0.4em] font-black">Portfolio — Galería de Fotos</h3>
                  <span className="text-[9px] text-purple-400 font-mono">{Array.from({ length: 10 }, (_, i) => profile[`photo${i + 1}`]).filter(Boolean).length}/10 FOTOS</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <div key={num} className="aspect-square rounded-xl overflow-hidden border border-white/15 bg-black/40 group relative shadow-xl flex items-center justify-center box-border">
                      {profile[`photo${num}`] ? (
                        <>
                          <img src={profile[`photo${num}`]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" alt="" />
                          <button onClick={async () => {
                            const updates = { [`photo${num}`]: '' };
                            setProfile(prev => ({ ...prev, ...updates }));
                            await persistProfile(updates);
                          }} className="absolute top-2 right-2 p-2 bg-black/80 backdrop-blur-md rounded-xl opacity-0 group-hover:opacity-100 text-red-300 transition-all border border-white/20 cursor-pointer shadow-xl"><X size={12} /></button>
                        </>
                      ) : (
                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.04] transition-all p-4 text-center">
                          <Upload size={20} className="text-white/40 mb-2" />
                          <span className="text-[7px] font-black tracking-widest text-white/60">SUBIR FOTO {num}</span>
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

        <footer className="w-full bg-[#070709]/60 backdrop-blur-md py-12 px-6 border-t border-white/10 text-center relative z-10 box-border font-['Poppins'] mt-auto shadow-2xl">
          <div className="max-w-[1400px] mx-auto box-border">
            <h2 className="text-white text-2xl md:text-3xl font-normal tracking-[0.05em] uppercase mb-3">CLASSCODE</h2>
            <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-white/60">© 2026 — TODOS LOS DERECHOS RESERVADOS</p>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 box-border overflow-x-hidden uppercase">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#070709] backdrop-blur-2xl w-full max-w-lg p-6 md:p-8 rounded-3xl border border-white/15 relative shadow-2xl space-y-6 max-h-[90vh] flex flex-col box-border"
            >
              <button onClick={() => setIsEditingProfile(false)} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors cursor-pointer p-2 z-10"><X size={22} /></button>
              
              <h3 className="text-[11px] font-['Poppins'] text-white tracking-[0.3em] font-black border-b border-white/10 pb-4">Editar Perfil Profesional</h3>
              
              <div className="space-y-4 font-bold overflow-y-auto pr-2 flex-1 scrollbar-hide text-left box-border">
                <div className="space-y-2">
                  <label className="text-[8px] text-white/80 tracking-widest font-black">Nombre Completo / Artístico</label>
                  <input 
                    className="w-full bg-white/[0.04] backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 text-[10px] text-white uppercase outline-none focus:border-purple-400 tracking-widest box-border shadow-inner" 
                    value={profile.name || ''} 
                    onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[8px] text-white/80 tracking-widest font-black">Rubro Principal</label>
                    <select 
                      className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-4 py-3 text-[10px] text-white uppercase outline-none focus:border-purple-400 tracking-widest box-border cursor-pointer shadow-inner" 
                      value={profile.job || ""} 
                      onChange={e => {
                        const selectedJob = e.target.value;
                        setProfile(prev => ({ ...prev, job: selectedJob, specialty: "" }));
                      }}>
                      <option value="" className="bg-[#0b0c10] text-white">SELECCIONAR</option>
                      {Object.keys(RUBROS).map(rubro => (
                        <option key={rubro} value={rubro} className="bg-[#0b0c10] text-white">{rubro}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] text-white/80 tracking-widest font-black">Provincia</label>
                    <select 
                      className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-4 py-3 text-[10px] text-white uppercase outline-none focus:border-purple-400 tracking-widest box-border cursor-pointer shadow-inner" 
                      value={profile.location || ""} 
                      onChange={e => setProfile(prev => ({ ...prev, location: e.target.value }))}>
                      <option value="" className="bg-[#0b0c10] text-white">SELECCIONAR</option>
                      {PROVINCIAS.map(prov => <option key={prov} value={prov} className="bg-[#0b0c10] text-white">{prov.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                {profile.job && RUBROS[profile.job] && (
                  <div className="space-y-2">
                    <label className="text-[8px] text-white/80 tracking-widest font-black">Especialidad</label>
                    <select 
                      className="w-full bg-[#0b0c10] border border-white/15 rounded-xl px-4 py-3 text-[10px] text-white uppercase outline-none focus:border-purple-400 tracking-widest box-border cursor-pointer shadow-inner" 
                      value={profile.specialty || ""} 
                      onChange={e => setProfile(prev => ({ ...prev, specialty: e.target.value }))}>
                      <option value="" className="bg-[#0b0c10] text-white">SELECCIONAR ESPECIALIDAD</option>
                      {RUBROS[profile.job].map(spec => <option key={spec} value={spec} className="bg-[#0b0c10] text-white">{spec.toUpperCase()}</option>)}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[8px] text-white/80 tracking-widest font-black">Biografía / Presentación</label>
                  <textarea 
                    className="w-full bg-white/[0.04] backdrop-blur-md border border-white/15 rounded-xl px-4 py-3 text-[10px] text-white uppercase h-28 resize-none outline-none focus:border-purple-400 tracking-widest box-border shadow-inner" 
                    value={profile.bio || ''} 
                    onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))} 
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button type="button" onClick={() => setIsEditingProfile(false)} className="px-5 py-3 bg-white/[0.04] backdrop-blur-md border border-white/15 rounded-xl text-[9px] font-black tracking-widest hover:bg-white/[0.08] transition-all cursor-pointer text-white shadow-lg">
                  Descartar
                </button>
                <button type="button" onClick={handleSaveProfileData} className="px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 text-white rounded-xl text-[9px] font-black tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-xl">
                  Guardar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
}