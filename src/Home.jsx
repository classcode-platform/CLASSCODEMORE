import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, ChevronDown, Camera, Music, Sparkles, 
  Lightbulb, Utensils, Video, ArrowRight, User, LogOut, 
  Home as HomeIcon, Shirt, Palette, PartyPopper, Layout, Zap, 
  GraduationCap, Users, Star, Trophy 
} from 'lucide-react';
import { auth, db } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 

export default function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/');
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleAccount = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          navigate(role === 'professional' ? '/dashboard' : '/client-profile');
        } else {
          navigate('/onboarding');
        }
      } catch (error) {
        navigate('/dashboard');
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleSearch = () => {
    navigate(`/results?q=${searchTerm}&location=${location}&category=${selectedCategory}`);
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/results?category=${categoryName}`);
  };

  const categories = [
    { name: 'Fotografía', count: '+ profesionales', icon: Camera, gradient: 'from-cyan-400 to-blue-500' },
    { name: 'Video / Filmmaker', count: '+ profesionales', icon: Video, gradient: 'from-blue-400 to-indigo-600' },
    { name: 'DJ / Sonido', count: '+ profesionales', icon: Music, gradient: 'from-green-400 to-emerald-500' },
    { name: 'Modelo / Presencia', count: '+ profesionales', icon: User, gradient: 'from-fuchsia-400 to-purple-600' }, 
    { name: 'Locaciones', count: '+ profesionales', icon: HomeIcon, gradient: 'from-slate-400 to-slate-700' }, 
    { name: 'Makeup / Pelo', count: '+ profesionales', icon: Sparkles, gradient: 'from-orange-300 to-yellow-500' },
    { name: 'Estilismo / Moda', count: '+ profesionales', icon: Shirt, gradient: 'from-pink-400 to-rose-500' },
    { name: 'Diseño Gráfico', count: '+ profesionales', icon: Palette, gradient: 'from-red-400 to-orange-500' },
    { name: 'Catering / Barra', count: '+ profesionales', icon: Utensils, gradient: 'from-lime-400 to-green-600' },
    { name: 'Animación / Show', count: '+ profesionales', icon: PartyPopper, gradient: 'from-amber-200 to-yellow-500' },
    { name: 'Ambientación', count: '+ profesionales', icon: Layout, gradient: 'from-purple-400 to-violet-600' },
    { name: 'Técnica / Ilum.', count: '+ profesionales', icon: Zap, gradient: 'from-sky-400 to-blue-600' },
  ];

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-['Poppins'] tracking-[0.35em] text-[10px]">VERIFICANDO...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-['Open_Sans'] flex flex-col relative overflow-hidden antialiased text-white">
      
      {/* LUCES DINÁMICAS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-purple-600/10 rounded-full blur-[100px] md:blur-[150px]"
        />
        <motion.div 
          animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-0 w-[200px] md:w-[500px] h-[200px] md:h-[500px] bg-indigo-600/10 rounded-full blur-[90px] md:blur-[130px]"
        />
      </div>

      <header className="p-6 md:p-8 flex justify-end items-center max-w-7xl mx-auto w-full relative z-[60]">
        <div className="flex items-center gap-6">
          <button onClick={handleAccount} className="text-[9px] tracking-[0.2em] uppercase text-gray-400 hover:text-white transition-all flex items-center gap-2 font-bold">
            <User size={12}/> MI CUENTA
          </button>
          <button onClick={handleLogout} className="text-[9px] tracking-[0.2em] uppercase text-gray-400 hover:text-red-400 transition-all flex items-center gap-2 font-bold">
            <LogOut size={12}/> SALIR
          </button>
        </div>
      </header>

      <main className="flex-grow relative z-10">
        <div className="pt-12 pb-16 px-4 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h1 className="text-4xl md:text-6xl text-white mb-6 uppercase font-['Poppins'] font-normal tracking-[0.05em] leading-none">
              CLASSCODE
            </h1>
            <p className="text-gray-400 text-[10px] md:text-xs font-light tracking-[0.3em] uppercase">
              Descubre o comparte tu talento con el mundo
            </p>
          </motion.div>

          {/* BUSCADOR GLASSMORPHISM */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-3 flex flex-col md:flex-row items-center gap-2 shadow-[0_0_50px_rgba(0,0,0,0.3)]"
          >
            <div className="flex-1 flex items-center px-6 py-4 w-full border-b md:border-b-0 md:border-r border-white/10">
              <Search className="text-purple-400 w-5 h-5 mr-4" />
              <input type="text" placeholder="BUSCAR PROFESIONALES..." className="bg-transparent border-none outline-none text-white w-full font-normal uppercase text-[11px] placeholder:text-gray-600 tracking-widest" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            
            <div className="flex-1 flex items-center px-6 py-4 w-full border-b md:border-b-0 md:border-r border-white/10 relative">
              <select className="w-full bg-transparent text-gray-400 outline-none appearance-none cursor-pointer z-10 font-normal uppercase text-[11px] tracking-widest" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="" className="bg-[#0a0a0a]">CATEGORÍAS</option>
                {categories.map(c => <option key={c.name} value={c.name} className="bg-[#0a0a0a]">{c.name.toUpperCase()}</option>)}
              </select>
              <ChevronDown className="text-gray-500 w-4 h-4 ml-auto absolute right-6 pointer-events-none" />
            </div>

            <div className="flex-1 flex items-center px-6 py-4 w-full">
              <MapPin className="text-purple-400 w-5 h-5 mr-4" />
              <input type="text" placeholder="UBICACIÓN" className="bg-transparent border-none outline-none text-white w-full font-normal uppercase text-[11px] placeholder:text-gray-600 tracking-widest" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <button onClick={handleSearch} className="w-full md:w-auto px-10 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 transition-all shadow-xl">
              BUSCAR
            </button>
          </motion.div>
        </div>

        {/* CATEGORÍAS GLASS */}
        <div className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name} onClick={() => handleCategoryClick(cat.name)}
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.08)' }}
                className="bg-white/5 backdrop-blur-md p-6 rounded-[1.5rem] flex items-center gap-5 border border-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-lg"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.4)]`}>
                   <cat.icon className="text-white w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-[10px] uppercase tracking-[0.1em] leading-tight">{cat.name}</h3>
                  <p className="text-[7px] text-gray-500 uppercase tracking-widest mt-1 font-bold">{cat.count}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SECCIÓN ACADEMY - GLASS DARK */}
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[3.5rem] p-10 md:p-16 border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-8 text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <GraduationCap className="text-purple-400" size={16} />
                  <span className="text-[9px] text-purple-300 font-bold uppercase tracking-[0.2em]">Classcode Academy</span>
                </div>
                
                <h2 className="text-3xl md:text-5xl font-light font-['Poppins'] leading-tight tracking-tight">
                  Potenciá tu <span className="text-purple-500 font-normal">talento creativo</span>
                </h2>
                
                <p className="text-gray-400 text-sm md:text-base font-light leading-relaxed max-w-xl">
                  Brindamos las herramientas, certificaciones y el coaching técnico necesario para destacar en la industria creativa internacional.
                </p>

                <button onClick={() => navigate('/academy')} className="group flex items-center gap-5 text-[10px] font-black uppercase tracking-[0.3em] text-white hover:text-purple-400 transition-all">
                  EXPLORAR ACADEMY
                  <div className="p-3 rounded-full bg-white/5 group-hover:bg-purple-500/20 transition-all">
                    <ArrowRight size={16} />
                  </div>
                </button>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                <div className="space-y-4 pt-10">
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/5 text-center backdrop-blur-sm">
                    <Zap className="text-yellow-400 mx-auto mb-3" size={24} />
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Masterclasses</p>
                  </div>
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/5 text-center backdrop-blur-sm">
                    <Trophy className="text-purple-400 mx-auto mb-3" size={24} />
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Certificados</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/5 text-center backdrop-blur-sm">
                    <Users size={24} className="text-blue-400 mx-auto mb-3" />
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Mentoria</p>
                  </div>
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/5 text-center backdrop-blur-sm">
                    <Star size={24} className="text-pink-400 mx-auto mb-3" />
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Networking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#0a0a0a] py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-white text-3xl font-['Poppins'] font-normal tracking-[0.05em] uppercase mb-8">CLASSCODE</h2>
          <div className="space-y-4 opacity-30">
            <p className="text-[9px] uppercase tracking-[0.5em] font-bold">© 2026 CLASSCODE — TODOS LOS DERECHOS RESERVADOS</p>
            <p className="text-[8px] uppercase tracking-[0.4em] font-light">Vigente desde enero 2026.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}