import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, ChevronDown, Camera, Music, Sparkles, 
  Lightbulb, Utensils, Video, ArrowRight, User, LogOut, 
  Home as HomeIcon, Shirt, Palette, PartyPopper, Layout, Zap, 
  GraduationCap, Users, Star, Trophy,
  Theater, Smartphone, Clapperboard, CalendarDays,
  Instagram, Linkedin, MessageCircle, Send, Globe, ShieldCheck
} from 'lucide-react';
import { auth, db } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 

export default function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [email, setEmail] = useState('');
const handleSubscribe = (e) => { e.preventDefault(); /* ... */ };

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
    } else {
      
      navigate('/auth');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };
  const handleSearch = () => {
    try {
      console.log("Iniciando búsqueda...");
      console.log("Valores:", { searchTerm, selectedCategory, location });
      
      // Forzamos la navegación
      navigate('/results'); 
      
      console.log("Navegación ejecutada.");
    } catch (error) {
      console.error("Error al intentar navegar:", error);
    }
  };

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

            <button 
  type="button" // <--- AGREGA ESTO
  onClick={handleSearch} 
  className="w-full md:w-auto px-10 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] hover:bg-gray-200 transition-all shadow-xl"
>
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
      <footer className="relative bg-[#0a0a0a] border-t border-white/5 pt-24 pb-12 px-6 overflow-hidden uppercase font-normal">
  {/* Gradiente de fondo sutil */}
  <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-purple-600/5 blur-[120px] pointer-events-none" />
  
  <div className="max-w-7xl mx-auto relative z-10">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24 text-center lg:text-left">
      
      {/* Columna Izquierda: Logo y Social */}
      <div className="lg:col-span-7 space-y-12">
        <div className="space-y-6">
          <h2 className="text-[26px] font-['Poppins'] tracking-[0.05em] text-white leading-none font-normal">
            CLASSCODE<sup className="text-[10px] ml-1 font-bold">®</sup>
          </h2>
          <p className="text-purple-500 text-[9px] font-black tracking-[0.4em] mt-4 leading-none">TALENTO ARGENTINO</p>
          <p className="text-gray-500 text-[11px] leading-relaxed max-w-sm normal-case font-light mx-auto lg:mx-0">
            Desarrollamos la arquitectura digital para que la conexión entre talento y mercado sea eficiente, verificada y de alta fidelidad.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between lg:justify-start gap-12 lg:gap-24">
          <div className="flex gap-4">
            <a href="https://www.instagram.com/classcodevisual/" target="_blank" rel="noreferrer" className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl hover:border-purple-500/50"><Instagram size={20} /></a>
            <a href="#" className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl hover:border-purple-500/50"><Linkedin size={20} /></a>
            <a href="#" className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl hover:border-purple-500/50"><MessageCircle size={20} /></a>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-white text-[9px] font-black tracking-[0.3em] opacity-40 uppercase leading-none">Soluciones</h4>
            <nav className="flex flex-col gap-4 text-[10px] font-bold tracking-widest text-gray-500">
              <button onClick={() => navigate('/results')} className="hover:text-purple-400 transition-all text-center lg:text-left leading-none uppercase">MARKETPLACE</button>
              <button onClick={() => navigate('/academy')} className="hover:text-purple-400 transition-all text-center lg:text-left leading-none uppercase">ACADEMY</button>
            </nav>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-white text-[9px] font-black tracking-[0.3em] opacity-40 uppercase leading-none">Legal</h4>
            <nav className="flex flex-col gap-4 text-[10px] font-bold tracking-widest text-gray-500">
              <button onClick={() => navigate('/terms')} className="hover:text-purple-400 transition-all text-center lg:text-left leading-none uppercase">TÉRMINOS</button>
              <button onClick={() => navigate('/privacy')} className="hover:text-purple-400 transition-all text-center lg:text-left leading-none uppercase">PRIVACIDAD</button>
            </nav>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Suscripción */}
      <div className="lg:col-span-5">
        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group leading-none">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Send size={80} /></div>
          <h4 className="text-[12px] font-black tracking-[0.4em] text-white mb-4 uppercase">Recibe Novedades</h4>
          <p className="text-gray-500 text-[10px] tracking-widest leading-relaxed mb-8 normal-case font-light">Actualizaciones para el talento argentino.</p>
          <form onSubmit={handleSubscribe} className="space-y-4 font-normal">
            <input type="email" required placeholder="EMAIL" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-[10px] font-bold tracking-widest outline-none focus:border-purple-500/50 transition-all text-white shadow-inner uppercase font-['Poppins']" />
            <button type="submit" className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-[10px] tracking-[0.3em] transition-all uppercase leading-none shadow-xl">SUSCRIBITE</button>
          </form>
        </div>
      </div>
    </div>

    {/* Footer Bottom */}
    <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 leading-none uppercase font-normal text-center md:text-left">
      <div className="flex items-center gap-3 text-gray-700 leading-none">
        <Globe size={14} className="text-purple-500/50" />
        <p className="text-[9px] font-black tracking-[0.4em] leading-none">© 2026 CLASSCODE • ARGENTINA</p>
      </div>
      <div className="flex items-center gap-3 text-gray-800 leading-none">
        <ShieldCheck size={14} />
        <span className="text-[8px] font-bold tracking-[0.2em] leading-none uppercase">Encrypted Infrastructure</span>
      </div>
    </div>
  </div>
</footer>
    </div>
  );
}