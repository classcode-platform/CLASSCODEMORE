import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import { Search, Briefcase, ArrowRight, Check } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- CHEQUEO DE SEGURIDAD INICIAL ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/'); // Si no hay sesión, al login
      } else {
        // Verificamos si ya eligió rol para no mostrarle esto de nuevo
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists() && docSnap.data().role) {
          navigate(docSnap.data().role === 'professional' ? '/dashboard' : '/home');
        } else {
          setLoading(false); // Recién aquí mostramos las opciones
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
    setIsSubmitting(true);
    
    const user = auth.currentUser;
    if (user) {
      try {
        // 1. Guardamos el rol en la colección de usuarios general
        await setDoc(doc(db, "users", user.uid), {
          role: role === 'Profesional' ? 'professional' : 'client',
          email: user.email
        }, { merge: true });

        // 2. Inicializamos su perfil según el rol
        if (role === 'Profesional') {
          await setDoc(doc(db, "professionals", user.uid), { 
            email: user.email,
            score: 0,
            academyPoints: 0,
            photos: [],
            job: '' 
          }, { merge: true });
          navigate('/dashboard');
        } else {
          await setDoc(doc(db, "clients", user.uid), { 
            email: user.email 
          }, { merge: true });
          navigate('/home');
        }
      } catch (error) {
        console.error("Error al guardar rol:", error);
        setIsSubmitting(false);
      }
    }
  };

  const roleOptions = [
    {
      role: 'Cliente',
      icon: Search,
      title: '¿BUSCÁS SERVICIOS?',
      description: 'Encontrá profesionales expertos para tus proyectos',
      features: ['Acceso a miles de profesionales', 'Solicitá presupuestos', 'Revisá portfolios'],
    },
    {
      role: 'Profesional',
      icon: Briefcase,
      title: '¿OFRECÉS SERVICIOS?',
      description: 'Mostrá tu talento y conectá con nuevos clientes',
      features: ['Creá tu perfil profesional', 'Recibí solicitudes', 'Gestioná proyectos'],
    }
  ];

  const violetBtn = "w-full py-4 rounded-lg bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] text-white font-bold flex items-center justify-center gap-2 text-[10px] tracking-[0.35em] uppercase hover:opacity-90 transition-opacity mt-4 border-none";

  // Pantalla de carga sutil para evitar parpadeos
  if (loading) return (
    <div className="min-h-screen bg-[#282929] flex items-center justify-center">
      <div className="text-white font-['Poppins'] tracking-[0.4em] text-[10px] animate-pulse uppercase">Iniciando Experiencia...</div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#282929] p-4 font-['Open_Sans'] relative">
      
      <div className="relative z-10 w-full max-w-5xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-white text-2xl uppercase tracking-[0.35em] mb-4 font-normal" style={{ fontFamily: 'Poppins' }}>
            CLASSCODE
          </h1>
          <p className="text-sm md:text-base text-gray-400 font-light tracking-wide">
            Seleccioná tu perfil para continuar
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 px-4">
          {roleOptions.map((option, index) => (
            <motion.div
              key={option.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
            >
              <button
                onClick={() => handleRoleSelect(option.role)}
                disabled={isSubmitting}
                className={`w-full h-full flex flex-col items-start text-left p-8 rounded-[2rem] border transition-all duration-300 group ${
                  selectedRole === option.role
                    ? 'border-purple-500 bg-[#1e1e1e] shadow-2xl scale-[1.01]'
                    : 'border-[#333] bg-[#171717] hover:border-gray-500 hover:shadow-xl'
                } ${isSubmitting && selectedRole !== option.role ? 'opacity-50' : ''}`}
              >
                <div className={`w-14 h-14 flex items-center justify-center rounded-xl mb-6 relative overflow-hidden transition-all duration-300 ${
                  selectedRole === option.role 
                    ? 'bg-gradient-to-r from-[#8A2BE2] to-[#4B0082]' 
                    : 'bg-[#252525]' 
                }`}>
                   <option.icon className={`w-6 h-6 transition-colors ${
                     selectedRole === option.role ? 'text-white' : 'text-gray-500'
                   }`} />
                </div>

                <div className="w-full text-left space-y-3 flex-grow">
                    <h3 className="text-xl font-bold text-white uppercase tracking-wide font-['Open_Sans']">
                      {option.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed font-light">
                      {option.description}
                    </p>

                    <ul className="space-y-2 py-4">
                    {option.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-gray-300 text-[10px] uppercase tracking-wide font-light">
                        <div className="mt-0.5 p-0.5 rounded-full bg-white/10 flex-shrink-0">
                            <Check className="w-2 h-2 text-white" />
                        </div>
                        <span>{feature}</span>
                        </li>
                    ))}
                    </ul>
                </div>

                <div className={violetBtn}>
                  <span>
                    {selectedRole === option.role && isSubmitting ? 'GUARDANDO...' : 'SELECCIONAR'}
                  </span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
