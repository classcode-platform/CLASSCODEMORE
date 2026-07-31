import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase'; 
import { collection, onSnapshot, query } from 'firebase/firestore'; 
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight, Search, ShieldCheck, Zap, Award, Filter, X, CheckCircle2, ChevronDown, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('classcode_theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  const [selectedMacro, setSelectedMacro] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [selectedProvincia, setSelectedProvincia] = useState('');
  const [searchTermQuery, setSearchTermQuery] = useState('');

  const [isMacroOpen, setIsMacroOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [isLocOpen, setIsLocOpen] = useState(false);

  const macroRef = useRef(null);
  const subRef = useRef(null);
  const locRef = useRef(null);

  // ESTRUCTURA OFICIAL DE RUBROS ACTUALIZADA (Macro-categorías en 2 palabras)
  const RUBROS = {
    "FOTO Y VIDEO": [
      "Fotografía", "Video", "Edición", "Cobertura Integral", "Drone"
    ],
    "ESPACIOS Y LOCACIONES": [
      "Salones", "Estudios", "Quintas", "Teatros", "Hoteles", "Otros espacios"
    ],
    "TÉCNICA Y EQUIPAMIENTO": [
      "Sonido e iluminación", "Rental", "Iluminación", "Pantallas LED", "DJ"
    ],
    "AMBIENTACIÓN Y PROVEEDORES": [
      "Ambientación", "Catering", "Pastelería", "Barra", "Planner"
    ],
    "ESTILISMO Y BELLEZA": [
      "Make up", "Hairstylist", "Moda", "Estilismo", "Asesoría de Imagen"
    ],
    "SHOWS Y TALENTOS": [
      "Artista", "Producción", "Influencer", "Show", "UGC", "Community Manager"
    ]
  };

  const PROVINCIAS = ["CABA", "Buenos Aires", "Capital Federal", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes", "Río Negro", "Neuquén", "Chubut", "Formosa", "Jujuy", "San Luis", "San Juan", "La Rioja", "La Pampa", "Santiago del Estero", "Catamarca", "Santa Cruz", "Tierra del Fuego"];

  useEffect(() => {
    const handleStorageChange = () => {
      const savedTheme = localStorage.getItem('classcode_theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (macroRef.current && !macroRef.current.contains(event.target)) setIsMacroOpen(false);
      if (subRef.current && !subRef.current.contains(event.target)) setIsSubOpen(false);
      if (locRef.current && !locRef.current.contains(event.target)) setIsLocOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!db) return;

    const params = new URLSearchParams(location.search);
    const urlCategory = params.get('category') || params.get('job');
    const urlLocation = params.get('location');
    const urlQuery = params.get('q');

    if (urlCategory) {
      if (RUBROS[urlCategory]) {
        setSelectedMacro(urlCategory);
      } else {
        for (const [macro, subs] of Object.entries(RUBROS)) {
          if (subs.some(s => s.toLowerCase() === urlCategory.toLowerCase())) {
            setSelectedMacro(macro);
            setSelectedSub(urlCategory);
            break;
          }
        }
      }
    }
    if (urlLocation) setSelectedProvincia(urlLocation);
    if (urlQuery) setSearchTermQuery(urlQuery);

    const q = query(collection(db, "professionals"));
    
    const unsubscribeDocs = onSnapshot(q, (snapshot) => {
      let extractedProfiles = [];
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const docId = docSnap.id;

        if (data.profiles && Array.isArray(data.profiles) && data.profiles.length > 0) {
          data.profiles.forEach((p, idx) => {
            extractedProfiles.push({ id: docId, subIndex: idx, ...p });
          });
        } else {
          extractedProfiles.push({ id: docId, ...data });
        }
      });
      
      setProfessionals(extractedProfiles);
      setLoading(false);
    }, (error) => {
      console.error("ERROR DE FIREBASE:", error);
      setLoading(false);
    });
  
    return () => unsubscribeDocs();
  }, [location.search]);

  const isProfileComplete = (pro) => {
    const hasName = pro.name && pro.name.trim() !== '' && pro.name.trim() !== 'NUEVO TALENTO';
    const hasJob = (pro.job && pro.job.trim() !== '') || (pro.category && pro.category.trim() !== '');
    const hasMedia = pro.videoLink || pro.photo1 || (pro.photos && pro.photos.length > 0);
    return hasName && hasJob && hasMedia;
  };

  const filteredProfessionals = professionals.filter(pro => {
    const proRubro = pro.job || pro.category || '';
    
    let matchMacro = true;
    if (selectedMacro) {
      const subsOfMacro = RUBROS[selectedMacro] || [];
      matchMacro = proRubro.toLowerCase() === selectedMacro.toLowerCase() || 
                   subsOfMacro.some(s => s.toLowerCase() === proRubro.toLowerCase()) ||
                   pro.specialty?.toLowerCase() === selectedMacro.toLowerCase();
    }

    let matchSub = true;
    if (selectedSub) {
      matchSub = proRubro.toLowerCase() === selectedSub.toLowerCase() || 
                 pro.specialty?.toLowerCase() === selectedSub.toLowerCase();
    }

    const matchProvincia = selectedProvincia ? pro.location?.toLowerCase().includes(selectedProvincia.toLowerCase()) : true;
    const matchQuery = searchTermQuery ? (
      pro.name?.toLowerCase().includes(searchTermQuery.toLowerCase()) ||
      proRubro.toLowerCase().includes(searchTermQuery.toLowerCase()) ||
      pro.location?.toLowerCase().includes(searchTermQuery.toLowerCase())
    ) : true;

    return matchMacro && matchSub && matchProvincia && matchQuery;
  }).sort((a, b) => {
    const aComplete = isProfileComplete(a);
    const bComplete = isProfileComplete(b);
    if (aComplete && !bComplete) return -1;
    if (!aComplete && bComplete) return 1;
    return (Number(b.score) || 0) - (Number(a.score) || 0);
  });

  const currentSubcategories = selectedMacro && RUBROS[selectedMacro] ? RUBROS[selectedMacro] : [];

  if (loading) return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0a0a0c] text-white' : 'bg-[#f4f4f6] text-neutral-900'} flex items-center justify-center font-['Poppins'] tracking-[0.35em] text-[10px]`}>
      SINCRONIZANDO...
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0a0a0c] text-white' : 'bg-[#f4f4f6] text-neutral-900'} font-['Open_Sans'] antialiased flex flex-col relative overflow-x-hidden uppercase transition-colors duration-300`}>
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute top-0 left-0 w-[250px] md:w-[600px] h-[250px] md:h-[600px] ${isDarkMode ? 'bg-purple-600/10' : 'bg-purple-600/5'} rounded-full blur-[100px] md:blur-[150px]`} />
      </div>

      <nav className={`p-6 md:p-8 border-b ${isDarkMode ? 'border-white/5 bg-black/20' : 'border-black/5 bg-white/60'} flex justify-between items-center relative z-50 backdrop-blur-md`}>
        <div onClick={() => navigate('/')} className={`text-xl cursor-pointer uppercase ${isDarkMode ? 'text-white' : 'text-neutral-900'} font-['Poppins'] tracking-[0.05em]`}>CLASSCODE</div>
        <button onClick={() => navigate('/')} className={`p-3 rounded-full ${isDarkMode ? 'bg-white/5 border-white/5 text-purple-400' : 'bg-black/5 border-black/5 text-purple-600'} border cursor-pointer`}><Search size={18} /></button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-12 flex-grow w-full relative z-10">
        
        <header className="mb-8 md:mb-12">
          <p className="text-purple-500 text-[9px] md:text-[10px] tracking-[0.3em] font-bold mb-2">RESULTADOS DE BÚSQUEDA</p>
          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-neutral-600'} tracking-[0.2em] font-bold`}>{filteredProfessionals.length} TALENTOS DISPONIBLES</span>
            
            {(selectedMacro || selectedSub || selectedProvincia || searchTermQuery) && (
              <button 
                onClick={() => { setSelectedMacro(''); setSelectedSub(''); setSelectedProvincia(''); setSearchTermQuery(''); }}
                className={`self-start md:self-auto flex items-center gap-2 text-[8px] font-black tracking-widest ${isDarkMode ? 'bg-white/5 border-white/10 text-purple-400 hover:bg-white/10' : 'bg-black/5 border-black/10 text-purple-600 hover:bg-black/10'} border px-4 py-2 rounded-xl transition-all cursor-pointer`}>
                <X size={12}/> LIMPIAR FILTROS
              </button>
            )}
          </div>
        </header>

        {/* CONTENEDOR DE FILTROS EN CASCADA (3 COLUMNAS) */}
        <section className={`${isDarkMode ? 'bg-white/[0.02] border-white/5 text-white' : 'bg-white/70 border-black/5 text-neutral-900'} border backdrop-blur-xl rounded-3xl p-6 mb-12 shadow-2xl space-y-4 relative z-50`}>
          <div className="flex items-center gap-2 text-[9px] font-black text-purple-500 tracking-widest border-l-2 border-purple-500 pl-3">
            <Filter size={14}/> FILTROS DE BÚSQUEDA EN CASCADA
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. SELECTOR DE MACRO-CATEGORÍA */}
            <div ref={macroRef} className="space-y-1 relative">
              <label className={`text-[7px] ${isDarkMode ? 'text-gray-500' : 'text-neutral-500'} tracking-widest font-bold`}>RUBRO</label>
              
              <button 
                type="button"
                onClick={() => { setIsMacroOpen(!isMacroOpen); setIsSubOpen(false); setIsLocOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border text-[9px] uppercase tracking-widest cursor-pointer transition-all ${isDarkMode ? 'bg-[#121215] border-white/10 text-white' : 'bg-white border-black/10 text-neutral-900'}`}
              >
                <span className={selectedMacro ? "text-purple-400 font-bold truncate" : (isDarkMode ? "text-gray-400 truncate" : "text-neutral-500 truncate")}>
                  {selectedMacro || "TODAS LAS CATEGORÍAS"}
                </span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isMacroOpen ? 'rotate-180 text-purple-400' : 'text-gray-400'}`} />
              </button>

              <AnimatePresence>
                {isMacroOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute top-full left-0 right-0 mt-2 border rounded-2xl shadow-2xl max-h-72 overflow-y-auto z-[100] p-2 space-y-1 ${isDarkMode ? 'bg-[#121215] border-white/10 text-white' : 'bg-white border-black/10 text-neutral-900'}`}
                  >
                    <div 
                      onClick={() => { setSelectedMacro(''); setSelectedSub(''); setIsMacroOpen(false); }}
                      className={`px-3 py-3 text-[9px] uppercase tracking-widest rounded-xl cursor-pointer transition-all flex items-center justify-between ${!selectedMacro ? 'bg-purple-600/20 text-purple-400 font-bold' : 'hover:bg-white/5'}`}
                    >
                      TODOS LOS RUBROS
                      {!selectedMacro && <Check size={14} className="text-purple-400" />}
                    </div>

                    {Object.keys(RUBROS).map((macro) => (
                      <div 
                        key={macro}
                        onClick={() => { 
                          setSelectedMacro(macro); 
                          setSelectedSub(''); 
                          setIsMacroOpen(false); 
                        }}
                        className={`px-3 py-3 text-[9px] font-black uppercase tracking-[0.15em] rounded-xl cursor-pointer transition-all flex items-center justify-between ${selectedMacro === macro ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                      >
                        <span className="truncate">{macro}</span>
                        {selectedMacro === macro && <Check size={14} className="text-purple-400 shrink-0" />}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. SELECTOR DE SUBCATEGORÍA */}
            <div ref={subRef} className="space-y-1 relative">
              <label className={`text-[7px] ${isDarkMode ? 'text-gray-500' : 'text-neutral-500'} tracking-widest font-bold`}>ESPECIALIDAD</label>
              
              <button 
                type="button"
                disabled={!selectedMacro}
                onClick={() => { if(selectedMacro) { setIsSubOpen(!isSubOpen); setIsMacroOpen(false); setIsLocOpen(false); }}}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border text-[9px] uppercase tracking-widest transition-all ${!selectedMacro ? 'opacity-50 cursor-not-allowed bg-black/10 border-white/5 text-gray-600' : 'cursor-pointer'} ${isDarkMode ? 'bg-[#121215] border-white/10 text-white' : 'bg-white border-black/10 text-neutral-900'}`}
              >
                <span className={selectedSub ? "text-purple-400 font-bold truncate" : (isDarkMode ? "text-gray-400 truncate" : "text-neutral-500 truncate")}>
                  {!selectedMacro ? "SELECCIONÁ UN RUBRO PRIMERO" : (selectedSub || "TODAS LAS ESPECIALIDADES")}
                </span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isSubOpen ? 'rotate-180 text-purple-400' : 'text-gray-400'}`} />
              </button>

              <AnimatePresence>
                {isSubOpen && selectedMacro && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute top-full left-0 right-0 mt-2 border rounded-2xl shadow-2xl max-h-56 overflow-y-auto z-[100] p-2 space-y-1 ${isDarkMode ? 'bg-[#121215] border-white/10 text-white' : 'bg-white border-black/10 text-neutral-900'}`}
                  >
                    <div 
                      onClick={() => { setSelectedSub(''); setIsSubOpen(false); }}
                      className={`px-3 py-2.5 text-[9px] uppercase tracking-widest rounded-xl cursor-pointer transition-all flex items-center justify-between ${!selectedSub ? 'bg-purple-600/20 text-purple-400 font-bold' : 'hover:bg-white/5'}`}
                    >
                      TODAS LAS ESPECIALIDADES
                      {!selectedSub && <Check size={14} className="text-purple-400" />}
                    </div>

                    {currentSubcategories.map((sub) => (
                      <div 
                        key={sub}
                        onClick={() => { setSelectedSub(sub); setIsSubOpen(false); }}
                        className={`px-3 py-2.5 text-[9px] uppercase tracking-widest rounded-xl cursor-pointer transition-all flex items-center justify-between ${selectedSub === sub ? 'bg-purple-600/20 text-purple-400 font-bold border border-purple-500/30' : 'text-gray-400 hover:bg-white/5'}`}
                      >
                        <span className="truncate">{sub}</span>
                        {selectedSub === sub && <Check size={14} className="text-purple-400 shrink-0" />}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. SELECTOR DE PROVINCIA */}
            <div ref={locRef} className="space-y-1 relative">
              <label className={`text-[7px] ${isDarkMode ? 'text-gray-500' : 'text-neutral-500'} tracking-widest font-bold`}>PROVINCIA / UBICACIÓN</label>
              
              <button 
                type="button"
                onClick={() => { setIsLocOpen(!isLocOpen); setIsMacroOpen(false); setIsSubOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border text-[9px] uppercase tracking-widest cursor-pointer transition-all ${isDarkMode ? 'bg-[#121215] border-white/10 text-white' : 'bg-white border-black/10 text-neutral-900'}`}
              >
                <span className={selectedProvincia ? "text-purple-400 font-bold truncate" : (isDarkMode ? "text-gray-400 truncate" : "text-neutral-500 truncate")}>
                  {selectedProvincia || "TODAS LAS PROVINCIAS"}
                </span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isLocOpen ? 'rotate-180 text-purple-400' : 'text-gray-400'}`} />
              </button>

              <AnimatePresence>
                {isLocOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute top-full left-0 right-0 mt-2 border rounded-2xl shadow-2xl max-h-56 overflow-y-auto z-[100] p-2 space-y-1 ${isDarkMode ? 'bg-[#121215] border-white/10 text-white' : 'bg-white border-black/10 text-neutral-900'}`}
                  >
                    <div 
                      onClick={() => { setSelectedProvincia(''); setIsLocOpen(false); }}
                      className={`px-3 py-2.5 text-[9px] uppercase tracking-widest rounded-xl cursor-pointer transition-all flex items-center justify-between ${!selectedProvincia ? 'bg-purple-600/20 text-purple-400 font-bold' : 'hover:bg-white/5'}`}
                    >
                      TODAS LAS PROVINCIAS
                      {!selectedProvincia && <Check size={14} className="text-purple-400" />}
                    </div>
                    {PROVINCIAS.map((prov) => (
                      <div 
                        key={prov}
                        onClick={() => { setSelectedProvincia(prov); setIsLocOpen(false); }}
                        className={`px-3 py-2 text-[9px] uppercase tracking-widest rounded-xl cursor-pointer transition-all flex items-center justify-between ${selectedProvincia === prov ? 'bg-purple-600/20 text-purple-400 font-bold border border-purple-500/30' : 'text-gray-400 hover:bg-white/5'}`}
                      >
                        <span className="truncate">{prov}</span>
                        {selectedProvincia === prov && <Check size={14} className="text-purple-400 shrink-0" />}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </section>

        {filteredProfessionals.length === 0 ? (
          <div className={`text-center py-32 ${isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-white/50 border-black/10'} backdrop-blur-xl rounded-[3rem] border border-dashed`}>
            <Search size={40} className={`mx-auto mb-6 ${isDarkMode ? 'text-gray-700' : 'text-neutral-400'}`} />
            <p className={`${isDarkMode ? 'text-gray-500' : 'text-neutral-500'} tracking-[0.3em] text-[10px] font-bold`}>NO SE ENCONTRARON TALENTOS CON ESOS FILTROS</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredProfessionals.map((pro, index) => {
              const coverImage = pro.photo1 || (pro.photos && pro.photos[0]) || '';
              const proRubro = pro.job || pro.category || 'TALENTO';
              
              return (
                <motion.div 
                  key={`${pro.id}-${index}`} 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  onClick={() => navigate(`/profile/${pro.id}`)} 
                  className={`${isDarkMode ? 'bg-white/[0.03] border-white/5 text-white' : 'bg-white/80 border-black/5 text-neutral-900 shadow-lg'} backdrop-blur-xl rounded-[2rem] border overflow-hidden hover:border-purple-500/40 transition-all cursor-pointer group flex flex-col h-full`}
                >
                  <div className="w-full h-64 bg-black relative overflow-hidden">
                    {pro.videoLink ? (
                      <video 
                        src={pro.videoLink} 
                        muted 
                        loop 
                        playsInline 
                        onMouseEnter={(e) => e.target.play().catch(()=>{})}
                        onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none" 
                      />
                    ) : coverImage ? (
                      <img src={coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={pro.name} />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-gray-500 text-[8px] tracking-widest font-black">SIN CONTENIDO VISUAL</div>
                    )}

                    {proRubro && (
                      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black tracking-widest text-purple-400">
                        {proRubro}
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-['Poppins'] font-normal truncate tracking-wide ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>{pro.name || 'TALENTO'}</h3>
                        <span className="flex items-center gap-1 text-[8px] font-black text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                          <CheckCircle2 size={10} /> VERIFICADO
                        </span>
                      </div>

                      {pro.specialty && (
                        <p className={`text-[9px] ${isDarkMode ? 'text-gray-400' : 'text-neutral-600'} font-bold tracking-widest`}>{pro.specialty}</p>
                      )}

                      <div className={`flex flex-wrap items-center gap-3 text-[8px] ${isDarkMode ? 'text-gray-500' : 'text-neutral-500'} font-bold tracking-widest pt-2`}>
                        {pro.location && (
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-purple-500"/> {pro.location}</span>
                        )}
                        <span className="flex items-center gap-1"><Award size={12} className="text-purple-500"/> {pro.score || 0} PTS</span>
                      </div>
                    </div>

                    <div className={`pt-4 border-t ${isDarkMode ? 'border-white/5 text-purple-400' : 'border-black/5 text-purple-600'} flex items-center justify-between text-[8px] font-black tracking-widest group-hover:opacity-80`}>
                      <span>VER PERFIL COMPLETO</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      
      <footer className={`${isDarkMode ? 'bg-black border-white/5 text-white' : 'bg-neutral-900 border-black/5 text-white'} py-16 px-6 border-t text-center relative z-10 font-['Poppins']`}>
         <h2 className="text-2xl font-normal tracking-[0.05em] uppercase mb-4 opacity-40">CLASSCODE</h2>
         <p className="text-[8px] uppercase tracking-[0.4em] text-gray-500">© 2026 — TODOS LOS DERECHOS RESERVADOS</p>
      </footer>
    </div>
  );
}