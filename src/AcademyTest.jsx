import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from './firebase';
import { doc, setDoc, increment, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { Zap, ShieldCheck, Trophy, RefreshCw, X, ArrowRight } from 'lucide-react';
import { ACADEMY_DB } from './AcademyData'; 

export default function AcademyTest() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [testFinished, setTestFinished] = useState(false);

  // Decodificamos y limpiamos el nombre de la categoría
  const decodedCategory = category ? decodeURIComponent(category) : "Generico";
  const questions = ACADEMY_DB[decodedCategory] || ACADEMY_DB["Generico"];
  
  // Puntos: 150 para genérico, 250 para especialización técnica
  const puntosAOtorgar = decodedCategory === "Generico" ? 150 : 250;

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
        // Normalización unificada para que coincida exactamente con el Dashboard
        const cleanCat = decodedCategory.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s/]/g, '_');
        const courseId = decodedCategory === "Generico" 
          ? "cert_generico" 
          : `cert_${cleanCat}`;
        
        await setDoc(doc(db, "professionals", user.uid), {
          score: increment(puntosAOtorgar),
          completedCourses: arrayUnion(courseId),
          verified: true,
          uid: user.uid,
          lastAchievement: serverTimestamp()
        }, { merge: true });

      } catch (error) { console.error("Error Firebase Academy:", error); }
    }
    setTestFinished(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] fixed inset-0 z-[100] flex items-center justify-center p-4 antialiased font-['Open_Sans'] text-white overflow-hidden uppercase">
      
      {/* Fondo Animado */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ x: [-20, 20], y: [-20, 20] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-white/[0.02] backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden z-10"
      >
        <button onClick={() => navigate('/academy')} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-all z-20">
          <X size={20} />
        </button>

        <div className="p-8 md:p-14">
          {!testFinished ? (
            <div className="space-y-10">
              <header className="text-center space-y-2">
                <h1 className="text-xl md:text-2xl font-['Poppins'] tracking-[0.05em] leading-none">CLASSCODE</h1>
                <p className="text-purple-400 text-[8px] font-black tracking-[0.4em]">EXAMEN DE MÓDULO • {decodedCategory.replace('_', ' ')}</p>
              </header>

              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[9px] text-gray-600 font-black tracking-[0.3em]">PREGUNTA {currentStep + 1} / {questions.length}</span>
                  <div className="flex gap-2">
                    {questions.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/5'}`} />
                    ))}
                  </div>
                </div>
                <h3 className="text-[20px] md:text-[24px] font-['Poppins'] font-light leading-snug tracking-tight text-white/90 normal-case">
                  {questions[currentStep].q}
                </h3>
              </div>

              <div className="grid gap-3 pt-4">
                {questions[currentStep].a.map((ans, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleAnswer(idx === questions[currentStep].correct)} 
                    className="w-full py-5 px-8 text-left bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] md:text-[11px] font-bold tracking-widest hover:bg-purple-600/10 hover:border-purple-500/30 transition-all group flex justify-between items-center"
                  >
                    <span className="normal-case opacity-70 group-hover:opacity-100">{ans}</span>
                    <ArrowRight size={14} className="text-purple-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-10 py-4">
              {score === questions.length ? (
                <div className="space-y-8">
                  <div className="relative inline-block">
                    <Trophy size={64} className="text-amber-400 mx-auto" />
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-[#111]">
                      <ShieldCheck size={16} className="text-white" />
                    </motion.div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-['Poppins'] tracking-[0.2em]">CERTIFICADO</h2>
                    <p className="text-gray-500 text-[10px] tracking-widest font-black max-w-[250px] mx-auto leading-relaxed">
                      HAS COMPLETADO EL MÓDULO CON ÉXITO. TUS PUNTOS HAN SIDO SUMADOS.
                    </p>
                  </div>
                  <button onClick={() => navigate('/academy')} className="w-full py-5 bg-white text-black rounded-2xl text-[10px] font-black tracking-[0.4em] shadow-2xl hover:bg-gray-200 transition-all uppercase">
                    VOLVER A ACADEMY
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-[18px] font-['Poppins'] tracking-[0.2em]">REPASO NECESARIO</h2>
                    <p className="text-[9px] text-gray-500 font-black tracking-widest leading-relaxed uppercase">
                      Debes acertar todas las preguntas para certificar este módulo.
                    </p>
                  </div>
                  <div className="space-y-4 pt-4">
                    <button onClick={() => window.location.reload()} className="w-full py-5 bg-purple-600 text-white rounded-2xl text-[10px] font-black tracking-[0.4em] shadow-xl shadow-purple-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all">
                      <RefreshCw size={14}/> REINTENTAR TEST
                    </button>
                    <button onClick={() => navigate('/academy')} className="w-full py-4 text-gray-600 hover:text-white text-[9px] font-black tracking-widest uppercase">VOLVER</button>
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