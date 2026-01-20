import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Scale, Lock, Info, Users, CreditCard, Globe } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#282929] text-white font-['Open_Sans'] antialiased p-8 md:p-12">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-16 max-w-4xl mx-auto">
        <div>
          <div className="text-[16px] tracking-[0.35em] uppercase font-['Poppins'] font-normal text-white">
            CLASSCODE<sup className="text-[9px] ml-0.5 font-bold">®</sup>
          </div>
          <p className="text-gray-500 text-[9px] uppercase tracking-[0.3em] font-bold mt-1">TÉRMINOS Y CONDICIONES DE USO</p>
        </div>
        <button onClick={() => navigate(-1)} className="text-[9px] tracking-[0.35em] uppercase text-gray-400 hover:text-white transition-all flex items-center gap-2 font-bold">
          <ArrowLeft size={12}/> VOLVER
        </button>
      </header>

      {/* CUERPO LEGAL - DISEÑO PREMIUM CON TEXTO EXACTO */}
      <div className="max-w-4xl mx-auto bg-[#1e1e1e] p-10 md:p-16 rounded-[3rem] border border-white/5 shadow-2xl">
        
        <div className="flex items-center gap-4 mb-12 border-b border-white/5 pb-8">
          <ShieldCheck className="text-purple-500" size={32} />
          <h1 className="text-2xl md:text-3xl font-light font-['Poppins'] tracking-tight text-white">Acuerdo Legal de Usuario</h1>
        </div>

        <div className="space-y-12 text-[13px] text-gray-300 font-light leading-relaxed text-justify">
          
          {/* 1. Misión Multisectorial */}
          <section>
            <h3 className="text-white font-bold uppercase tracking-[0.2em] text-[11px] mb-4 flex items-center gap-2">
               <Globe size={14} className="text-purple-400"/> 1. El Servicio y Nuestra Misión
            </h3>
            <p className="mb-4">
              <strong>CLASSCODE®</strong> es una infraestructura tecnológica y plataforma digital multisectorial que proporciona herramientas de visibilidad, conexión, promoción, formación y gestión de perfiles profesionales para distintas industrias, incluyendo —pero no limitándose a— eventos, moda, audiovisual, publicidad, marketing, producción de contenidos, servicios creativos y rubros afines.
            </p>
            <p className="mb-4">
              CLASSCODE® permite que los usuarios profesionales (en adelante, los “Talentos”) exhiban su trabajo, trayectoria y servicios, y que los usuarios contratantes (en adelante, los “Clientes”) puedan descubrirlos, contactarlos y evaluarlos de manera independiente.
            </p>
            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 text-[12px] space-y-4">
              <p className="font-bold text-white uppercase tracking-tighter">El Usuario comprende y acepta expresamente que:</p>
              <ul className="space-y-2 list-none text-gray-400 italic">
                <li>• CLASSCODE® no es una agencia de empleos.</li>
                <li>• No actúa como intermediario laboral.</li>
                <li>• No representa a los Talentos ni a los Clientes.</li>
                <li>• No participa en la negociación, ejecución ni cumplimiento de los acuerdos privados que puedan celebrarse entre las partes.</li>
                <li>• No garantiza resultados, contrataciones, ingresos, disponibilidad ni continuidad de servicios.</li>
              </ul>
              <p className="text-white font-medium border-t border-white/5 pt-4 leading-relaxed">
                Toda relación contractual, comercial, laboral, civil o de cualquier otra naturaleza que pudiera surgir entre Talentos y Clientes será exclusiva responsabilidad de dichas partes, eximiendo a CLASSCODE® de cualquier obligación, reclamo o responsabilidad derivada.
              </p>
            </div>
          </section>

          {/* 2. Compromisos y ConductA */}
          <section>
            <h3 className="text-white font-bold uppercase tracking-[0.2em] text-[11px] mb-4 flex items-center gap-2">
              <Users size={14} className="text-purple-400"/> 2. Compromisos de Seguridad, Conducta y Uso de la Plataforma
            </h3>
            <p className="mb-4 text-white/80">Con el fin de preservar un entorno seguro, profesional y confiable, el Usuario se compromete a:</p>
            <div className="space-y-4 ml-2">
              <p><strong>a)</strong> Proporcionar información veraz, actualizada y comprobable, absteniéndose de suplantar identidades o falsear datos personales o profesionales.</p>
              <p><strong>b)</strong> Publicar únicamente contenido (textos, imágenes, videos, audios o cualquier otro material) sobre el cual posea los derechos de uso, reproducción y difusión, garantizando que dicho contenido no infringe derechos de terceros.</p>
              <p><strong>c)</strong> No utilizar la plataforma para actividades ilegales, fraudulentas, engañosas, difamatorias, discriminatorias, violentas o contrarias a la moral y el orden público.</p>
              <p><strong>d)</strong> Mantener la confidencialidad y seguridad de sus credenciales de acceso, siendo el único responsable por toda actividad realizada desde su cuenta.</p>
            </div>
            <p className="mt-6 p-4 bg-red-500/5 rounded-xl border border-red-500/10 italic text-[12px]">
              CLASSCODE® se reserva el derecho de suspender o dar de baja cuentas de forma inmediata y sin previo aviso, cuando detecte incumplimientos a estas normas, sin que ello genere derecho a reembolso, indemnización o compensación alguna.
            </p>
          </section>

          {/* 3. Limitación de Responsabilidad */}
          <section>
            <h3 className="text-white font-bold uppercase tracking-[0.2em] text-[11px] mb-4 flex items-center gap-2">
              <Scale size={14} className="text-purple-400"/> 3. Limitación de Responsabilidad (Descargo Legal)
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                <p className="text-white font-bold mb-2 uppercase text-[10px] tracking-widest">a) Servicios de Terceros</p>
                <p className="text-[12px]">CLASSCODE® no supervisa, dirige, controla ni valida la calidad, legalidad, idoneidad, seguridad, cumplimiento normativo ni resultados de los servicios ofrecidos o prestados por los Talentos. La plataforma actúa exclusivamente como medio tecnológico de exhibición y contacto.</p>
              </div>
              <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                <p className="text-white font-bold mb-2 uppercase text-[10px] tracking-widest">b) Indemnidad</p>
                <p className="text-[12px]">El Usuario acepta mantener totalmente indemne a CLASSCODE®, sus titulares, colaboradores y proveedores frente a cualquier reclamo, demanda, sanción, daño, perjuicio, multa o acción legal derivada de su conducta, contenido publicado o acuerdos privados.</p>
              </div>
            </div>
          </section>

          {/* 4. Propiedad Intelectual */}
          <section>
            <h3 className="text-white font-bold uppercase tracking-[0.2em] text-[11px] mb-4 flex items-center gap-2">
               <Lock size={14} className="text-purple-400"/> 4. Propiedad Intelectual y Licencias de Contenido
            </h3>
            <p className="mb-4">
              El Usuario conserva la titularidad de los derechos sobre el contenido que publique. Al subir contenido a CLASSCODE®, el Usuario otorga a la plataforma una licencia no exclusiva, gratuita, revocable y de alcance mundial, únicamente para alojar, reproducir, distribuir y comunicar dicho contenido dentro del entorno de la plataforma y con fines de promoción institucional de CLASSCODE®, sin cesión de titularidad.
            </p>
            <p>
              El Usuario declara y garantiza ser el legítimo titular de los derechos del contenido publicado, liberando a CLASSCODE® de cualquier responsabilidad frente a reclamos de terceros.
            </p>
          </section>

          {/* 5. Pagos y Suscripciones */}
          <section>
            <h3 className="text-white font-bold uppercase tracking-[0.2em] text-[11px] mb-4 flex items-center gap-2">
              <CreditCard size={14} className="text-purple-400"/> 5. Pagos, Suscripciones, Renovaciones y Cancelaciones
            </h3>
            <p className="mb-4">
              Algunos servicios de CLASSCODE® pueden ofrecerse bajo modalidad de suscripción paga (por ejemplo, Plan PRO). Dichos servicios se facturan por adelantado y se gestionan mediante procesadores de pago externos (como Mercado Pago), sujetos a sus propios términos y condiciones.
            </p>
            <p>
              Las cancelaciones o bajas deberán gestionarse desde el panel de usuario antes del inicio del siguiente ciclo de facturación. No se realizarán reembolsos por períodos ya abonados.
            </p>
          </section>

          {/* 6. Jurisdicción */}
          <section>
            <h3 className="text-white font-bold uppercase tracking-[0.2em] text-[11px] mb-4 flex items-center gap-2">
              <Scale size={14} className="text-purple-400"/> 6. Jurisdicción y Legislación Aplicable
            </h3>
            <div className="bg-purple-500/5 p-6 rounded-2xl border-l-4 border-purple-500/50">
              <p className="text-purple-100/90 leading-relaxed italic">
                El presente contrato se rige por las leyes de la República Argentina. Para cualquier controversia derivada del uso de la plataforma, las partes se someten a la jurisdicción exclusiva de los <strong>Tribunales Ordinarios en lo Civil y Comercial de la Ciudad Autónoma de Buenos Aires (CABA)</strong>, renunciando a cualquier otro fuero o jurisdicción.
              </p>
            </div>
          </section>

          {/* FOOTER LEGAL */}
          <div className="pt-12 border-t border-white/5 text-center">
            <p className="text-[10px] uppercase tracking-[0.5em] text-white/40 mb-2 font-['Poppins']">
              © 2025 CLASSCODE<sup className="text-[7px]">®</sup> — TODOS LOS DERECHOS RESERVADOS
            </p>
            <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">
              Vigente desde el 29 de diciembre de 2025.
            </p>
          </div>

        </div>
      </div>

      <div className="mt-12 text-center pb-20">
        <button onClick={() => navigate(-1)} className="text-[10px] tracking-[0.2em] uppercase text-purple-400 hover:text-white transition-all border border-purple-500/20 hover:border-white/20 px-12 py-4 rounded-full font-bold shadow-xl shadow-purple-500/5">
          He leído y acepto los términos y condiciones
        </button>
      </div>
    </div>
  );
}
