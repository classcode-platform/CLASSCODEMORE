import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      alert("Por favor, ingresá tu email primero.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("¡Email enviado! Revisá tu casilla.");
    } catch (error) {
      alert("Error: Email no encontrado.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin && !acceptedTerms) return;
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        // IMPORTANTE: Siempre mandamos a Onboarding para que allí se verifique el rol
        navigate('/onboarding'); 
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/onboarding');
      }
    } catch (error) {
      alert("Error en los datos.");
    }
  };

  return (
    <div className="min-h-screen bg-[#282929] flex items-center justify-center p-4 font-['Open_Sans'] text-white">
      <div className="max-w-md w-full space-y-10 bg-[#171717] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl text-center">
        
        {/* LOGO */}
        <div>
          <h1 className="font-['Poppins'] font-normal text-2xl tracking-[0.35em] uppercase">
                 CLASSCODE
          </h1>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-2 font-light">
            Tu talento, nuestra plataforma
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="email" 
            placeholder="EMAIL" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-b border-white/10 py-3 text-[12px] text-left placeholder:text-gray-600 outline-none focus:border-white transition-all tracking-widest font-light" 
            required
          />
          
          <input 
            type="password" 
            placeholder="CONTRASEÑA" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent border-b border-white/10 py-3 text-[12px] text-left placeholder:text-gray-600 outline-none focus:border-white transition-all tracking-widest font-light" 
            required
          />

          {!isLogin && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <input 
                type="checkbox" 
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 border-white/10 bg-white/5 text-purple-600 rounded"
              />
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-light">
                Acepto las <span 
                  onClick={() => navigate('/terms')} 
                  className="text-purple-400 hover:underline font-bold cursor-pointer"
                >
                  Bases y Condiciones
                </span>
              </label>
            </div>
          )}
          
          <button 
            type="submit"
            disabled={!isLogin && !acceptedTerms}
            className={`w-full py-4 rounded-xl font-bold text-[10px] tracking-[0.35em] uppercase transition-all mt-4 ${
              !isLogin && !acceptedTerms 
              ? 'bg-gray-800 text-gray-600' 
              : 'bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] text-white hover:opacity-90 shadow-lg shadow-purple-500/10'
            }`}
          >
            {isLogin ? 'ENTRAR' : 'REGISTRARME'}
          </button>
        </form>
        
        {/* SECCIÓN INFERIOR */}
        <div className="pt-2 flex flex-col items-center space-y-4">
          
          {isLogin && (
            <button 
              type="button"
              onClick={handleResetPassword}
              className="text-[9px] text-gray-600 uppercase tracking-[0.2em] hover:text-purple-400 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <div className="w-12 h-[1px] bg-white/5"></div>

          <button 
            onClick={() => { setIsLogin(!isLogin); setAcceptedTerms(false); }} 
            className="text-gray-500 text-[9px] uppercase tracking-widest hover:text-white transition-colors font-light"
          >
            {isLogin ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
          </button>
        </div>

      </div>
    </div>
  );
}
