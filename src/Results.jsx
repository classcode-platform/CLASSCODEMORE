import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase'; 
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; 
import { MapPin, ArrowRight, User, Search, Trophy } from 'lucide-react'; // Importamos Trophy

export default function Results() {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/');
      } else {
        fetchDocs();
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchDocs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "professionals"));
      const allDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      const q = params.get('q'); 
      const loc = params.get('location');

      let filtered = allDocs;

      if (cat) {
        filtered = filtered.filter(p => p.job?.toLowerCase() === cat.toLowerCase());
      }
      
      if (q) {
        filtered = filtered.filter(p => 
          p.name?.toLowerCase().includes(q.toLowerCase()) || 
          p.job?.toLowerCase().includes(q.toLowerCase())
        );
      }

      if (loc) {
        filtered = filtered.filter(p => p.location?.toLowerCase().includes(loc.toLowerCase()));
      }

      filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
      setProfessionals(filtered);
    } catch (error) {
      console.error("Error cargando resultados:", error);
    } finally {
      setLoading(false);
    }
  };

  const logoStyle = { fontFamily: 'Poppins', fontWeight: 400, letterSpacing: '0.35em' };

  if (loading) return <div className="min-h-screen bg-[#282929] flex items-center justify-center text-white font-['Poppins'] tracking-[0.35em] text-[10px]">CARGANDO RESULTADOS...</div>;

  return (
    <div className="min-h-screen bg-[#282929] text-white font-['Open_Sans'] font-light antialiased flex flex-col">
      
      {/* HEADER CON MARCA REGISTRADA */}
      <nav className="p-6 border-b border-white/5 flex justify-between items-center bg-[#171717]">
        <div 
          onClick={() => navigate('/home')} 
          className="text-[16px] cursor-pointer uppercase text-white"
          style={logoStyle}
        >
          CLASSCODE
        </div>
        <div className="flex gap-6 items-center">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-normal">{professionals.length} Talentos</div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10 flex-grow w-full">
        
        {professionals.length === 0 ? (
          <div className="text-center py-20 bg-[#1e1e1e] rounded-[3rem] border border-dashed border-white/10">
            <Search size={40} className="mx-auto mb-4 text-gray-700" />
            <p className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">No hay talentos disponibles en esta categoría</p>
            <button onClick={() => navigate('/home')} className="mt-6 text-purple-400 text-[9px] uppercase tracking-widest hover:text-white transition-all border border-purple-400/20 px-6 py-2 rounded-full font-bold">VOLVER AL BUSCADOR</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {professionals.map((pro) => (
              <div 
                key={pro.id} 
                onClick={() => navigate(`/profile/${pro.id}`)} 
                className="bg-[#171717] rounded-[2rem] border border-white/5 overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer group shadow-2xl flex flex-col h-full"
              >
                <div className="aspect-video bg-[#222] overflow-hidden relative">
                  {pro.photos?.[0] ? (
                    <img src={pro.photos[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={pro.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-black text-gray-700 text-[8px] uppercase tracking-[0.3em] font-bold">Sin portfolio visual</div>
                  )}
                  
                  {/* --- BADGE DE XP EN LA FOTO --- */}
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                    <Trophy size={10} className="text-yellow-500" />
                    <span className="text-[8px] tracking-[0.2em] font-bold text-white uppercase">{pro.score || 0} XP</span>
                  </div>

                  <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[8px] tracking-[0.2em] font-bold uppercase">
                    NIVEL {Math.floor((pro.score || 0) / 100)}
                  </div>
                </div>

                <div className="p-8 space-y-4 flex flex-col flex-grow">
                  <div>
                    {/* Badge Dinámico de Nivelación - Indica si aprobó el examen de Academy */}
                    <div className="flex items-center gap-2 mb-2">
                      {pro.verified ? (
                        <span className="bg-green-500/10 text-green-400 text-[7px] font-bold px-2 py-0.5 rounded-full border border-green-500/20 tracking-widest uppercase">
                          Talento Nivelado
                        </span>
                      ) : (
                        <span className="bg-amber-500/10 text-amber-400 text-[7px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20 tracking-widest uppercase">
                          Pendiente Nivelación
                        </span>
                      )}
                    </div>

                    <h3 className="text-[17px] font-normal uppercase tracking-wider text-white font-['Poppins']">{pro.name || "Talento Anónimo"}</h3>
                    <p className="text-purple-400 text-[10px] uppercase tracking-[0.3em] font-bold mt-1">{pro.job || "Profesional"}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase font-bold">
                    <MapPin size={12} className="text-gray-600"/> {pro.location || "Ubicación a consultar"}
                  </div>

                  <p className="text-gray-500 text-[12px] line-clamp-2 font-light leading-relaxed flex-grow italic">
                    {pro.bio ? `"${pro.bio}"` : "Este talento aún no ha redactado su biografía profesional."}
                  </p>

                  <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[8px] text-gray-600 uppercase tracking-widest" style={logoStyle}>CLASSCODE® TALENT</span>
                    <div className="text-purple-400 text-[9px] tracking-[0.2em] font-bold group-hover:text-white transition-colors flex items-center gap-2">
                      EXPLORAR <ArrowRight size={12}/>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-[#282929] py-16 px-4 border-t border-white/5 text-center">
        <h2 className="text-white uppercase mb-6" style={logoStyle}>CLASSCODE®</h2>
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500">
            © 2025 CLASSCODE® — TODOS LOS DERECHOS RESERVADOS
          </p>
          <p className="text-[9px] uppercase tracking-[0.2em] font-light text-gray-600 italic">
            Vigente desde el 29 de diciembre de 2025.
          </p>
        </div>
      </footer>
    </div>
  );
}