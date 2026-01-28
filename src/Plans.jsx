import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Star, Zap, ExternalLink, Sparkles } from 'lucide-react';

export default function Plans() {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'INICIAL',
      price: 'GRATIS',
      icon: Star,
      color: 'text-gray-400',
      border: 'border-white/10',
      bg: 'bg-white/[0.02]',
      button: 'ACTUAL',
      active: true,
      features: [
        'Perfil Profesional Básico', 
        'Aparición en resultados de búsqueda', 
        'Recepción de mensajes y presupuestos'
      ],
      action: null
    },
    {
      name: 'PRO',
      price: '$5.000',
      icon: Zap,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/[0.03]',
      gradient: 'from-[#8A2BE2] to-[#4B0082]',
      button: 'SUSCRIBIRSE',
      active: false,
      features: [
        'Posicionamiento destacado en búsquedas', 
        'Sello de Verificado (Verified Badge)', 
        'ALL ACCESS: Classcode Academy', 
        'Soporte y Coaching Técnico'
      ],
      action: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=6c842f08d2e74f1abfe843bf2eb935f7' 
    }
  ];

  const handlePlanClick = (link) => {
    if (link) window.location.href = link;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] antialiased relative overflow-hidden flex flex-col uppercase">
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [-50, 50], y: [-30, 30] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[180px]"
        />
      </div>

      <nav className="p-4 md:p-8 w-full sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center w-full font-['Poppins']">
          <div className="flex flex-col gap-0">
            <div onClick={() => navigate('/home')} className="text-lg md:text-xl cursor-pointer tracking-[0.05em] text-white">
              CLASSCODE
            </div>
            <p className="text-purple-400 text-[7px] md:text-[9px] font-black tracking-[0.3em]">MEMBERSHIPS</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white text-[8px] md:text-[9px] font-black tracking-[0.3em] transition-all">
            <ArrowLeft size={12}/> VOLVER
          </button>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-4 md:px-12 py-6 md:py-12 relative z-10 w-full flex-grow flex flex-col justify-center">
        
        <div className="grid grid-cols-2 gap-3 md:gap-10 max-w-5xl mx-auto w-full">
          {plans.map((plan, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative backdrop-blur-xl rounded-[1.5rem] md:rounded-[3rem] p-5 md:p-14 border transition-all duration-500 flex flex-col ${plan.bg} ${plan.border} ${plan.active ? 'opacity-80' : 'hover:border-purple-500/60 shadow-2xl'}`}
            >
              {/* PESTAÑA RECOMENDADO: MÁS GRANDE Y LEGIBLE */}
              {plan.name === 'PRO' && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 md:translate-x-0 md:right-12 bg-gradient-to-r from-[#FFD700] via-[#FDB931] to-[#D4AF37] text-black text-[7px] md:text-[10px] font-black px-4 md:px-8 py-2 md:py-3 rounded-b-xl md:rounded-b-2xl tracking-[0.25em] shadow-[0_4px_20px_rgba(212,175,55,0.3)] z-20">
                  RECOMENDADO
                </div>
              )}
              <div className={`w-10 h-10 md:w-16 md:h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 md:mb-10 ${plan.color} border border-white/5 shadow-inner`}>
                <plan.icon size={20} className="md:w-8 md:h-8" />
              </div>

              <div className="space-y-1 mb-6 md:mb-10">
                <h3 className="text-[8px] md:text-[11px] font-black text-gray-500 tracking-[0.4em] uppercase">{plan.name}</h3>
                <div className="text-xl md:text-5xl font-['Poppins'] font-light text-white tracking-tighter flex items-baseline gap-1">
                  {plan.price} <span className="text-[7px] md:text-[10px] text-gray-500 font-bold uppercase">/ mes</span>
                </div>
              </div>

              <ul className="space-y-3 md:space-y-5 mb-8 md:mb-12 flex-grow">
                {plan.features.map((feat, k) => (
                  <li key={k} className="flex items-start gap-2 md:gap-4 text-[7px] md:text-[11px] text-gray-400 font-bold tracking-wider leading-tight">
                    <Check size={12} className={`${plan.color} mt-0.5 md:w-5 md:h-5`} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handlePlanClick(plan.action)}
                disabled={plan.active}
                className={`w-full py-4 md:py-6 rounded-xl md:rounded-[1.5rem] font-black text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.4em] transition-all flex items-center justify-center gap-2 shadow-xl ${
                  plan.active 
                    ? 'bg-white/5 text-gray-500 border border-white/5 cursor-default' 
                    : `bg-gradient-to-r ${plan.gradient} text-white hover:scale-[1.02] active:scale-95 shadow-purple-900/20`
                }`}
              >
                {plan.button} {plan.action && <ExternalLink size={12} className="md:w-4 md:h-4"/>}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 md:mt-20 max-w-5xl mx-auto w-full">
          <div className="w-full bg-white/[0.01] border border-dashed border-white/10 rounded-[1.5rem] p-6 md:p-10 flex flex-col items-center justify-center text-gray-600 gap-2">
            <Sparkles size={16} className="opacity-20 text-purple-400" />
            <div className="text-center">
              <span className="text-[7px] md:text-[9px] font-black text-purple-500/50 tracking-widest uppercase">CONTACTO.CLASSCODE@GMAIL.COM</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-black py-10 md:py-16 px-6 border-t border-white/5 text-center w-full">
        <div className="max-w-[1440px] mx-auto opacity-30 font-['Poppins']">
          <h2 className="text-lg md:text-2xl font-normal tracking-[0.1em] mb-2 uppercase">CLASSCODE</h2>
          <p className="text-[7px] md:text-[9px] tracking-[0.4em] font-bold uppercase">© 2026 — TODOS LOS DERECHOS RESERVADOS</p>
        </div>
      </footer>
    </div>
      );
    }