import React, { useEffect } from 'react';
import { X, Brain, Trophy, AlertCircle } from 'lucide-react';

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
  
  // ESTILO BOTÓN RESPONSIVE: 'w-full' en móvil (ocupa todo el ancho), 'md:w-auto' en PC
  const violetBtn = "w-full md:w-auto py-4 px-8 rounded-lg bg-gradient-to-r from-[#8A2BE2] to-[#4B0082] text-white font-bold flex items-center justify-center gap-2 text-[10px] tracking-[0.35em] uppercase hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20";

  useEffect(() => {
    // Bloquea el scroll de la página de fondo cuando el modal está abierto
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    // 'overflow-y-auto' permite scrollear si el contenido es muy alto en móviles
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="max-w-4xl w-full bg-[#1e1e1e] rounded-[2rem] p-6 md:p-8 border border-white/10 relative shadow-2xl my-auto">
        
        {/* Botón Cerrar (X) */}
        <button onClick={onClose} className="absolute top-4 right-4 md:top-8 md:right-8 text-gray-500 hover:text-white z-10 p-2 bg-black/20 rounded-full md:bg-transparent">
            <X size={20}/>
        </button>
        
        {!quizMode && (
          <div className="animate-in fade-in duration-300">
            {/* Video Container */}
            <div className="aspect-video bg-black rounded-2xl mb-6 overflow-hidden border border-white/5 shadow-2xl relative">
              <iframe src={course.videoSrc} className="absolute inset-0 w-full h-full" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture"></iframe>
            </div>
            
            {/* --- AQUÍ ESTABA EL ERROR VISUAL --- */}
            {/* Antes era solo flex, ahora es flex-col (columna) en móvil y flex-row (fila) en desktop */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="w-full md:w-2/3">
                <h2 className="text-xl md:text-2xl font-bold font-['Poppins'] leading-tight">{course.title}</h2>
                <p className="text-gray-400 text-xs md:text-sm mt-2 font-light">{course.description || 'Contenido educativo CLASSCODE®.'}</p>
              </div>
              
              {course.hasQuiz && (
                <button onClick={() => setQuizMode(true)} className={violetBtn}>
                  RENDIR EXAMEN <Brain size={14}/>
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODO QUIZ (Preguntas) */}
        {quizMode && !showResult && (
          <div className="py-4 md:py-10 animate-in slide-in-from-right duration-300">
            <p className="text-purple-400 text-[9px] md:text-[10px] tracking-[0.3em] font-bold mb-4 uppercase">
                Pregunta {currentQuestion + 1} de {course.questions.length}
            </p>
            <h3 className="text-lg md:text-2xl font-bold mb-8 leading-relaxed">{course.questions[currentQuestion].q}</h3>
            <div className="grid gap-3 md:gap-4">
              {course.questions[currentQuestion].options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(i)} className="w-full p-4 md:p-5 text-left rounded-xl md:rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/50 transition-all text-xs md:text-sm font-light active:bg-white/10">
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RESULTADO FINAL */}
        {showResult && (
          <div className="text-center py-8 md:py-12 animate-in zoom-in duration-300">
            {score === course.questions.length ? (
              <>
                <Trophy size={60} className="text-yellow-400 mx-auto mb-6 md:w-20 md:h-20"/>
                <h2 className="text-2xl md:text-3xl font-bold mb-6 uppercase tracking-tighter">¡Desafío Superado!</h2>
                <button onClick={handleSaveProgress} className={violetBtn + " mx-auto"}>RECLAMAR CERTIFICADO</button>
              </>
            ) : (
              <>
                <AlertCircle size={60} className="text-red-400 mx-auto mb-6 md:w-20 md:h-20"/>
                <h2 className="text-2xl md:text-3xl font-bold mb-6 uppercase tracking-tighter">Revisión Necesaria</h2>
                <p className="text-gray-400 text-xs mb-8 uppercase tracking-widest px-4">No te preocupes. Repasa las bases y vuelve a intentarlo.</p>
                <button onClick={onClose} className="w-full md:w-auto px-10 py-4 rounded-xl border border-white/20 text-[10px] tracking-[0.3em] uppercase font-bold hover:bg-white/5 transition-all">
                  IR A LAS CLASES DE REPASO
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizModal;