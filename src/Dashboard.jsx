import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; 
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LogOut, Trophy, GraduationCap, PlayCircle, User, ChevronDown, Upload, X, AlertCircle, Eye, Menu, ShieldCheck } from 'lucide-react'; 
import CustomModal from './components/CustomModal'; 
import QuizModal from './components/QuizModal'; // Asegúrate de tener este componente creado

export default function Dashboard() {
  const [profile, setProfile] = useState({
    name: '', job: '', location: '', bio: '', instagram: '', videoLink: '', 
    photo1: '', photo2: '', photo3: '', photo4: '', photo5: '', 
    photo6: '', photo7: '', photo8: '', photo9: '', photo10: '',
    academyPoints: 0, verified: false
  });
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // --- ESTADOS PARA ACADEMY QUIZ ---
  const [quizState, setQuizState] = useState({
    isOpen: false,
    quizMode: false,
    currentQuestion: 0,
    showResult: false,
    score: 0,
    activeCourse: null
  });

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
    'Locaciones', 'Makeup / Pelo', 'Estilismo / Moda', 'Diseño Gráfico',
    'Catering / Barra', 'Animación / Show', 'Ambientación', 'Técnica / Ilum.'
  ];

  // --- DATA DE ACADEMY COURSES ---
  const academyCourses = [
    {
      id: 'nivelacion',
      title: 'NIVELACIÓN PROFESIONAL',
      description: 'Valida tus conocimientos técnicos y ética profesional.',
      videoSrc: 'https://player.vimeo.com/video/1041133346', // El video preliminar
      hasQuiz: true,
      questions: [
        { q: '¿Qué ajuste reduce la profundidad de campo?', options: ['Bajar el ISO', 'Cerrar diafragma (f alto)', 'Abrir diafragma (f bajo)'], correct: 2 },
        { q: '¿Qué controla la velocidad de obturación?', options: ['Color de luz', 'Ruido digital', 'Congelamiento de movimiento'], correct: 2 },
        { q: '¿Para qué sirve el ISO alto?', options: ['Ambientes oscuros', 'Mayor nitidez', 'Desenfoque de fondo'], correct: 0 }
      ]
    }
  ];

  const calculateTotalScore = () => {
    let score = 0;
    if (profile.name?.trim()) score += 15;
    if (profile.job?.trim()) score += 15;
    if (profile.location?.trim()) score += 10;
    if (profile.bio?.trim()) score += 10;
    const photoCount = Array.from({ length: 10 }, (_, i) => profile[`photo${i + 1}`]).filter(Boolean).length;
    score += photoCount * 3; 
    if (profile.videoLink) score += 10;
    if (profile.instagram?.trim()) score += 10;
    return score + (profile.academyPoints || 0);
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
            setProfile({ ...data, ...photosData, academyPoints: data.academyPoints || 0 });
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

  // --- LÓGICA DEL QUIZ ---
  const handleAnswer = (selectedIndex) => {
    const currentCourse = academyCourses[0];
    const isCorrect = selectedIndex === currentCourse.questions[quizState.currentQuestion].correct;
    
    if (isCorrect) {
      const nextQuestion = quizState.currentQuestion + 1;
      if (nextQuestion < currentCourse.questions.length) {
        setQuizState(prev => ({ ...prev, currentQuestion: nextQuestion, score: prev.score + 1 }));
      } else {
        setQuizState(prev => ({ ...prev, score: prev.score + 1, showResult: true }));
      }
    } else {
      setQuizState(prev => ({ ...prev, showResult: true }));
    }
  };

  const handleSaveProgress = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const proRef = doc(db, "professionals", user.uid);
        await updateDoc(proRef, {
          academyPoints: increment(500),
          verified: true,
          isPro: true
        });
        setProfile(prev => ({ ...prev, verified: true, academyPoints: (prev.academyPoints || 0) + 500 }));
        setQuizState({ isOpen: false, quizMode: false, currentQuestion: 0, showResult: false, score: 0, activeCourse: null });
        setModal({ isOpen: true, type: 'success', title: "¡VERIFICADO!", message: "TU PERFIL YA TIENE EL BADGE PRO Y +500 XP.", isConfirm: false, onConfirm: () => {} });
      } catch (error) { console.error(error); }
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

  const handleSave = async () => {
    const user = auth.currentUser;
    if (user) {
      if (!profile.job) return alert("Seleccioná categoría.");
      try {
        const photoList = Array.from({ length: 10 }, (_, i) => profile[`photo${i + 1}`]).filter(p => p && p !== '');
        const finalData = { ...profile, score: calculateTotalScore(), photos: photoList };
        await setDoc(doc(db, "professionals", user.uid), finalData, { merge: true });
        setModal({ isOpen: true, type: 'success', title: "GUARDADO", message: "PERFIL ACTUALIZADO.", isConfirm: false, onConfirm: () => {} });
      } catch (e) { console.error(e); }
    }
  };

  if (loading) return <div className="min-h-screen bg-[#282929] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-['Poppins']">Sincronizando...</div>;

  return (
    <div className="min-h-screen bg-[#282929] text-white font-['Open_Sans'] p-4 md:p-10 relative antialiased">
      <div className="max-w-6xl mx-auto space-y-8 pb-10">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-8 relative">
          <div className="w-full flex justify-between items-center md:w-auto">
            <div className="flex flex-col items-start space-y-3">
              <h1 onClick={() => navigate('/home')} className="text-[22px] font-normal tracking-[0.35em] text-white uppercase font-['Poppins'] cursor-pointer hover:opacity-80 transition-opacity">
                CLASSCODE
              </h1>
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/client-profile')} className="text-[7px] font-black tracking-[0.3em] text-gray-600 hover:text-blue-400 transition-all uppercase">MODO CLIENTE</button>
                <div className="w-[1px] h-3 bg-white/10" />
                <button className="text-[7px] font-black tracking-[0.3em] text-purple-500 uppercase cursor-default">MODO PROFESIONAL</button>
              </div>
            </div>

            <div className="flex items-center gap-4 md:hidden">
                <button onClick={() => navigate(`/profile/${auth.currentUser?.uid}`)} className="p-2 text-gray-500 hover:text-white transition-colors">
                  <Eye size={20} />
                </button>
                <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-white hover:text-purple-400 transition-colors">
                  {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => navigate(`/profile/${auth.currentUser?.uid}`)} className="p-2 text-gray-500 hover:text-white transition-colors">
              <Eye size={18} />
            </button>
            <button onClick={() => navigate('/plans')} className="px-6 py-1.5 rounded-full bg-[#f1ad02] text-black text-[8px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(241,173,2,0.4)] hover:scale-105 transition-all flex items-center gap-2">
              <Trophy size={11} strokeWidth={3} /> PRO
            </button>
            <button onClick={() => navigate('/academy')} className="px-6 py-1.5 rounded-full bg-[#2a233c] text-[#a890fe] border border-[#4a3a6b] text-[8px] font-black uppercase tracking-widest hover:bg-[#362c4d] transition-all flex items-center gap-2 shadow-lg">
              <GraduationCap size={12} strokeWidth={2.5} /> ACADEMY
            </button>
          </div>

          {menuOpen && (
            <div className="absolute top-full left-0 right-0 z-50 bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 mt-4 shadow-2xl flex flex-col gap-4 md:hidden animate-in slide-in-from-top duration-300">
               <button onClick={() => navigate('/plans')} className="w-full py-4 rounded-xl bg-[#f1ad02] text-black text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(241,173,2,0.4)] flex items-center justify-center gap-2">
                  <Trophy size={14} strokeWidth={3} /> MEJORAR A PRO
               </button>
               <button onClick={() => navigate('/academy')} className="w-full py-4 rounded-xl bg-[#2a233c] text-[#a890fe] border border-[#4a3a6b] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <GraduationCap size={14} strokeWidth={2.5} /> IR A ACADEMY
               </button>
               <div className="w-full h-[1px] bg-white/5 my-2"></div>
               <button onClick={() => { signOut(auth); navigate('/'); }} className="text-[9px] font-black tracking-[0.4em] uppercase text-gray-500 hover:text-red-500 transition-colors flex items-center justify-center gap-2">
                  <LogOut size={12}/> CERRAR SESIÓN
               </button>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            {!profile.verified ? (
              <div onClick={() => setQuizState({ ...quizState, isOpen: true, activeCourse: academyCourses[0] })} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between animate-pulse cursor-pointer hover:bg-amber-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <AlertCircle size={16} className="text-amber-500" />
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-amber-500">Nivelación Pendiente</p>
                    <p className="text-[6px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold italic">Click para verificar perfil</p>
                  </div>
                </div>
                <ArrowRight size={12} className="text-amber-500" />
              </div>
            ) : (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 flex items-center gap-3">
                    <ShieldCheck size={16} className="text-purple-400" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-purple-400">Perfil Verificado CLASSCODE PRO</p>
                </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1 text-[8px] font-black tracking-[0.3em] text-gray-500 uppercase">
                <span>Reputación</span>
                <span className="text-purple-400 font-bold">{calculateTotalScore()} XP</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-purple-600 transition-all duration-1000" style={{ width: `${Math.min(calculateTotalScore(), 100)}%` }} />
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between border-b border-white/5 pb-1">
                 <span className="text-[8px] font-black tracking-[0.3em] text-gray-500 uppercase">Enlaces Directos</span>
                 <span className="text-[7px] text-purple-400 font-bold uppercase tracking-widest">{messages.length} Chats Activos</span>
               </div>
               <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                  {messages.length === 0 ? (
                    <p className="text-center py-6 text-[7px] text-gray-700 uppercase tracking-widest border border-white/5 rounded-xl italic">Sin actividad</p>
                  ) : (
                    messages.map(chat => (
                      <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex justify-between items-center py-3 border-b border-white/5 group cursor-pointer hover:border-purple-500/20 transition-all px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
                                {chat.clientPhoto ? <img src={chat.clientPhoto} className="w-full h-full object-cover" /> : <User size={12} className="text-gray-700" />}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-white uppercase tracking-wider">{chat.clientName || chat.clientEmail || "Usuario"}</p>
                                <p className="text-[7px] tracking-[0.2em] text-purple-400 uppercase mt-0.5 font-bold italic">Mensaje Privado</p>
                            </div>
                        </div>
                        <ArrowRight size={12} className="text-gray-800 group-hover:text-purple-500 transition-all transform group-hover:translate-x-1" />
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
               <div className="flex justify-between items-end border-b border-white/5 pb-1 px-1">
                 <h3 className="text-[8px] text-gray-500 font-black uppercase tracking-[0.3em]">Material Showreel</h3>
                 {profile.videoLink && (
                   <button onClick={() => setProfile({...profile, videoLink: ''})} className="text-[7px] text-red-500/50 hover:text-red-500 font-bold uppercase tracking-widest transition-colors">Eliminar</button>
                 )}
               </div>
               <div className="aspect-video bg-black rounded-[1.5rem] overflow-hidden border border-white/5 relative flex items-center justify-center group shadow-xl">
                 {profile.videoLink ? <video key={profile.videoLink} src={profile.videoLink} controls className="w-full h-full object-cover" /> : (
                   <div className="text-center space-y-2">
                     <PlayCircle size={24} className="text-white/10 group-hover:text-purple-500 transition-colors mx-auto"/><p className="text-[7px] text-gray-600 tracking-[0.3em] font-black uppercase italic">Click para subir</p>
                   </div>
                 )}
                 {!profile.videoLink && <input type="file" accept="video/*" onChange={handleVideoUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploadingStatus.video} />}
               </div>
            </div>

            <div className="space-y-6 bg-[#1e1e1e]/30 p-6 rounded-[1.5rem] border border-white/5 shadow-inner">
               <div className="space-y-1 border-b border-white/10">
                  <label className="text-[6px] font-black tracking-[0.3em] text-gray-600 uppercase ml-1">Nombre</label>
                  <input className="w-full bg-transparent py-2 text-[11px] outline-none focus:text-purple-400 transition-all uppercase tracking-widest" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
               </div>
               <div className="space-y-1 border-b border-white/10 relative">
                  <label className="text-[6px] font-black tracking-[0.3em] text-gray-600 uppercase ml-1">Rubro</label>
                  <select className="w-full bg-transparent py-2 text-[11px] outline-none appearance-none cursor-pointer uppercase tracking-widest" value={profile.job} onChange={e => setProfile({...profile, job: e.target.value})}>
                    <option value="" className="bg-[#282929]">Seleccionar</option>
                    {categories.map(cat => <option key={cat} value={cat} className="bg-[#282929]">{cat.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown size={10} className="absolute right-0 bottom-2 text-gray-600 pointer-events-none"/>
               </div>
               <div className="space-y-1 border-b border-white/10">
                  <label className="text-[6px] font-black tracking-[0.3em] text-gray-600 uppercase ml-1">Ubicación</label>
                  <input className="w-full bg-transparent py-2 text-[11px] outline-none focus:text-purple-400 transition-all uppercase tracking-widest" value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} />
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <span className="text-[8px] font-black tracking-[0.3em] text-gray-500 uppercase border-b border-white/5 pb-1 block w-full">Portfolio Visual (Hasta 10 fotos)</span>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
              <div key={num} className="group relative aspect-square bg-[#1e1e1e] border border-white/5 overflow-hidden rounded-xl transition-all hover:border-purple-500/20 shadow-md">
                {profile[`photo${num}`] ? (
                  <>
                    <img src={profile[`photo${num}`]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                    <button onClick={() => setProfile({...profile, [`photo${num}`]: ''})} className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all">
                    <Upload size={12} className="text-gray-700 group-hover:text-purple-500 mb-1"/>
                    <span className="text-[5px] font-black tracking-[0.2em] text-gray-700 uppercase">Subir {num}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, `photo${num}`)} className="hidden" />
                  </label>
                )}
                {uploadingStatus[`photo${num}`] && <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><span className="text-[6px] font-black text-purple-400 animate-pulse tracking-widest uppercase">Cargando...</span></div>}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 space-y-6 text-center">
          <button onClick={handleSave} className="w-full max-w-sm mx-auto py-4 text-[9px] tracking-[0.4em] font-black uppercase rounded-xl bg-gradient-to-r from-purple-600 to-indigo-800 text-white shadow-lg hover:opacity-90 active:scale-95 transition-all block">
            GUARDAR PERFIL
          </button>
        </div>

      </div>

      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} type={modal.type} onConfirm={modal.onConfirm} isConfirm={modal.isConfirm} />
      
      {/* MODAL DE QUIZ */}
      {quizState.isOpen && (
        <QuizModal 
          course={quizState.activeCourse} 
          onClose={() => setQuizState({ ...quizState, isOpen: false })}
          quizMode={quizState.quizMode}
          setQuizMode={(val) => setQuizState({ ...quizState, quizMode: val })}
          currentQuestion={quizState.currentQuestion}
          handleAnswer={handleAnswer}
          showResult={quizState.showResult}
          score={quizState.score}
          handleSaveProgress={handleSaveProgress}
        />
      )}
    </div>
  );
}
