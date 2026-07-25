import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, ChevronDown, Camera, Music, Sparkles, 
  Utensils, Video, ArrowRight, User, LogOut, 
  Home as HomeIcon, Shirt, Palette, PartyPopper, Zap, 
  Users, Theater, Smartphone, Clapperboard, CalendarDays,
  Instagram, Linkedin, MessageCircle, Send, Globe, ShieldCheck, Check, X
} from 'lucide-react';
import { auth, db } from './firebase'; 
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'; 

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

  // Estado Modal Suscripción Pop-Up
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  const catRef = useRef(null);
  const locRef = useRef(null);

  const eventPhotos = [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&auto=format&fit=crop"
  ];

  // VIDEOS DE PROMO MOBILE
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
    const isSubscribed = localStorage.getItem('classcode_subscribed');
    const isModalDismissed = localStorage.getItem('classcode_modal_dismissed');

    if (!isSubscribed && !isModalDismissed) {
      const timer = setTimeout(() => {
        setShowSubscribeModal(true);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseModal = () => {
    setShowSubscribeModal(false);
    localStorage.setItem('classcode_modal_dismissed', 'true');
  };

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

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      await addDoc(collection(db, "newsletter"), {
        email: email,
        createdAt: serverTimestamp(),
        source: 'home_popup'
      });

      localStorage.setItem('classcode_subscribed', 'true');
      setShowSubscribeModal(false);
      setEmail('');
    } catch (error) {
      console.error("Error al guardar la suscripción en Firestore:", error);
    }
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
      {/* LUCES DINÁMICAS DE FONDO */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-purple-600/10 rounded-full blur-[100px] md:blur-[150px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-indigo-600/10 rounded-full blur-[90px] md:blur-[130px]" />
      </div>

      <header className="p-4 md:p-8 flex justify-end items-center max-w-7xl mx-auto w-full relative z-[60]">
        <div className="flex items-center gap-6">
          <button onClick={handleAccount} className="text-[9px] tracking-[0.2em] uppercase text-gray-400 hover:text-white transition-all flex items-center gap-2 font-bold"><User size={12}/> MI CUENTA</button>
          <button onClick={handleLogout} className="text-[9px] tracking-[0.2em] uppercase text-gray-400 hover:text-red-400 transition-all flex items-center gap-2 font-bold"><LogOut size={12}/> SALIR</button>
        </div>
      </header>

      <main className="flex-grow relative z-10">
        <div className="pt-4 md:pt-12 pb-6 md:pb-16 px-4 text-center">
          
          {/* ENCABEZADO ADAPTATIVO */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-12 flex flex-col items-center justify-center">
            
            {/* SOLO MOBILE: Isotipo limpio en PNG sin fondo ni resplandores */}
            <div className="block md:hidden">
              <img 
                src="/logo192.png" 
                alt="CLASSCODE" 
                className="w-12 h-12 object-contain" 
              />
            </div>

            {/* SOLO DESKTOP: Tamaño original intacto */}
            <div className="hidden md:block text-center">
              <h1 className="text-4xl md:text-6xl text-white mb-2 md:mb-6 uppercase font-['Poppins'] font-normal tracking-[0.05em] leading-none">
                CLASSCODE
              </h1>
              <p className="text-gray-400 text-xs font-light tracking-[0.3em] uppercase">
                Descubre o comparte tu talento con el mundo
              </p>
            </div>

          </motion.div>

          {/* BUSCADOR */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-4xl mx-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-3 flex flex-col md:flex-row items-center gap-2 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative z-50">
            
            {/* INPUT BUSCAR */}
            <div className="flex-1 flex items-center px-6 py-3.5 md:py-4 w-full border-b md:border-b-0 md:border-r border-white/10">
              <Search className="text-purple-400 w-5 h-5 mr-4 shrink-0" />
              <input type="text" placeholder="BUSCAR PROFESIONALES..." className="bg-transparent border-none outline-none text-white w-full font-normal uppercase text-[11px] placeholder:text-gray-500 tracking-widest" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            {/* DROPDOWN CATEGORÍAS */}
            <div ref={catRef} className="flex-1 w-full border-b md:border-b-0 md:border-r border-white/10 relative">
              <button 
                type="button"
                onClick={() => { setIsCatOpen(!isCatOpen); setIsLocOpen(false); }}
                className="w-full flex items-center justify-between px-6 py-3.5 md:py-4 text-left uppercase text-[11px] tracking-widest text-gray-300 hover:text-white transition-all"
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
                    className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d0d] border border-white/20 rounded-2xl shadow-2xl max-h-72 overflow-y-auto z-[100] p-2 space-y-1"
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
                className="w-full flex items-center justify-between px-6 py-3.5 md:py-4 text-left uppercase text-[11px] tracking-widest text-gray-300 hover:text-white transition-all"
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
                    className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d0d] border border-white/20 rounded-2xl shadow-2xl max-h-60 overflow-y-auto z-[100] p-2"
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

            <button type="button" onClick={handleSearch} className="w-full md:w-auto px-10 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 transition-all shadow-xl mt-1 md:mt-0">BUSCAR</button>
          </motion.div>
        </div>

        {/* GRILLA DE TARJETAS (SOLO DESKTOP) */}
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

        {/* MOBILE: CARRUSEL DE VIDEOS */}
        <section className="block lg:hidden max-w-6xl mx-auto px-4 py-4 space-y-6">
          <div className="w-full relative">
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

            <div className="flex items-center justify-center gap-2 mt-3">
              {mobilePromoVideos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentVideo(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${currentVideo === idx ? 'w-6 bg-purple-500' : 'w-1.5 bg-white/20'}`}
                  aria-label={`Ver video ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* TARJETA ACADEMY MOBILE */}
          <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[2rem] p-6 border border-white/5 shadow-2xl flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-normal font-['Poppins'] text-white">
                CLASSCODE <span className="text-purple-400 font-light">Academy</span>
              </h2>
              <p className="text-gray-400 text-[10px] font-light mt-1">Formación técnica para creativos.</p>
            </div>
            <button onClick={() => navigate('/academy')} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-white hover:text-purple-400 transition-all shrink-0">
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER LIGERO Y LIMPIO */}
      <footer className="relative bg-[#0a0a0a] border-t border-white/5 pt-12 pb-10 px-6 overflow-hidden uppercase font-normal">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10 text-center md:text-left">
            <div className="space-y-2">
              <h2 className="text-[22px] font-['Poppins'] tracking-[0.05em] text-white leading-none font-normal">CLASSCODE<sup className="text-[10px] ml-1 font-bold">®</sup></h2>
              <p className="text-purple-500 text-[9px] font-black tracking-[0.4em] leading-none">TALENTO ARGENTINO</p>
            </div>

            <div className="flex gap-4">
              <a href="https://www.instagram.com/classcodevisual/" target="_blank" rel="noreferrer" className="p-3 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"><Instagram size={18} /></a>
              <a href="#" className="p-3 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"><Linkedin size={18} /></a>
              <a href="#" className="p-3 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"><MessageCircle size={18} /></a>
            </div>

            <nav className="flex items-center gap-6 text-[10px] font-bold tracking-widest text-gray-500">
              <button onClick={() => navigate('/results')} className="hover:text-purple-400 transition-all uppercase">MARKETPLACE</button>
              <button onClick={() => navigate('/academy')} className="hover:text-purple-400 transition-all uppercase">ACADEMY</button>
              <button onClick={() => navigate('/terms')} className="hover:text-purple-400 transition-all uppercase">TÉRMINOS</button>
            </nav>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 leading-none uppercase font-normal text-center md:text-left">
            <div className="flex items-center gap-3 text-gray-700 leading-none"><Globe size={14} className="text-purple-500/50" /><p className="text-[9px] font-black tracking-[0.4em] leading-none">© 2026 CLASSCODE • ARGENTINA</p></div>
            <div className="flex items-center gap-3 text-gray-800 leading-none"><ShieldCheck size={14} /><span className="text-[8px] font-bold tracking-[0.2em] leading-none uppercase">Encrypted Infrastructure</span></div>
          </div>
        </div>
      </footer>

      {/* POP-UP MODAL SUSCRIPCIÓN */}
      <AnimatePresence>
        {showSubscribeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={handleCloseModal}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0e0e10] border border-white/15 rounded-[2.5rem] p-6 md:p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden"
            >
              <button 
                onClick={handleCloseModal}
                className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-4 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                  <Send size={20} />
                </div>

                <h3 className="text-xl font-['Poppins'] uppercase font-normal text-white tracking-wide">
                  SUMATE A CLASSCODE
                </h3>

                <p className="text-gray-400 text-xs leading-relaxed font-light">
                  Recibí novedades exclusivas, llamados a castings y actualizaciones para el talento argentino.
                </p>

                <form onSubmit={handleSubscribe} className="space-y-3 pt-2">
                  <input 
                    type="email" 
                    required 
                    placeholder="TU EMAIL..." 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-white/5 border border-white/15 p-4 rounded-2xl text-[11px] font-bold tracking-widest outline-none focus:border-purple-500 transition-all text-white uppercase text-center placeholder:text-gray-600" 
                  />
                  <button 
                    type="submit" 
                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-[10px] tracking-[0.3em] transition-all uppercase leading-none shadow-xl"
                  >
                    SUSCRIBIRME
                  </button>
                </form>

                <button 
                  onClick={handleCloseModal}
                  className="text-[9px] uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-all font-bold pt-1"
                >
                  NO, GRACIAS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}