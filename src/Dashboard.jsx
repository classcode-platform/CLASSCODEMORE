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
    name: '', job: '', location: '', bio: '', instagram: '', videoLink: '', 
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

  const categories = [
    'Fotografía', 'Video / Filmmaker', 'DJ / Sonido', 'Modelo / Presencia', 
    'Locaciones', 'Makeup / Pelo', 'Estilismo / Moda', 'Diseño Gráfico',
    'Catering / Barra', 'Animación / Show', 'Ambientación', 'Técnica / Ilum.'
  ];

  const isGenericoDone = profile.completedCourses?.includes('cert_generico');
  const proCourseId = profile.job ? `cert_${profile.job.toLowerCase().replace(/\s/g, '')}` : null;
  const isProfessionalTestDone = proCourseId && profile.completedCourses?.includes(proCourseId);

  const isProfileVisible = profile.name?.trim() && profile.bio?.trim() && profile.photo1;
    // Lógica de cálculo corregida: Usa el score de la Academy (data.score) y suma lo del perfil
    const calculateTotalScore = (currentProfile) => {
      let bonus = 0;
      if (currentProfile.name?.trim()) bonus += 15;
      if (currentProfile.job?.trim()) bonus += 15;
      const photoCount = Array.from({ length: 10 }, (_, i) => currentProfile[`photo${i + 1}`]).filter(Boolean).length;
      bonus += photoCount * 5; 
      if (currentProfile.videoLink) bonus += 20;
      
      // El score base viene de lo que ya está en Firestore (Academy, etc)
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
                // Guardamos el score de la DB por separado para el cálculo
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
  
    // FUNCIÓN DE GUARDADO ÚNICA (Persiste Score y Datos)
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
      if (!profile.job) return setModal({ isOpen: true, title: 'ATENCIÓN', message: 'SELECCIONÁ CATEGORÍA.', type: 'warning' });
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

      <header className="md:hidden fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-b border-white/5 z-[100] px-8 py-6 flex justify-between items-center">
        <div onClick={() => navigate('/home')} className="text-[18px] font-['Poppins'] font-normal tracking-[0.05em] uppercase cursor-pointer">CLASSCODE</div>
        <div className="flex items-center gap-6">
           <button onClick={() => setIsMobileMenuOpen(true)} className="text-white"><Menu size={28} /></button>
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] md:hidden" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 bottom-0 w-[85%] bg-[#050505] z-[120] p-12 flex flex-col md:hidden shadow-2xl">
              <button onClick={() => setIsMobileMenuOpen(false)} className="self-end mb-12 text-gray-500"><X size={32} /></button>
              
              <button onClick={handleSwitchToClient} className="mb-12 w-full flex items-center justify-between bg-white/[0.03] border border-white/10 p-5 rounded-2xl group hover:bg-purple-500/10 transition-all">
                <div className="flex items-center gap-4 text-left leading-none">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400"><RefreshCcw size={20} /></div>
                  <div>
                    <p className="text-[7px] font-black text-gray-500 tracking-[0.2em]">SWITCH MOOD</p>
                    <p className="text-[11px] font-black text-white tracking-widest uppercase mt-1">MODO EXPERIENCE</p>
                  </div>
                </div>
              </button>

              <nav className="flex-1 space-y-12">
                <button onClick={() => {navigate('/dashboard'); setIsMobileMenuOpen(false);}} className="flex items-center gap-6 text-[12px] font-black tracking-widest leading-none"><LayoutDashboard size={22} className="text-purple-500"/> DASHBOARD</button>
                <button onClick={() => {navigate('/academy'); setIsMobileMenuOpen(false);}} className="flex items-center gap-6 text-[12px] font-black tracking-widest leading-none text-gray-400"><GraduationCap size={22}/> ACADEMY</button>
              </nav>
              <button onClick={() => auth.signOut()} className="flex items-center gap-6 text-gray-700 text-[10px] font-black tracking-widest leading-none"><LogOut size={20}/> SALIR</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-72 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex-col p-10 fixed h-full z-50">
        <header className="mb-12 text-left leading-none">
          <div onClick={() => navigate('/home')} className="text-[22px] font-['Poppins'] font-normal tracking-[0.05em] leading-none cursor-pointer uppercase text-white">CLASSCODE</div>
          <p className="text-purple-400 text-[10px] font-bold tracking-[0.3em] mt-2 leading-none uppercase">Talent</p>
        </header>
        
        <div className="mb-12 text-left">
          <button onClick={handleSwitchToClient} className="w-full flex items-center justify-between bg-white/[0.03] border border-white/10 p-4 rounded-2xl group hover:bg-purple-500/10 transition-all leading-none">
            <div className="flex items-center gap-3 text-left leading-none">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" /></div>
              <div>
                <p className="text-[6px] font-black text-gray-500 tracking-[0.2em] leading-none">SWITCH MOOD</p>
                <p className="text-[9px] font-black text-white tracking-widest uppercase mt-1 leading-none">MODO EXPERIENCE</p>
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 space-y-8 text-left">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-4 text-white text-[10px] font-black tracking-widest leading-none"><LayoutDashboard size={18} className="text-purple-500"/> DASHBOARD</button>
          <button onClick={() => navigate('/academy')} className="flex items-center gap-4 text-gray-500 hover:text-white text-[10px] font-black tracking-widest leading-none transition-all"><GraduationCap size={18}/> ACADEMY</button>
          <button onClick={() => navigate(`/profile/${auth.currentUser?.uid}`)} className="flex items-center gap-4 text-gray-500 hover:text-white text-[10px] font-black tracking-widest leading-none transition-all"><Eye size={18}/> MI PERFIL PÚBLICO</button>
        </nav>
        <button onClick={() => auth.signOut()} className="flex items-center gap-4 text-gray-700 hover:text-red-500 text-[10px] font-black tracking-widest transition-all mt-auto pt-8 border-t border-white/5 leading-none"><LogOut size={18}/> CERRAR SESIÓN</button>
      </aside>

      <main className="flex-1 md:ml-72 p-6 md:p-16 mt-24 md:mt-0 space-y-8 relative z-10 w-full max-w-[1600px] mx-auto">
        
        <header className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] backdrop-blur-md">
          <div className="flex items-center gap-4 md:gap-6 text-left leading-none">
            <div className="relative group w-14 h-14 md:w-16 md:h-16 flex-shrink-0 leading-none">
               <div className="w-full h-full rounded-full border-2 border-purple-500/20 overflow-hidden bg-white/5 shadow-2xl leading-none">
                 {profile.photo1 ? <img src={profile.photo1} className="w-full h-full object-cover" /> : <User size={24} className="m-auto mt-4 text-gray-700"/>}
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
                <button onClick={() => setIsEditingProfile(true)} className="text-gray-600 hover:text-purple-400 transition-colors leading-none"><Edit3 size={18} /></button>
              </div>
              <p className="text-[8px] md:text-[10px] text-purple-400 font-bold tracking-[0.3em] uppercase leading-none">{profile.job || 'SIN CATEGORÍA'}</p>
            </div>
          </div>
          <div className="flex items-center gap-8 leading-none">
             <div className="text-right hidden sm:block leading-none">
                <p className="text-[14px] font-black text-white tracking-tighter italic leading-none">{calculateTotalScore(profile)} PTS</p>
                <p className="text-[7px] text-purple-400 font-black uppercase tracking-widest mt-1 leading-none">Reputación</p>
             </div>
             <Bell size={20} className="text-gray-600 cursor-pointer hover:text-white transition-colors" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left">
          <div className="space-y-12">
            <section className="bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 space-y-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Award size={100} /></div>
               <h3 className="text-[9px] text-gray-500 font-black tracking-[0.4em] uppercase leading-none">Estatus de Carrera</h3>
               <div className="space-y-6 leading-none">
                  <div className="flex items-center gap-4 leading-none">
                    <div className={`p-4 rounded-2xl ${isGenericoDone ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-500'} leading-none`}>
                       {isGenericoDone ? <CheckCircle2 size={24}/> : <Zap size={24} fill="currentColor" className="animate-pulse"/>}
                    </div>
                    <div className="leading-none">
                       <p className="text-[11px] font-black uppercase tracking-widest italic leading-none">Nivelación Ingreso</p>
                       <p className="text-[8px] text-gray-500 uppercase font-bold mt-2 leading-none">{isGenericoDone ? 'VERIFICADO' : 'PENDIENTE'}</p>
                    </div>
                    {!isGenericoDone && (
                      <button onClick={() => navigate('/academy-test/Generico')} className="ml-auto bg-amber-500/20 border border-amber-500/40 text-amber-500 p-3 rounded-full hover:bg-amber-500 hover:text-black transition-all cursor-pointer relative z-30"><ArrowRight size={18}/></button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 leading-none">
                    <div className={`p-4 rounded-2xl ${isProfessionalTestDone ? 'bg-purple-500/10 text-purple-400' : 'bg-white/5 text-gray-600 border border-white/5'} leading-none`}><Award size={24}/></div>
                    <div className="leading-none">
                       <p className="text-[11px] font-black uppercase tracking-widest italic leading-none">Especialista {profile.job || ''}</p>
                       <p className="text-[8px] text-gray-500 uppercase font-bold mt-2 leading-none">{isProfessionalTestDone ? 'CERTIFICADO ELITE' : profile.job ? `INVITACIÓN AL TEST DE ${profile.job.toUpperCase()}` : 'ASIGNA RUBRO'}</p>
                    </div>
                    {(!isProfessionalTestDone && profile.job) && (
                       <button onClick={() => navigate(`/academy-test/${encodeURIComponent(profile.job)}`)} className="ml-auto bg-purple-600/20 border border-purple-500/40 text-purple-400 p-3 rounded-full hover:bg-purple-600 hover:text-white transition-all shadow-lg cursor-pointer relative z-30"><Zap size={18} fill="currentColor"/></button>
                    )}
                  </div>
               </div>
               </section>
            <section className="space-y-6 leading-none">
               <h3 className="text-[9px] text-gray-500 font-black tracking-[0.4em] uppercase border-b border-white/5 pb-2 flex items-center gap-2 leading-none"><MessageSquare size={12}/> Mensajes</h3>
               <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2 leading-none">
                  {messages.length === 0 ? <p className="text-center py-10 text-[8px] text-gray-700 italic uppercase font-black tracking-widest leading-none">Sin conversaciones</p> : messages.map(chat => (
                    <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex justify-between items-center p-5 bg-white/[0.02] border border-white/5 hover:border-purple-500/30 rounded-[1.5rem] group transition-all cursor-pointer leading-none">
                       <div className="flex items-center gap-5 text-left leading-none">
                          {chat.clientPhoto ? <img src={chat.clientPhoto} className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all border border-white/5" /> : <div className="w-12 h-12 rounded-full bg-white/5 text-gray-700 flex items-center justify-center leading-none"><User size={18}/></div>}
                          <div className="leading-none">
                             <p className="text-[11px] font-black text-white uppercase tracking-tight leading-none">{chat.clientName || "USUARIO"}</p>
                             <p className="text-[8px] text-purple-400 font-black uppercase italic mt-1 leading-none">Nuevo mensaje</p>
                          </div>
                       </div>
                       <ArrowRight size={16} className="text-gray-800 group-hover:text-purple-500 transition-all leading-none" />
                    </div>
                  ))}
               </div>
            </section>
          </div>
          <div className="space-y-12">
            <div className="aspect-video bg-black rounded-[2.5rem] md:rounded-[3rem] overflow-hidden border border-white/5 relative flex items-center justify-center group shadow-2xl leading-none">
               {profile.videoLink ? <video src={profile.videoLink} controls className="w-full h-full object-cover" /> : (
                 <div className="text-center opacity-30 group-hover:opacity-60 transition-opacity leading-none"><PlayCircle size={60} strokeWidth={1} className="text-white mx-auto leading-none"/><p className="text-[8px] font-black uppercase tracking-[0.5em] mt-4 italic leading-none">Cargar Showreel</p></div>
               )}
               <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10 leading-none" />
            </div>
            <section className="space-y-8 pb-32 leading-none">
              <h3 className="text-[9px] text-gray-500 font-black tracking-[0.4em] uppercase border-b border-white/5 pb-2 text-left leading-none">Portfolio</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 leading-none">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                  <div key={num} className="relative aspect-square bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-3xl overflow-hidden group transition-all hover:border-purple-500/50 shadow-xl leading-none">
                    {profile[`photo${num}`] ? (
                      <>
                        <img src={profile[`photo${num}`]} className="w-full h-full object-cover" />
                        <button onClick={async () => {
                          const updates = { [`photo${num}`]: '' };
                          setProfile(prev => ({ ...prev, ...updates }));
                          await persistProfile(updates);
                        }} className="absolute top-2 right-2 p-2 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 text-red-500 transition-all leading-none"><X size={10} /></button>
                      </>
                    ) : (
                      <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-500/5 transition-all leading-none">
                        <Upload size={20} className="text-gray-700 mb-2 leading-none"/><span className="text-[6px] font-black text-gray-800 uppercase tracking-widest italic">ESPACIO {num}</span>
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

      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center p-6 antialiased uppercase leading-none">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#050505] border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 max-w-md w-full space-y-12 shadow-2xl text-center relative leading-none border-t-purple-500/20 uppercase">
              <button onClick={() => setIsEditingProfile(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full leading-none"><X size={24} /></button>
              <h3 className="text-[14px] font-['Poppins'] tracking-[0.3em] uppercase text-white border-b border-white/5 pb-6 text-left leading-none font-bold uppercase">Editar Identidad</h3>
              <div className="space-y-8 text-left leading-none uppercase">
                <div className="space-y-3 leading-none">
                  <label className="text-[8px] text-gray-600 font-black uppercase tracking-[0.3em] pl-1 leading-none">Nombre Profesional</label>
                  <input className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-[12px] font-bold uppercase outline-none focus:border-purple-500 transition-all text-white leading-none shadow-inner" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
                </div>
                <div className="space-y-3 leading-none uppercase">
                  <label className="text-[8px] text-gray-600 font-black uppercase tracking-[0.3em] pl-1 leading-none">Especialidad</label>
                  <select className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-[12px] font-bold uppercase outline-none focus:border-purple-500 transition-all text-white appearance-none cursor-pointer leading-none shadow-inner" value={profile.job} onChange={e => setProfile({...profile, job: e.target.value})}>
                    <option value="" className="bg-black text-white uppercase">RUBRO</option>
                    {categories.map(cat => <option key={cat} value={cat} className="bg-black text-white uppercase">{cat.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-3 leading-none uppercase">
                  <label className="text-[8px] text-gray-600 font-black uppercase tracking-[0.3em] pl-1 leading-none">Biografía</label>
                  <textarea className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-[11px] h-32 resize-none font-bold outline-none focus:border-purple-500 transition-all text-white font-['Open_Sans'] leading-relaxed shadow-inner uppercase" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 leading-none"><button onClick={() => setIsEditingProfile(false)} className="py-5 bg-white/5 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-white/10 leading-none">DESCARTAR</button><button onClick={handleSaveProfileData} className="py-5 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-900/40 hover:bg-purple-500 active:scale-95 transition-all leading-none">GUARDAR</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
}     