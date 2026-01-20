import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Star, Zap, ExternalLink } from 'lucide-react';

export default function Plans() {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'INICIAL',
      price: 'GRATIS',
      icon: Star,
      color: 'text-gray-400',
      border: 'border-white/10',
      button: 'PLAN ACTUAL',
      active: true,
      features: ['Perfil Básico', 'Aparición en búsquedas', 'Recibir mensajes'],
      action: null
    },
    {
      name: 'PRO',
      price: '$5.000 / mes',
      icon: Zap,
      color: 'text-purple-400',
      border: 'border-purple-500/50',
      gradient: 'from-[#8A2BE2] to-[#4B0082]',
      button: 'SUSCRIBIRSE',
      active: false,
      features: [
        'Posicionamiento destacado', 
        'Badge de Verificado', 
        'ALL ACCESS ACADEMY', 
        'Soporte'
      ],
      // Link corregido (sin etiquetas iframe)
      action: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=6c842f08d2e74f1abfe843bf2eb935f7' 
    }
  ];

  const handlePlanClick = (link) => {
    if (link) {
      window.location.href = link;
    }
  };

  return (
    <div className="min-h-screen bg-[#282929] text-white font-['Open_Sans'] antialiased p-8 md:p-12">
      
      <header className="flex justify-between items-center mb-16">
        <div>
          <div className="text-[16px] tracking-[0.35em] uppercase font-['Poppins'] font-normal text-white">CLASSCODE</div>
          <p className="text-purple-400 text-[9px] uppercase tracking-[0.3em] font-bold mt-1">MEMBERSHIPS</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-[9px] tracking-[0.35em] uppercase text-gray-400 hover:text-white transition-all flex items-center gap-2 font-bold">
          <ArrowLeft size={12}/> VOLVER
        </button>
      </header>

      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 font-['Poppins']">Invierte en tu carrera</h1>
        <p className="text-gray-400 font-light">
          Aprovechá el lanzamiento. Destacá tu perfil y captá clientes hoy mismo.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <div key={i} className={`bg-[#1e1e1e] rounded-[2rem] p-8 border ${plan.border} flex flex-col relative overflow-hidden group hover:scale-105 transition-transform duration-300 shadow-2xl`}>
            
            {plan.name === 'PRO' && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                Recomendado
              </div>
            )}

            <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 ${plan.color}`}>
              <plan.icon size={28} />
            </div>

            <h3 className="text-xl font-bold font-['Poppins'] tracking-widest mb-2">{plan.name}</h3>
            <div className="text-3xl font-light mb-8">{plan.price}</div>

            <ul className="space-y-4 mb-8 flex-grow">
              {plan.features.map((feat, k) => (
                <li key={k} className="flex items-start gap-3 text-sm text-gray-300 font-light">
                  <Check size={16} className={plan.color} />
                  {feat}
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handlePlanClick(plan.action)}
              disabled={plan.active}
              className={`w-full py-4 rounded-xl font-bold text-[10px] tracking-[0.35em] uppercase transition-all flex items-center justify-center gap-2 ${
                plan.active 
                  ? 'bg-white/10 text-gray-400 cursor-default' 
                  : plan.gradient 
                    ? `bg-gradient-to-r ${plan.gradient} text-white hover:opacity-90 shadow-lg cursor-pointer` 
                    : 'border border-white/20 hover:bg-white/5'
              }`}
            >
              {plan.button} {plan.action && <ExternalLink size={12}/>}
            </button>
          </div>
        ))}
      </div>

       <div className="mt-20 max-w-4xl mx-auto text-center border-t border-white/5 pt-10">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">Potenciá tu marca</p>
        <div className="w-full bg-[#171717] border border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 gap-2">
            <span className="text-sm font-light">ESPACIO DISPONIBLE PARA PUBLICIDAD</span>
            <span className="text-[10px] uppercase tracking-widest text-purple-400">Contactar a contacto.classcode@gmail.com</span>
        </div>
      </div>
    </div>
  );
}
