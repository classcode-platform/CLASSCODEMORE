import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ArrowLeft, Zap, X, Play, CheckCircle2, BookOpen } from 'lucide-react';

export default function Academy() {
  const navigate = useNavigate();
  const [userJob, setUserJob] = useState('');
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // --- LIBRERÍA DE CONOCIMIENTO (FOTOGRAFÍA REAL + SIMULADOS) ---
  const videoLibrary = [
    // FOTOGRAFÍA - VIDEOS REALES INTEGRADOS
    { 
      id: 'cert_fotografía_intro', 
      category: 'FOTOGRAFÍA', 
      title: 'FOTOGRAFÍA I: INTRODUCCIÓN Y CONCEPTOS', 
      videoUrl: 'https://player.vimeo.com/video/1156357123', 
      description: 'FUNDAMENTOS VISUALES Y EL ROL DEL FOTÓGRAFO PROFESIONAL.' 
    },
    { 
      id: 'cert_fotografía_triangulo', 
      category: 'FOTOGRAFÍA', 
      title: 'FOTOGRAFÍA II: EL TRIÁNGULO DE EXPOSICIÓN', 
      videoUrl: 'https://player.vimeo.com/video/1156296481', 
      description: 'DOMINIO TÉCNICO: APERTURA, VELOCIDAD DE OBTURACIÓN E ISO.' 
    },
    
    // VIDEO / FILMMAKER
    { id: 'cert_videofilmmaker', category: 'VIDEO / FILMMAKER', title: 'FILMMAKING I: NARRATIVA', videoUrl: 'https://player.vimeo.com/video/1151434449', description: 'ESTRUCTURA VISUAL Y RITMO EN EVENTOS.' },
    { id: 'vid_video_2', category: 'VIDEO / FILMMAKER', title: 'FILMMAKING II: MOVIMIENTO', videoUrl: 'https://player.vimeo.com/video/1151434449', description: 'ESTABILIZACIÓN Y USO DE GIMBALS.' },

    // MODELO / PRESENCIA
    { id: 'cert_modelopresencia', category: 'MODELO / PRESENCIA', title: 'PRESENCIA I: POSE Y ÁNGULOS', videoUrl: 'https://player.vimeo.com/video/1151434449', description: 'DOMINIO CORPORAL FRENTE A CÁMARA.' },

    // MAKEUP / PELO
    { id: 'cert_makeuppelo', category: 'MAKEUP / PELO', title: 'MAKEUP PRO I: DURABILIDAD', videoUrl: 'https://player.vimeo.com/video/1151434449', description: 'TÉCNICAS PARA LARGAS JORNADAS.' },

    // DJ / SONIDO
    { id: 'cert_djsonido', category: 'DJ / SONIDO', title: 'DJ PRO I: MEZCLA Y RITMO', videoUrl: 'https://player.vimeo.com/video/1151434449', description: 'CONTROL DE ENERGÍA EN LA PISTA.' },

    // TRONCO COMÚN (TODOS)
    { id: 'cert_generico', category: 'TODOS', title: 'ESTÁNDAR GLOBAL CLASSCODE®', videoUrl: 'https://player.vimeo.com/video/1151434449', description: 'PROTOCOLO DE ÉTICA Y COMPORTAMIENTO.' },
    { id: 'vid_gen_2', category: 'TODOS', title: 'COMUNICACIÓN CON CLIENTES', videoUrl: 'https://player.vimeo.com/video/1151434449', description: 'MANEJO DE EXPECTATIVAS Y SOFT SKILLS.' }
  ];

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const unsubscribe = onSnapshot(doc(db, "professionals", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserJob(data.job?.toUpperCase() || '');
          setCompletedCourses(data.completedCourses || []);
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
    <div className="min-h-screen bg-[#282929] text-white font-['Open_Sans'] pb-20 antialiased uppercase">
      
      <header className="max-w-7xl mx-auto px-8 pt-16 flex justify-between items-end">
        <div className="space-y-6 text-left">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-500 hover:text-white text-[9px] font-black tracking-widest transition-all">
            <ArrowLeft size={12}/> VOLVER
          </button>
          <div className="space-y-1">
            <div className="text-[22px] font-['Poppins'] tracking-[0.35em] leading-none text-white">CLASSCODE</div>
            <p className="text-purple-400 text-[10px] font-bold tracking-[0.3em] mt-1">ACADEMY</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 mt-20 space-y-24">
        
        {/* SECCIÓN RUBRO */}
        <section className="space-y-12">
          <div className="flex items-center gap-4">
            <BookOpen size={18} className="text-purple-400" />
            <h2 className="text-[14px] font-bold tracking-[0.2em]">ESPECIALIZACIÓN: {userJob}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {rubroVideos.map((video) => (
              <VideoCard key={video.id} video={video} completed={completedCourses.includes(video.id)} onClick={() => setSelectedVideo(video)} />
            ))}
          </div>
        </section>

        {/* SECCIÓN GENERAL */}
        <section className="space-y-12">
          <h2 className="text-[14px] font-bold tracking-[0.2em] text-gray-500">TRONCO COMÚN</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {generalVideos.map((video) => (
              <VideoCard key={video.id} video={video} completed={completedCourses.includes(video.id)} onClick={() => setSelectedVideo(video)} />
            ))}
          </div>
        </section>
      </main>

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
  <div onClick={onClick} className={`group bg-[#171717] rounded-[2.5rem] p-2 border transition-all cursor-pointer ${completed ? 'border-green-500/30' : 'border-white/5 hover:border-purple-500/30'}`}>
    <div className="aspect-video bg-black rounded-[2rem] overflow-hidden relative shadow-2xl">
      {completed && <div className="absolute top-4 right-4 z-10 bg-green-500 p-1.5 rounded-full shadow-lg"><CheckCircle2 size={14} /></div>}
      <div className="absolute inset-0 flex items-center justify-center bg-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity"><Play size={30} fill="currentColor"/></div>
      <img src={`https://vumbnail.com/${video.videoUrl.split('/').pop()}.jpg`} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="" />
    </div>
    <div className="p-7 flex justify-between items-center text-left">
      <div>
        <span className={`text-[7px] font-black tracking-widest ${completed ? 'text-green-400' : 'text-purple-500'}`}>{completed ? 'COMPLETADO' : video.category}</span>
        <h4 className="text-[13px] font-bold mt-1 tracking-wider text-white/90">{video.title}</h4>
      </div>
      <GraduationCap size={16} className="text-gray-800" />
    </div>
  </div>
);

const AcademyPopup = ({ video, completed, onClose, navigate }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 antialiased">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#282929]/95 backdrop-blur-md" />
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="max-w-2xl w-full bg-[#171717] rounded-[2.5rem] border border-white/10 relative z-[210] p-10 md:p-14 text-center space-y-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={20} /></button>
      <header className="space-y-2">
        <div className="text-[18px] font-['Poppins'] tracking-[0.35em] leading-none text-white">CLASSCODE</div>
        <p className="text-purple-400 text-[9px] font-bold tracking-[0.3em]">ACADEMY • {completed ? 'NIVEL COMPLETADO' : 'CERTIFICACIÓN'}</p>
      </header>
      <div className="aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/10 shadow-inner">
        <iframe src={video.videoUrl} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
      </div>
      <div className="space-y-6">
        <p className="text-[10px] text-gray-500 tracking-widest leading-relaxed px-4 uppercase italic font-bold">
          {video.description}
        </p>
        {completed ? (
           <div className="py-4 bg-green-500/10 border border-green-500/20 rounded-xl"><p className="text-[10px] text-green-400 font-bold tracking-[0.2em]">CERTIFICACIÓN OBTENIDA</p></div>
        ) : (
          <button onClick={() => navigate(`/academy-test/${encodeURIComponent(video.category)}`)} className="w-full py-5 bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] rounded-xl text-[10px] font-black tracking-[0.4em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-purple-900/20 text-white">
            <Zap size={14} fill="currentColor" /> COMENZAR NIVELACIÓN
          </button>
        )}
      </div>
    </motion.div>
  </div>
);

