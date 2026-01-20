import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { doc, updateDoc, increment } from 'firebase/firestore'; // Importamos increment
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Trophy, Loader2 } from 'lucide-react';

export default function PaymentSuccess() {
  const [status, setStatus] = useState('procesando');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const activatePro = async () => {
      // Mercado Pago envía por URL el estado: collection_status=approved
      const paymentStatus = searchParams.get('collection_status'); 
      const user = auth.currentUser;

      if (user && paymentStatus === 'approved') {
        try {
          const proRef = doc(db, "professionals", user.uid);
          
          // --- AUTOMATIZACIÓN DE BENEFICIOS PRO ---
          await updateDoc(proRef, {
            isPro: true,                // Activa flag PRO
            planStatus: 'active',       // Estado de suscripción
            premiumSince: new Date(),   // Fecha de inicio
            
            // PROMESA 1: Badge de Verificado
            verified: true,             
            
            // PROMESA 2: Bonus de XP (All Access Academy)
            academyPoints: increment(500), 
            
            // PROMESA 3: Mejor posicionamiento (Score base más alto)
            scoreBonus: 1000            // Campo auxiliar para ordenar en Results.jsx
          });

          setStatus('success');
          // Lo enviamos al Dashboard después de 4 segundos
          setTimeout(() => navigate('/dashboard'), 4000);
        } catch (error) {
          console.error("Error al activar:", error);
          setStatus('error');
        }
      } else if (paymentStatus && paymentStatus !== 'approved') {
        setStatus('error');
      }
    };

    // Esperamos 1.5 segundos para asegurar que el usuario esté logueado
    const timer = setTimeout(() => activatePro(), 1500);
    return () => clearTimeout(timer);
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#282929] flex flex-col items-center justify-center text-white font-['Open_Sans']">
      <div className="max-w-md w-full text-center space-y-8">
        
        {status === 'procesando' && (
          <div className="space-y-4">
            <Loader2 size={40} className="text-purple-500 animate-spin mx-auto" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Sincronizando Pago...</h2>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-700">
            <Trophy size={60} className="text-[#f1ad02] mx-auto shadow-[0_0_30px_rgba(241,173,2,0.3)]" />
            <h1 className="text-2xl font-normal uppercase font-['Poppins'] tracking-tighter">¡Nivel PRO Activado!</h1>
            
            <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Tu perfil ha sido actualizado:</p>
                <ul className="text-[9px] text-purple-400 font-bold uppercase tracking-widest space-y-1">
                    <li>✓ Badge de Verificado</li>
                    <li>✓ +500 XP Academy Bonus</li>
                    <li>✓ Posicionamiento Elite</li>
                </ul>
            </div>

            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-6">
                <div className="h-full bg-purple-600 animate-[loading_4s_ease-in-out]" style={{width: '100%'}} />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <h2 className="text-red-500 text-[10px] font-black uppercase tracking-widest">Hubo un problema</h2>
            <p className="text-gray-400 text-xs">No pudimos validar el pago o fue cancelado.</p>
            <button onClick={() => navigate('/plans')} className="text-white text-[8px] font-black uppercase tracking-widest border border-white/10 px-6 py-2 rounded-full hover:bg-white/5">Reintentar</button>
          </div>
        )}
      </div>
    </div>
  );
}