import React, { useEffect } from 'react';
import { X, Brain, Trophy, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QuizModal = ({ 
  course, 
  onClose, 
  quizMode, 
  setQuizMode, 
  currentQuestion, 
  handleAnswer, 
  showResult, 
  score, 
  handleSaveProgress 
}) => {
  
  // Estética oficial CLASSCODE
  const violetBtn = "w-full md:w-auto py-4 px-8 rounded-lg bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] text-white font-bold flex items-center justify-center gap-2 text-[10px] tracking-[0.35em] uppercase hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20";

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 overflow-y-auto antialiased">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full bg-[#1e1e1e] rounded-[2rem] p-6 md:p-8 border border-white/10 relative shadow-2xl my-auto overflow-hidden"
      >
        {/* Efecto de luz de fondo CLASSCODE */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <button onClick={onClose} className="absolute top-4 right-4 md:top-8 md:right-8 text-gray-500 hover:text-white z-20 p-2 bg-black/20 rounded-full">
            <X size={20}/>
        </button>
        
        {!quizMode && (
          <div className="animate-in fade-in duration-500 relative z-10">
            <div className="aspect-video bg-black rounded-3xl mb-8 overflow-hidden border border-white/5 shadow-2xl relative">
              <iframe 
                src={course.videoSrc} 
                className="absolute inset-0 w-full h-full" 
                frameBorder="0" 
                allow="autoplay; fullscreen"
              ></iframe>
            </div>
                        
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
              <div className="w-full md:w-2/3">
                <div className="flex items-center gap-2 mb-2 text-purple-400">
                   <ShieldCheck size={14} />
                   <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Módulo de Nivelación</span>
                </div>
                <h2 className="text-xl md:text-3xl font-normal font-['Poppins'] leading-tight tracking-tight text-white">{course.title}</h2>
                <p className="text-gray-400 text-xs md:text-sm mt-3 font-light leading-relaxed">{course.description}</p>
              </div>
              
              {course.hasQuiz && (
                <button onClick={() => setQuizMode(true)} className={violetBtn}>
                  RENDIR EXAMEN <Brain size={14}/>
                </button>
              )}
            </div>
          </div>
        )}

        {quizMode && !showResult && (
          <div className="py-8 md:py-16 animate-in slide-in-from-right duration-500 relative z-10 max-w-2xl mx-auto">
            <p className="text-purple-400 text-[10px] tracking-[0.4em] font-black mb-6 uppercase text-center">
                Pregunta {currentQuestion + 1} de {course.questions.length}
            </p>
            <h3 className="text-xl md:text-3xl font-normal text-center mb-12 leading-tight font-['Poppins']">
              {course.questions[currentQuestion].q}
            </h3>
            <div className="grid gap-4">
              {course.questions[currentQuestion].options.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => handleAnswer(i)} 
                  className="w-full p-5 text-left rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/50 hover:bg-white/[0.07] transition-all text-sm font-light tracking-wide flex justify-between items-center group"
                >
                  {opt}
                  <div className="w-5 h-5 rounded-full border border-white/10 group-hover:border-purple-500/50 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {showResult && (
          <div className="text-center py-12 md:py-20 animate-in zoom-in duration-500 relative z-10">
            {score === course.questions.length ? (
              <div className="space-y-8">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full"></div>
                  <Trophy size={80} className="text-yellow-400 mx-auto relative z-10"/>
                </div>
                <div>
                  <h2 className="text-3xl md:text-5xl font-normal mb-4 uppercase tracking-tighter font-['Poppins']">¡Nivel Superado!</h2>
                  <p className="text-gray-400 text-xs uppercase tracking-[0.3em] font-light">Has demostrado ser un Talento nivelado para CLASSCODE®</p>
                </div>
                <button onClick={handleSaveProgress} className={violetBtn + " mx-auto"}>
                  RECLAMAR CERTIFICADO Y BADGE <ArrowRight size={14}/>
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <AlertCircle size={80} className="text-red-500/50 mx-auto mb-6"/>
                <h2 className="text-2xl md:text-3xl font-normal mb-4 uppercase tracking-tighter font-['Poppins'] text-red-200">Revisión Necesaria</h2>
                <p className="text-gray-400 text-[10px] mb-10 uppercase tracking-[0.35em] leading-relaxed max-w-sm mx-auto font-light">
                  El estándar de calidad CLASSCODE requiere el 100% de respuestas correctas. Repasa el material y vuelve a intentarlo.
                </p>
                <button onClick={onClose} className="w-full md:w-auto px-10 py-5 rounded-xl border border-white/10 text-[10px] tracking-[0.4em] uppercase font-bold hover:bg-white/5 transition-all text-white">
                  VOLVER A LAS CLASES
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default QuizModal;
