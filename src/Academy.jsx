import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, ArrowLeft, Zap, X, Play, CheckCircle2, 
  BookOpen, Menu, Star, Trophy, Users, ShieldCheck, Sparkles, ArrowRight 
} from 'lucide-react';

export default function Academy() {
  const navigate = useNavigate();
  const [userJob, setUserJob] = useState('');
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);

  const videoLibrary = [
    { id: 'cert_fotografia_intro', category: 'FOTOGRAFÍA', title: 'FOTOGRAFÍA I: INTRODUCCIÓN', videoUrl: 'https://player.vimeo.com/video/1156357123', description: 'FUNDAMENTOS VISUALES CLASSCODE.' },
    { id: 'cert_fotografia_triangulo', category: 'FOTOGRAFÍA', title: 'FOTOGRAFÍA II: TRIÁNGULO EXPOSICIÓN', videoUrl: 'https://player.vimeo.com/video/1156296481', description: 'DOMINIO DE LUZ: APERTURA, VELOCIDAD E ISO.' },
    { id: 'cert_generico', category: 'TODOS', title: 'ESTÁNDAR GLOBAL CLASSCODE®', videoUrl: 'https://player.vimeo.com/video/1151434449', description: 'PROTOCOLO DE ÉTICA Y COMPORTAMIENTO.' }
  ];

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const unsubscribe = onSnapshot(doc(db, "professionals", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserJob(data.job?.toUpperCase() || '');
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

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#282929] text-white font-['Open_Sans'] pb-10 antialiased uppercase overflow-x-hidden">
      
      {/* HEADER RESPONSIVO */}
      <header className="max-w-7xl mx-auto px-6 md:px-8 pt-10 md:pt-16 flex justify-between items-center md:items-end">
        <div className="space-y-4 md:space-y-6 text-left">
          <button onClick={() => navigate('/dashboard')} className="hidden md:flex items-center gap-2 text-gray-500 hover:text-white text-[9px] font-black tracking-widest transition-all uppercase">
            <ArrowLeft size={12}/> VOLVER
          </button>
          <div className="space-y-1">
            <div className="text-[18px] md:text-[22px] font-['Poppins'] tracking-[0.35em] leading-none text-white uppercase">CLASSCODE</div>
            <p className="text-purple-400 text-[8px] md:text-[10px] font-bold tracking-[0.3em] mt-1 uppercase">ACADEMY</p>
          </div>
        </div>

        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white p-2">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className="hidden md:block">
           <p className="text-[9px] font-black tracking-[0.2em] text-gray-500 italic uppercase">MODO APRENDIZAJE ACTIVO</p>
        </nav>
      </header>

      {/* MENÚ HAMBURGUESA MOBILE */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden bg-[#171717] border-b border-white/5 px-8 py-6 flex flex-col gap-4 overflow-hidden">
             <button onClick={() => navigate('/dashboard')} className="text-[10px] font-black tracking-widest text-left uppercase">DASHBOARD</button>
             <button onClick={() => navigate('/client-profile')} className="text-[10px] font-black tracking-widest text-left uppercase">MODO CLIENTE</button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 md:px-8 mt-12 md:mt-20 space-y-16 md:space-y-24">
        
        {/* BANNER INVITACIÓN PRO */}
        {!isPro && (
          <section className="relative overflow-hidden bg-gradient-to-br from-[#1e1e1e] to-[#171717] rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-16 border border-white/5 shadow-2xl group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all duration-700"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Star className="text-amber-500 fill-amber-500" size={14} />
                  <span className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em]">Upgrade a PRO</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-light font-['Poppins'] leading-tight">
                  Obtené <span className="text-purple-400 font-normal italic">Tu Verified</span>
                </h2>
                <p className="text-gray-400 text-sm font-light leading-relaxed normal-case">
                   Prioridad en búsquedas y All Access Academy.
                </p>
                <button onClick={() => navigate('/plans')} className="group flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white hover:text-purple-400 transition-all">
                  VER PLANES <div className="p-2 rounded-full bg-white/5 group-hover:bg-purple-500/20 transition-all"><ArrowRight size={14} /></div>
                </button>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-8">
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center group-hover:border-purple-500/30 transition-colors"><ShieldCheck className="text-blue-400 mx-auto mb-2" size={20} /><p className="text-[8px] text-gray-500 uppercase tracking-widest font-black italic">Sello Verified</p></div>
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center group-hover:border-purple-500/30 transition-colors"><Zap className="text-yellow-400 mx-auto mb-2" size={20} /><p className="text-[8px] text-gray-500 uppercase tracking-widest font-black italic">Prioridad</p></div>
                </div>
                <div className="space-y-4">
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center group-hover:border-purple-500/30 transition-colors"><Sparkles size={20} className="text-pink-400 mx-auto mb-2" /><p className="text-[8px] text-gray-500 uppercase tracking-widest font-black italic">Coaching</p></div>
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center group-hover:border-purple-500/30 transition-colors"><Trophy size={20} className="text-amber-500 mx-auto mb-2" /><p className="text-[8px] text-gray-500 uppercase tracking-widest font-black italic">Certificación</p></div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-8 md:space-y-12">
          <div className="flex items-center gap-4">
            <BookOpen size={16} className="text-purple-400" />
            <h2 className="text-[11px] md:text-[14px] font-bold tracking-[0.2em] uppercase">ESPECIALIZACIÓN: {userJob}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            {rubroVideos.map((video) => (
              <VideoCard key={video.id} video={video} completed={completedCourses.includes(video.id)} onClick={() => setSelectedVideo(video)} />
            ))}
          </div>
        </section>

        <section className="space-y-8 md:space-y-12 pb-20">
          <h2 className="text-[11px] md:text-[14px] font-bold tracking-[0.2em] text-gray-500 uppercase">TRONCO COMÚN</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            {generalVideos.map((video) => (
              <VideoCard key={video.id} video={video} completed={completedCourses.includes(video.id)} onClick={() => setSelectedVideo(video)} />
            ))}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {selectedVideo && (
          <AcademyPopup video={selectedVideo} completed={completedCourses.includes(selectedVideo.id)} onClose={() => setSelectedVideo(null)} navigate={navigate} />
        )}
      </AnimatePresence>
    </div>
  );
}

const VideoCard = ({ video, completed, onClick }) => (
  <div onClick={onClick} className={`group bg-[#171717] rounded-[1.5rem] md:rounded-[2.5rem] p-2 border transition-all cursor-pointer ${completed ? 'border-green-500/30' : 'border-white/5 hover:border-purple-500/30'}`}>
    <div className="aspect-video bg-black rounded-[1.2rem] md:rounded-[2rem] overflow-hidden relative shadow-2xl">
      {completed && <div className="absolute top-3 right-3 z-10 bg-green-500 p-1.5 rounded-full shadow-lg"><CheckCircle2 size={12} /></div>}
      <div className="absolute inset-0 flex items-center justify-center bg-purple-900/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Play size={24} className="md:w-[30px]" fill="currentColor"/></div>
      <img src={`https://vumbnail.com/${video.videoUrl.split('/').pop()}.jpg`} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="" />
    </div>
    <div className="p-5 md:p-7 flex justify-between items-center text-left">
      <div>
        <span className={`text-[6px] md:text-[7px] font-black tracking-widest uppercase ${completed ? 'text-green-400' : 'text-purple-500'}`}>{completed ? 'COMPLETADO' : video.category}</span>
        <h4 className="text-[11px] md:text-[13px] font-bold mt-1 tracking-wider text-white/90 uppercase">{video.title}</h4>
      </div>
      <GraduationCap size={14} className="text-gray-800" />
    </div>
  </div>
);

const AcademyPopup = ({ video, completed, onClose, navigate }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 antialiased">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#282929]/95 backdrop-blur-md" />
    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="w-full h-full md:h-auto md:max-w-2xl bg-[#171717] md:rounded-[2.5rem] border-0 md:border md:border-white/10 relative z-[210] p-6 md:p-14 text-center flex flex-col justify-center md:block overflow-y-auto uppercase">
      <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors z-[220]"><X size={24} /></button>
      <header className="mb-8 md:mb-10 space-y-2">
        <div className="text-[16px] md:text-[18px] font-['Poppins'] tracking-[0.35em] leading-none text-white">CLASSCODE</div>
        <p className="text-purple-400 text-[8px] md:text-[9px] font-bold tracking-[0.3em] mt-1">ACADEMY</p>
      </header>
      <div className="aspect-video bg-black rounded-lg md:rounded-[2rem] overflow-hidden border border-white/10 shadow-inner w-full">
        <iframe src={`${video.videoUrl}?badge=0&autopause=0&player_id=0&app_id=58479`} className="w-full h-full" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={video.title}></iframe>
      </div>
      <div className="mt-8 md:mt-10 space-y-6">
        <p className="text-[9px] md:text-[10px] text-gray-500 tracking-widest leading-relaxed px-4 italic font-bold">{video.description}</p>
        {!completed && (
          <button onClick={() => navigate(`/academy-test/${encodeURIComponent(video.category)}`)} className="w-full py-5 md:py-5 bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] rounded-xl text-[10px] font-black tracking-[0.4em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-purple-900/20 text-white uppercase">
            <Zap size={14} fill="currentColor" /> COMENZAR NIVELACIÓN
          </button>
        )}
      </div>
    </motion.div>
  </div>
);
