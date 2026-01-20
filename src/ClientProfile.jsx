import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, query, where, onSnapshot } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  User, Heart, Trash2, Upload, LogOut, ArrowRight, MessageSquare, 
  LayoutDashboard, GraduationCap, Users, Menu, X, RefreshCcw, Bell, PlusCircle, Share2, Camera, Monitor 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomModal from './components/CustomModal';

export default function ClientProfile() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState({ name: '', location: '', interests: '', photoURL: '' });
  const [favorites, setFavorites] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null); 
  const [isPro, setIsPro] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) setProfile(prev => ({ ...prev, ...userSnap.data() }));
          
          const proSnap = await getDoc(doc(db, "professionals", user.uid));
          setIsPro(proSnap.exists());

          const unsubFavs = onSnapshot(collection(db, "users", user.uid, "favorites"), (snap) => {
            setFavorites(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          });

          // Escucha del evento blindada para evitar bloqueos
          const unsubEvent = onSnapshot(doc(db, "events", user.uid), (docSnap) => {
            if (docSnap.exists()) {
              setActiveEvent(docSnap.data());
            } else {
              setActiveEvent(null);
            }
          });

          const chatsRef = collection(db, "chats");
          const q = query(chatsRef, where("participants", "array-contains", user.uid));
          const chatSnap = await getDocs(q);
          setMessages(chatSnap.docs.map(chatDoc => {
            const data = chatDoc.data();
            return { 
              id: chatDoc.id, 
              displayName: data.professionalName || data.clientName || "Usuario",
              displayPhoto: data.professionalPhoto || data.clientPhoto || '',
              ...data 
            };
          }));

          setLoading(false);
          return () => { unsubFavs(); unsubEvent(); };
        } catch (error) { 
          console.error(error); 
          setLoading(false); 
        }
      } else { 
        navigate('/'); 
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleCreateEvent = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const eventCode = `LIVE-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const newEvent = {
      clientId: user.uid,
      eventName: profile.interests || "MI EVENTO CLASSCODE",
      eventCode: eventCode,
      liveGallery: [],
      status: 'active',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "events", user.uid), newEvent);
      setModal({ isOpen: true, title: 'ÉXITO', message: `EVENTO CREADO. CÓDIGO: ${eventCode}`, type: 'success' });
    } catch (e) {
      console.error(e);
      setModal({ isOpen: true, title: 'ERROR', message: 'NO SE PUDO CREAR EL EVENTO.', type: 'error' });
    }
  };

  const handleSave = async () => {
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), { ...profile, role: 'client' }, { merge: true });
      setModal({ isOpen: true, title: 'GUARDADO', message: 'PERFIL ACTUALIZADO.', type: 'success' });
    } catch (e) { console.error(e); }
  };

  const handleSwitchToPro = async () => {
    if (isPro) {
      try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { role: 'professional' });
        navigate('/dashboard');
      } catch (error) { console.error(error); }
    } else { navigate('/academy'); }
  };

  const removeFavorite = async (favId) => {
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "favorites", favId));
    } catch (error) { console.error(error); }
  };

  if (loading) return <div className="min-h-screen bg-[#282929] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-black font-['Poppins']">Sincronizando...</div>;

  return (
    <div className="min-h-screen bg-[#282929] text-white font-['Open_Sans'] flex overflow-x-hidden uppercase antialiased text-left relative">
      
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] md:hidden" 
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] bg-[#171717] z-[120] p-12 flex flex-col md:hidden shadow-2xl"
            >
              <button onClick={() => setIsMobileMenuOpen(false)} className="self-end mb-12 text-gray-500"><X size={32} /></button>
              <nav className="flex-1 space-y-12 text-left">
                <button onClick={() => {navigate('/client-profile'); setIsMobileMenuOpen(false);}} className="flex items-center gap-6 text-[12px] font-black tracking-widest text-white"><LayoutDashboard size={22} className="text-purple-500"/> PANEL EVENTOS</button>
                <button onClick={() => {navigate('/home'); setIsMobileMenuOpen(false);}} className="flex items-center gap-6 text-[12px] font-black tracking-widest text-gray-400"><Users size={22}/> BUSCAR TALENTO</button>
                <button onClick={() => {navigate('/academy'); setIsMobileMenuOpen(false);}} className="flex items-center gap-6 text-[12px] font-black tracking-widest text-gray-400"><GraduationCap size={22}/> ACADEMY</button>
                <div className="pt-12 border-t border-white/5">
                  <button onClick={handleSwitchToPro} className="flex items-center gap-6 text-[12px] font-black tracking-widest text-purple-400"><RefreshCcw size={22}/> MODO PROFESIONAL</button>
                </div>
              </nav>
              <button onClick={() => signOut(auth)} className="flex items-center gap-6 text-gray-700 text-[10px] font-black tracking-widest"><LogOut size={20}/> SALIR</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-72 bg-[#171717] border-r border-white/5 flex-col p-10 fixed h-full z-50">
        <header className="mb-12 text-left">
          <div onClick={() => navigate('/home')} className="text-[22px] font-['Poppins'] tracking-[0.35em] cursor-pointer">CLASSCODE</div>
          <p className="text-purple-400 text-[10px] font-bold tracking-[0.3em] mt-2 italic">CLIENT EXPERIENCE</p>
        </header>

        <div className="mb-12 text-left">
          <button onClick={handleSwitchToPro} className="w-full flex items-center justify-between bg-white/[0.03] border border-white/5 p-4 rounded-2xl group hover:border-purple-500/30 transition-all">
            <div className="flex items-center gap-3">
              <RefreshCcw size={14} className="text-purple-400 group-hover:rotate-180 transition-transform duration-500" />
              <div className="text-left">
                <p className="text-[6px] font-black text-gray-500 tracking-[0.2em]">SWITCH MOOD</p>
                <p className="text-[9px] font-black text-white tracking-widest uppercase">SOY PROFESIONAL</p>
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 space-y-8 text-left">
          <button onClick={() => navigate('/client-profile')} className="flex items-center gap-4 text-white text-[10px] font-black tracking-widest"><LayoutDashboard size={18} className="text-purple-500"/> PANEL EVENTOS</button>
          <button onClick={() => navigate('/home')} className="flex items-center gap-4 text-gray-500 hover:text-white text-[10px] font-black tracking-widest transition-all"><Users size={18}/> BUSCAR TALENTO</button>
          <button onClick={() => navigate('/academy')} className="flex items-center gap-4 text-gray-500 hover:text-white text-[10px] font-black tracking-widest transition-all"><GraduationCap size={18}/> ACADEMY</button>
        </nav>
        <button onClick={() => signOut(auth)} className="flex items-center gap-4 text-gray-700 hover:text-red-500 text-[10px] font-black tracking-widest transition-all"><LogOut size={18}/> SALIR</button>
      </aside>

      <main className="flex-1 md:ml-72 p-6 md:p-16 space-y-12 mt-4 md:mt-0">
        <header className="flex justify-between items-center border-b border-white/5 pb-8">
          <div className="flex items-center gap-4 text-left">
            {profile.photoURL && (
              <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden shadow-lg">
                <img src={profile.photoURL} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h2 className="text-[14px] font-bold tracking-widest uppercase">{profile.name || 'ORGANIZADOR'}</h2>
              <p className="text-[8px] text-gray-500 font-black tracking-[0.3em] uppercase">{profile.location || 'UBICACIÓN'}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="relative cursor-pointer group" onClick={() => setModal({ isOpen: true, title: 'NOTIFICACIONES', message: messages.length > 0 ? `TIENES ${messages.length} CHATS ACTIVOS.` : 'SIN ALERTAS NUEVAS.' })}>
                <Bell size={18} className="text-gray-600 group-hover:text-white transition-colors" />
                {messages.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse border border-[#282929]" />}
             </div>
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-white hover:text-purple-500 transition-colors"><Menu size={24} /></button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left">
          <div className="space-y-12">
            <section className="bg-[#171717] rounded-[2.5rem] p-8 border border-white/5 space-y-8 relative overflow-hidden">
               <div className="flex justify-between items-center">
                  <h3 className="text-[9px] text-gray-500 font-black tracking-[0.4em] uppercase">Panel de Divulgación</h3>
                  {!activeEvent && (
                    <button onClick={handleCreateEvent} className="text-[7px] font-black tracking-widest text-purple-400 flex items-center gap-2 uppercase font-bold">
                      <PlusCircle size={12}/> Crear Nuevo
                    </button>
                  )}
               </div>
               {activeEvent ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="bg-white p-4 rounded-[2rem] flex flex-col items-center justify-center gap-3 shadow-2xl">
                       <img 
                         src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/live/${activeEvent.eventCode}`} 
                         alt="QR"
                         className="w-32 h-32 md:w-40 md:h-40 object-contain"
                       />
                       <p className="text-[7px] font-black text-black tracking-[0.2em] uppercase italic text-center leading-tight">ESCANEÁ PARA <br/> SUBIR CONTENIDO</p>
                    </div>
                    <div className="space-y-4">
                       <div>
                          <p className="text-[14px] font-bold tracking-tight uppercase leading-none">{activeEvent.eventName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-[7px] text-green-500 font-black tracking-widest uppercase italic font-bold uppercase">En Vivo</p>
                          </div>
                       </div>
                       <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20 flex items-center gap-3">
                          <Camera size={18} className="text-purple-400" />
                          <div>
                            <p className="text-[14px] font-black leading-none">{activeEvent.liveGallery?.length || 0}</p>
                            <p className="text-[6px] font-bold text-gray-500 tracking-widest uppercase italic">Archivos Originales</p>
                          </div>
                       </div>
                       
                       <div className="space-y-2">
                         <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/live/${activeEvent.eventCode}`); setModal({ isOpen: true, title: 'COPIADO', message: 'LINK DE INVITADO LISTO.', type: 'success' }); }} className="w-full py-3 bg-white/5 rounded-xl border border-white/5 text-[7px] font-black tracking-widest flex items-center justify-center gap-2 uppercase font-bold font-['Poppins'] transition-all"><Share2 size={12}/> Copiar Link</button>
                         
                         {/* Botón Proyectar Galería */}
                         <button 
                           onClick={() => window.open(`/live-gallery/${activeEvent.eventCode}`, '_blank')}
                           className="w-full py-3 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-xl text-[7px] font-black tracking-widest flex items-center justify-center gap-2 uppercase font-bold font-['Poppins'] transition-all shadow-lg"
                         >
                           <Monitor size={12}/> Proyectar Galería
                         </button>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="py-12 text-center border border-white/5 rounded-[2rem] border-dashed"><p className="text-[7px] text-gray-700 uppercase italic font-bold tracking-widest italic font-bold">Iniciá un evento para activar la galería real-time</p></div>
               )}
            </section>

            <section className="space-y-6">
              <h3 className="text-[9px] text-gray-500 font-black tracking-[0.4em] uppercase border-b border-white/5 pb-2 flex items-center gap-2"><MessageSquare size={12}/> Mensajería</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                {messages.length === 0 ? <p className="text-center py-6 text-[7px] text-gray-700 italic uppercase font-bold">Sin chats activos</p> : messages.map(chat => (
                  <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex justify-between items-center py-4 border-b border-white/5 hover:border-purple-500/20 cursor-pointer px-2 transition-all group">
                     <div className="flex items-center gap-4 text-left">
                        {chat.displayPhoto && <img src={chat.displayPhoto} className="w-10 h-10 rounded-full border border-white/10 grayscale group-hover:grayscale-0 transition-all" />}
                        <p className="text-[10px] font-bold text-white uppercase">{chat.displayName}</p>
                     </div>
                     <ArrowRight size={12} className="text-gray-800 group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6 pb-20">
              <h3 className="text-[9px] text-gray-500 font-black tracking-[0.4em] uppercase border-b border-white/5 pb-2 flex items-center gap-2"><Heart size={12} className="text-purple-500 fill-purple-500"/> Mis Favoritos</h3>
              <div className="grid grid-cols-1 gap-4">
                {favorites.length === 0 ? <p className="text-center py-6 text-[7px] text-gray-700 italic uppercase font-bold">Cero talentos guardados</p> : favorites.map(fav => (
                  <div key={fav.id} onClick={() => navigate(`/profile/${fav.id}`)} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:border-purple-500/30 transition-all text-left">
                    <div className="flex items-center gap-4 text-left">
                      <img src={fav.photo || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0" />
                      <div><p className="text-[11px] font-bold uppercase">{fav.name}</p><p className="text-[7px] text-purple-400 font-bold uppercase italic font-bold">{fav.job}</p></div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeFavorite(fav.id); }} className="text-gray-700 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8 bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl h-fit">
               <h3 className="text-[9px] text-gray-500 font-black tracking-[0.4em] uppercase border-b border-white/5 pb-2 text-left">Identidad Organizador</h3>
               <div className="space-y-1 border-b border-white/5 text-left">
                  <label className="text-[6px] font-black tracking-[0.4em] text-gray-600 uppercase ml-1">Nombre</label>
                  <input className="w-full bg-transparent py-2 text-[12px] outline-none font-bold uppercase" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
               </div>
               <div className="space-y-1 border-b border-white/5 text-left">
                  <label className="text-[6px] font-black tracking-[0.4em] text-gray-600 uppercase ml-1">Localidad</label>
                  <input className="w-full bg-transparent py-2 text-[12px] outline-none font-bold uppercase" value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} />
               </div>
               <div className="space-y-1 border-b border-white/5 text-left">
                  <label className="text-[6px] font-black tracking-[0.4em] text-gray-600 uppercase ml-1">Intereses / Notas</label>
                  <textarea className="w-full bg-transparent py-3 text-[11px] h-24 resize-none font-bold uppercase leading-relaxed font-['Open_Sans']" placeholder="EJ: FOTOGRAFÍA, MODA..." value={profile.interests} onChange={e => setProfile({...profile, interests: e.target.value})} />
               </div>
               <button onClick={handleSave} className="w-full py-5 text-[10px] tracking-[0.4em] font-black uppercase rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-900 text-white shadow-xl active:scale-95 transition-all font-['Poppins'] tracking-widest">ACTUALIZAR DATOS</button>
          </div>
        </div>
      </main>

      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
}
