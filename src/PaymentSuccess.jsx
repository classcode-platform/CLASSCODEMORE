import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Loader2, Star, XCircle } from 'lucide-react'; // Cambiamos Trophy por Star

export default function PaymentSuccess() {
  const [status, setStatus] = useState('procesando');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const activatePro = async () => {
      const paymentStatus = searchParams.get('collection_status'); 
      const user = auth.currentUser;

      if (user && paymentStatus === 'approved') {
        try {
          const proRef = doc(db, "professionals", user.uid);
          
          // ACTUALIZACIÓN DE PUNTOS PRO: Ahora suma 1000 puntos
          await updateDoc(proRef, {
            isPro: true,
            planStatus: 'active',
            premiumSince: new Date(),
            verified: true,             
            academyPoints: increment(1000), // Ajustado a 1000 puntos
            scoreBonus: 1000            
          });

          setStatus('success');
        } catch (error) {
          console.error("Error al activar:", error);
          setStatus('error');
        }
      } else if (paymentStatus && paymentStatus !== 'approved') {
        setStatus('error');
      }
    };

    const timer = setTimeout(() => activatePro(), 1500);
    return () => clearTimeout(timer);
  }, [searchParams, navigate]);
  
  return (
    <div className="min-h-screen bg-[#282929] text-white flex items-center justify-center p-6 font-['Open_Sans'] antialiased">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#171717] rounded-[2rem] p-10 border border-white/10 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          {status === 'procesando' && (
            <div className="py-10">
              <Loader2 size={50} className="text-purple-500 animate-spin mx-auto mb-6" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Validando Suscripción...</h2>
            </div>
          )}

          {status === 'success' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-purple-500/30">
                <ShieldCheck size={40} className="text-white" strokeWidth={1.5} />
              </div>

              <h1 className="text-2xl md:text-3xl font-normal font-['Poppins'] mb-4 tracking-[0.1em] uppercase">
                ¡Miembro <span className="text-purple-400 font-bold">PRO</span> Activo!
              </h1>
              
              <p className="text-gray-400 text-[11px] uppercase tracking-widest font-light leading-relaxed mb-8">
                Bienvenido a la comunidad de <span className="text-white font-bold">CLASSCODE</span>. 
                Tu perfil ha sido elevado a estatus profesional.
              </p>

              <div className="bg-black/40 border border-purple-500/20 rounded-2xl p-6 mb-10 flex flex-col items-center gap-3">
                 <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                    <Star size={14} className="text-[#f1ad02] fill-[#f1ad02]" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-purple-300">+1000 PUNTOS OBTENIDOS</span>
                 </div>
                 <ul className="text-[8px] text-gray-500 uppercase tracking-widest space-y-1 mt-2 font-bold italic">
                    <li>✓ Sello Miembro PRO</li>
                    <li>✓ Acceso Total Academy</li>
                    <li>✓ Posicionamiento Elite</li>
                 </ul>
              </div>
              
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] rounded-lg font-bold text-[10px] tracking-[0.3em] uppercase hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                IR AL DASHBOARD <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {status === 'error' && (
            <div className="py-10">
              <XCircle size={60} className="text-red-500 mx-auto mb-6" />
              <h2 className="text-red-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Error en la transacción</h2>
              <p className="text-gray-500 text-xs mb-8">No pudimos validar la suscripción. Intenta nuevamente.</p>
              <button 
                onClick={() => navigate('/plans')}
                className="text-white text-[9px] font-bold uppercase tracking-widest border border-white/10 px-8 py-3 rounded-lg hover:bg-white/5"
              >
                VOLVER A PLANES
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}