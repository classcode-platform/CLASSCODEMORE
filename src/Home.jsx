import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, ChevronDown, Camera, Music, Sparkles, 
  Utensils, Video, User, LogOut, 
  Home as HomeIcon, Shirt, Palette, PartyPopper, Zap, 
  Users, Theater, Smartphone, Clapperboard, CalendarDays,
  Instagram, Linkedin, MessageCircle, Globe, ShieldCheck, Check, X,
  GraduationCap, PlayCircle, Briefcase, ArrowLeft, Layers, Gem, Scissors
} from 'lucide-react';
import { auth, db } from './firebase'; 
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import ThemeSwitcher from './components/ThemeSwitcher';

export default function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Estado para verificar si hay un usuario logueado activamente
  const [currentUser, setCurrentUser] = useState(null);

  // Estados desplegables custom
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isLocOpen, setIsLocOpen] = useState(false);

  // Estado para mostrar la Live Gallery Estática / Showcase
  const [showLiveGallery, setShowLiveGallery] = useState(false);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState(null);

  const catRef = useRef(null);
  const locRef = useRef(null);

  const singleBannerVideo = "https://res.cloudinary.com/dsyfitywd/video/upload/v1785118161/Copia_de_Video_C1_Banner_para_Twitch_1200_x_280_px_4_x7weiy.mp4";
  
  // Showcase estático con proporciones variadas (masonry)
  const showcaseItems = [
    { 
      id: 1, 
      title: 'BACKSTAGE 01', 
      category: 'PRODUCCIÓN', 
      aspect: 'aspect-[3/4]', 
      url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80' 
    },
    { 
      id: 2, 
      title: 'RODAJE EN ESTUDIO', 
      category: 'FILMACIÓN', 
      aspect: 'aspect-[16/9]', 
      url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80' 
    },
    { 
      id: 3, 
      title: 'SHOW EN VIVO', 
      category: 'ESCÉNICO', 
      aspect: 'aspect-square', 
      url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80' 
    },
    { 
      id: 4, 
      title: 'EDITORIAL DE MODA', 
      category: 'ESTILISMO', 
      aspect: 'aspect-[4/5]', 
      url: "https://res.cloudinary.com/dsyfitywd/image/upload/v1785476490/Dise%C3%B1o_sin_t%C3%ADtulo_18_llsvie.jpg"
    },
    { 
      id: 5, 
      title: 'DIRECCIÓN DE ARTE', 
      category: 'CINE', 
      aspect: 'aspect-[16/9]', 
      url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80' 
    },
    { 
      id: 6, 
      title: 'BACKSTAGE SHOW', 
      category: 'FOTOGRAFÍA', 
      aspect: 'aspect-[3/4]', 
      url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80' 
    }
  ];

  // Las 6 Macro-Categorías Actualizadas con sus subcategorías completas
  const macroCategories = [
    {
      id: 1,
      title: "COBERTURA AUDIOVISUAL Y VISUAL",
      subtitle: "Fotografía, Video, Filmmaking & Postproducción",
      image: "https://res.cloudinary.com/dsyfitywd/image/upload/v1785476514/Dise%C3%B1o_sin_t%C3%ADtulo_21_pepaqt.jpg",
      subcategories: ["Fotografía Social", "Fotografía de Moda", "Fotografía Publicitaria", "Fotografía de Producto", "Video y filmmaking", "Postproducción y edición", "Edición de Video", "Color Grading", "Streaming"]
    },
    {
      id: 2,
      title: "ESPACIOS Y LOCACIONES",
      subtitle: "Salones, Quintas, Estudios & Sets",
      image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80",
      subcategories: ["Salones y espacios", "Estudios y locaciones", "Salones", "Quintas", "Estudios Fotográficos", "Estudios Audiovisuales", "Teatros", "Hoteles", "Rooftops"]
    },
    {
      id: 3,
      title: "TÉCNICA Y EQUIPAMIENTO",
      subtitle: "Sonido, Iluminación, Rental & Escenarios",
      image: "https://res.cloudinary.com/dsyfitywd/image/upload/v1785476500/Dise%C3%B1o_sin_t%C3%ADtulo_19_lbiadp.jpg",
      subcategories: ["Sonido e iluminación", "Alquiler de equipo / Rental", "Iluminación", "Pantallas LED", "Escenarios", "Sonidista", "Operador de Audio", "Mezcla y Mastering"]
    },
    {
      id: 4,
      title: "AMBIENTACIÓN, DECO Y PROVEEDORES",
      subtitle: "Materiales, Deco, Catering & Barras",
      image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1000&q=80",
      subcategories: ["Materiales, ambientación y deco", "Catering y barras", "Catering", "Barra", "Bartender", "Barista", "Pastelería", "Food Truck"]
    },
    {
      id: 5,
      title: "MODA, ESTILISMO Y BELLEZA",
      subtitle: "Makeup, Pelo, Atelier, Alta Costura & Modelos",
      image: "https://res.cloudinary.com/dsyfitywd/image/upload/v1785476490/Dise%C3%B1o_sin_t%C3%ADtulo_18_llsvie.jpg",
      subcategories: ["Makeup y pelo", "Atelier y alta costura", "Joyería y accesorios", "Indumentaria y estilismo", "Moda", "Publicidad", "E-commerce", "Pasarela", "Makeup Social", "Hairstylist"]
    },
    {
      id: 6,
      title: "PRODUCCIÓN, TALENTO Y PLANIFICACIÓN",
      subtitle: "Planners, Artistas, Entretenimiento & Logística",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80",
      subcategories: ["Event & Wedding Planners", "Artistas y entretenimiento", "Logística y producción", "Wedding Planner", "Event Planner", "Actor / Actriz", "Bailarín/a", "Músico", "Influencer", "UGC Creator", "Community Manager"]
    }
  ];

  // Lista simplificada y limpia para el desplegable principal del buscador en Home
// Las 6 Macro-Categorías exactas para el desplegable limpio de la Home
const categories = [
  { name: 'COBERTURA AUDIOVISUAL Y VISUAL', count: '+ profesionales', icon: Camera, gradient: 'from-cyan-400 to-blue-500' },
  { name: 'ESPACIOS Y LOCACIONES', count: '+ profesionales', icon: HomeIcon, gradient: 'from-slate-400 to-slate-700' },
  { name: 'TÉCNICA Y EQUIPAMIENTO', count: '+ profesionales', icon: Zap, gradient: 'from-sky-400 to-blue-600' },
  { name: 'AMBIENTACIÓN, DECO Y PROVEEDORES', count: '+ profesionales', icon: Palette, gradient: 'from-red-400 to-orange-500' },
  { name: 'MODA, ESTILISMO Y BELLEZA', count: '+ profesionales', icon: Sparkles, gradient: 'from-pink-400 to-rose-500' },
  { name: 'PRODUCCIÓN, TALENTO Y PLANIFICACIÓN', count: '+ profesionales', icon: Users, gradient: 'from-indigo-400 to-purple-500' }
];

  const locationsList = [
    "CABA", "Buenos Aires", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", 
    "Entre Ríos", "Salta", "Misiones", "Chaco", "Corrientes", "Río Negro", 
    "Neuquén", "Chubut", "Formosa", "Jujuy", "San Luis", "San Juan", 
    "La Rioja", "La Pampa", "Santiago del Estero", "Catamarca", "Santa Cruz", "Tierra del Fuego"
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

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
    const params = new URLSearchParams();
    if (selectedCategory) params.append('category', selectedCategory);
    if (searchTerm.trim()) params.append('q', searchTerm.trim());
    if (location) params.append('location', location);

    navigate(`/results?${params.toString()}`);
  };

  const handleCategoryClick = (catName) => {
    setSelectedCategory(catName);
    const params = new URLSearchParams();
    params.append('category', catName);
    navigate(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] font-['Open_Sans'] flex flex-col relative overflow-hidden antialiased text-[var(--text-primary)] justify-between transition-colors duration-300">
      
      {/* VISTA DE LA LIVE GALLERY (SHOWCASE ESTÁTICO) EN OVERLAY */}
      <AnimatePresence>
        {showLiveGallery && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed inset-0 z-[150] bg-[var(--bg-primary)] overflow-y-auto flex flex-col justify-between"
          >
            <header className="px-6 py-6 md:px-12 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-[var(--border-glass)]">
              <button 
                onClick={() => setShowLiveGallery(false)}
                className="group flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                VOLVER AL INICIO
              </button>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-gray-400">SHOWCASE / PROMO</span>
              </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 w-full flex-grow">
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                {showcaseItems.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    onClick={() => setSelectedGalleryItem(item)}
                    className="break-inside-avoid group relative rounded-2xl overflow-hidden glass-panel cursor-pointer shadow-2xl hover:border-blue-500/50 transition-all duration-500"
                  >
                    <div className={`w-full ${item.aspect} overflow-hidden bg-[var(--bg-card)]`}>
                      <img 
                        src={item.url} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <span className="text-[9px] uppercase font-bold tracking-[0.3em] text-blue-400 mb-1">
                        {item.category}
                      </span>
                      <h3 className="text-sm font-['Poppins'] tracking-[0.05em] uppercase text-white font-medium">
                        {item.title}
                      </h3>
                    </div>
                  </motion.div>
                ))}
              </div>
            </main>

            <footer className="border-t border-[var(--border-glass)] py-8 text-center text-gray-500 text-[9px] uppercase tracking-[0.3em]">
              CLASSCODE • ARGENTINA © 2026
            </footer>

            <AnimatePresence>
              {selectedGalleryItem && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedGalleryItem(null)}
                  className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative max-w-5xl w-full bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                  >
                    <button 
                      onClick={() => setSelectedGalleryItem(null)}
                      className="absolute top-4 right-4 z-10 p-2.5 text-gray-400 hover:text-white rounded-full bg-black/60 hover:bg-black/95 backdrop-blur-md transition-all cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                    <div className="w-full flex-grow overflow-hidden flex items-center justify-center bg-black/50 p-4">
                      <img 
                        src={selectedGalleryItem.url} 
                        alt={selectedGalleryItem.title}
                        className="max-h-[70vh] w-auto object-contain rounded-2xl shadow-xl"
                      />
                    </div>
                    <div className="p-6 bg-[var(--bg-primary)] border-t border-[var(--border-glass)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold tracking-[0.3em] text-blue-400">
                          {selectedGalleryItem.category}
                        </span>
                        <h3 className="text-lg font-['Poppins'] tracking-[0.05em] uppercase text-[var(--text-primary)] font-medium mt-0.5">
                          {selectedGalleryItem.title}
                        </h3>
                      </div>
                      <span className="text-[9px] tracking-widest text-gray-500 uppercase">
                        CLASSCODE SHOWCASE
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LUCES DINÁMICAS DE FONDO */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-purple-600/10 rounded-full blur-[100px] md:blur-[150px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-indigo-600/10 rounded-full blur-[90px] md:blur-[130px]" />
      </div>

      {/* HEADER: ThemeSwitcher a la izquierda y controles de cuenta/salir condicionales a la derecha */}
      <header className="px-4 py-3 md:px-6 md:py-4 flex justify-between items-center max-w-5xl mx-auto w-full relative z-[60]">
        <div>
          <ThemeSwitcher />
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleAccount} className="text-[9px] tracking-[0.2em] uppercase text-gray-400 hover:text-[var(--text-primary)] transition-all flex items-center gap-2 font-bold cursor-pointer">
            <User size={12}/> MI CUENTA
          </button>
          {currentUser && (
            <button onClick={handleLogout} className="text-[9px] tracking-[0.2em] uppercase text-gray-400 hover:text-red-400 transition-all flex items-center gap-2 font-bold cursor-pointer">
              <LogOut size={12}/> SALIR
            </button>
          )}
        </div>
      </header>

      <main className="flex-grow flex flex-col justify-center relative z-10 py-6 md:py-12">
        <div className="max-w-5xl mx-auto px-6 md:px-10 flex flex-col items-center w-full gap-8 md:gap-10">
          
          {/* HEADER PRINCIPAL */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-5xl md:text-5xl text-[var(--text-primary)] mb-2.5 uppercase font-['Poppins'] font-normal tracking-[0.05em] leading-none">
              CLASSCODE
            </h1>
            <p className="text-purple-400 text-[9px] md:text-[10px] font-black tracking-[0.4em] uppercase max-w-lg mx-auto">
              TODO PARA TU EVENTO O PRODUCCIÓN
            </p>
          </motion.div>

          {/* BUSCADOR COMPACTO */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full glass-panel rounded-[1.8rem] p-2 flex flex-col md:flex-row items-center gap-2 shadow-[0_0_30px_rgba(0,0,0,0.15)] relative z-50">
            
            <div className="flex-1 flex items-center px-3 md:px-4 py-2.5 w-full border-b md:border-b-0 md:border-r border-[var(--border-glass)]">
              <Search className="text-purple-400 w-4 h-4 mr-3 shrink-0" />
              <input type="text" placeholder="BUSCAR PROFESIONALES..." className="bg-transparent border-none outline-none text-[var(--text-primary)] w-full font-normal uppercase text-[10px] placeholder:text-gray-500 tracking-widest" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div ref={catRef} className="flex-1 w-full border-b md:border-b-0 md:border-r border-[var(--border-glass)] relative">
              <button 
                type="button"
                onClick={() => { setIsCatOpen(!isCatOpen); setIsLocOpen(false); }}
                className="w-full flex items-center justify-between px-3 md:px-4 py-2.5 text-left uppercase text-[10px] tracking-widest text-gray-400 hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                <span className={selectedCategory ? "text-purple-400 font-bold" : "text-gray-400"}>
                  {selectedCategory || "CATEGORÍAS"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-300 ${isCatOpen ? 'rotate-180 text-purple-400' : ''}`} />
              </button>

              <AnimatePresence>
                {isCatOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-2xl shadow-2xl max-h-64 overflow-y-auto z-[100] p-2 space-y-1"
                  >
                    <div 
                      onClick={() => { setSelectedCategory(''); setIsCatOpen(false); }}
                      className="px-3 py-2.5 text-[10px] uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-[var(--text-primary)] rounded-xl cursor-pointer transition-all flex items-center justify-between"
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
                          className={`px-3 py-2 text-[10px] uppercase tracking-widest rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 ${selectedCategory === c.name ? 'bg-purple-600/20 text-[var(--text-primary)] font-bold border border-purple-500/30' : 'text-gray-400 hover:bg-white/5'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`lg:hidden w-6 h-6 rounded-lg bg-gradient-to-br ${c.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                              <IconComponent className="text-white w-3 h-3" />
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

            <div ref={locRef} className="flex-1 w-full relative">
              <button 
                type="button"
                onClick={() => { setIsLocOpen(!isLocOpen); setIsCatOpen(false); }}
                className="w-full flex items-center justify-between px-3 md:px-4 py-2.5 text-left uppercase text-[10px] tracking-widest text-gray-400 hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="text-purple-400 w-4 h-4 shrink-0" />
                  <span className={location ? "text-purple-400 font-bold" : "text-gray-400"}>
                    {location || "UBICACIÓN"}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-300 ${isLocOpen ? 'rotate-180 text-purple-400' : ''}`} />
              </button>

              <AnimatePresence>
                {isLocOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-glass)] rounded-2xl shadow-2xl max-h-56 overflow-y-auto z-[100] p-2"
                  >
                    <div 
                      onClick={() => { setLocation(''); setIsLocOpen(false); }}
                      className="px-3 py-2.5 text-[10px] uppercase tracking-widest text-gray-400 hover:bg-white/5 hover:text-[var(--text-primary)] rounded-xl cursor-pointer transition-all flex items-center justify-between"
                    >
                      TODAS LAS UBICACIONES
                      {!location && <Check size={14} className="text-purple-400" />}
                    </div>
                    {locationsList.map((prov) => (
                      <div 
                        key={prov}
                        onClick={() => { setLocation(prov); setIsLocOpen(false); }}
                        className={`px-3 py-2 text-[10px] uppercase tracking-widest rounded-xl cursor-pointer transition-all flex items-center justify-between ${location === prov ? 'bg-purple-600/20 text-[var(--text-primary)] font-bold border border-purple-500/30' : 'text-gray-400 hover:bg-white/5'}`}
                      >
                        {prov}
                        {location === prov && <Check size={14} className="text-purple-400" />}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button type="button" onClick={handleSearch} className="w-full md:w-auto px-8 py-3 rounded-xl bg-purple-600 text-white font-black uppercase tracking-[0.2em] text-[9px] hover:bg-purple-500 transition-all shadow-xl cursor-pointer">BUSCAR</button>
          </motion.div>

          {/* CONTENEDOR CENTRAL: BANNER Y BOTONES LATERALES */}
          <div className="w-full flex flex-col md:flex-row items-center justify-center gap-3">
            
            <div className="flex flex-row md:flex-col items-center justify-center gap-3 order-2 md:order-1">
              <button 
                onClick={() => navigate('/academy')}
                title="Academy"
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl glass-panel hover:border-purple-500/50 flex items-center justify-center text-purple-400 transition-all shadow-lg group cursor-pointer"
              >
                <GraduationCap size={18} className="group-hover:scale-110 transition-transform" />
              </button>

              <button 
                onClick={() => setShowLiveGallery(true)}
                title="Live Gallery"
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl glass-panel hover:border-blue-500/50 flex items-center justify-center text-blue-400 transition-all shadow-lg group cursor-pointer"
              >
                <PlayCircle size={18} className="group-hover:scale-110 transition-transform" />
              </button>

              <button 
                onClick={() => navigate('/client-profile?mode=experience')}
                title="Organizador"
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl glass-panel hover:border-indigo-500/50 flex items-center justify-center text-indigo-400 transition-all shadow-lg group cursor-pointer"
              >
                <Briefcase size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <div className="w-full aspect-[4.28/1] rounded-2xl overflow-hidden relative bg-transparent shadow-2xl order-1 md:order-2 flex items-center justify-center border border-[var(--border-glass)]">
              <video 
                src={singleBannerVideo}
                autoPlay 
                muted 
                loop 
                playsInline 
                className="w-full h-full object-cover absolute inset-0 rounded-2xl"
              />
            </div>

          </div>

          {/* BANNER DE INVITACIÓN A PROVEEDORES Y TALENTOS */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full relative rounded-3xl overflow-hidden glass-panel p-8 md:p-12 border border-purple-500/30 shadow-2xl my-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-indigo-900/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div className="max-w-xl">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-purple-400 mb-2 block">
                  SUMATE AL DIRECTORIO
                </span>
                <h3 className="text-xl md:text-2xl font-['Poppins'] tracking-[0.05em] uppercase text-[var(--text-primary)] font-normal leading-tight mb-3">
                  ¿SOS PROVEEDOR, TÉCNICO O TALENTO?
                </h3>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 leading-relaxed font-normal">
                  Mostrá tu trabajo en la red donde se arman las mejores producciones y eventos. Formá parte de la movida.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button 
                  onClick={() => navigate('/auth')}
                  className="px-8 py-3.5 rounded-xl bg-purple-600 text-white font-black uppercase tracking-[0.2em] text-[9px] hover:bg-purple-500 transition-all shadow-lg cursor-pointer"
                >
                  REGISTRARME GRATIS
                </button>
              </div>
            </div>
          </motion.div>

          {/* MACRO-CATEGORÍAS VISUALES */}
          <div className="w-full flex flex-col gap-6 mt-4">
            <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="text-purple-400 w-4 h-4" />
                <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] font-['Poppins'] text-[var(--text-primary)]">
                  ¿QUÉ ESTÁS BUSCANDO?
                </h2>
              </div>
              <span className="text-[8px] uppercase tracking-[0.2em] text-gray-500 font-bold">SECTORES PRINCIPALES</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {macroCategories.map((macro) => (
                <motion.div 
                  key={macro.id}
                  whileHover={{ y: -4 }}
                  className="group relative rounded-3xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-glass)] shadow-xl cursor-pointer min-h-[320px] flex flex-col justify-end p-7 transition-all duration-300"
                >
                  {/* IMAGEN DE FONDO CON OVERLAY ADAPTATIVO */}
                  <div className="absolute inset-0 overflow-hidden">
                    <img 
                      src={macro.image} 
                      alt={macro.title}
                      className="w-full h-full object-cover opacity-50 dark:opacity-40 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)]/80 to-transparent" />
                  </div>

                  {/* CONTENIDO DE LA TARJETA */}
                  <div className="relative z-10 flex flex-col justify-end h-full">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-purple-500 dark:text-purple-400 mb-1.5">
                      {macro.subtitle}
                    </span>
                    <h3 className="text-sm md:text-base font-['Poppins'] tracking-[0.05em] uppercase text-[var(--text-primary)] font-semibold mb-3 leading-snug">
                      {macro.title}
                    </h3>

                    {/* SUBCATEGORÍAS COMO TAGS */}
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[var(--border-glass)]">
                      {macro.subcategories.map((sub) => (
                        <button
                          key={sub}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategoryClick(sub);
                          }}
                          className="text-[8px] uppercase tracking-wider font-bold bg-[var(--bg-primary)]/80 hover:bg-purple-600 hover:text-white text-[var(--text-primary)] px-2.5 py-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer shadow-sm border border-[var(--border-glass)]"
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative bg-[var(--bg-primary)] border-t border-[var(--border-glass)] py-6 px-6 overflow-hidden uppercase font-normal transition-colors duration-300">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 text-center md:text-left">
            <div className="hidden md:block space-y-1">
              <h2 className="text-[18px] font-['Poppins'] tracking-[0.05em] text-[var(--text-primary)] leading-none font-normal">CLASSCODE<sup className="text-[8px] ml-1 font-bold">®</sup></h2>
              <p className="text-purple-500 text-[7px] font-black tracking-[0.4em] leading-none">TODO PARA TU EVENTO O PRODUCCIÓN</p>
            </div>

            <div className="flex gap-3">
              <a href="https://www.instagram.com/classcodevisual/" target="_blank" rel="noreferrer" className="p-2 glass-panel rounded-xl text-gray-400 hover:text-[var(--text-primary)] transition-all"><Instagram size={14} /></a>
              <a href="#" className="p-2 glass-panel rounded-xl text-gray-400 hover:text-[var(--text-primary)] transition-all"><Linkedin size={14} /></a>
              <a href="#" className="p-2 glass-panel rounded-xl text-gray-400 hover:text-[var(--text-primary)] transition-all"><MessageCircle size={14} /></a>
            </div>

            <nav className="flex items-center gap-5 text-[9px] font-bold tracking-widest text-gray-500">
              <button onClick={() => navigate('/results')} className="hover:text-purple-400 transition-all uppercase cursor-pointer">MARKETPLACE</button>
              <button onClick={() => navigate('/academy')} className="hover:text-purple-400 transition-all uppercase cursor-pointer">ACADEMY</button>
              <button onClick={() => navigate('/terms')} className="hover:text-purple-400 transition-all uppercase cursor-pointer">TÉRMINOS</button>
            </nav>
          </div>

          <div className="pt-3 border-t border-[var(--border-glass)] flex flex-col md:flex-row justify-between items-center gap-2 leading-none uppercase font-normal text-center md:text-left">
            <div className="flex items-center gap-2 text-gray-500 leading-none"><Globe size={12} className="text-purple-500/50" /><p className="text-[8px] font-black tracking-[0.4em] leading-none">© 2026 CLASSCODE • ARGENTINA</p></div>
            <div className="flex items-center gap-2 text-gray-500 leading-none"><ShieldCheck size={12} /><span className="text-[7.5px] font-bold tracking-[0.2em] leading-none uppercase">Encrypted Infrastructure</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}