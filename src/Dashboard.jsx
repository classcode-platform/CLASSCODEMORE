import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase'; 
import { doc, setDoc, collection, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, GraduationCap, Play, 
  Upload, X, Eye, Menu, Zap, 
  LayoutDashboard, LogOut, RefreshCcw, User, MessageSquare, Edit3, Camera, Award, MapPin, Plus,
  Camera as CameraIcon, Video as VideoIcon, User as UserIcon, Theater, Smartphone, PartyPopper, 
  Clapperboard, Sparkles, Shirt, Palette, Music, Utensils, CalendarDays, Home as HomeIcon, Check, ChevronDown
} from 'lucide-react'; 
import CustomModal from './components/CustomModal'; 
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('classcode_theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });
  
  const [profiles, setProfiles] = useState([]);
  const [activeProfileIndex, setActiveProfileIndex] = useState(0);

  const [profile, setProfile] = useState({
    name: '', job: '', specialty: [], location: '', bio: '', videoLink: '', 
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`photo${i + 1}`, ''])),
    academyPoints: 0, verified: false, score: 0,
    completedCourses: [] 
  });

  const [uploadingStatus, setUploadingStatus] = useState({
    video: false, ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`photo${i + 1}`, false]))
  });

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'warning' });
  const [openDropdown, setOpenDropdown] = useState(null);

  const CLOUD_NAME = "dsyfitywd";
  const UPLOAD_PRESET = "CLASSCODE"; 

  // Estructura actualizada con la categoría Técnica y equipamiento ajustada[cite: 4]
  const RUBROS = {
    "FOTO Y VIDEO": [
      "Fotografía", "Video", "Edición", "Cobertura Integral", "Drone"
    ],
    "ESPACIOS Y LOCACIONES": [
      "Salones", "Estudios", "Quintas", "Teatros", "Hoteles", "Rooftops", "Otros espacios"
    ],
    "TÉCNICA Y EQUIPAMIENTO": [
      "Sonido e iluminación", "Rental", "Iluminación", "Pantallas LED", "Escenarios", "Sonidista", "DJ"
    ],
    "AMBIENTACIÓN Y PROVEEDORES": [
      "Ambientación", "Catering", "Pastelería", "Barra", "Planner"
    ],
    "ESTILISMO Y BELLEZA": [
      "Makeup y pelo", "Atelier y alta costura", "Joyería y accesorios", "Make up", "Hairstylist"
    ],
    "SHOWS Y TALENTOS": [
      "Artista", "Producción", "Influencer", "Show", "UGC", "Community Manager"
    ]
  };
  
  const RUBRO_ICONS = {
    "COBERTURA AUDIOVISUAL Y VISUAL": CameraIcon,
    "ESPACIOS Y LOCACIONES": HomeIcon,
    "TÉCNICA Y EQUIPAMIENTO": Zap,
    "AMBIENTACIÓN, DECO Y PROVEEDORES": Utensils,
    "MODA, ESTILISMO Y BELLEZA": Sparkles,
    "PRODUCCIÓN, TALENTO Y PLANIFICACIÓN": Clapperboard
  };

  const PROVINCIAS = ["CABA", "Buenos Aires", "Capital Federal", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes", "Río Negro", "Neuquén", "Chubut", "Formosa", "Jujuy", "San Luis", "San Juan", "La Rioja", "La Pampa", "Santiago del Estero", "Catamarca", "Santa Cruz", "Tierra del Fuego"];

  const isGenericoDone = profile.completedCourses?.includes('cert_generico');
  const proCourseId = profile.job ? `cert_${profile.job.toLowerCase().replace(/[\s/]/g, '')}` : null;
  const isProfessionalTestDone = proCourseId && profile.completedCourses?.includes(proCourseId);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedTheme = localStorage.getItem('classcode_theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
      specialty: Array.isArray(target.specialty) ? target.specialty : (target.specialty ? [target.specialty] : []),
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
              job: '', specialty: [], location: '', bio: '', videoLink: '', completedCourses: [], academyBaseScore: 0
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
      job: '', specialty: [], location: profile.location || '', bio: '', videoLink: '',
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

  const toggleSpecialty = (spec) => {
    setProfile(prev => {
      const currentSpecs = Array.isArray(prev.specialty) ? prev.specialty : [];
      if (currentSpecs.includes(spec)) {
        return { ...prev, specialty: currentSpecs.filter(s => s !== spec) };
      } else {
        return { ...prev, specialty: [...currentSpecs, spec] };
      }
    });
  };

  if (loading) return <div className={`min-h-screen w-full ${isDarkMode ? 'bg-[#0a0a0c] text-white' : 'bg-[#f4f4f6] text-neutral-900'} flex items-center justify-center tracking-[0.4em] text-[10px] uppercase font-['Poppins'] overflow-x-hidden box-border`}>CARGANDO DASHBOARD...</div>;

  const currentJobIcon = profile.job && RUBRO_ICONS[profile.job] ? React.createElement(RUBRO_ICONS[profile.job], { size: 14, className: "text-purple-400 flex-shrink-0" }) : null;

  return (
    <div className={`min-h-screen w-full ${isDarkMode ? 'bg-[#0a0a0c] text-white' : 'bg-[#f4f4f6] text-neutral-900'} font-['Open_Sans'] flex flex-col md:flex-row overflow-x-hidden uppercase antialiased relative text-left box-border m-0 p-0 transition-colors duration-300`}>
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className={`absolute top-0 left-0 w-[600px] h-[600px] ${isDarkMode ? 'bg-purple-600/10' : 'bg-purple-600/5'} rounded-full blur-[100px] md:blur-[150px]`} />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className={`absolute bottom-0 right-0 w-[500px] h-[500px] ${isDarkMode ? 'bg-indigo-600/10' : 'bg-indigo-600/5'} rounded-full blur-[90px] md:blur-[130px]`} />
      </div>

      <header className={`md:hidden fixed top-0 left-0 right-0 w-full ${isDarkMode ? 'bg-[#070709]/90 border-white/10 text-white' : 'bg-white/90 border-black/10 text-neutral-900'} backdrop-blur-md border-b z-[100] px-8 py-5 flex justify-between items-center shadow-xl`}>
        <div onClick={() => navigate('/home')} className={`text-[18px] font-['Poppins'] font-normal tracking-[0.05em] uppercase cursor-pointer ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>CLASSCODE</div>
        <button onClick={() => setIsMobileMenuOpen(true)} className={`${isDarkMode ? 'text-white hover:text-purple-300' : 'text-neutral-900 hover:text-purple-600'} transition-colors cursor-pointer`}><Menu size={28} /></button>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] md:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-sm ${isDarkMode ? 'bg-[#070709] border-white/10 text-white' : 'bg-white border-black/10 text-neutral-900'} border-l z-[120] p-10 flex flex-col md:hidden shadow-2xl box-border overflow-y-auto`}>
              <button onClick={() => setIsMobileMenuOpen(false)} className={`self-end mb-10 ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'} transition-colors cursor-pointer`}><X size={28} /></button>
              
              <button onClick={handleSwitchToClient} className="mb-10 w-full flex items-center justify-between p-2 group transition-all cursor-pointer">
                <div className="flex items-center gap-4 text-left leading-none">
                  <div className={`p-2.5 ${isDarkMode ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-500/10 text-purple-600 border-purple-500/20'} rounded-lg border`}>
                    <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                  </div>
                  <div>
                    <p className={`text-[7px] font-black ${isDarkMode ? 'text-purple-300' : 'text-purple-600'} tracking-[0.2em]`}>SWITCH MOOD</p>
                    <p className={`text-[11px] font-black ${isDarkMode ? 'text-white' : 'text-neutral-900'} tracking-widest uppercase leading-none mt-1`}>MODO EXPERIENCE</p>
                  </div>
                </div>
              </button>

              <nav className="flex-1 space-y-6">
                <button onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-4 text-[11px] font-black tracking-widest ${isDarkMode ? 'text-purple-300' : 'text-purple-600'} uppercase cursor-pointer w-full py-2`}><LayoutDashboard size={18}/> DASHBOARD</button>
                <button onClick={() => { navigate('/academy'); setIsMobileMenuOpen(false); }} className={`flex items-center gap-4 text-[11px] font-black tracking-widest ${isDarkMode ? 'text-white/70 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'} uppercase cursor-pointer w-full py-2`}><GraduationCap size={18}/> ACADEMY</button>
                <button onClick={() => { handleAddNewProfile(); setIsMobileMenuOpen(false); }} className={`flex items-center gap-4 text-[11px] font-black tracking-widest ${isDarkMode ? 'text-white/70 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'} uppercase cursor-pointer w-full py-2`}><Plus size={18}/> NUEVO RUBRO</button>
              </nav>

              <button onClick={() => { auth.signOut(); setIsMobileMenuOpen(false); }} className={`flex items-center gap-5 ${isDarkMode ? 'text-white/50 hover:text-red-300' : 'text-neutral-500 hover:text-red-600'} text-[10px] font-black tracking-widest uppercase mt-8 cursor-pointer`}><LogOut size={18}/> SALIR</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside className={`hidden md:flex w-72 ${isDarkMode ? 'bg-[#070709] border-white/10 text-white' : 'bg-white border-black/10 text-neutral-900'} border-r flex-col p-8 fixed h-full z-50 box-border shadow-2xl`}>
        <header className="mb-10 text-left leading-none">
          <div onClick={() => navigate('/home')} className={`text-[22px] font-['Poppins'] font-normal tracking-[0.05em] leading-none cursor-pointer uppercase ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>CLASSCODE</div>
          <p className="text-purple-500 text-[10px] font-bold tracking-[0.3em] mt-2.5 leading-none uppercase">Talent</p>
        </header>
        
        <div className="mb-10 text-left">
          <button onClick={handleSwitchToClient} className="w-full flex items-center justify-between p-2 group transition-all cursor-pointer">
            <div className="flex items-center gap-3 text-left leading-none">
              <div className={`p-2.5 ${isDarkMode ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-500/10 text-purple-600 border-purple-500/20'} rounded-lg border`}>
                <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <div>
                <p className={`text-[6px] font-black ${isDarkMode ? 'text-purple-300' : 'text-purple-600'} tracking-[0.2em] leading-none`}>SWITCH MOOD</p>
                <p className={`text-[9px] font-black ${isDarkMode ? 'text-white' : 'text-neutral-900'} tracking-widest uppercase mt-1 leading-none`}>MODO EXPERIENCE</p>
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 space-y-3 text-left">
          <button onClick={() => navigate('/dashboard')} className={`flex items-center gap-3 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'} py-3 px-3 text-[10px] font-black tracking-widest leading-none transition-all cursor-pointer w-full`}><LayoutDashboard size={16}/> DASHBOARD</button>
          <button onClick={() => navigate('/academy')} className={`flex items-center gap-3 ${isDarkMode ? 'text-white/70 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'} py-3 px-3 text-[10px] font-black tracking-widest leading-none transition-all cursor-pointer w-full`}><GraduationCap size={16}/> ACADEMY</button>
          <button onClick={handleAddNewProfile} className={`flex items-center gap-3 ${isDarkMode ? 'text-white/70 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'} py-3 px-3 text-[10px] font-black tracking-widest leading-none transition-all cursor-pointer w-full`}><Plus size={16}/> NUEVO RUBRO</button>
        </nav>

        <button onClick={() => auth.signOut()} className={`flex items-center gap-4 ${isDarkMode ? 'text-white/50 hover:text-red-300 border-white/10' : 'text-neutral-500 hover:text-red-600 border-black/10'} text-[10px] font-black tracking-widest transition-all mt-auto pt-6 border-t leading-none cursor-pointer`}><LogOut size={16}/> CERRAR SESIÓN</button>
      </aside>

      <div className="flex-1 md:ml-72 flex flex-col min-h-screen relative z-10 w-full max-w-full box-border overflow-x-hidden">
        
        <div className="flex-1 p-6 md:p-12 mt-16 md:mt-0 w-full max-w-[1400px] mx-auto box-border overflow-x-hidden space-y-8">
          
          {profiles.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <span className={`text-[8px] font-black tracking-widest ${isDarkMode ? 'text-white/70' : 'text-neutral-600'}`}>PERFILES ACTIVOS:</span>
              {profiles.map((p, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveProfileIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-[8px] font-black tracking-widest border transition-all uppercase cursor-pointer shadow-lg ${
                    activeProfileIndex === idx 
                      ? (isDarkMode ? 'bg-white/[0.08] border-purple-400 text-purple-300' : 'bg-black/[0.05] border-purple-600 text-purple-600') 
                      : (isDarkMode ? 'bg-white/[0.03] border-white/10 text-white/70 hover:text-white' : 'bg-black/[0.02] border-black/10 text-neutral-600 hover:text-neutral-900')
                  }`}>
                  {p.job || `PERFIL ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          <div className="w-full pb-6">
            <div className="w-full mx-auto box-border space-y-6">
              
              <label className={`w-full h-[180px] md:h-[260px] ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-black/5 border-black/5'} relative group block rounded-2xl overflow-hidden cursor-pointer border`}>
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
                  <div className={`w-full h-full ${isDarkMode ? 'bg-[#070709]' : 'bg-white/80'} flex flex-col items-center justify-center p-6 text-center`}>
                    <Play size={28} className={`${isDarkMode ? 'text-white/40' : 'text-neutral-400'} mb-2`} strokeWidth={1}/>
                    <span className={`text-[8px] tracking-[0.4em] ${isDarkMode ? 'text-white/70' : 'text-neutral-600'} font-black`}>
                      {uploadingStatus.video ? 'SUBIENDO VIDEO...' : 'SIN SHOWREEL CARGADO'}
                    </span>
                  </div>
                )}
                
                <div className={`absolute bottom-4 right-4 ${isDarkMode ? 'bg-black/80 text-white border-white/10' : 'bg-white text-neutral-900 border-black/10'} hover:opacity-90 px-4 py-2 rounded-full text-[8px] font-black tracking-widest transition-all flex items-center gap-2 z-20 cursor-pointer border shadow-lg`}>
                  <Upload size={14} className="text-purple-500" /> {uploadingStatus.video ? 'SUBIENDO...' : (profile.videoLink ? 'CAMBIAR' : 'SUBIR')}
                </div>
                
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              </label>

              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 w-full px-2">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left w-full md:w-auto min-w-0">
                  
                  <div className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full border-2 ${isDarkMode ? 'border-purple-500/30 bg-black/50 text-white/60' : 'border-purple-500/40 bg-black/10 text-neutral-600'} overflow-hidden flex-shrink-0 group shadow-xl flex items-center justify-center`}>
                    {profile.photo1 ? (
                      <img src={profile.photo1} className="w-full h-full object-cover rounded-full" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><User size={40}/></div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-all rounded-full">
                      <Camera size={20} className="text-purple-400"/>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'photo1')} className="hidden" />
                    </label>
                  </div>

                  <div className="space-y-2 min-w-0 flex-1 w-full pt-2">
                    <h1 className={`text-lg md:text-2xl font-['Poppins'] font-normal tracking-wide ${isDarkMode ? 'text-white' : 'text-neutral-900'} truncate max-w-full`}>{profile.name || 'NUEVO TALENTO'}</h1>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      {currentJobIcon}
                      <p className={`${isDarkMode ? 'text-white/80' : 'text-neutral-700'} text-[10px] md:text-xs tracking-[0.3em] font-bold truncate`}>{profile.job || 'ASIGNAR RUBRO'}</p>
                    </div>
                    {Array.isArray(profile.specialty) && profile.specialty.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-center md:justify-start pt-1">
                        {profile.specialty.map(spec => (
                          <span key={spec} className={`text-[8px] px-2 py-0.5 rounded-md font-black tracking-wider ${isDarkMode ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-purple-500/10 text-purple-700 border border-purple-500/20'}`}>
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className={`flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] ${isDarkMode ? 'text-white/80' : 'text-neutral-700'} font-bold tracking-widest pt-1`}>
                      {profile.location && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-purple-500"/> {profile.location}</span>}
                      <span className="flex items-center gap-2">
                        <div className="flex items-center text-purple-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`text-xs ${i < Math.min(5, Math.max(1, Math.round(calculateTotalScore(profile) / 40))) ? 'opacity-100' : 'opacity-30'}`}>★</span>
                          ))}
                        </div>
                        <span className="font-mono text-[9px]">{calculateTotalScore(profile)} PTS</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-center flex-shrink-0">
                  <button onClick={handleViewPublicProfile} className={`px-5 py-3 rounded-full ${isDarkMode ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white' : 'bg-black/[0.04] hover:bg-black/[0.08] border-black/10 text-neutral-900'} border transition-all flex items-center gap-2 text-[9px] font-black tracking-widest cursor-pointer font-['Poppins'] shadow-lg`}>
                    <Eye size={14} className="text-purple-500" /> <span className="hidden md:inline">VER PÚBLICO</span>
                  </button>
                  <button onClick={() => setIsEditingProfile(true)} className={`px-6 py-3 rounded-full ${isDarkMode ? 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/30 text-white' : 'bg-purple-600/10 hover:bg-purple-600/20 border-purple-500/30 text-purple-900'} font-black text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer font-['Poppins'] shadow-lg border`}>
                    <Edit3 size={14} className="text-purple-500"/> EDITAR PERFIL
                  </button>
                </div>
              </div>
            </div>
          </div>

          <main className="w-full py-6 grid lg:grid-cols-12 gap-10 relative z-10 box-border">
            
            <div className="lg:col-span-4 space-y-8 min-w-0 box-border">
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-l-2 border-purple-500 pl-4">
                  <h3 className={`text-[10px] ${isDarkMode ? 'text-white/70' : 'text-neutral-700'} uppercase tracking-[0.4em] font-black`}>Estatus Academy</h3>
                </div>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between py-2 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Zap size={14} className={isGenericoDone ? "text-purple-500 flex-shrink-0" : `${isDarkMode ? 'text-white/30' : 'text-neutral-300'} flex-shrink-0`} />
                      <span className={`text-[9px] font-black tracking-widest ${isDarkMode ? 'text-white' : 'text-neutral-900'} truncate`}>NIVELACIÓN INGRESO</span>
                    </div>
                    {!isGenericoDone ? (
                      <button onClick={() => navigate('/academy-test/Generico')} className={`text-[8px] font-black ${isDarkMode ? 'text-purple-300 hover:text-white' : 'text-purple-600 hover:text-neutral-900'} flex-shrink-0 ml-2 cursor-pointer uppercase tracking-widest`}>RENDIR</button>
                    ) : (
                      <span className="text-[8px] font-black text-emerald-500 flex-shrink-0 ml-2">APROBADO</span>
                    )}
                  </div>

                  {profile.job && (
                    <div className={`flex items-center justify-between py-2 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <Award size={14} className={isProfessionalTestDone ? "text-purple-500 flex-shrink-0" : `${isDarkMode ? 'text-white/30' : 'text-neutral-300'} flex-shrink-0`} />
                        <span className={`text-[9px] font-black tracking-widest ${isDarkMode ? 'text-white' : 'text-neutral-900'} truncate`}>TEST PROFESIONAL</span>
                      </div>
                      {!isProfessionalTestDone ? (
                        <button onClick={() => navigate(`/academy-test/${encodeURIComponent(profile.job)}`)} className={`text-[8px] font-black ${isDarkMode ? 'text-purple-300 hover:text-white' : 'text-purple-600 hover:text-neutral-900'} flex-shrink-0 ml-2 cursor-pointer uppercase tracking-widest`}>RENDIR</button>
                      ) : (
                        <span className="text-[8px] font-black text-emerald-500 flex-shrink-0 ml-2">APROBADO</span>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => navigate('/academy')} className={`w-full py-3 ${isDarkMode ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/15 text-white' : 'bg-black/[0.04] hover:bg-black/[0.08] border-black/15 text-neutral-900'} border rounded-xl text-[9px] font-black tracking-widest transition-all flex items-center justify-center gap-2 box-border cursor-pointer font-['Poppins'] shadow-sm`}>
                  <GraduationCap size={14} className="text-purple-500"/> IR A CLASSCODE ACADEMY
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-l-2 border-purple-500 pl-4">
                  <h3 className={`text-[10px] ${isDarkMode ? 'text-white/70' : 'text-neutral-700'} uppercase tracking-[0.4em] font-black flex items-center gap-2`}><MessageSquare size={12}/> Mensajes</h3>
                  <span className="text-[9px] text-purple-500 font-black">{messages.length}</span>
                </div>
                <div className="space-y-3 max-h-[240px] overflow-y-auto no-scrollbar">
                  {messages.length === 0 ? (
                    <div className={`text-center py-6 text-[8px] ${isDarkMode ? 'text-white/50' : 'text-neutral-400'} uppercase font-black tracking-widest`}>No hay chats activos</div>
                  ) : messages.map(chat => (
                    <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className={`flex justify-between items-center py-3 border-b ${isDarkMode ? 'border-white/10 hover:border-purple-400' : 'border-black/10 hover:border-purple-600'} transition-all cursor-pointer box-border`}>
                       <div className="flex items-center gap-3 min-w-0">
                          {chat.clientPhoto ? <img src={chat.clientPhoto} className={`w-8 h-8 rounded-lg object-cover border ${isDarkMode ? 'border-white/15' : 'border-black/15'} flex-shrink-0`} alt="" /> : <div className={`w-8 h-8 rounded-lg ${isDarkMode ? 'bg-white/5 border-white/15 text-white/60' : 'bg-black/5 border-black/15 text-neutral-600'} border flex items-center justify-center flex-shrink-0`}><User size={14}/></div>}
                          <div className="min-w-0">
                             <p className={`text-[9px] font-black ${isDarkMode ? 'text-white' : 'text-neutral-900'} uppercase tracking-wider truncate`}>{chat.clientName || "CLIENTE"}</p>
                             <p className={`text-[7px] ${isDarkMode ? 'text-white/60' : 'text-neutral-500'} font-bold uppercase mt-0.5`}>Ver chat</p>
                          </div>
                       </div>
                       <ArrowRight size={12} className={`${isDarkMode ? 'text-white/40' : 'text-neutral-400'} flex-shrink-0 ml-2`} />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="lg:col-span-8 space-y-12 min-w-0 box-border">
              <section className="space-y-6">
                <div className="flex justify-between items-center border-l-2 border-purple-500 pl-4">
                  <h3 className={`text-[10px] ${isDarkMode ? 'text-white/70' : 'text-neutral-700'} uppercase tracking-[0.4em] font-black`}>Portfolio — Galería de Fotos</h3>
                  <span className="text-[9px] text-purple-500 font-mono">{Array.from({ length: 10 }, (_, i) => profile[`photo${i + 1}`]).filter(Boolean).length}/10 FOTOS</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <div 
                      key={num} 
                      className={`aspect-square rounded-xl overflow-hidden border ${isDarkMode ? 'border-white/15 bg-black/40' : 'border-black/15 bg-black/5'} group relative flex items-center justify-center box-border transform-gpu translate-z-0`}
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      {profile[`photo${num}`] ? (
                        <>
                          <img src={profile[`photo${num}`]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90" alt="" />
                          <button onClick={async () => {
                            const updates = { [`photo${num}`]: '' };
                            setProfile(prev => ({ ...prev, ...updates }));
                            await persistProfile(updates);
                          }} className={`absolute top-2 right-2 p-2 ${isDarkMode ? 'bg-black/80 text-red-300 border-white/20' : 'bg-white/90 text-red-600 border-black/20'} rounded-lg opacity-0 group-hover:opacity-100 transition-all border cursor-pointer`}><X size={12} /></button>
                        </>
                      ) : (
                        <label className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer ${isDarkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'} transition-all p-4 text-center`}>
                          <Upload size={20} className={`${isDarkMode ? 'text-white/40' : 'text-neutral-400'} mb-2`} />
                          <span className={`text-[7px] font-black tracking-widest ${isDarkMode ? 'text-white/60' : 'text-neutral-600'}`}>SUBIR FOTO {num}</span>
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

        <footer className={`w-full ${isDarkMode ? 'bg-[#070709] border-white/10 text-white' : 'bg-neutral-900 border-black/10 text-white'} py-12 px-6 border-t text-center relative z-10 box-border font-['Poppins'] mt-auto`}>
          <div className="max-w-[1400px] mx-auto box-border">
            <h2 className="text-2xl md:text-3xl font-normal tracking-[0.05em] uppercase mb-3 opacity-90">CLASSCODE</h2>
            <p className="text-[9px] uppercase tracking-[0.4em] font-bold opacity-60">© 2026 — TODOS LOS DERECHOS RESERVADOS</p>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 p-4 box-border overflow-x-hidden uppercase">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className={`${isDarkMode ? 'bg-[#070709] border-white/15 text-white' : 'bg-white border-black/15 text-neutral-900'} w-full max-w-lg p-6 md:p-8 rounded-2xl border relative space-y-6 max-h-[90vh] flex flex-col box-border shadow-2xl`}
            >
              <button onClick={() => setIsEditingProfile(false)} className={`absolute top-6 right-6 ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'} transition-colors cursor-pointer p-2 z-10`}><X size={22} /></button>
              
              <h3 className={`text-[11px] font-['Poppins'] tracking-[0.3em] font-black border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'} pb-4`}>Editar Perfil Profesional</h3>
              
              <div className="space-y-4 font-bold overflow-y-auto pr-2 flex-1 scrollbar-hide text-left box-border">
                <div className="space-y-2">
                  <label className={`text-[8px] ${isDarkMode ? 'text-white/80' : 'text-neutral-700'} tracking-widest font-black`}>Nombre Completo / Artístico</label>
                  <input 
                    className={`w-full ${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white' : 'bg-black/[0.02] border-black/15 text-neutral-900'} border rounded-xl px-4 py-3 text-[10px] uppercase outline-none focus:border-purple-500 tracking-widest box-border`} 
                    value={profile.name || ''} 
                    onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 relative">
                    <label className={`text-[8px] ${isDarkMode ? 'text-white/80' : 'text-neutral-700'} tracking-widest font-black`}>Rubro Principal</label>
                    <div 
                      onClick={() => setOpenDropdown(openDropdown === 'job' ? null : 'job')}
                      className={`w-full ${isDarkMode ? 'bg-[#0b0c10] border-white/15 text-white' : 'bg-white border-black/15 text-neutral-900'} border rounded-xl px-4 py-3 text-[10px] uppercase flex items-center justify-between cursor-pointer`}
                    >
                      <span className="truncate">{profile.job || "SELECCIONAR"}</span>
                      <ChevronDown size={14} className={`transition-transform ${openDropdown === 'job' ? 'rotate-180' : ''}`} />
                    </div>

                    {openDropdown === 'job' && (
                      <div className={`absolute top-full left-0 right-0 mt-1 z-50 ${isDarkMode ? 'bg-[#0b0c10] border-white/20 text-white' : 'bg-white border-black/20 text-neutral-900'} border rounded-xl shadow-2xl max-h-52 overflow-y-auto`}>
                        <div 
                          onClick={() => { setProfile(prev => ({ ...prev, job: "", specialty: [] })); setOpenDropdown(null); }}
                          className={`px-4 py-3 text-[10px] cursor-pointer hover:bg-purple-500/20 border-b ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}
                        >
                          SELECCIONAR
                        </div>
                        {Object.keys(RUBROS).map(rubro => (
                          <div 
                            key={rubro}
                            onClick={() => { setProfile(prev => ({ ...prev, job: rubro, specialty: [] })); setOpenDropdown(null); }}
                            className={`px-4 py-3 text-[10px] cursor-pointer hover:bg-purple-500/20 flex items-center justify-between ${profile.job === rubro ? 'text-purple-400 font-black' : ''}`}
                          >
                            <span>{rubro}</span>
                            {profile.job === rubro && <Check size={12} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 relative">
                    <label className={`text-[8px] ${isDarkMode ? 'text-white/80' : 'text-neutral-700'} tracking-widest font-black`}>Provincia</label>
                    <div 
                      onClick={() => setOpenDropdown(openDropdown === 'location' ? null : 'location')}
                      className={`w-full ${isDarkMode ? 'bg-[#0b0c10] border-white/15 text-white' : 'bg-white border-black/15 text-neutral-900'} border rounded-xl px-4 py-3 text-[10px] uppercase flex items-center justify-between cursor-pointer`}
                    >
                      <span className="truncate">{profile.location || "SELECCIONAR"}</span>
                      <ChevronDown size={14} className={`transition-transform ${openDropdown === 'location' ? 'rotate-180' : ''}`} />
                    </div>

                    {openDropdown === 'location' && (
                      <div className={`absolute top-full left-0 right-0 mt-1 z-50 ${isDarkMode ? 'bg-[#0b0c10] border-white/20 text-white' : 'bg-white border-black/20 text-neutral-900'} border rounded-xl shadow-2xl max-h-52 overflow-y-auto`}>
                        <div 
                          onClick={() => { setProfile(prev => ({ ...prev, location: "" })); setOpenDropdown(null); }}
                          className={`px-4 py-3 text-[10px] cursor-pointer hover:bg-purple-500/20 border-b ${isDarkMode ? 'border-white/5' : 'border-black/5'}`}
                        >
                          SELECCIONAR
                        </div>
                        {PROVINCIAS.map(prov => (
                          <div 
                            key={prov}
                            onClick={() => { setProfile(prev => ({ ...prev, location: prov })); setOpenDropdown(null); }}
                            className={`px-4 py-3 text-[10px] cursor-pointer hover:bg-purple-500/20 flex items-center justify-between ${profile.location === prov ? 'text-purple-400 font-black' : ''}`}
                          >
                            <span>{prov.toUpperCase()}</span>
                            {profile.location === prov && <Check size={12} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {profile.job && RUBROS[profile.job] && (
                  <div className="space-y-2 relative">
                    <label className={`text-[8px] ${isDarkMode ? 'text-white/80' : 'text-neutral-700'} tracking-widest font-black`}>
                      Especialidades (Podés seleccionar varias)
                    </label>
                    
                    <div 
                      onClick={() => setOpenDropdown(openDropdown === 'specialty' ? null : 'specialty')}
                      className={`w-full ${isDarkMode ? 'bg-[#0b0c10] border-white/15 text-white' : 'bg-white border-black/15 text-neutral-900'} border rounded-xl px-4 py-3 text-[10px] uppercase flex items-center justify-between cursor-pointer`}
                    >
                      <span className="truncate">
                        {Array.isArray(profile.specialty) && profile.specialty.length > 0 
                          ? profile.specialty.join(', ') 
                          : "SELECCIONAR ESPECIALIDADES"}
                      </span>
                      <ChevronDown size={14} className={`transition-transform ${openDropdown === 'specialty' ? 'rotate-180' : ''}`} />
                    </div>

                    {openDropdown === 'specialty' && (
                      <div className={`absolute top-full left-0 right-0 mt-1 z-50 ${isDarkMode ? 'bg-[#0b0c10] border-white/20 text-white' : 'bg-white border-black/20 text-neutral-900'} border rounded-xl shadow-2xl max-h-52 overflow-y-auto`}>
                        {RUBROS[profile.job].map(spec => {
                          const isSelected = Array.isArray(profile.specialty) && profile.specialty.includes(spec);
                          return (
                            <div 
                              key={spec}
                              onClick={() => toggleSpecialty(spec)}
                              className={`px-4 py-3 text-[10px] cursor-pointer hover:bg-purple-500/20 flex items-center justify-between ${isSelected ? 'text-purple-400 font-black' : ''}`}
                            >
                              <span>{spec.toUpperCase()}</span>
                              {isSelected && <Check size={12} />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className={`text-[8px] ${isDarkMode ? 'text-white/80' : 'text-neutral-700'} tracking-widest font-black`}>Biografía / Presentación</label>
                  <textarea 
                    className={`w-full ${isDarkMode ? 'bg-white/[0.04] border-white/15 text-white' : 'bg-black/[0.02] border-black/15 text-neutral-900'} border rounded-xl px-4 py-3 text-[10px] uppercase h-28 resize-none outline-none focus:border-purple-500 tracking-widest box-border`} 
                    value={profile.bio || ''} 
                    onChange={e => setProfile(prev => ({ ...prev, bio: e.target.value }))} 
                  />
                </div>
              </div>

              <div className={`pt-4 flex justify-end gap-3 border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                <button type="button" onClick={() => setIsEditingProfile(false)} className={`px-5 py-3 ${isDarkMode ? 'bg-white/[0.04] border-white/15 hover:bg-white/[0.08] text-white' : 'bg-black/[0.04] border-black/15 hover:bg-black/[0.08] text-neutral-900'} border rounded-xl text-[9px] font-black tracking-widest transition-all cursor-pointer`}>
                  Descartar
                </button>
                <button type="button" onClick={handleSaveProfileData} className={`px-6 py-3 ${isDarkMode ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/15 text-white' : 'bg-black/[0.04] border-black/15 hover:bg-black/[0.08] text-neutral-900'} border rounded-xl text-[9px] font-black tracking-widest transition-all cursor-pointer flex items-center gap-2`}>
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