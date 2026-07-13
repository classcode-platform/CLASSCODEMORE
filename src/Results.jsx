import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; 
import { collection, onSnapshot, query } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth'; 
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Search, Star, ShieldCheck, Zap, Award } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "professionals"));
    const unsubscribeDocs = onSnapshot(q, (snapshot) => {
      const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const params = new URLSearchParams(location.search);
      const cat = params.get('category');
      const qParam = params.get('q');
      const loc = params.get('location');

      let filtered = allDocs.filter(p => p.name && p.photos && p.photos.length > 0);

      if (cat) filtered = filtered.filter(p => p.job?.toLowerCase() === cat.toLowerCase());
      if (qParam) {
        filtered = filtered.filter(p => 
          p.name?.toLowerCase().includes(qParam.toLowerCase()) || 
          p.job?.toLowerCase().includes(qParam.toLowerCase())
        );
      }
      if (loc) filtered = filtered.filter(p => p.location?.toLowerCase().includes(loc.toLowerCase()));

      filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      setProfessionals(filtered);
      setLoading(false);
    });

    return () => unsubscribeDocs();
  }, [location.search]);

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-['Poppins'] tracking-[0.35em] text-[10px]">SINCRONIZANDO...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] antialiased flex flex-col relative overflow-hidden uppercase">
  
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-purple-600/10 rounded-full blur-[100px] md:blur-[150px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-0 w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-indigo-600/10 rounded-full blur-[90px] md:blur-[130px]" />
      </div>

      <nav className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center relative z-50 bg-black/20 backdrop-blur-md">
        <div onClick={() => navigate('/home')} className="text-xl cursor-pointer uppercase text-white font-['Poppins'] tracking-[0.05em] hover:opacity-80 transition-all">CLASSCODE</div>
        <button onClick={() => navigate('/home')} className="p-3 rounded-full bg-white/5 border border-white/5 text-purple-400"><Search size={18} /></button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-12 flex-grow w-full relative z-10">
        
        <header className="mb-8 md:mb-12">
          <p className="text-purple-400 text-[9px] md:text-[10px] tracking-[0.3em] font-bold mb-2">RESULTADOS DE BÚSQUEDA</p>
          <div className="mt-4 text-[10px] text-gray-500 tracking-[0.2em] font-bold">{professionals.length} PROFESIONALES DISPONIBLES</div>
        </header>

        {professionals.length === 0 ? (
          <div className="text-center py-32 bg-white/[0.02] backdrop-blur-xl rounded-[3rem] border border-dashed border-white/10">
            <Search size={40} className="mx-auto mb-6 text-gray-700" />
            <p className="text-gray-500 tracking-[0.3em] text-[10px] font-bold">SIN RESULTADOS CON PERFIL COMPLETO</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-10">
            {professionals.map((pro) => (
              <motion.div key={pro.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} onClick={() => navigate(`/profile/${pro.id}`)} 
                className="bg-white/[0.03] backdrop-blur-xl rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 overflow-hidden hover:border-purple-500/40 transition-all cursor-pointer group shadow-2xl flex flex-col h-full"
              >
                <div className="aspect-square md:aspect-[4/3] bg-[#111] overflow-hidden relative">
                  <img src={pro.photos[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                  
                  <div className="absolute top-2 right-2 md:top-6 md:right-6 bg-black/60 backdrop-blur-md px-3 md:px-5 py-1.5 md:py-2 rounded-full border border-white/10 flex items-center gap-2">
                    <Star size={14} className="text-amber-400 fill-amber-400" /> 
                    <span className="text-[10px] md:text-sm font-black text-white">{pro.score || 0}</span>
                  </div>

                  <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 flex flex-col gap-1.5">
                    <div className="bg-purple-600/80 backdrop-blur-md px-2 md:px-3 py-1 rounded-full text-[6px] md:text-[7px] tracking-[0.2em] font-black text-white uppercase border border-white/10 w-fit">
                      {pro.job || "PRO"}
                    </div>
                  </div>
                </div>

                <div className="p-3 md:p-8 flex flex-col flex-grow">
                  <div className="space-y-2 md:space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[12px] md:text-2xl font-normal tracking-wide text-white font-['Poppins'] line-clamp-1 uppercase leading-none">{pro.name}</h3>
                      {pro.isPro ? (
                        <ShieldCheck size={18} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      ) : pro.verified ? (
                        <ShieldCheck size={18} className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                      ) : null}
                    </div>

                    {(pro.completedCourses && pro.completedCourses.length > 0) && (
                      <div className="flex flex-wrap gap-1 md:gap-2">
                        {pro.completedCourses.includes('cert_fotografia_triangulo') && (
                          <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-1.5 md:px-2 py-0.5 rounded text-[6px] md:text-[7px] font-black tracking-widest text-purple-400">
                            <Zap size={8} className="fill-purple-400" /> TECH PRO
                          </div>
                        )}
                        {pro.completedCourses.includes('cert_generico') && (
                          <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-1.5 md:px-2 py-0.5 rounded text-[6px] md:text-[7px] font-black tracking-widest text-blue-400">
                            <Award size={8} /> ÉTICA
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5 text-gray-500 text-[8px] md:text-xs tracking-[0.15em] font-bold">
                      <MapPin size={10} className="text-purple-500/50 md:w-4"/> 
                      <span className="line-clamp-1">{pro.location || "ARG"}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-3 md:pt-8 border-t border-white/5 flex justify-between items-center group-hover:border-purple-500/20">
                    <span className="text-[7px] md:text-[9px] text-gray-700 tracking-[0.4em] font-['Poppins']">CLASSCODE®</span>
                    <div className="text-white text-[9px] md:text-xs tracking-[0.2em] font-black flex items-center gap-2 group-hover:text-purple-400 transition-all">
                      <span className="hidden md:inline">VER PERFIL</span> <ArrowRight size={14} className="md:w-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
))}
          </div>
        )}
      </main>

      <footer className="bg-black py-16 md:py-24 px-6 border-t border-white/5 text-center relative z-10">
        <h2 className="text-white text-2xl md:text-4xl font-['Poppins'] tracking-[0.05em] uppercase mb-4 opacity-40">CLASSCODE</h2>
        <p className="text-[9px] md:text-xs uppercase tracking-[0.5em] font-bold opacity-20 leading-loose">© 2026 — TODOS LOS DERECHOS RESERVADOS</p>
      </footer>
      </div>
  );
}
