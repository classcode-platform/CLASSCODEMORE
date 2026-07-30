import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const processUserRedirection = async (user) => {
    try {
      const pendingRole = localStorage.getItem('pendingRole');
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (pendingRole) {
        // Si hay un rol pendiente de registro (ej: profesional)
        await setDoc(userRef, {
          role: pendingRole,
          email: user.email,
          createdAt: new Date().toISOString()
        }, { merge: true });
        localStorage.removeItem('pendingRole');
        navigate(pendingRole === 'professional' ? '/dashboard' : '/client-profile');
      } else if (userDoc.exists()) {
        // Si ya existe el usuario, respetamos el rol que tenga guardado en la base de datos
        const role = userDoc.data().role;
        if (role === 'professional') {
          navigate('/dashboard');
        } else {
          navigate('/client-profile');
        }
      } else {
        // Usuario nuevo por defecto sin rol previo -> va al perfil de cliente / organizador
        await setDoc(userRef, {
          email: user.email,
          role: 'client',
          createdAt: new Date().toISOString()
        }, { merge: true });
        navigate('/client-profile');
      }
    } catch (error) {
      console.error("Error en la redirección:", error);
      navigate('/client-profile'); // Respaldo de seguridad
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await processUserRedirection(result.user);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = isLogin 
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password);
      await processUserRedirection(userCredential.user);
    } catch (error) {
      console.error("Error detallado Firebase:", error.code, error.message);
      alert(`Error en la autenticación: ${error.message}`);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      alert("Por favor, ingresá tu correo electrónico en el campo de arriba para recuperar tu contraseña.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("¡Correo de recuperación enviado! Revisá tu bandeja de entrada.");
    } catch (error) {
      console.error("Error al restablecer contraseña:", error.code, error.message);
      alert(`No se pudo enviar el correo: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-['Open_Sans'] text-white relative overflow-hidden">
      
      {/* LUCES ORBITALES DINÁMICAS */}
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          x: [-200, 200, -200],
          y: [-100, 100, -100],
          rotate: [0, 360]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[140px] pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          x: [200, -200, 200],
          y: [100, -100, 100],
          rotate: [360, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"
      />

      {/* TARJETA GLASSMORPHISM */}
      <div className="max-w-md w-full space-y-8 bg-white/5 backdrop-blur-2xl p-10 md:p-12 rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">
        
        {/* LOGO CLASSCODE ÚNICO */}
        <header className="text-center pb-2 cursor-default">
          <h1 className="text-3xl md:text-4xl font-['Poppins'] font-normal tracking-[0.05em] uppercase text-white leading-none">
            CLASSCODE
          </h1>
        </header>
        
        <div className="space-y-6">
          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 hover:bg-white/10 transition-all group"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
               <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
               <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
               <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
               <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-gray-300 group-hover:text-white transition-colors">
              Continuar con Google
            </span>
          </button>

          <div className="flex items-center gap-4 opacity-20">
            <div className="h-[1px] flex-1 bg-white"></div>
            <span className="text-[10px] uppercase tracking-widest">o</span>
            <div className="h-[1px] flex-1 bg-white"></div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="text-left">
                <label className="text-[9px] text-gray-500 tracking-widest uppercase ml-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 py-2 text-sm outline-none focus:border-purple-500 transition-all font-light" 
                  required
                />
              </div>
              
              <div className="text-left relative">
                <label className="text-[9px] text-gray-500 tracking-widest uppercase ml-1">Contraseña</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 py-2 text-sm outline-none focus:border-purple-500 transition-all font-light" 
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 bottom-2 text-gray-600 hover:text-white"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 rounded-xl bg-white text-black hover:bg-gray-200 transition-all shadow-xl active:scale-[0.98]"
            >
              <span className="text-[11px] tracking-[0.25em] font-black uppercase">
                {isLogin ? 'Entrar' : 'Registrarme'}
              </span>
            </button>
          </form>
        </div>
        
        <footer className="pt-4 flex flex-col items-center gap-3">
          <button 
            type="button" 
            onClick={handlePasswordReset}
            className="text-[9px] text-gray-600 tracking-[0.15em] uppercase hover:text-purple-400 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)} 
            className="text-white text-[10px] tracking-[0.15em] uppercase font-bold border-b border-white/20 pb-1"
          >
            {isLogin ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
          </button>
        </footer>
      </div>
    </div>
  );
}