import React from 'react';
import { Lock, ShieldCheck, Eye, Database } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#282929] text-white p-8 md:p-12 font-['Poppins']">
      <div className="max-w-4xl mx-auto bg-[#1e1e1e] p-10 rounded-[2rem] border border-white/5">
        
        <h1 className="text-2xl mb-8 font-light tracking-tight">Política de Privacidad CLASSCODE®</h1>

        {/* Sección corregida */}
        <section className="text-gray-300 text-sm leading-relaxed">
          <h3 className="text-white font-bold uppercase tracking-[0.2em] text-[11px] mb-4 flex items-center gap-2">
            <Lock size={14} className="text-purple-400"/> Tratamiento de Datos Personales
          </h3>
          <p className="mb-4">
            En <strong>CLASSCODE®</strong>, la privacidad es pilar de nuestra estética y ética. Los datos recolectados (Nombre, Email, Imágenes de Perfil) se utilizan exclusivamente para la funcionalidad de la plataforma multisectorial.
          </p>
          <p className="mb-4 border-l-2 border-purple-500/30 pl-4 bg-white/5 p-4 rounded-r-lg">
            <strong className="text-purple-300">Live Gallery:</strong> Las imágenes subidas por invitados a las galerías en tiempo real son almacenadas de forma temporal y el Organizador tiene el control total para eliminarlas permanentemente. No compartimos estas imágenes con terceros con fines publicitarios.
          </p>
        </section>

        <section className="mt-8 pt-8 border-t border-white/5 text-[10px] text-gray-500 uppercase tracking-widest">
          © 2026 CLASSCODE ACADEMY — PROTECCIÓN DE DATOS DE GRADO PROFESIONAL
        </section>
      </div>
    </div>
  );
}