import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Zap, Play, CheckCircle2, 
  BookOpen, Star, ArrowRight,
  User, Search, X 
} from 'lucide-react';

export default function Academy() {
  const navigate = useNavigate();
  const [userJob, setUserJob] = useState('');
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPro, setIsPro] = useState(false);

  const videoLibrary = [
    { 
      id: 'cert_fotografia_intro', 
      category: 'FOTOGRAFÍA', 
      title: 'FOTOGRAFÍA I: INTRODUCCIÓN', 
      videoUrl: 'https://player.vimeo.com/video/1156357123', 
      description: 'CONCEPTOS INICIALES Y FILOSOFÍA DE TRABAJO CLASSCODE.',
      testPath: '/academy-test/fotografia_intro'
    },
    { 
      id: 'cert_fotografia_triangulo', 
      category: 'FOTOGRAFÍA', 
      title: 'FOTOGRAFÍA II: TRIÁNGULO EXPOSICIÓN', 
      videoUrl: 'https://player.vimeo.com/video/1156296481', 
      description: 'DOMINIO TÉCNICO: APERTURA, VELOCIDAD E ISO.',
      testPath: '/academy-test/fotografia_triangulo'
    },
    { 
      id: 'cert_generico', 
      category: 'TODOS', 
      title: 'ESTÁNDAR GLOBAL CLASSCODE®', 
      videoUrl: 'https://player.vimeo.com/video/1151434449', 
      description: 'PROTOCOLO DE ÉTICA, COMPORTAMIENTO Y PRESENCIA EN SET.',
      testPath: '/academy-test/Generico'
    }
  ];

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const unsubscribe = onSnapshot(doc(db, "professionals", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Lógica adaptada: soporta perfiles múltiples (array) o perfil único directo
          let activeJob = '';
          if (data.profiles && Array.isArray(data.profiles) && data.profiles.length > 0) {
            activeJob = data.profiles[0].job || data.job || '';
          } else {
            activeJob = data.job || '';
          }

          setUserJob(activeJob.toUpperCase());
          setCompletedCourses(data.completedCourses || []);
          setIsPro(data.isPro || false);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  const rubroVideos = videoLibrary.filter(v => v.category === userJob);
  const generalVideos = videoLibrary.filter(v => v.category === 'TODOS');

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-['Poppins'] tracking-[0.35em] text-[10px]">
      SINCRONIZANDO ACADEMY...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] antialiased flex flex-col relative overflow-hidden uppercase">
      
      {/* LUCES ORBITALES */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [-30, 30], y: [-20, 20], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px]"
        />
      </div>

      <nav className="p-6 md:p-10 w-full sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center w-full font-['Poppins']">
          <div onClick={() => navigate('/home')} className="flex flex-col cursor-pointer text-white" style={{ width: 'fit-content' }}>
            <span className="text-xl md:text-2xl font-normal tracking-[0.05em] leading-none uppercase">CLASSCODE</span>
            <div className="flex justify-end w-full">
              <span className="font-light text-[11px] md:text-[14.5px] leading-none -mt-0.5 text-purple-500" style={{ width: '62%', textAlign: 'right', textTransform: 'none', letterSpacing: '0.02em' }}>Academy</span>
            </div>
          </div>

          <div className="flex items-center gap-8 md:gap-12">
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-white transition-all active:scale-90"><User size={22} strokeWidth={1.5} /></button>
            <button onClick={() => navigate('/home')} className="text-gray-500 hover:text-purple-500 transition-all active:scale-90"><Search size={22} strokeWidth={1.5} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 mt-12 md:mt-16 flex-grow relative z-10 w-full space-y-16 md:space-y-24">
        {!isPro && (
          <section className="bg-white/[0.02] backdrop-blur-3xl rounded-[2rem] p-6 md:p-8 border border-white/5 relative overflow-hidden group shadow-2xl">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all duration-1000"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg"><Star className="text-amber-500 fill-amber-400" size={20} /></div>
                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-['Poppins'] font-light tracking-tight text-white uppercase font-normal">ESTATUS: <span className="text-purple-500 font-normal">TALENTO STANDARD</span></h2>
                  <p className="text-gray-500 text-[9px] md:text-[10px] font-bold tracking-[0.2em]">ALCANZÁ EL NIVEL <span className="text-white font-black">PRO VERIFIED</span> PARA PRIORIDAD EN BÚSQUEDAS</p>
                </div>
              </div>
              <button onClick={() => navigate('/plans')} className="w-full md:w-auto px-10 py-4 bg-white text-black rounded-xl text-[9px] font-black tracking-[0.3em] hover:bg-gray-200 transition-all shadow-xl uppercase leading-none">UPGRADE PRO</button>
            </div>
          </section>
        )}
        
        <section className="space-y-10">
          <div className="flex items-center gap-4 border-l-2 border-purple-500 pl-4">
            <BookOpen size={16} className="text-purple-400" />
            <h2 className="text-[11px] md:text-[14px] font-normal tracking-[0.3em] uppercase">ESPECIALIZACIÓN: {userJob || 'CREATIVO'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            {rubroVideos.map((video) => (
              <VideoCard key={video.id} video={video} completed={completedCourses.includes(video.id)} onClick={() => setSelectedVideo(video)} />
            ))}
          </div>
        </section>

        <section className="space-y-10 pb-32">
          <div className="flex items-center gap-4 border-l-2 border-gray-700 pl-4 text-gray-500">
            <GraduationCap size={16} />
            <h2 className="text-[11px] md:text-[14px] font-normal tracking-[0.3em] uppercase">MÓDULOS GLOBALES</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            {generalVideos.map((video) => (
              <VideoCard key={video.id} video={video} completed={completedCourses.includes(video.id)} onClick={() => setSelectedVideo(video)} />
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-black py-20 px-6 border-t border-white/5 relative z-10 w-full text-center">
        <h2 className="text-white text-3xl font-normal tracking-[0.1em] mb-4 opacity-30 uppercase font-['Poppins'] leading-none">CLASSCODE</h2>
        <p className="text-[9px] uppercase tracking-[0.5em] font-bold opacity-30 leading-none">© 2026 — TODOS LOS DERECHOS RESERVADOS</p>
      </footer>

      <AnimatePresence>
        {selectedVideo && (
          <AcademyPopup 
            video={selectedVideo} 
            completed={completedCourses.includes(selectedVideo.id)} 
            onClose={() => setSelectedVideo(null)} 
            navigate={navigate} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const VideoCard = ({ video, completed, onClick }) => (
  <motion.div whileHover={{ y: -5 }} onClick={onClick} className={`group bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] p-3 border transition-all cursor-pointer flex flex-col h-full shadow-2xl ${completed ? 'border-green-500/20 shadow-green-900/5' : 'border-white/5 hover:border-purple-500/30'}`}>
    <div className="aspect-video bg-[#0d0d0d] rounded-[1.5rem] overflow-hidden relative group">
      {completed && <div className="absolute top-4 right-4 z-10 bg-green-500 p-2 rounded-full shadow-lg"><CheckCircle2 size={12} className="text-white" /></div>}
      <div className="absolute inset-0 flex items-center justify-center bg-purple-900/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"><Play size={24} className="text-white" fill="white" /></div>
      <img src={`https://vumbnail.com/${video.videoUrl.split('/').pop()}.jpg`} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-all duration-500" alt="" />
    </div>
    <div className="p-6 md:p-8 flex-grow flex flex-col justify-between">
      <div className="space-y-2">
        <span className={`text-[7px] font-black tracking-widest uppercase ${completed ? 'text-green-400' : 'text-purple-500'}`}>{completed ? 'CERTIFICACIÓN OBTENIDA' : video.category}</span>
        <h4 className="text-[12px] md:text-[14px] font-['Poppins'] font-normal tracking-wide text-white leading-tight uppercase">{video.title}</h4>
      </div>
      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-black tracking-[0.2em] uppercase leading-none">CLASSCODE® ACADEMY</span>
        <ArrowRight size={14} className="text-purple-400" />
      </div>
    </div>
  </motion.div>
);

const AcademyPopup = ({ video, completed, onClose, navigate }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 antialiased uppercase">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="w-full h-full md:h-auto md:max-w-4xl bg-[#0d0d0d] md:rounded-[3.5rem] border-0 md:border md:border-white/10 relative z-[210] p-6 md:p-14 backdrop-blur-3xl overflow-y-auto flex flex-col">
      <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors z-[220]"><X size={24} /></button>
      <header className="mb-10 text-center space-y-2 uppercase leading-none">
        <div className="text-[18px] md:text-[22px] font-['Poppins'] tracking-[0.05em] text-white">CLASSCODE</div>
        <p className="text-purple-400 text-[9px] md:text-[11px] font-black tracking-[0.3em]">MÓDULO DE CERTIFICACIÓN</p>
      </header>
      <div className="aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/10 shadow-inner w-full">
        <iframe src={`${video.videoUrl}?badge=0&autopause=0&player_id=0&app_id=58479`} className="w-full h-full" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={video.title}></iframe>
      </div>
      <div className="mt-10 space-y-8 text-center uppercase leading-none">
        <div className="space-y-2">
           <h3 className="text-white text-[14px] font-bold tracking-widest">{video.title}</h3>
           <p className="text-[10px] md:text-[12px] text-gray-500 tracking-widest leading-relaxed max-w-2xl mx-auto font-normal">{video.description}</p>
        </div>
        
        {!completed ? (
          <button 
            onClick={() => navigate(video.testPath)} 
            className="w-full max-w-md mx-auto py-5 bg-white text-black rounded-2xl text-[10px] font-black tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-gray-200 transition-all shadow-2xl active:scale-95 uppercase leading-none"
          >
            <Zap size={16} fill="black" /> INICIAR EXAMEN DE MÓDULO
          </button>
        ) : (
          <div className="flex items-center justify-center gap-3 text-green-500 py-4 px-8 border border-green-500/20 rounded-2xl bg-green-500/5 mx-auto w-fit">
            <CheckCircle2 size={16} />
            <span className="text-[10px] font-black tracking-[0.3em]">EXAMEN APROBADO</span>
          </div>
        )}
      </div>
    </motion.div>
  </div>
);