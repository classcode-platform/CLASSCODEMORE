import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Zap, Play, CheckCircle2, 
  BookOpen, Star, ArrowRight,
  User, Search, X, Clock, ShieldCheck 
} from 'lucide-react';

export default function Academy() {
  const navigate = useNavigate();
  const [userJob, setUserJob] = useState('');
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPro, setIsPro] = useState(false);

  // BIBLIOTECA DE CLASES CON CLOUDINARY
  const videoLibrary = [
    { 
      id: 'cert_fotografia_intro', 
      category: 'FOTOGRAFÍA', 
      title: 'FOTOGRAFÍA I: INTRODUCCIÓN', 
      videoUrl: 'https://res.cloudinary.com/dsyfitywd/video/upload/v1785139540/INTROFOTOFINAL_vyoxwi.mp4', 
      description: 'CONCEPTOS INICIALES Y FILOSOFÍA DE TRABAJO EN SET.',
      testPath: '/academy-test/fotografia_intro',
      available: true
    },
    { 
      id: 'cert_fotografia_triangulo', 
      category: 'FOTOGRAFÍA', 
      title: 'FOTOGRAFÍA II: TRIÁNGULO EXPOSICIÓN', 
      videoUrl: 'https://res.cloudinary.com/dsyfitywd/video/upload/v1785139462/0112_1_zyb4mb.mp4', 
      description: 'DOMINIO TÉCNICO: APERTURA, VELOCIDAD E ISO.',
      testPath: '/academy-test/fotografia_triangulo',
      available: true
    },
    { 
      id: 'cert_escenico_intro', 
      category: 'ESCÉNICO', 
      title: 'ACTUACIÓN Y PRESENCIA ESCÉNICA I', 
      videoUrl: 'https://res.cloudinary.com/dsyfitywd/video/upload/v1785139614/Presenta_1_vilqib.mp4', 
      description: 'EXPRESIÓN CORPORAL, MANEJO DE CÁMARA Y TÉCNICA ACTORAL.',
      testPath: '/academy-test/Escénico',
      available: true
    },
    { 
      id: 'cert_makeup_intro', 
      category: 'MAKEUP / PELO', 
      title: 'MAKEUP & PELO PARA SET I', 
      videoUrl: 'https://res.cloudinary.com/dsyfitywd/video/upload/v1785140159/Intro_Make_up_pelo_1_1_1_tqe1t0.mp4', 
      description: 'ESTÉTICA PROFESIONAL, PREPARACIÓN DE PIEL Y ESTILISMO TÉCNICO.',
      testPath: '/academy-test/Makeup_Pelo',
      available: true
    },
    // RESTO DE CATEGORÍAS (PRÓXIMAMENTE)
    { id: 'c_audiovisual', category: 'AUDIOVISUAL', title: 'FILMMAKER & DIRECCIÓN DE FOTOGRAFÍA', videoUrl: '', description: 'MÓDULO EN DESARROLLO.', testPath: '', available: false },
    { id: 'c_modelo', category: 'MODELO', title: 'MODELAJE Y TÉCNICA DE PASARELA', videoUrl: '', description: 'MÓDULO EN DESARROLLO.', testPath: '', available: false },
    { id: 'c_digital', category: 'DIGITAL', title: 'CREACIÓN DE CONTENIDO & UGC', videoUrl: '', description: 'MÓDULO EN DESARROLLO.', testPath: '', available: false },
    { id: 'c_show', category: 'SHOW', title: 'ANIMACIÓN Y ESPECTÁCULO EN VIVO', videoUrl: '', description: 'MÓDULO EN DESARROLLO.', testPath: '', available: false },
    { id: 'c_produccion', category: 'PRODUCCIÓN / DIRECCIÓN', title: 'PRODUCCIÓN EJECUTIVA Y RODAJE', videoUrl: '', description: 'MÓDULO EN DESARROLLO.', testPath: '', available: false },
    { id: 'c_estilismo', category: 'ESTILISMO / MODA', title: 'FITTING Y VESTUARIO PROFESIONAL', videoUrl: '', description: 'MÓDULO EN DESARROLLO.', testPath: '', available: false },
    { id: 'c_diseno', category: 'DISEÑO / ARTE', title: 'IDENTIDAD VISUAL Y VECTORES', videoUrl: '', description: 'MÓDULO EN DESARROLLO.', testPath: '', available: false },
    { id: 'c_dj', category: 'DJ / SONIDO', title: 'TÉCNICA DE SONIDO Y DJ SET', videoUrl: '', description: 'MÓDULO EN DESARROLLO.', testPath: '', available: false },
    { id: 'c_catering', category: 'CATERING / BARRA', title: 'GASTRONOMÍA Y LOGÍSTICA DE SET', videoUrl: '', description: 'MÓDULO EN DESARROLLO.', testPath: '', available: false },
    { id: 'c_planner', category: 'PLANNER / EVENTOS', title: 'CRONOGRAMAS Y GESTIÓN DE EVENTOS', videoUrl: '', description: 'MÓDULO EN DESARROLLO.', testPath: '', available: false },
    { id: 'c_tecnica', category: 'TÉCNICA / ILUMINACIÓN', title: 'LUCES, ENERGÍA Y RIGGING', videoUrl: '', description: 'MÓDULO EN DESARROLLO.', testPath: '', available: false },
    { id: 'c_agencia', category: 'AGENCIA', title: 'REPRESENTACIÓN Y GESTIÓN DE TALENTOS', videoUrl: '', description: 'MÓDULO EN DESARROLLO.', testPath: '', available: false },
    { id: 'c_locaciones', category: 'LOCACIONES', title: 'SCOUTING Y GESTIÓN DE ESPACIOS', videoUrl: '', description: 'MÓDULO EN DESARROLLO.', testPath: '', available: false }
  ];

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const unsubscribe = onSnapshot(doc(db, "professionals", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
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
  const otherVideos = videoLibrary.filter(v => v.category !== userJob);
  const isGenericoCompleted = completedCourses.includes('cert_generico');

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-['Poppins'] tracking-[0.35em] text-[10px]">
      SINCRONIZANDO ACADEMY...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] antialiased flex flex-col relative overflow-hidden uppercase">
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [-30, 30], y: [-20, 20], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px]"
        />
      </div>

      <nav className="p-4 md:px-12 md:py-6 w-full sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center w-full font-['Poppins']">
          <div onClick={() => navigate('/home')} className="flex flex-col cursor-pointer text-white" style={{ width: 'fit-content' }}>
            <span className="text-xl md:text-2xl font-normal tracking-[0.05em] leading-none uppercase">CLASSCODE</span>
            <div className="flex justify-end w-full">
              <span className="font-light text-[11px] md:text-[14.5px] leading-none -mt-0.5 text-purple-500" style={{ width: '62%', textAlign: 'right', textTransform: 'none', letterSpacing: '0.02em' }}>Academy</span>
            </div>
          </div>

          <div className="flex items-center gap-6 md:gap-10">
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-white transition-all active:scale-90"><User size={20} strokeWidth={1.5} /></button>
            <button onClick={() => navigate('/home')} className="text-gray-500 hover:text-purple-500 transition-all active:scale-90"><Search size={20} strokeWidth={1.5} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 py-8 md:py-10 flex-grow relative z-10 w-full space-y-10 md:space-y-14">
        {!isPro && (
          <section className="bg-white/[0.02] backdrop-blur-3xl rounded-2xl p-5 md:p-6 border border-white/5 relative overflow-hidden group shadow-xl">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all duration-1000"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg"><Star className="text-amber-500 fill-amber-400" size={18} /></div>
                <div className="space-y-1">
                  <h2 className="text-lg md:text-xl font-['Poppins'] font-light tracking-tight text-white uppercase">ESTATUS: <span className="text-purple-500 font-normal">TALENTO STANDARD</span></h2>
                  <p className="text-gray-500 text-[8px] md:text-[9px] font-bold tracking-[0.2em]">ALCANZÁ EL NIVEL <span className="text-white font-black">PRO VERIFIED</span> PARA PRIORIDAD EN BÚSQUEDAS</p>
                </div>
              </div>
              <button onClick={() => navigate('/plans')} className="w-full md:w-auto px-8 py-3.5 bg-white text-black rounded-xl text-[9px] font-black tracking-[0.3em] hover:bg-gray-200 transition-all shadow-lg uppercase leading-none">UPGRADE PRO</button>
            </div>
          </section>
        )}
        
        {/* ESPECIALIZACIÓN DEL USUARIO */}
        {rubroVideos.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-l-2 border-purple-500 pl-3">
              <BookOpen size={15} className="text-purple-400" />
              <h2 className="text-[11px] md:text-[13px] font-normal tracking-[0.3em] uppercase">ESPECIALIZACIÓN: {userJob || 'CREATIVO'}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
              {rubroVideos.map((video) => (
                <VideoCard key={video.id} video={video} completed={completedCourses.includes(video.id)} onClick={() => video.available && setSelectedVideo(video)} />
              ))}
            </div>
          </section>
        )}

        {/* MÓDULOS GLOBALES (TEST DE ÉTICA) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-l-2 border-gray-700 pl-3 text-gray-400">
            <GraduationCap size={15} />
            <h2 className="text-[11px] md:text-[13px] font-normal tracking-[0.3em] uppercase">MÓDULOS GLOBALES</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            <motion.div 
              whileHover={{ y: -4 }} 
              onClick={() => navigate('/academy-test/Generico')}
              className={`group bg-white/[0.03] backdrop-blur-xl rounded-[2rem] p-3 border transition-all flex flex-col h-full shadow-xl cursor-pointer ${
                isGenericoCompleted ? 'border-green-500/20' : 'border-white/5 hover:border-purple-500/30'
              }`}
            >
              <div className="aspect-video bg-[#0d0d0d] rounded-[1.4rem] overflow-hidden relative flex items-center justify-center border border-white/5">
                {isGenericoCompleted && <div className="absolute top-4 right-4 z-10 bg-green-500 p-2 rounded-full shadow-lg"><CheckCircle2 size={12} className="text-white" /></div>}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-black/80 flex items-center justify-center">
                  <ShieldCheck size={36} className="text-purple-400 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
                </div>
              </div>
              <div className="p-5 md:p-6 flex-grow flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className={`text-[7px] font-black tracking-widest uppercase ${isGenericoCompleted ? 'text-green-400' : 'text-purple-500'}`}>
                    {isGenericoCompleted ? 'CERTIFICACIÓN OBTENIDA' : 'EVALUACIÓN OBLIGATORIA'}
                  </span>
                  <h4 className="text-[11px] md:text-[13px] font-['Poppins'] font-normal tracking-wide text-white leading-tight uppercase">TEST DE ÉTICA Y PROTOCOLO DE SET</h4>
                </div>
                <div className="mt-5 pt-3 border-t border-white/5 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                  <span className="text-[7px] font-black tracking-[0.2em] uppercase leading-none">CLASSCODE® ACADEMY</span>
                  <ArrowRight size={13} className="text-purple-400" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* OTRAS ESPECIALIDADES (PRÓXIMAMENTE) */}
        <section className="space-y-6 pb-20">
          <div className="flex items-center gap-3 border-l-2 border-purple-900 pl-3 text-gray-400">
            <Clock size={15} className="text-purple-500" />
            <h2 className="text-[11px] md:text-[13px] font-normal tracking-[0.3em] uppercase">OTRAS ESPECIALIDADES (PRÓXIMAMENTE)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            {otherVideos.map((video) => (
              <VideoCard key={video.id} video={video} completed={completedCourses.includes(video.id)} onClick={() => video.available && setSelectedVideo(video)} />
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-black py-12 px-6 border-t border-white/5 relative z-10 w-full text-center">
        <h2 className="text-white text-2xl font-normal tracking-[0.1em] mb-3 opacity-30 uppercase font-['Poppins'] leading-none">CLASSCODE</h2>
        <p className="text-[8px] uppercase tracking-[0.5vm] font-bold opacity-30 leading-none">© 2026 — TODOS LOS DERECHOS RESERVADOS</p>
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
  <motion.div 
    whileHover={video.available ? { y: -4 } : {}} 
    onClick={onClick} 
    className={`group bg-white/[0.03] backdrop-blur-xl rounded-[2rem] p-3 border transition-all flex flex-col h-full shadow-xl ${
      !video.available ? 'opacity-60 cursor-default border-white/5' : 
      completed ? 'border-green-500/20 shadow-green-900/5 cursor-pointer' : 'border-white/5 hover:border-purple-500/30 cursor-pointer'
    }`}
  >
    <div className="aspect-video bg-[#0d0d0d] rounded-[1.4rem] overflow-hidden relative group">
      {completed && <div className="absolute top-4 right-4 z-10 bg-green-500 p-2 rounded-full shadow-lg"><CheckCircle2 size={12} className="text-white" /></div>}
      
      {!video.available ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
          <span className="text-[8px] font-black tracking-[0.3em] text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">PRÓXIMAMENTE</span>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-purple-900/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
          <Play size={22} className="text-white" fill="white" />
        </div>
      )}

      {video.available ? (
        <video src={video.videoUrl} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-all duration-500" />
      ) : (
        <div className="w-full h-full bg-white/[0.01]" />
      )}
    </div>
    
    <div className="p-5 md:p-6 flex-grow flex flex-col justify-between">
      <div className="space-y-1.5">
        <span className={`text-[7px] font-black tracking-widest uppercase ${!video.available ? 'text-gray-500' : completed ? 'text-green-400' : 'text-purple-500'}`}>
          {!video.available ? 'EN DESARROLLO' : completed ? 'CERTIFICACIÓN OBTENIDA' : video.category}
        </span>
        <h4 className="text-[11px] md:text-[13px] font-['Poppins'] font-normal tracking-wide text-white leading-tight uppercase">{video.title}</h4>
      </div>
      <div className="mt-5 pt-3 border-t border-white/5 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
        <span className="text-[7px] font-black tracking-[0.2em] uppercase leading-none">CLASSCODE® ACADEMY</span>
        {video.available && <ArrowRight size={13} className="text-purple-400" />}
      </div>
    </div>
  </motion.div>
);

const AcademyPopup = ({ video, completed, onClose, navigate }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4 antialiased uppercase">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
    <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className="w-full h-full md:h-auto md:max-w-3xl bg-[#0d0d0d] md:rounded-[3rem] border-0 md:border md:border-white/10 relative z-[210] p-6 md:p-10 backdrop-blur-3xl overflow-y-auto flex flex-col">
      <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors z-[220]"><X size={22} /></button>
      <header className="mb-6 text-center space-y-1.5 uppercase leading-none">
        <div className="text-[16px] md:text-[20px] font-['Poppins'] tracking-[0.05em] text-white">CLASSCODE</div>
        <p className="text-purple-400 text-[8px] md:text-[10px] font-black tracking-[0.3em]">MÓDULO DE CERTIFICACIÓN</p>
      </header>

      {/* REPRODUCTOR NATIVO CLOUDINARY HTML5 */}
      <div className="aspect-video bg-black rounded-[1.5rem] overflow-hidden border border-white/10 shadow-inner w-full flex items-center justify-center relative">
        <video 
          src={video.videoUrl} 
          controls 
          controlsList="nodownload" 
          className="w-full h-full object-contain"
        />
      </div>

      <div className="mt-6 space-y-6 text-center uppercase leading-none">
        <div className="space-y-1.5">
           <h3 className="text-white text-[13px] font-bold tracking-widest">{video.title}</h3>
           <p className="text-[9px] md:text-[11px] text-gray-500 tracking-widest leading-relaxed max-w-xl mx-auto font-normal">{video.description}</p>
        </div>
        
        {!completed ? (
          <button 
            onClick={() => navigate(video.testPath)} 
            className="w-full max-w-sm mx-auto py-4 bg-white text-black rounded-xl text-[9px] font-black tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-xl active:scale-95 uppercase leading-none cursor-pointer"
          >
            <Zap size={15} fill="black" /> INICIAR EXAMEN DE MÓDULO
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2.5 text-green-500 py-3.5 px-6 border border-green-500/20 rounded-xl bg-green-500/5 mx-auto w-fit">
            <CheckCircle2 size={15} />
            <span className="text-[9px] font-black tracking-[0.3em]">EXAMEN APROBADO</span>
          </div>
        )}
      </div>
    </motion.div>
  </div>
);