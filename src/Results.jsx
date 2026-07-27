import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, onSnapshot, query } from 'firebase/firestore'; 
import { motion } from 'framer-motion';
import { MapPin, ArrowRight, Search, Star, ShieldCheck, Zap, Award, Filter, X, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRubro, setSelectedRubro] = useState('');
  const [selectedProvincia, setSelectedProvincia] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  const RUBROS = {
    "FOTOGRAFÍA": ["Fotografía Social", "Fotografía de Moda", "Fotografía Publicitaria", "Fotografía de Producto", "Fotografía Gastronómica", "Fotografía Inmobiliaria", "Fotografía Corporativa", "Fotografía Editorial", "Fotografía Deportiva", "Fotografía de Naturaleza", "Retrato", "Drone"],
    "AUDIOVISUAL": ["Filmmaker", "Dirección de Fotografía", "Edición de Video", "Color Grading", "Motion Graphics", "Animación 2D / 3D", "Streaming", "Operador de Cámara", "Drone", "Producción de Contenido"],
    "MODELO": ["Moda", "Publicidad", "E-commerce", "Pasarela", "Presencia para Eventos", "Fitness", "Curvy", "Comercial", "Editorial", "Partes del cuerpo (Hands / Feet / Hair)"],
    "ESCÉNICO": ["Actor / Actriz", "Bailarín/a", "Cantante", "Músico", "Performer", "Comediante", "Improvisación", "Voz", "Locución", "Doblaje"],
    "DIGITAL": ["Influencer", "UGC Creator", "Streamer", "Presentador/a de Contenido", "Community Creator", "Community Manager", "Social Media Manager", "Content Creator", "Podcaster"],
    "SHOW": ["Animación", "Magia", "Circo", "Personajes", "Shows Infantiles", "Shows Temáticos", "Zanquistas", "Comparsas", "Bandas", "DJs en Vivo", "Karaoke", "Humor"],
    "PRODUCCIÓN / DIRECCIÓN": ["Producción Audiovisual", "Producción de Moda", "Producción de Eventos", "Dirección General", "Dirección Creativa", "Dirección de Arte", "Dirección de Casting", "Asistencia de Producción"],
    "MAKEUP / PELO": ["Makeup Social", "Makeup Editorial", "Makeup FX", "Makeup Artístico", "Hairstylist", "Barbería", "Caracterización"],
    "ESTILISMO / MODA": ["Estilismo", "Vestuario", "Personal Shopper", "Asesoría de Imagen", "Diseño de Moda", "Sastrería"],
    "DISEÑO / ARTE": ["Diseño Gráfico", "Ilustración", "Branding", "Identidad Visual", "UX/UI", "Escenografía", "Escaparatismo", "Arte Digital"],
    "DJ / SONIDO": ["DJ", "Sonidista", "Operador de Audio", "Ingeniería de Sonido", "Musicalización", "Producción Musical", "Grabación", "Mezcla y Mastering"],
    "CATERING / BARRA": ["Catering", "Barra", "Bartender", "Barista", "Coffee Break", "Pastelería", "Food Truck", "Chef Privado"],
    "PLANNER / EVENTOS": ["Wedding Planner", "Event Planner", "Coordinación de Eventos", "Organización Integral", "Maestro/a de Ceremonias", "Protocolo", "Logística"],
    "TÉCNICA / ILUMINACIÓN": ["Iluminación", "Operador de Luces", "Pantallas LED", "Escenarios", "Estructuras", "Rigging", "Efectos Especiales", "Mapping"],
    "LOCACIONES": ["Salones", "Quintas", "Estudios Fotográficos", "Estudios Audiovisuales", "Teatros", "Galpones", "Hoteles", "Rooftops", "Restaurantes", "Bares", "Espacios Corporativos", "Espacios al Aire Libre"]
  };

  const PROVINCIAS = ["Buenos Aires", "Capital Federal", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes", "Río Negro", "Neuquén", "Chubut", "Formosa", "Jujuy", "San Luis", "San Juan", "La Rioja", "La Pampa", "Santiago del Estero", "Catamarca", "Santa Cruz", "Tierra del Fuego"];

  useEffect(() => {
    if (!db) return;

    const params = new URLSearchParams(location.search);
    const urlJob = params.get('job');
    const urlLocation = params.get('location');
    if (urlJob) setSelectedRubro(urlJob);
    if (urlLocation) setSelectedProvincia(urlLocation);

    const q = query(collection(db, "professionals"));
    
    const unsubscribeDocs = onSnapshot(q, (snapshot) => {
      let extractedProfiles = [];
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const docId = docSnap.id;

        if (data.profiles && Array.isArray(data.profiles) && data.profiles.length > 0) {
          data.profiles.forEach((p, idx) => {
            extractedProfiles.push({
              id: docId,
              subIndex: idx,
              ...p
            });
          });
        } else {
          extractedProfiles.push({
            id: docId,
            ...data
          });
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
    const hasJob = pro.job && pro.job.trim() !== '';
    const hasMedia = pro.videoLink || pro.photo1 || (pro.photos && pro.photos.length > 0);
    return hasName && hasJob && hasMedia;
  };

  // Filtrado y ordenamiento por puntaje (mayor a menor) + perfiles vacíos al fondo
  const filteredProfessionals = professionals.filter(pro => {
    const matchRubro = selectedRubro ? pro.job?.toLowerCase() === selectedRubro.toLowerCase() : true;
    const matchProvincia = selectedProvincia ? pro.location?.toLowerCase() === selectedProvincia.toLowerCase() : true;
    const matchSpecialty = selectedSpecialty ? pro.specialty?.toLowerCase() === selectedSpecialty.toLowerCase() : true;
    return matchRubro && matchProvincia && matchSpecialty;
  }).sort((a, b) => {
    const aComplete = isProfileComplete(a);
    const bComplete = isProfileComplete(b);

    // Si uno está completo y el otro no, priorizamos el completo
    if (aComplete && !bComplete) return -1;
    if (!aComplete && bComplete) return 1;

    // Si ambos están completos o ambos están incompletos, ordenamos por score de mayor a menor
    const scoreA = Number(a.score) || 0;
    const scoreB = Number(b.score) || 0;
    return scoreB - scoreA;
  });

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-['Poppins'] tracking-[0.35em] text-[10px]">
      SINCRONIZANDO...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] antialiased flex flex-col relative overflow-hidden uppercase">
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-purple-600/10 rounded-full blur-[100px] md:blur-[150px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-0 w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-indigo-600/10 rounded-full blur-[90px] md:blur-[130px]" />
      </div>

      <nav className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center relative z-50 bg-black/20 backdrop-blur-md">
        <div onClick={() => navigate('/home')} className="text-xl cursor-pointer uppercase text-white font-['Poppins'] tracking-[0.05em]">CLASSCODE</div>
        <button onClick={() => navigate('/home')} className="p-3 rounded-full bg-white/5 border border-white/5 text-purple-400 cursor-pointer"><Search size={18} /></button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-12 flex-grow w-full relative z-10">
        <header className="mb-8 md:mb-12">
          <p className="text-purple-400 text-[9px] md:text-[10px] tracking-[0.3em] font-bold mb-2">RESULTADOS DE BÚSQUEDA</p>
          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <span className="text-[10px] text-gray-400 tracking-[0.2em] font-bold">{filteredProfessionals.length} TALENTOS DISPONIBLES</span>
            
            {(selectedRubro || selectedProvincia || selectedSpecialty) && (
              <button 
                onClick={() => { setSelectedRubro(''); setSelectedProvincia(''); setSelectedSpecialty(''); }}
                className="self-start md:self-auto flex items-center gap-2 text-[8px] font-black tracking-widest bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-purple-400 hover:bg-white/10 transition-all cursor-pointer">
                <X size={12}/> LIMPIAR FILTROS
              </button>
            )}
          </div>
        </header>

        <section className="bg-white/[0.02] border border-white/5 backdrop-blur-xl rounded-3xl p-6 mb-12 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 text-[9px] font-black text-purple-400 tracking-widest border-l-2 border-purple-500 pl-3">
            <Filter size={14}/> FILTROS DE BÚSQUEDA
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[7px] text-gray-500 tracking-widest font-bold">RUBRO</label>
              <select 
                className="w-full bg-[#121215] border border-white/10 rounded-2xl p-4 text-[9px] text-white uppercase outline-none focus:border-purple-500 tracking-widest cursor-pointer"
                value={selectedRubro}
                onChange={(e) => { setSelectedRubro(e.target.value); setSelectedSpecialty(''); }}>
                <option value="">TODOS LOS RUBROS</option>
                {Object.keys(RUBROS).map(rubro => (
                  <option key={rubro} value={rubro}>{rubro}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[7px] text-gray-500 tracking-widest font-bold">ESPECIALIDAD</label>
              <select 
                className="w-full bg-[#121215] border border-white/10 rounded-2xl p-4 text-[9px] text-white uppercase outline-none focus:border-purple-500 tracking-widest cursor-pointer"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                disabled={!selectedRubro}>
                <option value="">TODAS LAS ESPECIALIDADES</option>
                {selectedRubro && RUBROS[selectedRubro]?.map(spec => (
                  <option key={spec} value={spec}>{spec.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[7px] text-gray-500 tracking-widest font-bold">PROVINCIA / UBICACIÓN</label>
              <select 
                className="w-full bg-[#121215] border border-white/10 rounded-2xl p-4 text-[9px] text-white uppercase outline-none focus:border-purple-500 tracking-widest cursor-pointer"
                value={selectedProvincia}
                onChange={(e) => setSelectedProvincia(e.target.value)}>
                <option value="">TODAS LAS PROVINCIAS</option>
                {PROVINCIAS.map(prov => (
                  <option key={prov} value={prov}>{prov.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {filteredProfessionals.length === 0 ? (
          <div className="text-center py-32 bg-white/[0.02] backdrop-blur-xl rounded-[3rem] border border-dashed border-white/10">
            <Search size={40} className="mx-auto mb-6 text-gray-700" />
            <p className="text-gray-500 tracking-[0.3em] text-[10px] font-bold">NO SE ENCONTRARON TALENTOS CON ESOS FILTROS</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredProfessionals.map((pro, index) => {
              const coverImage = pro.photo1 || (pro.photos && pro.photos[0]) || '';
              
              return (
                <motion.div 
                  key={`${pro.id}-${index}`} 
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  onClick={() => navigate(`/profile/${pro.id}`)} 
                  className="bg-white/[0.03] backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden hover:border-purple-500/40 transition-all cursor-pointer group shadow-2xl flex flex-col h-full"
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
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-gray-600 text-[8px] tracking-widest font-black">SIN CONTENIDO VISUAL</div>
                    )}

                    {pro.job && (
                      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black tracking-widest text-purple-400">
                        {pro.job}
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-grow justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-['Poppins'] font-normal text-white truncate tracking-wide">{pro.name || 'TALENTO'}</h3>
                        <span className="flex items-center gap-1 text-[8px] font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                          <CheckCircle2 size={10} /> VERIFICADO
                        </span>
                      </div>

                      {pro.specialty && (
                        <p className="text-[9px] text-gray-400 font-bold tracking-widest">{pro.specialty}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[8px] text-gray-500 font-bold tracking-widest pt-2">
                        {pro.location && (
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-purple-400"/> {pro.location}</span>
                        )}
                        <span className="flex items-center gap-1"><Award size={12} className="text-purple-400"/> {pro.score || 0} PTS</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[8px] font-black tracking-widest text-purple-400 group-hover:text-purple-300">
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
      
      <footer className="bg-black py-16 px-6 border-t border-white/5 text-center relative z-10 font-['Poppins']">
         <h2 className="text-white text-2xl font-normal tracking-[0.05em] uppercase mb-4 opacity-40">CLASSCODE</h2>
         <p className="text-[8px] uppercase tracking-[0.4em] text-gray-600">© 2026 — TODOS LOS DERECHOS RESERVADOS</p>
      </footer>
    </div>
  );
}