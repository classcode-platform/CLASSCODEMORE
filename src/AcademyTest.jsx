import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from './firebase';
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore'; 
import { Zap, ShieldCheck, Trophy, RefreshCw, X, ArrowRight } from 'lucide-react';
import { ACADEMY_DB } from './AcademyData'; 

export default function AcademyTest() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [testFinished, setTestFinished] = useState(false);

  const decodedCategory = category ? decodeURIComponent(category) : "Generico";
  const questions = ACADEMY_DB[decodedCategory] || ACADEMY_DB["Generico"];
  const puntosAOtorgar = decodedCategory === "Generico" ? 150 : 250;

  // ESTILO DE LOGO SEGÚN HOME
  const logoStyle = { fontFamily: 'Poppins', fontWeight: 400, letterSpacing: '0.35em' };

  const handleAnswer = (isCorrect) => {
    let newScore = score;
    if (isCorrect) newScore = score + 1;
    setScore(newScore);
    if (currentStep + 1 < questions.length) setCurrentStep(currentStep + 1);
    else finishTest(newScore);
  };

  const finishTest = async (finalCorrect) => {
    const approved = finalCorrect === questions.length;
    const user = auth.currentUser;
    if (user && approved) {
      try {
        const courseId = decodedCategory === "Generico" ? "cert_generico" : `cert_${decodedCategory.toLowerCase().replace(/\s/g, '')}`;
        await updateDoc(doc(db, "professionals", user.uid), {
          score: increment(puntosAOtorgar),
          completedCourses: arrayUnion(courseId),
          verified: true
        });
      } catch (error) { console.error("Error Firebase:", error); }
    }
    setTestFinished(true);
  };

  return (
    <div className="min-h-screen bg-[#282929]/95 backdrop-blur-md fixed inset-0 z-[100] flex items-center justify-center p-4 antialiased font-['Open_Sans'] text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-xl w-full bg-[#171717] rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
      >
        {/* BOTÓN CERRAR ESTILO HOME */}
        <button onClick={() => navigate('/dashboard')} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-all">
          <X size={20} />
        </button>

        <div className="p-10 md:p-14">
          {!testFinished ? (
            <div className="space-y-10">
              <header className="text-center space-y-2">
                <h1 className="text-xl md:text-2xl uppercase leading-none" style={logoStyle}>CLASSCODE</h1>
                <p className="text-purple-400 text-[8px] font-black uppercase tracking-[0.4em]">Academy • {decodedCategory}</p>
              </header>

              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Paso {currentStep + 1} de {questions.length}</span>
                  <div className="flex gap-1.5">
                    {questions.map((_, i) => (
                      <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'bg-purple-500' : 'bg-gray-800'}`} />
                    ))}
                  </div>
                </div>
                <h3 className="text-[22px] font-light leading-snug tracking-tight text-white/90">{questions[currentStep].q}</h3>
              </div>

              <div className="grid gap-3 pt-4">
                {questions[currentStep].a.map((ans, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleAnswer(idx === questions[currentStep].correct)} 
                    className="w-full py-5 px-8 text-left bg-white/[0.02] border border-white/5 rounded-2xl text-[12px] uppercase font-bold tracking-widest hover:bg-purple-600/10 hover:border-purple-500/30 transition-all group flex justify-between items-center"
                  >
                    <span>{ans}</span>
                    <Zap size={14} className="text-transparent group-hover:text-purple-500 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-10 py-4">
              {score === questions.length ? (
                <div className="space-y-8">
                  <Trophy size={60} className="text-yellow-400 mx-auto" />
                  <div className="space-y-2">
                    <h2 className="text-2xl uppercase tracking-[0.3em]" style={logoStyle}>¡Nivelado!</h2>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest font-black italic">Certificación CLASSCODE® obtenida</p>
                  </div>
                  <button onClick={() => navigate('/dashboard')} className="w-full py-5 bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] rounded-xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-purple-500/20 active:scale-95 transition-all">Ir al Dashboard</button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-[18px] uppercase tracking-[0.2em] font-normal" style={logoStyle}>Capacitación Pendiente</h2>
                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest leading-relaxed">
                      Para desbloquear este rubro, mira el video de <br/> estándar de calidad internacional.
                    </p>
                  </div>

                  <div className="w-full aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                    <iframe 
                      src={decodedCategory === "Fotografía" ? "https://player.vimeo.com/video/1156357123" : "https://player.vimeo.com/video/1151434449"} 
                      className="w-full h-full" frameBorder="0" allowFullScreen
                    ></iframe>
                  </div>

                  <div className="space-y-4 pt-4">
                    <button onClick={() => window.location.reload()} className="w-full py-5 bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] rounded-xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-purple-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all">
                      <RefreshCw size={14}/> Reintentar Nivelación
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="w-full py-4 text-gray-600 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all">Salir</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

