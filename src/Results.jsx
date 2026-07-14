import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, onSnapshot, query } from 'firebase/firestore'; 
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Search, Star, ShieldCheck, Zap, Award } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, "professionals"));
    
    const unsubscribeDocs = onSnapshot(q, (snapshot) => {
      const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log("Datos recibidos de Firebase:", allDocs);
      
      // Filtramos (puedes ajustar esta lógica según necesites)
      setProfessionals(allDocs);
      setLoading(false);
    }, (error) => {
      console.error("ERROR DE FIREBASE:", error);
      setLoading(false);
    });
  
    return () => unsubscribeDocs();
  }, [location.search]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-['Poppins'] tracking-[0.35em] text-[10px]">
      SINCRONIZANDO...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] antialiased flex flex-col relative overflow-hidden uppercase">
      {/* Tu estructura de fondo, nav y main aquí */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-purple-600/10 rounded-full blur-[100px] md:blur-[150px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-0 w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-indigo-600/10 rounded-full blur-[90px] md:blur-[130px]" />
      </div>

      <nav className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center relative z-50 bg-black/20 backdrop-blur-md">
        <div onClick={() => navigate('/home')} className="text-xl cursor-pointer uppercase text-white font-['Poppins'] tracking-[0.05em]">CLASSCODE</div>
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
            <p className="text-gray-500 tracking-[0.3em] text-[10px] font-bold">SIN RESULTADOS</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-10">
            {professionals.map((pro) => (
              <motion.div key={pro.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} onClick={() => navigate(`/profile/${pro.id}`)} 
                className="bg-white/[0.03] backdrop-blur-xl rounded-[1.5rem] border border-white/5 overflow-hidden hover:border-purple-500/40 transition-all cursor-pointer group shadow-2xl flex flex-col h-full"
              >
                {/* ... resto de tu contenido de tarjeta igual al original ... */}
              </motion.div>
            ))}
          </div>
        )}
      </main>
      
      <footer className="bg-black py-16 px-6 border-t border-white/5 text-center relative z-10">
         <h2 className="text-white text-2xl font-['Poppins'] tracking-[0.05em] uppercase mb-4 opacity-40">CLASSCODE</h2>
      </footer>
    </div>
  );
}