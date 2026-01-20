import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, query, where } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { User, Heart, Trash2, Upload, LogOut, ArrowRight, MessageSquare } from 'lucide-react';
import CustomModal from './components/CustomModal';

export default function ClientProfile() {
  const [profile, setProfile] = useState({ name: '', location: '', interests: '', photoURL: '' });
  const [favorites, setFavorites] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isPro, setIsPro] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  
  const navigate = useNavigate();
  const CLOUD_NAME = "dsyfitywd";
  const UPLOAD_PRESET = "CLASSCODE";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Datos del Perfil
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists()) setProfile(prev => ({ ...prev, ...userSnap.data() }));
          
          // Verificar si es Pro para el Switch
          const proSnap = await getDoc(doc(db, "professionals", user.uid));
          setIsPro(proSnap.exists());

          // Cargar Favoritos
          const favSnap = await getDocs(collection(db, "users", user.uid, "favorites"));
          setFavorites(favSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // Cargar Chats (Inbox para el Cliente) - Lógica de mapeo corregida
          const chatsRef = collection(db, "chats");
          const q = query(chatsRef, where("participants", "array-contains", user.uid));
          const chatSnap = await getDocs(q);
          
          setMessages(chatSnap.docs.map(chatDoc => {
            const data = chatDoc.data();
            return { 
              id: chatDoc.id, 
              // Usamos displayName y displayPhoto para abstraer si el otro es Pro o Cliente
              displayName: data.professionalName || data.clientName || "Usuario Classcode",
              displayPhoto: data.professionalPhoto || data.clientPhoto || '',
              ...data 
            };
          }));

        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
      } else { navigate('/'); }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
      const data = await response.json();
      if (data.secure_url) {
        setProfile(prev => ({ ...prev, photoURL: data.secure_url }));
        await updateDoc(doc(db, "users", auth.currentUser.uid), { photoURL: data.secure_url });
      }
    } catch (error) { console.error(error); } 
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), { ...profile, role: 'client' }, { merge: true });
        setModal({ isOpen: true, title: 'GUARDADO', message: 'PERFIL ACTUALIZADO.', type: 'success' });
      } catch (e) { console.error(e); }
    }
  };

  const removeFavorite = async (favId) => {
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "favorites", favId));
      setFavorites(favorites.filter(f => f.id !== favId));
    } catch (error) { console.error(error); }
  };

  // --- LÓGICA INSERTADA PARA EL CAMBIO DE ROL ---
  const handleSwitchToPro = async () => {
    if (isPro) {
      try {
        // Actualizamos en DB que ahora vuelve a ser professional
        await updateDoc(doc(db, "users", auth.currentUser.uid), { 
          role: 'professional' 
        });
        navigate('/dashboard');
      } catch (error) {
        console.error("Error al cambiar de modo:", error);
      }
    } else {
      navigate('/academy');
    }
  };
  // ----------------------------------------------

  if (loading) return <div className="min-h-screen bg-[#282929] flex items-center justify-center text-white tracking-[0.4em] text-[10px] uppercase font-['Poppins']">Sincronizando...</div>;

  return (
    <div className="min-h-screen bg-[#282929] text-white font-['Open_Sans'] p-4 md:p-10 relative antialiased">
      <div className="max-w-6xl mx-auto space-y-8 pb-10">
        
        {/* HEADER DISTRIBUIDO: LOGO/MODOS IZQUIERDA - FOTO/VOLVER DERECHA */}
        <header className="flex flex-row justify-between items-center border-b border-white/5 pb-8">
          <div className="flex flex-col items-start space-y-3">
            <h1 onClick={() => navigate('/home')} className="text-[22px] font-normal tracking-[0.35em] text-white uppercase font-['Poppins'] cursor-pointer hover:opacity-80 transition-opacity">
              CLASSCODE
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-[7px] font-black tracking-[0.3em] text-blue-400 uppercase">MODO CLIENTE</span>
              <div className="w-[1px] h-3 bg-white/10" />
              {/* BOTÓN ACTUALIZADO CON LA NUEVA LÓGICA */}
              <button onClick={handleSwitchToPro} className="text-[7px] font-black tracking-[0.3em] text-gray-600 hover:text-purple-500 transition-all uppercase">
                MODO PROFESIONAL
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                {profile.photoURL ? <img src={profile.photoURL} className="w-full h-full object-cover" alt="" /> : <User size={16} className="text-gray-700"/>}
              </div>
              <label className="absolute -bottom-1 -right-1 p-1.5 bg-white text-black rounded-full cursor-pointer hover:scale-110 transition-all shadow-lg">
                <Upload size={10} />
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>
            </div>
            <button onClick={() => navigate('/home')} className="px-5 py-1.5 rounded-full bg-white/5 text-gray-400 border border-white/10 text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
              VOLVER
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: FAVORITOS Y CHATS */}
          <div className="space-y-10">
            
            {/* CHATS / ENLACES DIRECTOS */}
            <div className="space-y-4">
               <div className="flex items-center justify-between border-b border-white/5 pb-1">
                 <span className="text-[8px] font-black tracking-[0.3em] text-gray-500 uppercase flex items-center gap-2">
                   <MessageSquare size={10} className="text-blue-400" /> Conversaciones
                 </span>
                 <span className="text-[7px] text-blue-400 font-bold uppercase tracking-widest">{messages.length} Activas</span>
               </div>
               <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                  {messages.length === 0 ? (
                    <p className="text-center py-8 text-[7px] text-gray-700 uppercase tracking-widest border border-white/5 rounded-xl italic">Sin mensajes activos</p>
                  ) : (
                    messages.map(chat => (
                      <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="flex justify-between items-center py-3 border-b border-white/5 group cursor-pointer hover:border-blue-500/20 transition-all px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
                                {chat.displayPhoto ? <img src={chat.displayPhoto} className="w-full h-full object-cover" alt="" /> : <User size={12} className="text-gray-700" />}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-white uppercase tracking-wider">{chat.displayName}</p>
                                <p className="text-[7px] tracking-[0.2em] text-blue-400 uppercase mt-0.5 font-bold italic">Terminal de Chat</p>
                            </div>
                        </div>
                        <ArrowRight size={12} className="text-gray-800 group-hover:text-blue-400 transition-all transform group-hover:translate-x-1" />
                      </div>
                    ))
                  )}
               </div>
            </div>

            {/* FAVORITOS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-[8px] font-black tracking-[0.3em] text-gray-500 uppercase flex items-center gap-2">
                  <Heart size={10} className="fill-purple-500 text-purple-500"/> Mis Favoritos
                </span>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                {favorites.length === 0 ? (
                  <p className="text-center py-8 text-[7px] text-gray-700 uppercase tracking-widest border border-white/5 rounded-xl">Cero talentos guardados</p>
                ) : (
                  favorites.map(fav => (
                    <div key={fav.id} onClick={() => navigate(`/profile/${fav.id}`)} className="flex justify-between items-center py-3 border-b border-white/5 group cursor-pointer hover:border-purple-500/20 transition-all px-2">
                      <div className="flex items-center gap-3">
                        <img src={fav.photo || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                        <div>
                          <p className="text-[10px] font-bold text-white uppercase">{fav.name}</p>
                          <p className="text-[7px] text-purple-400 uppercase font-bold">{fav.job}</p>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeFavorite(fav.id); }} className="text-gray-700 hover:text-red-500 transition-colors">
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: FORMULARIO COMPACTO */}
          <div className="space-y-6 bg-[#1e1e1e]/30 p-6 rounded-[1.5rem] border border-white/5 shadow-inner">
            <div className="space-y-4">
              <div className="space-y-1 border-b border-white/10">
                <label className="text-[6px] font-black tracking-[0.3em] text-gray-600 uppercase ml-1">Tu Nombre</label>
                <input className="w-full bg-transparent py-2 text-[11px] outline-none focus:text-purple-400 transition-all uppercase tracking-widest font-['Open_Sans']" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
              </div>
              <div className="space-y-1 border-b border-white/10">
                <label className="text-[6px] font-black tracking-[0.3em] text-gray-600 uppercase ml-1">Ubicación</label>
                <input className="w-full bg-transparent py-2 text-[11px] outline-none focus:text-purple-400 transition-all uppercase tracking-widest font-['Open_Sans']" value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} />
              </div>
              <div className="space-y-1 border-b border-white/10">
                <label className="text-[6px] font-black tracking-[0.3em] text-gray-600 uppercase ml-1">Intereses</label>
                <input className="w-full bg-transparent py-2 text-[11px] outline-none focus:text-purple-400 transition-all uppercase tracking-widest font-['Open_Sans']" placeholder="EJ: FOTOGRAFÍA, MODA..." value={profile.interests} onChange={e => setProfile({...profile, interests: e.target.value})} />
              </div>
            </div>
            
            <div className="pt-4 space-y-4">
              <button onClick={handleSave} className="w-full py-4 text-[9px] tracking-[0.4em] font-black uppercase rounded-xl bg-gradient-to-r from-purple-600 to-indigo-800 text-white shadow-lg hover:opacity-90 active:scale-95 transition-all block font-['Open_Sans']">
                GUARDAR DATOS
              </button>
              <button onClick={() => { signOut(auth); navigate('/'); }} className="w-full text-[7px] font-black tracking-[0.4em] uppercase text-gray-700 hover:text-red-500 transition-colors flex items-center justify-center gap-2">
                <LogOut size={10}/> CERRAR SESIÓN
              </button>
            </div>
          </div>

        </div>
      </div>
      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} message={modal.message} type={modal.type} isConfirm={false} onConfirm={() => {}} />
    </div>
  );
}
