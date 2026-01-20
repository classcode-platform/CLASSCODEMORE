import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  // 1. SEGURIDAD
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

  // 2. FUNCIÓN INTELIGENTE PARA "MI CUENTA"
  const handleAccount = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          if (role === 'professional') {
            navigate('/dashboard');
          } else {
            navigate('/client-profile');
          }
        } else {
          navigate('/onboarding');
        }
      } catch (error) {
        console.error("Error al verificar cuenta:", error);
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

  // CATEGORÍAS ACTUALIZADAS (12 TOTAL)
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

  const logoStyle = { 
    fontFamily: 'Poppins', 
    fontWeight: 400, 
    letterSpacing: '0.35em' 
  };

  if (loading) return <div className="min-h-screen bg-[#282929] flex items-center justify-center text-white font-['Poppins'] tracking-[0.35em] text-[10px]">VERIFICANDO...</div>;

  return (
    <div className="min-h-screen bg-[#282929] font-['Open_Sans'] flex flex-col relative overflow-x-hidden antialiased text-white">
      
      <header className="p-6 flex justify-end items-center max-w-7xl mx-auto w-full relative z-[60]">
        <div className="flex items-center gap-6">
          <button onClick={handleAccount} className="text-[10px] tracking-[0.2em] uppercase text-gray-400 hover:text-white transition-all flex items-center gap-2 font-bold">
            <User size={12}/> MI CUENTA
          </button>
          <button onClick={handleLogout} className="text-[10px] tracking-[0.2em] uppercase text-gray-400 hover:text-red-400 transition-all flex items-center gap-2 font-bold">
            <LogOut size={12}/> SALIR
          </button>
        </div>
      </header>

      <main className="flex-grow">
        <div className="pt-12 pb-16 px-4 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <h1 className="text-4xl md:text-6xl text-white mb-6 uppercase" style={logoStyle}>
              CLASSCODE
            </h1>
            <p className="text-gray-400 text-sm font-light tracking-widest uppercase">
              Descubre o comparte tu talento con el mundo
            </p>
          </motion.div>

          {/* BUSCADOR */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto bg-[#171717] border border-white/10 rounded-xl p-2 flex flex-col md:flex-row items-center gap-2 shadow-2xl"
          >
            <div className="flex-1 flex items-center px-4 py-3 w-full border-b md:border-b-0 md:border-r border-white/10">
              <Search className="text-gray-500 w-5 h-5 mr-3" />
              <input type="text" placeholder="BUSCAR PROFESIONALES..." className="bg-transparent border-none outline-none text-white w-full font-normal uppercase text-[12px] placeholder:text-gray-600 tracking-wide" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            
            <div className="flex-1 flex items-center px-4 py-3 w-full border-b md:border-b-0 md:border-r border-white/10 relative">
              <select className="w-full bg-transparent text-gray-500 outline-none appearance-none cursor-pointer z-10 font-normal uppercase text-[12px] tracking-wide" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="" className="bg-[#171717]">TODAS LAS CATEGORÍAS</option>
                {categories.map(c => <option key={c.name} value={c.name} className="bg-[#171717]">{c.name.toUpperCase()}</option>)}
              </select>
              <ChevronDown className="text-gray-500 w-4 h-4 ml-auto absolute right-4 pointer-events-none" />
            </div>

            <div className="flex-1 flex items-center px-4 py-3 w-full">
              <MapPin className="text-gray-500 w-5 h-5 mr-3" />
              <input type="text" placeholder="UBICACIÓN" className="bg-transparent border-none outline-none text-white w-full font-normal uppercase text-[12px] placeholder:text-gray-600 tracking-wide" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <button onClick={handleSearch} className="w-full md:w-auto px-8 py-3 rounded-lg bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] text-white font-bold uppercase tracking-widest text-[11px] hover:opacity-90 transition-opacity">
              BUSCAR
            </button>
          </motion.div>
        </div>

        {/* CATEGORÍAS */}
        <div className="max-w-5xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name} onClick={() => handleCategoryClick(cat.name)}
                whileHover={{ scale: 1.05 }}
                className="bg-[#171717] p-4 rounded-2xl flex items-center gap-4 border border-transparent hover:border-white/10 transition-colors cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-lg`}>
                   <cat.icon className="text-white w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-[11px] uppercase tracking-wide leading-tight">{cat.name}</h3>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest font-normal">{cat.count}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SECCIÓN ACADEMY PARA CLIENTES */}
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="bg-gradient-to-br from-[#1e1e1e] to-[#171717] rounded-[3rem] p-10 md:p-16 border border-white/5 shadow-2xl relative overflow-hidden group">
            
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-all duration-700"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <GraduationCap className="text-purple-400" size={16} />
                  <span className="text-[10px] text-purple-300 font-bold uppercase tracking-[0.2em]">Classcode Academy</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-light font-['Poppins'] leading-tight">
                  ¿Querés convertirte en un <span className="text-purple-400 font-normal">Talento Pro</span>?
                </h2>
                
                <p className="text-gray-400 text-sm font-light leading-relaxed">
                  No solo busques, ¡sé parte! En nuestra academia te brindamos las herramientas, 
                  certificaciones y el coaching necesario para destacar en la industria.
                </p>

                <button 
                  onClick={() => navigate('/academy')}
                  className="group flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white hover:text-purple-400 transition-all"
                >
                  EXPLORAR CAPACITACIONES 
                  <div className="p-2 rounded-full bg-white/5 group-hover:bg-purple-500/20 transition-all">
                    <ArrowRight size={14} />
                  </div>
                </button>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-8">
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center">
                    <Zap className="text-yellow-400 mx-auto mb-2" size={20} />
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest">Masterclasses</p>
                  </div>
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center">
                    <Trophy className="text-purple-400 mx-auto mb-2" size={20} />
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest">Certificaciones</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center">
                    <Users size={20} className="text-blue-400 mx-auto mb-2" />
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest">Mentoria</p>
                  </div>
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center">
                    <Star size={20} className="text-pink-400 mx-auto mb-2" />
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest">Networking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA FINAL */}
        <div className="bg-[#171717] py-6 px-4 text-center border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg md:text-xl font-normal text-gray-400 mb-8 uppercase tracking-wide">
              Únete a nuestra comunidad y conecta con clientes
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="px-8 py-4 rounded-lg bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] text-white font-bold flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20">
                CREAR MI PERFIL PROFESIONAL <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#282929] py-12 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <h2 className="text-white uppercase mb-4" style={logoStyle}>CLASSCODE®</h2>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-bold">© 2025 CLASSCODE® — TODOS LOS DERECHOS RESERVADOS</p>
            <p className="text-[9px] uppercase tracking-widest font-light text-gray-600 italic">Vigente desde el 29 de diciembre de 2025.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
