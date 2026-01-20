import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; 
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, GraduationCap, PlayCircle, User, ChevronDown, Upload, X, Eye, Menu, ShieldCheck, Zap, Lock, CheckCircle2 } from 'lucide-react'; 
import CustomModal from './components/CustomModal'; 

export default function Dashboard() {
  const [profile, setProfile] = useState({
    name: '', job: '', location: '', bio: '', instagram: '', videoLink: '', 
    photo1: '', photo2: '', photo3: '', photo4: '', photo5: '', 
    photo6: '', photo7: '', photo8: '', photo9: '', photo10: '',
    academyPoints: 0, verified: false, isPro: false, score: 0,
    completedCourses: [] 
  });
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const [uploadingStatus, setUploadingStatus] = useState({
    video: false,
    ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`photo${i + 1}`, false]))
  });

  const [modal, setModal] = useState({ 
    isOpen: false, title: '', message: '', type: 'warning', isConfirm: true, onConfirm: () => {} 
  });
  
  const navigate = useNavigate();
  const CLOUD_NAME = "dsyfitywd";
  const UPLOAD_PRESET = "CLASSCODE"; 

  const categories = [
    'Fotografía', 'Video / Filmmaker', 'DJ / Sonido', 'Modelo / Presencia', 
    'Locaciones', 'Makeup', 'Pelo', 'Estilismo / Moda', 'Diseño Gráfico',
    'Catering / Barra', 'Animación / Show', 'Ambientación', 'Técnica / Ilum.'
  ];

  // --- LÓGICA DE BLOQUEO Y RUBRO ---
  const isGenericoDone = profile.completedCourses && profile.completedCourses.includes('cert_generico');
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
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists() && userSnap.data().role !== 'professional') {
             navigate('/home');
             return;
          }
          const docSnap = await getDoc(doc(db, "professionals", user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            const photosData = {};
            data.photos?.forEach((url, i) => { if(i < 10) photosData[`photo${i+1}`] = url; });
            setProfile(prev => ({ 
                ...prev, 
                ...data, 
                ...photosData,
                completedCourses: data.completedCourses || [] 
            }));
          }
          const chatsRef = collection(db, "chats");
          const q = query(chatsRef, where("participants", "array-contains", user.uid));
          const chatSnap = await getDocs(q);
          setMessages(chatSnap.docs.map(chatDoc => ({ id: chatDoc.id, ...chatDoc.data() })));
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
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
        const finalData = { ...profile, photos: photoList };
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

  if (loading) return <div className="min-h-screen bg-[#282929] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-['Poppins'] font-black">Sincronizando...</div>;

  return (
    <div className="min-h-screen bg-[#282929] text-white font-['Open_Sans'] p-4 md:p-10 relative antialiased">
      <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 pb-20">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-8 gap-6 md:gap-0">
          <div className="w-full flex justify-between items-center md:w-auto">
            <div className="flex flex-col items-start space-y-3">
              <h1 onClick={() => navigate('/home')} className="text-[20px] md:text-[22px] font-normal tracking-[0.35em] text-white uppercase font-['Poppins'] cursor-pointer">CLASSCODE</h1>
              <div className="flex items-center gap-3 md:gap-4">
                <button onClick={() => navigate('/client-profile')} className="text-[6px] md:text-[7px] font-black tracking-[0.3em] text-gray-600 uppercase">MODO CLIENTE</button>
                <div className="w-[1px] h-3 bg-white/10" />
                <button className="text-[6px] md:text-[7px] font-black tracking-[0.3em] text-purple-500 uppercase">MODO PROFESIONAL</button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => navigate(`/profile/${auth.currentUser?.uid}`)} className="p-2 text-gray-500 hover:text-white"><Eye size={18} /></button>
            <button onClick={() => navigate('/plans')} className="px-6 py-1.5 rounded-full bg-[#f1ad02] text-black text-[8px] font-black uppercase tracking-widest"><Star size={11} className="inline mr-1" /> PRO</button>
            <button onClick={() => navigate('/academy')} className="px-6 py-1.5 rounded-full bg-[#2a233c] text-[#a890fe] border border-[#4a3a6b] text-[8px] font-black uppercase tracking-widest"><GraduationCap size={12} className="inline mr-1" /> ACADEMY</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
          
          <div className="space-y-10 order-2 lg:order-1">
            {/* --- SECCIÓN CERTIFICACIONES DINÁMICAS --- */}
            <section className="space-y-4">
               <h3 className="text-[9px] text-gray-500 font-black uppercase tracking-[0.4em] border-b border-white/5 pb-2">Nivelaciones Obligatorias</h3>
               <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 space-y-6">
                  
                  {/* 1. NIVELACIÓN INGRESO (GENÉRICA) */}
                  <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-full ${isGenericoDone ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-500'}`}>
                        {isGenericoDone ? <CheckCircle2 size={20}/> : <Zap size={20} fill="currentColor"/>}
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">Nivelación 1: Ingreso</p>
                        <p className="text-[7px] text-gray-500 uppercase tracking-widest font-bold">
                           {isGenericoDone ? 'VERIFICADO' : 'OBLIGATORIO (+150 PTS)'}
                        </p>
                     </div>
                     {!isGenericoDone && (
                        <button onClick={() => navigate('/academy-test/Generico')} className="ml-auto bg-amber-500 text-black p-2 rounded-full hover:scale-110 transition-transform"><ArrowRight size={14}/></button>
                     )}
                  </div>

                  <div className="w-full h-[1px] bg-white/5" />

                  {/* 2. NIVELACIÓN ESPECÍFICA (RUBRO) */}
                  {profile.job ? (
                    <div className={`flex items-center gap-4 transition-all ${!isGenericoDone ? 'opacity-30' : 'opacity-100'}`}>
                       <div className={`p-3 rounded-full ${isJobCertDone ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-white/5 text-gray-500'}`}>
                          {isJobCertDone ? <ShieldCheck size={20}/> : <Lock size={20}/>}
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white">Nivelación 2: {profile.job.toUpperCase()}</p>
                          <p className="text-[7px] text-gray-400 uppercase tracking-widest font-bold">Técnica Profesional (+250 PTS)</p>
                       </div>
                       {isGenericoDone && !isJobCertDone && (
                          <button onClick={() => navigate(`/academy-test/${encodeURIComponent(profile.job)}`)} className="ml-auto bg-purple-600 text-white p-2 rounded-full hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20"><ArrowRight size={14}/></button>
                       )}
                    </div>
                  ) : (
                    <p className="text-[7px] text-gray-700 uppercase font-black text-center italic py-2">Selecciona tu categoría para habilitar el test técnico.</p>
                  )}

                  {/* MENÚ DESPLEGABLE DE OTRAS ESPECIALIDADES (Opcional/Extra) */}
                  <div className="pt-2 border-t border-white/5">
                     <div onClick={() => isGenericoDone && setIsExpanded(!isExpanded)} className={`flex justify-between items-center px-1 group ${isGenericoDone ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}>
                        <p className="text-[7px] font-black uppercase tracking-[0.3em] text-gray-600 group-hover:text-purple-400">Otras especialidades</p>
                        {isGenericoDone && <ChevronDown size={12} className={`text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                     </div>
                     <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                        {categories.filter(c => c !== profile.job).map(cat => {
                           const certId = `cert_${cat.toLowerCase().replace(/\s/g, '')}`;
                           const isDone = profile.completedCourses?.includes(certId);
                           return (
                              <button key={cat} disabled={isDone} onClick={() => navigate(`/academy-test/${encodeURIComponent(cat)}`)} className={`text-left py-3 px-4 border rounded-xl text-[8px] font-bold uppercase tracking-widest ${isDone ? 'bg-purple-900/20 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/5'}`}>
                                 {cat}
                              </button>
                           );
                        })}
                     </div>
                  </div>
               </div>
            </section>

            {/* REPUTACIÓN */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1 text-[8px] font-black tracking-[0.3em] text-gray-500 uppercase">
                <span>Reputación Acumulada</span>
                <span className="text-purple-400 font-bold">{calculateTotalScore()} PUNTOS</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div className="h-full bg-purple-600 transition-all duration-1000 shadow-[0_0_15px_rgba(147,51,234,0.4)]" style={{ width: `${Math.min((calculateTotalScore() / 2000) * 100, 100)}%` }} />
              </div>
            </div>

            {/* CHATS */}
            <div className="space-y-4">
               <span className="text-[8px] font-black tracking-[0.3em] text-gray-500 uppercase border-b border-white/5 pb-1 block">Mensajería Activa</span>
               <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                  {messages.length === 0 ? <p className="text-center py-6 text-[7px] text-gray-700 uppercase italic">Sin chats pendientes</p> : messages.map(chat => (
                    <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex justify-between items-center py-4 border-b border-white/5 hover:border-purple-500/20 cursor-pointer px-2 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full border border-white/10 bg-black flex items-center justify-center grayscale group-hover:grayscale-0 transition-all overflow-hidden">
                             {chat.clientPhoto ? <img src={chat.clientPhoto} className="w-full h-full object-cover" /> : <User size={12} className="text-gray-700" />}
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-white uppercase tracking-wider">{chat.clientName || "Usuario"}</p>
                             <p className="text-[7px] text-purple-400 uppercase font-bold italic">Mensaje Privado</p>
                          </div>
                       </div>
                       <ArrowRight size={12} className="text-gray-800 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="space-y-10 order-1 lg:order-2">
            {/* MATERIAL SHOWREEL */}
            <div className="space-y-4">
               <h3 className="text-[9px] text-gray-500 font-black uppercase tracking-[0.4em] border-b border-white/5 pb-2">Showreel</h3>
               <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/5 relative flex items-center justify-center group shadow-2xl">
                 {profile.videoLink ? <video src={profile.videoLink} controls className="w-full h-full object-cover" /> : (
                   <div className="text-center space-y-3 opacity-30 group-hover:opacity-100 transition-all">
                     <PlayCircle size={40} strokeWidth={1} className="text-white mx-auto"/><p className="text-[7px] text-gray-400 tracking-[0.4em] font-black uppercase italic">Cargar Video Profesional</p>
                   </div>
                 )}
                 {!profile.videoLink && <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />}
                 {uploadingStatus.video && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[8px] font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando Video...</div>}
               </div>
            </div>

            {/* FORMULARIO IDENTIDAD */}
            <div className="space-y-6 bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl shadow-black/40">
               <div className="space-y-1 border-b border-white/5">
                  <label className="text-[6px] font-black tracking-[0.4em] text-gray-600 uppercase">Nombre / Marca</label>
                  <input className="w-full bg-transparent py-2 text-[12px] outline-none focus:text-purple-400 uppercase font-bold transition-all" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
               </div>
               <div className="space-y-1 border-b border-white/5 relative">
                  <label className="text-[6px] font-black tracking-[0.4em] text-gray-600 uppercase">Categoría Principal</label>
                  <select className="w-full bg-transparent py-2 text-[12px] outline-none appearance-none uppercase font-bold cursor-pointer" value={profile.job} onChange={e => setProfile({...profile, job: e.target.value})}>
                    <option value="" className="bg-[#282929]">Seleccionar Rubro</option>
                    {categories.map(cat => <option key={cat} value={cat} className="bg-[#282929]">{cat.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown size={10} className="absolute right-0 bottom-3 text-gray-600 pointer-events-none"/>
               </div>
               <div className="space-y-1 border-b border-white/5">
                  <label className="text-[6px] font-black tracking-[0.4em] text-gray-600 uppercase">Ubicación</label>
                  <input className="w-full bg-transparent py-2 text-[12px] outline-none focus:text-purple-400 uppercase font-bold transition-all" value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} />
               </div>
               <div className="space-y-1 border-b border-white/5">
                  <label className="text-[6px] font-black tracking-[0.4em] text-gray-600 uppercase">Biografía (Experiencia / Estilo)</label>
                  <textarea className="w-full bg-transparent py-3 text-[11px] outline-none focus:text-purple-400 uppercase h-28 resize-none font-bold leading-relaxed" placeholder="DESCRIBE TU VISIÓN PROFESIONAL..." value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} />
               </div>
            </div>
          </div>
        </div>

        {/* PORTFOLIO VISUAL */}
        <div className="space-y-6">
          <h3 className="text-[9px] text-gray-500 font-black uppercase tracking-[0.4em] border-b border-white/5 pb-2">Portfolio Visual (Max 10)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
              <div key={num} className="group relative aspect-square bg-white/[0.02] border border-white/5 overflow-hidden rounded-[1.5rem] shadow-xl hover:border-purple-500/30 transition-all">
                {profile[`photo${num}`] ? (
                  <>
                    <img src={profile[`photo${num}`]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <button onClick={() => setProfile({...profile, [`photo${num}`]: ''})} className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-xl opacity-0 group-hover:opacity-100 backdrop-blur-md transition-all"><X size={12} /></button>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all">
                    <Upload size={18} className="text-gray-700 mb-2 group-hover:text-purple-500 transition-colors"/>
                    <span className="text-[5px] font-black tracking-[0.4em] text-gray-700 uppercase">Espacio {num}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, `photo${num}`)} className="hidden" />
                  </label>
                )}
                {uploadingStatus[`photo${num}`] && <div className="absolute inset-0 bg-black/80 flex items-center justify-center animate-pulse text-purple-400 text-[7px] font-black uppercase tracking-widest">Subiendo...</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-10 text-center">
          <button onClick={handleSave} className="w-full max-w-md mx-auto py-5 text-[11px] tracking-[0.6em] font-black uppercase rounded-[2rem] bg-gradient-to-r from-purple-600 to-indigo-900 text-white shadow-[0_15px_40px_rgba(147,51,234,0.3)] hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-95 transition-all">
            ACTUALIZAR PERFIL
          </button>
        </div>
      </div>
      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} type={modal.type} onConfirm={modal.onConfirm} isConfirm={modal.isConfirm} />
    </div>
  );
}

