import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; 
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Star, GraduationCap, PlayCircle, ChevronDown, 
  Upload, X, Eye, Menu, ShieldCheck, Zap, Lock, CheckCircle2, 
  LayoutDashboard, LogOut, Bell, RefreshCcw 
} from 'lucide-react'; 
import CustomModal from './components/CustomModal'; 
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  
  const [profile, setProfile] = useState({
    name: '', job: '', location: '', bio: '', instagram: '', videoLink: '', 
    photo1: '', photo2: '', photo3: '', photo4: '', photo5: '', 
    photo6: '', photo7: '', photo8: '', photo9: '', photo10: '',
    academyPoints: 0, verified: false, isPro: false, score: 0,
    completedCourses: [] 
  });

  const [uploadingStatus, setUploadingStatus] = useState({
    video: false,
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`photo${i + 1}`, false]))
  });

  const [modal, setModal] = useState({ 
    isOpen: false, title: '', message: '', type: 'warning', isConfirm: true, onConfirm: () => {} 
  });

  const CLOUD_NAME = "dsyfitywd";
  const UPLOAD_PRESET = "CLASSCODE"; 

  const categories = [
    'Fotografía', 'Video / Filmmaker', 'DJ / Sonido', 'Modelo / Presencia', 
    'Locaciones', 'Makeup', 'Pelo', 'Estilismo / Moda', 'Diseño Gráfico',
    'Catering / Barra', 'Animación / Show', 'Ambientación', 'Técnica / Ilum.'
  ];

  const isGenericoDone = profile.completedCourses?.includes('cert_generico');
  const currentJobCertId = profile.job ? `cert_${profile.job.toLowerCase().replace(/\s/g, '')}` : null;
  const isJobCertDone = currentJobCertId && profile.completedCourses?.includes(currentJobCertId);

  const calculateTotalScore = () => {
    let baseScore = 0;
    if (profile.name?.trim()) baseScore += 15;
    if (profile.job?.trim()) baseScore += 15;
    if (profile.location?.trim()) baseScore += 10;
    if (profile.bio?.trim()) baseScore += 10;
    const photoCount = Array.from({ length: 10 }, (_, i) => profile[`photo${i + 1}`]).filter(Boolean).length;
    baseScore += photoCount * 3; 
    if (profile.videoLink) baseScore += 10;
    if (profile.instagram?.trim()) baseScore += 10;
    return baseScore + (profile.score || 0);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const unsubProfile = onSnapshot(doc(db, "professionals", user.uid), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const photosData = {};
              data.photos?.forEach((url, i) => { if(i < 10) photosData[`photo${i+1}`] = url; });
              setProfile(prev => ({ ...prev, ...data, ...photosData, completedCourses: data.completedCourses || [] }));
            }
            setLoading(false);
          });
          const chatsRef = collection(db, "chats");
          const q = query(chatsRef, where("participants", "array-contains", user.uid));
          const chatSnap = await getDocs(q);
          setMessages(chatSnap.docs.map(chatDoc => ({ id: chatDoc.id, ...chatDoc.data() })));
          return () => unsubProfile();
        } catch (error) { console.error(error); setLoading(false); }
      } else { navigate('/'); }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (user) {
      if (!profile.job) return alert("Seleccioná categoría.");
      try {
        const photoList = Array.from({ length: 10 }, (_, i) => profile[`photo${i + 1}`]).filter(p => p && p !== '');
        const finalData = { ...profile, photos: photoList, role: 'professional' };
        await setDoc(doc(db, "professionals", user.uid), finalData, { merge: true });
        setModal({ isOpen: true, type: 'success', title: "GUARDADO", message: "PERFIL ACTUALIZADO.", isConfirm: false, onConfirm: () => {} });
      } catch (e) { console.error(e); }
    }
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
      if (data.secure_url) setProfile(prev => ({ ...prev, [photoField]: data.secure_url }));
    } catch (error) { console.error(error); } 
    finally { setUploadingStatus(prev => ({ ...prev, [photoField]: false })); }
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
      if (data.secure_url) setProfile(prev => ({ ...prev, videoLink: data.secure_url }));
    } catch (error) { console.error(error); } 
    finally { setUploadingStatus(prev => ({ ...prev, video: false })); }
  };

  if (loading) return <div className="min-h-screen bg-[#282929] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-black">Sincronizando...</div>;

  return (
    <div className="min-h-screen bg-[#282929] text-white font-['Open_Sans'] flex overflow-x-hidden uppercase antialiased">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex w-72 bg-[#171717] border-r border-white/5 flex-col p-10 fixed h-full z-50">
        <header className="mb-12 text-left">
          <div onClick={() => navigate('/home')} className="text-[22px] font-['Poppins'] tracking-[0.35em] leading-none cursor-pointer">CLASSCODE</div>
          <p className="text-purple-400 text-[10px] font-bold tracking-[0.3em] mt-2 italic">TALENT PRO</p>
        </header>

        {/* SWITCHER DE MOOD */}
        <div className="mb-12 text-left">
          <button onClick={() => navigate('/client-profile')} className="w-full flex items-center justify-between bg-white/[0.03] border border-white/5 p-4 rounded-2xl group hover:border-purple-500/30 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <div className="text-left">
                <p className="text-[6px] font-black text-gray-500 tracking-[0.2em]">SWITCH MOOD</p>
                <p className="text-[9px] font-black text-white tracking-widest uppercase">MODO CLIENTE</p>
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 space-y-8 text-left">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-4 text-white text-[10px] font-black tracking-widest"><LayoutDashboard size={18} className="text-purple-500"/> DASHBOARD</button>
          <button onClick={() => navigate('/academy')} className="flex items-center gap-4 text-gray-500 hover:text-white text-[10px] font-black tracking-widest transition-all"><GraduationCap size={18}/> ACADEMY</button>
          <button onClick={() => navigate(`/profile/${auth.currentUser?.uid}`)} className="flex items-center gap-4 text-gray-500 hover:text-white text-[10px] font-black tracking-widest transition-all"><Eye size={18}/> MI PERFIL PÚBLICO</button>
        </nav>
        <button onClick={() => auth.signOut()} className="flex items-center gap-4 text-gray-700 hover:text-red-500 text-[10px] font-black tracking-widest transition-all"><LogOut size={18}/> CERRAR SESIÓN</button>
      </aside>

      {/* HEADER MOBILE */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-[#171717]/90 backdrop-blur-lg border-b border-white/5 z-[100] px-6 py-5 flex justify-between items-center">
        <div className="text-[16px] font-['Poppins'] tracking-[0.3em]">CLASSCODE</div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-white"><Menu size={24} /></button>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 md:ml-72 p-6 md:p-16 mt-20 md:mt-0 space-y-12">
        <header className="hidden md:flex justify-between items-center">
          <div className="flex items-center gap-4">
            {profile.photo1 && (
              <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden shadow-lg">
                <img src={profile.photo1} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="text-left">
              <h2 className="text-[14px] font-bold tracking-widest">{profile.name || 'PROFESIONAL'}</h2>
              <p className="text-[8px] text-gray-500 font-black tracking-[0.3em] uppercase">{profile.job || 'SIN CATEGORÍA'}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="text-right">
                <p className="text-[10px] font-black text-purple-400 tracking-widest">{calculateTotalScore()} PTS</p>
                <p className="text-[7px] text-gray-600 font-bold uppercase">Reputación</p>
             </div>
             <Bell size={18} className="text-gray-600 cursor-pointer" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left">
          {/* COLUMNA IZQUIERDA: NIVELACIONES Y CHATS */}
          <div className="space-y-12">
            <section className="bg-[#171717] rounded-[2.5rem] p-8 border border-white/5 space-y-8">
               <h3 className="text-[9px] text-gray-500 font-black tracking-[0.4em] uppercase">Nivelaciones</h3>
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${isGenericoDone ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-500'}`}>
                     {isGenericoDone ? <CheckCircle2 size={20}/> : <Zap size={20} fill="currentColor"/>}
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest">Nivelación 1: Ingreso</p>
                     <p className="text-[7px] text-gray-500 uppercase tracking-widest font-bold font-['Open_Sans']">
                        {isGenericoDone ? 'VERIFICADO' : 'OBLIGATORIO (+150 PTS)'}
                     </p>
                  </div>
                  {!isGenericoDone && <button onClick={() => navigate('/academy-test/Generico')} className="ml-auto bg-amber-500 text-black p-2 rounded-full"><ArrowRight size={14}/></button>}
               </div>
            </section>

            <section className="space-y-6">
               <h3 className="text-[9px] text-gray-500 font-black tracking-[0.4em] uppercase border-b border-white/5 pb-2">Mensajería Activa</h3>
               <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                  {messages.length === 0 ? <p className="text-center py-6 text-[7px] text-gray-700 italic uppercase">Sin chats</p> : messages.map(chat => (
                    <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex justify-between items-center py-4 border-b border-white/5 hover:border-purple-500/20 cursor-pointer px-2 group transition-all">
                       <div className="flex items-center gap-4 text-left">
                          {chat.clientPhoto && <img src={chat.clientPhoto} className="w-10 h-10 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" />}
                          <div>
                             <p className="text-[10px] font-bold text-white uppercase">{chat.clientName || "USUARIO"}</p>
                             <p className="text-[7px] text-purple-400 italic font-bold">MENSAJE PRIVADO</p>
                          </div>
                       </div>
                       <ArrowRight size={12} className="text-gray-800 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ))}
               </div>
            </section>
          </div>

          {/* COLUMNA DERECHA: IDENTIDAD Y SHOWREEL */}
          <div className="space-y-12">
            <div className="aspect-video bg-black rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/5 relative flex items-center justify-center group shadow-2xl">
               {profile.videoLink ? <video src={profile.videoLink} controls className="w-full h-full object-cover" /> : (
                 <div className="text-center opacity-30"><PlayCircle size={40} className="text-white mx-auto"/><p className="text-[7px] text-gray-400 font-black uppercase italic tracking-[0.4em] mt-2">Cargar Showreel</p></div>
               )}
               {!profile.videoLink && <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />}
               {uploadingStatus.video && <div className="absolute inset-0 bg-black/90 flex items-center justify-center animate-pulse text-[8px] font-black">Sincronizando...</div>}
            </div>

            <div className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl">
               <div className="space-y-1 border-b border-white/5">
                  <label className="text-[6px] font-black tracking-[0.4em] text-gray-600">NOMBRE PROFESIONAL</label>
                  <input className="w-full bg-transparent py-2 text-[12px] outline-none font-bold uppercase" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
               </div>
               <div className="space-y-1 border-b border-white/5 relative">
                  <label className="text-[6px] font-black tracking-[0.4em] text-gray-600">CATEGORÍA</label>
                  <select className="w-full bg-transparent py-2 text-[12px] outline-none appearance-none font-bold uppercase cursor-pointer" value={profile.job} onChange={e => setProfile({...profile, job: e.target.value})}>
                    <option value="">SELECCIONAR RUBRO</option>
                    {categories.map(cat => <option key={cat} value={cat} className="bg-[#282929]">{cat.toUpperCase()}</option>)}
                  </select>
               </div>
               <div className="space-y-1 border-b border-white/5">
                  <label className="text-[6px] font-black tracking-[0.4em] text-gray-600">BIOGRAFÍA</label>
                  <textarea className="w-full bg-transparent py-3 text-[11px] h-28 resize-none font-bold leading-relaxed uppercase" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} />
               </div>
            </div>
          </div>
        </div>

        {/* PORTFOLIO VISUAL */}
        <section className="space-y-8 pb-32">
          <h3 className="text-[9px] text-gray-500 font-black tracking-[0.4em] uppercase border-b border-white/5 pb-2 text-left">Portfolio Visual (Max 10)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
              <div key={num} className="relative aspect-square bg-white/[0.02] border border-white/5 rounded-[1.5rem] overflow-hidden group transition-all hover:border-purple-500/30">
                {profile[`photo${num}`] ? (
                  <>
                    <img src={profile[`photo${num}`]} className="w-full h-full object-cover" />
                    <button onClick={() => setProfile({...profile, [`photo${num}`]: ''})} className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 backdrop-blur-md transition-all"><X size={12} /></button>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5">
                    <Upload size={18} className="text-gray-700 mb-2"/><span className="text-[5px] font-black text-gray-700 uppercase">ESPACIO {num}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, `photo${num}`)} className="hidden" />
                  </label>
                )}
                {uploadingStatus[`photo${num}`] && <div className="absolute inset-0 bg-black/80 flex items-center justify-center animate-pulse text-purple-400 text-[7px] font-black">SUBIENDO...</div>}
              </div>
            ))}
          </div>
        </section>

        {/* BOTÓN GUARDAR FIJO MOBILE */}
        <div className="fixed bottom-6 left-6 right-6 md:static flex justify-center z-[90]">
          <button onClick={handleSave} className="w-full max-w-md py-5 text-[11px] tracking-[0.6em] font-black uppercase rounded-[2rem] bg-gradient-to-r from-purple-600 to-indigo-900 text-white shadow-2xl active:scale-95 transition-all">
            ACTUALIZAR PERFIL
          </button>
        </div>
      </main>

      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
}

