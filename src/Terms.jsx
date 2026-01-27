import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Scale, Lock, Users, CreditCard, Globe } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] antialiased relative overflow-x-hidden uppercase">
      
      {/* BACKGROUND GLOWS - GLASSMORPHISM BASE */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ x: [-50, 50, -50], y: [-30, 30, -30], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px]" />
        <motion.div animate={{ x: [50, -50, 50], y: [30, -30, 30], scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[130px]" />
      </div>

      {/* HEADER FIXED - GLASS STYLE */}
      <nav className="p-6 md:p-10 w-full sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto flex justify-between items-center w-full font-['Poppins']">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] font-bold transition-all"><ArrowLeft size={14}/> VOLVER</button>
          <div className="text-xl tracking-[0.05em] uppercase text-white font-normal">CLASSCODE<sup className="text-[9px] ml-0.5 font-bold">®</sup></div>
          <div className="w-20 hidden md:block"></div> {/* Spacer to center logo */}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 relative z-10 w-full">
        
        {/* LEGAL BODY - PREMIUM GLASS CONTAINER */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] backdrop-blur-3xl p-8 md:p-20 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden"
        >
          {/* HEADER INTERNO */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-16 border-b border-white/5 pb-12 text-center md:text-left leading-none">
            <div className="p-5 bg-purple-500/10 rounded-[2rem] border border-purple-500/20 text-purple-400 shadow-xl shadow-purple-900/10 leading-none">
               <ShieldCheck size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-3 leading-none">
              <h1 className="text-2xl md:text-4xl font-light font-['Poppins'] tracking-tight text-white uppercase leading-none">Acuerdo Legal</h1>
              <p className="text-gray-500 text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-bold leading-none">TÉRMINOS Y CONDICIONES DE USO V.2026</p>
            </div>
          </div>

          <div className="space-y-16 text-[13px] text-gray-400 font-light leading-relaxed text-justify normal-case">
            
            {/* 1. Misión Multisectorial */}
            <section className="space-y-6">
              <h3 className="text-white font-bold uppercase tracking-[0.3em] text-[11px] flex items-center gap-3">
                 <Globe size={16} className="text-purple-500"/> 1. El Servicio y Nuestra Misión
              </h3>
              <p>
                <strong className="text-white font-medium uppercase tracking-wider">CLASSCODE®</strong> es una infraestructura tecnológica y plataforma digital multisectorial que proporciona herramientas de visibilidad, conexión, promoción, formación y gestión de perfiles profesionales para distintas industrias, incluyendo —pero no limitándose a— eventos, moda, audiovisual, publicidad, marketing, producción de contenidos, servicios creativos y rubros afines.
              </p>
              <p>
                CLASSCODE® permite que los usuarios profesionales (en adelante, los “Talentos”) exhiban su trabajo, trayectoria y servicios, y que los usuarios contratantes (en adelante, los “Clientes”) puedan descubrirlos, contactarlos y evaluarlos de manera independiente.
              </p>
              <div className="bg-white/[0.03] p-8 rounded-[2rem] border border-white/5 text-[12px] space-y-6 shadow-inner">
                <p className="font-bold text-white uppercase tracking-[0.1em]">El Usuario comprende y acepta expresamente que:</p>
                <ul className="space-y-3 list-none text-gray-400 italic">
                  <li className="flex gap-3"><span>•</span> <span>CLASSCODE® no es una agencia de empleos.</span></li>
                  <li className="flex gap-3"><span>•</span> <span>No actúa como intermediario laboral.</span></li>
                  <li className="flex gap-3"><span>•</span> <span>No representa a los Talentos ni a los Clientes.</span></li>
                  <li className="flex gap-3"><span>•</span> <span>No participa en la negociación, ejecución ni cumplimiento de los acuerdos privados que puedan celebrarse entre las partes.</span></li>
                  <li className="flex gap-3"><span>•</span> <span>No garantiza resultados, contrataciones, ingresos, disponibilidad ni continuidad de servicios.</span></li>
                </ul>
                <p className="text-white font-medium border-t border-white/5 pt-6 leading-relaxed italic opacity-80">
                  Toda relación contractual, comercial, laboral, civil o de cualquier otra naturaleza que pudiera surgir entre Talentos y Clientes será exclusiva responsabilidad de dichas partes, eximiendo a CLASSCODE® de cualquier obligación, reclamo o responsabilidad derivada.
                </p>
              </div>
            </section>

            {/* 2. Compromisos y ConductA */}
            <section className="space-y-6">
              <h3 className="text-white font-bold uppercase tracking-[0.3em] text-[11px] flex items-center gap-3">
                <Users size={16} className="text-purple-500"/> 2. Compromisos de Seguridad y Conducta
              </h3>
              <p className="text-white/80">Con el fin de preservar un entorno seguro, profesional y confiable, el Usuario se compromete a:</p>
              <div className="space-y-5 ml-2">
                <p><strong className="text-purple-400 uppercase mr-2 tracking-widest">a)</strong> Proporcionar información veraz, actualizada y comprobable, absteniéndose de suplantar identidades o falsear datos personales o profesionales.</p>
                <p><strong className="text-purple-400 uppercase mr-2 tracking-widest">b)</strong> Publicar únicamente contenido sobre el cual posea los derechos de uso, reproducción y difusión, garantizando que dicho contenido no infringe derechos de terceros.</p>
                <p><strong className="text-purple-400 uppercase mr-2 tracking-widest">c)</strong> No utilizar la plataforma para actividades ilegales, fraudulentas, engañosas, difamatorias, violentas o contrarias a la moral y el orden público.</p>
                <p><strong className="text-purple-400 uppercase mr-2 tracking-widest">d)</strong> Mantener la confidencialidad de sus credenciales, siendo el único responsable por toda actividad realizada desde su cuenta.</p>
              </div>
              <p className="mt-8 p-6 bg-red-500/5 rounded-2xl border border-red-500/20 italic text-[12px] text-red-300/80">
                CLASSCODE® se reserva el derecho de suspender o dar de baja cuentas de forma inmediata y sin previo aviso, cuando detecte incumplimientos a estas normas, sin que ello genere derecho a reembolso o compensación alguna.
              </p>
            </section>

            {/* 3. Limitación de Responsabilidad */}
            <section className="space-y-6">
              <h3 className="text-white font-bold uppercase tracking-[0.3em] text-[11px] flex items-center gap-3">
                <Scale size={16} className="text-purple-500"/> 3. Limitación de Responsabilidad
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-black/20 p-8 rounded-[2rem] border border-white/5 space-y-3 shadow-xl">
                  <p className="text-white font-bold uppercase text-[10px] tracking-[0.2em] opacity-60">a) Servicios de Terceros</p>
                  <p className="text-[12px] leading-relaxed">CLASSCODE® no supervisa, dirige, controla ni valida la calidad, legalidad, idoneidad ni resultados de los servicios prestados por los Talentos. La plataforma actúa exclusivamente como medio tecnológico.</p>
                </div>
                <div className="bg-black/20 p-8 rounded-[2rem] border border-white/5 space-y-3 shadow-xl">
                  <p className="text-white font-bold uppercase text-[10px] tracking-[0.2em] opacity-60">b) Indemnidad</p>
                  <p className="text-[12px] leading-relaxed">El Usuario acepta mantener indemne a CLASSCODE®, sus titulares y proveedores frente a cualquier reclamo, sanción o daño derivado de su conducta, contenido publicado o acuerdos privados.</p>
                </div>
              </div>
            </section>

            {/* 4. Propiedad Intelectual */}
            <section className="space-y-6">
              <h3 className="text-white font-bold uppercase tracking-[0.3em] text-[11px] flex items-center gap-3">
                 <Lock size={16} className="text-purple-500"/> 4. Propiedad Intelectual e IP
              </h3>
              <p>
                El Usuario conserva la titularidad de los derechos sobre el contenido que publique. Al subir contenido a CLASSCODE®, el Usuario otorga a la plataforma una licencia no exclusiva, gratuita y revocable para alojar, reproducir y comunicar dicho contenido dentro de la plataforma y con fines de promoción institucional.
              </p>
              <p>
                El Usuario declara y garantiza ser el legítimo titular de los derechos del contenido publicado, liberando a CLASSCODE® de cualquier responsabilidad frente a reclamos de terceros.
              </p>
            </section>

            {/* 5. Pagos y Suscripciones */}
            <section className="space-y-6">
              <h3 className="text-white font-bold uppercase tracking-[0.3em] text-[11px] flex items-center gap-3">
                <CreditCard size={16} className="text-purple-500"/> 5. Gestión de Pagos y Bajas
              </h3>
              <p>
                Algunos servicios pueden ofrecerse bajo modalidad de suscripción paga (Plan PRO). Dichos servicios se facturan por adelantado mediante procesadores externos (como Mercado Pago), sujetos a sus propios términos y condiciones.
              </p>
              <p>
                Las cancelaciones deberán gestionarse desde el panel antes del inicio del siguiente ciclo. No se realizarán reembolsos por períodos ya abonados.
              </p>
            </section>

            {/* 6. Jurisdicción */}
            <section className="space-y-6 pb-12">
              <h3 className="text-white font-bold uppercase tracking-[0.3em] text-[11px] flex items-center gap-3">
                <Scale size={16} className="text-purple-500"/> 6. Jurisdicción y Legislación
              </h3>
              <div className="bg-purple-500/5 p-8 rounded-[2rem] border border-purple-500/10 shadow-inner">
                <p className="text-purple-100/70 leading-relaxed italic text-[12px]">
                  El presente contrato se rige por las leyes de la República Argentina. Para cualquier controversia, las partes se someten a la jurisdicción exclusiva de los <strong className="text-white">Tribunales Ordinarios en lo Civil y Comercial de la Ciudad Autónoma de Buenos Aires (CABA)</strong>, renunciando a cualquier otro fuero.
                </p>
              </div>
            </section>

            {/* FOOTER LEGAL */}
            <div className="pt-12 border-t border-white/5 text-center uppercase">
              <p className="text-[10px] tracking-[0.6em] text-white/40 mb-3 font-['Poppins']">
                CLASSCODE<sup className="text-[7px]">®</sup> — 2026
              </p>
              <p className="text-[9px] text-gray-700 tracking-[0.3em] font-bold">
                Actualizado al 26 de enero de 2026.
              </p>
            </div>

          </div>
        </motion.div>

        <div className="mt-16 text-center pb-24 space-y-6">
          <p className="text-[10px] text-gray-600 tracking-[0.3em] uppercase italic">Al continuar navegando aceptas los términos descritos arriba.</p>
          <button 
            onClick={() => navigate(-1)} 
            className="group relative inline-flex items-center justify-center px-12 py-5 font-black text-white bg-purple-600 rounded-full shadow-2xl shadow-purple-900/30 hover:bg-purple-500 transition-all active:scale-95 leading-none"
          >
            <span className="text-[11px] tracking-[0.3em] uppercase">ACEPTO LOS TÉRMINOS</span>
          </button>
        </div>
      </main>

      {/* STYLING FOR CUSTOM SCROLLBAR */}
      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(168, 85, 247, 0.2); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(168, 85, 247, 0.4); }
      `}</style>

    </div>
  );
}