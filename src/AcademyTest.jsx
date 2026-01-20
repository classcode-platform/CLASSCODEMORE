import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // <--- IMPORTANTE: useParams
import { db, auth } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, CheckCircle, XCircle, Zap, AlertCircle } from 'lucide-react';
import { ACADEMY_DB } from './AcademyData'; 

export default function AcademyTest() { // <--- Quitamos la prop category
  const { category } = useParams(); // <--- Capturamos la categoría de la URL directamente
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [testFinished, setTestFinished] = useState(false);
  const navigate = useNavigate();

  // Limpieza de categoría para evitar errores de tildes o símbolos en la URL
  const decodedCategory = category ? decodeURIComponent(category) : "Generico";
  const questions = ACADEMY_DB[decodedCategory] || ACADEMY_DB["Generico"];

  const handleAnswer = (isCorrect) => {
    let newScore = score;
    if (isCorrect) newScore = score + 1;
    setScore(newScore);
    
    if (currentStep + 1 < questions.length) {
      setCurrentStep(currentStep + 1);
    } else {
      finishTest(newScore);
    }
  };

  const finishTest = async (finalCorrect) => {
    const finalPercent = (finalCorrect / questions.length) * 100;
    const approved = finalPercent >= 80;
    
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, "professionals", user.uid), {
          verified: approved,
          testScore: finalPercent,
          lastTestDate: new Date()
        });
      } catch (error) { console.error("Error guardando progreso:", error); }
    }
    setTestFinished(true);
  };

  const logoStyle = { fontFamily: 'Poppins', fontWeight: 400, letterSpacing: '0.35em' };

  // Pantalla de error por si no hay preguntas cargadas
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#282929] flex items-center justify-center p-6 text-white text-center">
        <div className="space-y-6">
          <AlertCircle size={48} className="text-amber-500 mx-auto" />
          <p className="uppercase tracking-widest text-[10px]">No se encontraron preguntas para: {decodedCategory}</p>
          <button onClick={() => navigate('/dashboard')} className="text-purple-400 font-bold text-[9px] uppercase border border-purple-400/20 px-6 py-2 rounded-full">Volver al Dashboard</button>
        </div>
      </div>
    );
  }

  if (testFinished) {
    const approved = (score / questions.length) * 100 >= 80;
    return (
      <div className="min-h-screen bg-[#282929] flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-[#1e1e1e] p-12 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
          {approved ? (
            <>
              <CheckCircle size={60} className="text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold uppercase font-['Poppins'] tracking-widest">¡Nivelado!</h2>
              <p className="text-gray-400 text-sm italic font-light">Tu perfil ahora cuenta con el sello de confianza CLASSCODE®.</p>
            </>
          ) : (
            <>
              <XCircle size={60} className="text-red-500 mx-auto" />
              <h2 className="text-2xl font-bold uppercase font-['Poppins'] tracking-widest">No aprobado</h2>
              <p className="text-gray-400 text-sm italic font-light">Te invitamos a tomar el curso gratuito de nivelación para mejorar tu técnica.</p>
            </>
          )}
          <button onClick={() => navigate('/dashboard')} className="w-full py-4 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] border border-white/10 mt-4 hover:bg-white/10 transition-all shadow-xl">Volver al Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#282929] text-white font-['Open_Sans'] p-8 md:p-20 flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-12">
        <header className="text-center space-y-4">
          <h1 style={logoStyle} className="text-[14px]">CLASSCODE® ACADEMY</h1>
          <p className="text-purple-400 text-[9px] uppercase font-bold tracking-[0.35em]">Examen de Nivelación: {decodedCategory}</p>
        </header>

        <div className="bg-[#1e1e1e] p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-10">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">Pregunta {currentStep + 1} de {questions.length}</span>
              <span className="text-[8px] text-purple-500 font-bold uppercase tracking-widest">Mínimo 80% para aprobar</span>
            </div>
            <h3 className="text-xl font-light leading-relaxed">{questions[currentStep].q}</h3>
          </div>

          <div className="grid gap-4">
            {questions[currentStep].a.map((ans, idx) => (
              <button 
                key={idx}
                onClick={() => handleAnswer(idx === questions[currentStep].correct)}
                className="w-full py-5 px-8 text-left bg-black/20 border border-white/5 rounded-2xl text-[12px] uppercase tracking-widest hover:bg-purple-600/10 hover:border-purple-500/30 transition-all font-bold group flex justify-between items-center"
              >
                <span>{ans}</span>
                <Zap size={14} className="text-transparent group-hover:text-purple-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
