import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, ChevronDown, Camera, Music, Sparkles, 
  Utensils, Video, ArrowRight, User, LogOut, 
  Home as HomeIcon, Shirt, Palette, PartyPopper, Zap, 
  Users, Theater, Smartphone, Clapperboard, CalendarDays,
  Instagram, Linkedin, MessageCircle, Send, Globe, ShieldCheck, Check
} from 'lucide-react';
import { auth, db } from './firebase'; 
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 

export default function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [email, setEmail] = useState('');
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(0);

  // Estados desplegables custom
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isLocOpen, setIsLocOpen] = useState(false);

  const catRef = useRef(null);
  const locRef = useRef(null);

  const eventPhotos = [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&auto=format&fit=crop"
  ];

  const mobilePromoVideos = [
    "https://res.cloudinary.com/dsyfitywd/video/upload/Copia_de_Video_C1_r2ysay.mp4",
    "https://res.cloudinary.com/dsyfitywd/video/upload/Video_C1_4_woqohu.mp4",
    "https://res.cloudinary.com/dsyfitywd/video/upload/v1784949077/Copia_de_Copia_de_Video_C1_2_wkpqm9.mp4"
  ];

  const categories = [
    { name: 'Fotografía', count: '+ profesionales', icon: Camera, gradient: 'from-cyan-400 to-blue-500' },
    { name: 'Audiovisual', count: '+ profesionales', icon: Video, gradient: 'from-blue-400 to-indigo-600' },
    { name: 'Modelo', count: '+ profesionales', icon: User, gradient: 'from-fuchsia-400 to-purple-600' },
    { name: 'Escénico', count: '+ profesionales', icon: Theater, gradient: 'from-violet-400 to-indigo-500' },
    { name: 'Digital', count: '+ profesionales', icon: Smartphone, gradient: 'from-blue-500 to-teal-400' },
    { name: 'Show', count: '+ profesionales', icon: PartyPopper, gradient: 'from-amber-200 to-yellow-500' },
    { name: 'Producción / Dirección', count: '+ profesionales', icon: Clapperboard, gradient: 'from-red-500 to-orange-600' },
    { name: 'Makeup / Pelo', count: '+ profesionales', icon: Sparkles, gradient: 'from-orange-300 to-yellow-500' },
    { name: 'Estilismo / Moda', count: '+ profesionales', icon: Shirt, gradient: 'from-pink-400 to-rose-500' },
    { name: 'Diseño / Arte', count: '+ profesionales', icon: Palette, gradient: 'from-red-400 to-orange-500' },
    { name: 'DJ / Sonido', count: '+ profesionales', icon: Music, gradient: 'from-green-400 to-emerald-500' },
    { name: 'Catering / Barra', count: '+ profesionales', icon: Utensils, gradient: 'from-lime-400 to-green-600' },
    { name: 'Planner / Eventos', count: '+ profesionales', icon: CalendarDays, gradient: 'from-teal-400 to-emerald-600' },
    { name: 'Técnica / Iluminación', count: '+ profesionales', icon: Zap, gradient: 'from-sky-400 to-blue-600' },
    { name: 'Agencia', count: '+ profesionales', icon: Users, gradient: 'from-indigo-400 to-purple-500' },
    { name: 'Locaciones', count: '+ profesionales', icon: HomeIcon, gradient: 'from-slate-400 to-slate-700' }
  ];

  const locationsList = [
    "CABA", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", 
    "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes", "Río Negro", 
    "Neuquén", "Chubut", "Formosa", "Jujuy", "San Luis", "San Juan", 
    "La Rioja", "La Pampa", "Santiago del Estero", "Catamarca", "Santa Cruz", "Tierra del Fuego"
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (catRef.current && !catRef.current.contains(event.target)) setIsCatOpen(false);
      if (locRef.current && !locRef.current.contains(event.target)) setIsLocOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAccount = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      navigate(userDoc.exists() ? (userDoc.data().role === 'professional' ? '/dashboard' : '/client-profile') : '/onboarding');
    } else {
      navigate('/auth');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleSearch = () => {
    navigate(`/results?category=${encodeURIComponent(selectedCategory)}&q=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(location)}`);
  };

  const handleCategoryClick = (catName) => {
    setSelectedCategory(catName);
    navigate(`/results?category=${encodeURIComponent(catName)}`);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
  };

  useEffect(() => {
    const photoTimer = setInterval(() => {
      setCurrentPhoto((prev) => (prev + 1) % eventPhotos.length);
    }, 4000);
    return () => clearInterval(photoTimer);
  }, [eventPhotos.length]);

  useEffect(() => {
    const videoTimer = setInterval(() => {
      setCurrentVideo((prev) => (prev + 1) % mobilePromoVideos.length);
    }, 6000);
    return () => clearInterval(videoTimer);
  }, [mobilePromoVideos.length]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-['Open_Sans'] flex flex-col relative overflow-hidden antialiased text-white">
      {/* LUCES DINÁMICAS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-purple-600/10 rounded-full blur-[100px] md:blur-[150px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-indigo-600/10 rounded-full blur-[90px] md:blur-[130px]" />
      </div>

      <header className="p-6 md:p-8 flex justify-end items-center max-w-7xl mx-auto w-full relative z-[60]">
        <div className="flex items-center gap-6">
          <button onClick={handleAccount} className="text-[9px] tracking-[0.2em] uppercase text-gray-400 hover:text-white transition-all flex items-center gap-2 font-bold"><User size={12}/> MI CUENTA</button>
          <button onClick={handleLogout} className="text-[9px] tracking-[0.2em] uppercase text-gray-400 hover:text-red-400 transition-all flex items-center gap-2 font-bold"><LogOut size={12}/> SALIR</button>
        </div>
      </header>

      <main className="flex-grow relative z-10">
        <div className="pt-8 md:pt-12 pb-8 md:pb-16 px-4 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 md:mb-12">
            <h1 className="text-4xl md:text-6xl text-white mb-4 md:mb-6 uppercase font-['Poppins'] font-normal tracking-[0.05em] leading-none">CLASSCODE</h1>
            <p className="text-gray-400 text-[10px] md:text-xs font-light tracking-[0.3em] uppercase">Descubre o comparte tu talento con el mundo</p>
          </motion.div>

          {/* BUSCADOR */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-4xl mx-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-3 flex flex-col md:flex-row items-center gap-2 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative z-50">
            
            {/* INPUT BUSCAR */}
            <div className="flex-1 flex items-center px-6 py-4 w-full border-b md:border-b-0 md:border-r border-white/10">
              <Search className="text-purple-400 w-5 h-5 mr-4 shrink-0" />
              <input type="text" placeholder="BUSCAR PROFESIONALES..." className="bg-transparent border-none outline-none text-white w-full font-normal uppercase text-[11px] placeholder:text-gray-600 tracking-widest" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            {/* DROPDOWN CATEGORÍAS */}
            <div ref={catRef} className="flex-1 w-full border-b md:border-b-0 md:border-r border-white/10 relative">
              <button 
                type="button"
                onClick={() => { setIsCatOpen(!isCatOpen); setIsLocOpen(false); }}
                className="w-full flex items-center justify-between px-6 py-4 text-left uppercase text-[11px] tracking-widest text-gray-300 hover:text-white transition-all"
              >
                <span className={selectedCategory ? "text-purple-300 font-bold" : "text-gray-400"}>
                  {selectedCategory || "CATEGORÍAS"}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isCatOpen ? 'rotate-180 text-purple-400' : ''}`} />
              </button>

              <AnimatePresence>
                {isCatOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl max-h-72 overflow-y-auto z-50 p-2 space-y-1"
                  >
                    <div 
                      onClick={() => { setSelectedCategory(''); setIsCatOpen(false); }}
                      className="px-4 py-3 text-[10px] uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-white rounded-xl cursor-pointer transition-all flex items-center justify-between"
                    >
                      TODAS LAS CATEGORÍAS
                      {!selectedCategory && <Check size={14} className="text-purple-400" />}
                    </div>
                    {categories.map((c) => {
                      const IconComponent = c.icon;
                      return (
                        <div 
                          key={c.name}
                          onClick={() => { setSelectedCategory(c.name); setIsCatOpen(false); }}
                          className={`px-3 py-2.5 text-[10px] uppercase tracking-widest rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 ${selectedCategory === c.name ? 'bg-purple-600/20 text-white font-bold border border-purple-500/30' : 'text-gray-300 hover:bg-white/5'}`}
                        >
                          <div className="flex items-center gap-3">
                            {/* ÍCONOS Y GRADIENTES SOLAMENTE EN MOBILE (lg:hidden) */}
                            <div className={`lg:hidden w-7 h-7 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                              <IconComponent className="text-white w-3.5 h-3.5" />
                            </div>
                            <span>{c.name}</span>
                          </div>
                          {selectedCategory === c.name && <Check size={14} className="text-purple-400 shrink-0" />}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* UBICACIÓN */}
            <div ref={locRef} className="flex-1 w-full relative">
              <button 
                type="button"
                onClick={() => { setIsLocOpen(!isLocOpen); setIsCatOpen(false); }}
                className="w-full flex items-center justify-between px-6 py-4 text-left uppercase text-[11px] tracking-widest text-gray-300 hover:text-white transition-all"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="text-purple-400 w-5 h-5 shrink-0" />
                  <span className={location ? "text-purple-300 font-bold" : "text-gray-400"}>
                    {location || "UBICACIÓN"}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isLocOpen ? 'rotate-180 text-purple-400' : ''}`} />
              </button>

              <AnimatePresence>
                {isLocOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl max-h-60 overflow-y-auto z-50 p-2"
                  >
                    <div 
                      onClick={() => { setLocation(''); setIsLocOpen(false); }}
                      className="px-4 py-3 text-[10px] uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-white rounded-xl cursor-pointer transition-all flex items-center justify-between"
                    >
                      TODAS LAS UBICACIONES
                      {!location && <Check size={14} className="text-purple-400" />}
                    </div>
                    {locationsList.map((prov) => (
                      <div 
                        key={prov}
                        onClick={() => { setLocation(prov); setIsLocOpen(false); }}
                        className={`px-4 py-2.5 text-[10px] uppercase tracking-widest rounded-xl cursor-pointer transition-all flex items-center justify-between ${location === prov ? 'bg-purple-600/20 text-white font-bold border border-purple-500/30' : 'text-gray-300 hover:bg-white/5'}`}
                      >
                        {prov}
                        {location === prov && <Check size={14} className="text-purple-400" />}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button type="button" onClick={handleSearch} className="w-full md:w-auto px-10 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 transition-all shadow-xl">BUSCAR</button>
          </motion.div>
        </div>

        {/* GRILLA DE TARJETAS (SOLO EN DESKTOP / OCULTA EN MOBILE) */}
        <div className="hidden lg:block max-w-6xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <motion.div key={cat.name} onClick={() => handleCategoryClick(cat.name)} whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.08)' }} className="bg-white/5 backdrop-blur-md p-6 rounded-[1.5rem] flex items-center gap-5 border border-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-lg">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.4)]`}><cat.icon className="text-white w-5 h-5" /></div>
                <div>
                  <h3 className="text-white font-bold text-[10px] uppercase tracking-[0.1em] leading-tight">{cat.name}</h3>
                  <p className="text-[7px] text-gray-500 uppercase tracking-widest mt-1 font-bold">{cat.count}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* DESKTOP (LIVE GALLERY + ACADEMY) */}
        <section className="hidden lg:grid max-w-6xl mx-auto px-6 py-20 lg:grid-cols-2 gap-12 items-center">
          <div className="w-full relative group">
            <h2 className="text-white font-['Poppins'] text-2xl uppercase tracking-widest mb-8">Live Gallery</h2>
            <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-[#050505] shadow-2xl border border-white/5">
              <AnimatePresence mode="wait">
                <motion.img 
                  key={currentPhoto} 
                  src={eventPhotos[currentPhoto]} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 0.8 }} 
                  exit={{ opacity: 0 }} 
                  transition={{ duration: 1 }} 
                  className="w-full h-full object-cover brightness-90" 
                />
              </AnimatePresence>
            </div>
            <p className="text-purple-400 text-[9px] font-black uppercase tracking-[0.3em] mt-6">Momentos reales, talentos reales</p>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[3.5rem] p-10 border border-white/5 shadow-2xl h-full flex flex-col justify-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-light font-['Poppins'] leading-tight tracking-tight text-white">
                Potenciá tu <span className="text-purple-500 font-normal">talento creativo</span>
              </h2>
              <p className="text-gray-600 text-sm md:text-base font-light leading-relaxed max-w-lg">
                Descubre contenido técnico necesario para destacar en la industria creativa internacional.
              </p>
              <button onClick={() => navigate('/academy')} className="group flex items-center gap-5 text-[10px] font-black uppercase tracking-[0.3em] text-white hover:text-purple-400 transition-all">
                EXPLORAR ACADEMY
                <div className="p-3 rounded-full bg-white/5 group-hover:bg-purple-500/20 transition-all">
                  <ArrowRight size={16} />
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* MOBILE: CARRUSEL DE VIDEOS DIRECTO TRAS EL BUSCADOR */}
        <section className="block lg:hidden max-w-6xl mx-auto px-6 py-8 space-y-10">
          <div className="w-full relative group">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-['Poppins'] text-lg uppercase tracking-[0.2em] font-light">
                Descubrí <span className="text-purple-500 font-normal">CLASSCODE</span>
              </h2>
            </div>

            <div className="relative aspect-video rounded-[2rem] overflow-hidden bg-[#050505] shadow-[0_0_30px_rgba(168,85,247,0.15)] border border-white/10">
              <AnimatePresence mode="wait">
                <motion.video 
                  key={currentVideo}
                  src={mobilePromoVideos[currentVideo]} 
                  autoPlay
                  loop
                  muted
                  playsInline
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  transition={{ duration: 0.8 }} 
                  className="w-full h-full object-cover" 
                />
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4">
              {mobilePromoVideos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentVideo(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${currentVideo === idx ? 'w-8 bg-purple-500' : 'w-2 bg-white/20 hover:bg-white/40'}`}
                  aria-label={`Ver video ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* TARJETA ACADEMY MOBILE */}
          <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl flex flex-col justify-center">
            <div className="space-y-6">
              <h2 className="text-2xl font-light font-['Poppins'] leading-tight tracking-tight text-white">
                Formación técnica <span className="text-purple-500 font-normal">especializada</span>
              </h2>
              <p className="text-gray-400 text-xs font-light leading-relaxed">
                Accedé a guías, workflows y tutoriales clave para potenciar tus producciones y proyectos.
              </p>
              <button onClick={() => navigate('/academy')} className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-white hover:text-purple-400 transition-all">
                EXPLORAR ACADEMY
                <div className="p-3 rounded-full bg-white/5 group-hover:bg-purple-500/20 transition-all">
                  <ArrowRight size={16} />
                </div>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative bg-[#0a0a0a] border-t border-white/5 pt-16 pb-12 px-6 overflow-hidden uppercase font-normal">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-purple-600/5 blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16 text-center lg:text-left">
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-4">
                <h2 className="text-[26px] font-['Poppins'] tracking-[0.05em] text-white leading-none font-normal">CLASSCODE<sup className="text-[10px] ml-1 font-bold">®</sup></h2>
                <p className="text-purple-500 text-[9px] font-black tracking-[0.4em] mt-2 leading-none">TALENTO ARGENTINO</p>
                <p className="text-gray-500 text-[11px] leading-relaxed max-w-sm normal-case font-light mx-auto lg:mx-0"> La plataforma que conecta talento creativo con oportunidades. </p>
              </div>
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between lg:justify-start gap-10 lg:gap-20">
                <div className="flex gap-4">
                  <a href="https://www.instagram.com/classcodevisual/" target="_blank" rel="noreferrer" className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl hover:border-purple-500/50"><Instagram size={20} /></a>
                  <a href="#" className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl hover:border-purple-500/50"><Linkedin size={20} /></a>
                  <a href="#" className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl hover:border-purple-500/50"><MessageCircle size={20} /></a>
                </div>
                <div className="space-y-4">
                  <h4 className="text-white text-[9px] font-black tracking-[0.3em] opacity-40 uppercase leading-none">Soluciones</h4>
                  <nav className="flex flex-col gap-3 text-[10px] font-bold tracking-widest text-gray-500"><button onClick={() => navigate('/results')} className="hover:text-purple-400 transition-all text-center lg:text-left leading-none uppercase">MARKETPLACE</button><button onClick={() => navigate('/academy')} className="hover:text-purple-400 transition-all text-center lg:text-left leading-none uppercase">ACADEMY</button></nav>
                </div>
                <div className="space-y-4">
                  <h4 className="text-white text-[9px] font-black tracking-[0.3em] opacity-40 uppercase leading-none">Legal</h4>
                  <nav className="flex flex-col gap-3 text-[10px] font-bold tracking-widest text-gray-500"><button onClick={() => navigate('/terms')} className="hover:text-purple-400 transition-all text-center lg:text-left leading-none uppercase">TÉRMINOS</button><button onClick={() => navigate('/privacy')} className="hover:text-purple-400 transition-all text-center lg:text-left leading-none uppercase">PRIVACIDAD</button></nav>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Send size={80} /></div>
                <h4 className="text-[11px] font-normal tracking-[0.3em] text-white mb-4 uppercase leading-relaxed">
                  CONECTÁ &nbsp;|&nbsp; APRENDÉ &nbsp;|&nbsp; TRABAJÁ.
                </h4>
                <p className="text-gray-500 text-[11px] tracking-widest leading-relaxed mb-6 normal-case font-light">Actualizaciones para el talento argentino.</p>
                <form onSubmit={handleSubscribe} className="space-y-4 font-normal">
                  <input type="email" required placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-[10px] font-bold tracking-widest outline-none focus:border-purple-500/50 transition-all text-white shadow-inner uppercase font-['Poppins']" />
                  <button type="submit" className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-[10px] tracking-[0.3em] transition-all uppercase leading-none shadow-xl">SUSCRIBITE</button>
                </form>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 leading-none uppercase font-normal text-center md:text-left">
            <div className="flex items-center gap-3 text-gray-700 leading-none"><Globe size={14} className="text-purple-500/50" /><p className="text-[9px] font-black tracking-[0.4em] leading-none">© 2026 CLASSCODE • ARGENTINA</p></div>
            <div className="flex items-center gap-3 text-gray-800 leading-none"><ShieldCheck size={14} /><span className="text-[8px] font-bold tracking-[0.2em] leading-none uppercase">Encrypted Infrastructure</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}