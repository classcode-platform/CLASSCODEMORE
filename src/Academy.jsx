import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import Hero from './components/Hero';
import QuizModal from './components/QuizModal';
import CourseSection from './components/CourseSection'; 

export default function Academy() {
  const navigate = useNavigate();
  const location = useLocation();
  const [completed, setCompleted] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Todos');

  const [quizMode, setQuizMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // --- LISTA DE CURSOS ---
  const courses = [
    // --- NIVEL 1 ---
    { 
      id: 'cert_foto_trilogia', 
      category: 'Fotografía', 
      level: 1, 
      title: 'INTRODUCCIÓN A LA FOTOGRAFÍA', 
      author: 'CLASSCODE® Board', 
      duration: '15m', 
      points: 200, 
      videoSrc: 'https://player.vimeo.com/video/1156357123', 
      hasQuiz: true, 
      isRequiredForPro: true, 
      questions: [
        {q: "¿Cuáles son los 3 elementos del Triángulo de Exposición?", options: ["Luz, Cámara y Acción", "ISO, Diafragma y Velocidad", "Enfoque, Encuadre y Zoom"], correct: 1},
        {q: "En composición, ¿qué regla divide la imagen en 9 secciones?", options: ["Proporción Áurea", "Regla de los Tercios", "Simetría Central"], correct: 1},
        {q: "¿Qué tipo de luz produce sombras marcadas y bordes definidos?", options: ["Luz Suave (Difusa)", "Luz Dura (Directa)", "Luz de Rebote"], correct: 1}
      ] 
    },
    { 
      id: 'curso_triangulo', 
      category: 'Fotografía', 
      level: 1, 
      title: 'CLASE MAESTRA: TRIÁNGULO DE EXPOSICIÓN', 
      author: 'CLASSCODE® Academy', 
      duration: '20m', 
      points: 50, 
      videoSrc: 'https://player.vimeo.com/video/1156296481', 
      hasQuiz: true, 
      isRequiredForPro: false,
      questions: [
        {q: "Para congelar el movimiento de un sujeto rápido, ¿qué usas?", options: ["Velocidad de Obturación Alta", "ISO Bajo", "Diafragma Cerrado"], correct: 0},
        {q: "Si hay poca luz en el ambiente, ¿qué ajuste introduce 'ruido' en la foto?", options: ["Abrir Diafragma", "Subir ISO", "Bajar Velocidad"], correct: 1}
      ] 
    },
    // --- NIVEL 2 ---
    { 
      id: 'curso_composicion', 
      category: 'Fotografía', 
      level: 2, 
      title: 'CLASE MAESTRA: COMPOSICIÓN VISUAL', 
      author: 'CLASSCODE® Academy', 
      duration: 'PRÓXIMAMENTE', 
      points: 50, 
      videoSrc: 'https://player.vimeo.com/video/1151434449', 
      hasQuiz: true, 
      isRequiredForPro: false,
      questions: [
        {q: "¿Qué logran las 'Líneas Guía' en una foto?", options: ["Dividir la imagen", "Dirigir la mirada del espectador", "Enfocar el fondo"], correct: 1}
      ] 
    },
    { 
      id: 'curso_iluminacion', 
      category: 'Fotografía', 
      level: 2, 
      title: 'CLASE MAESTRA: ILUMINACIÓN', 
      author: 'CLASSCODE® Academy', 
      duration: 'PRÓXIMAMENTE', 
      points: 50, 
      videoSrc: 'https://player.vimeo.com/video/1151434449', 
      hasQuiz: true, 
      isRequiredForPro: false,
      questions: [
        {q: "¿Qué esquema de luz crea un triángulo en la mejilla opuesta?", options: ["Mariposa (Paramount)", "Rembrandt", "Split (Lateral)"], correct: 1}
      ] 
    },
    // --- EXTRAS ---
    { 
      id: 'cert_video', 
      category: 'Video', 
      level: 1, 
      title: 'CERTIFICACIÓN CAP: FILMMAKING', 
      author: 'CLASSCODE® Board', 
      duration: '50m', 
      points: 100, 
      videoSrc: 'https://player.vimeo.com/video/1154818731', 
      hasQuiz: true, 
      isRequiredForPro: true, 
      questions: [{q: "¿Qué es un jump-cut?", options: ["Error de edición", "Recurso Narrativo"], correct: 1}] 
    },
    { 
      id: 'cert_mua', 
      category: 'Maquillaje', 
      level: 1, 
      title: 'CERTIFICACIÓN CAP: MAKEUP HD', 
      duration: '40m', 
      points: 100, 
      videoSrc: 'https://player.vimeo.com/video/1154822959', 
      hasQuiz: true, 
      isRequiredForPro: true, 
      questions: [{q: "¿Base ideal para cámara 4K?", options: ["Acabado Mate", "Acabado Satinado/Natural"], correct: 1}] 
    },
  ];

  const categories = ['Todos', 'Fotografía', 'Video', 'Diseño', 'Maquillaje', 'Sonido', 'Marketing', 'ARTE DIGITAL'];

  useEffect(() => {
    if (location.state?.filter) setActiveTab(location.state.filter);
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const proSnap = await getDoc(doc(db, "professionals", user.uid));
        if (proSnap.exists()) setCompleted(proSnap.data().completedCourses || []);
      }
      setLoading(false);
    };
    fetchUserData();
  }, [location]);

  // --- FUNCIÓN CORREGIDA: AHORA SUMA PUNTOS (increment) ---
  const handleUpgradeToPro = async () => {
    const user = auth.currentUser;
    try {
      await updateDoc(doc(db, "users", user.uid), { role: 'professional' });
      await setDoc(doc(db, "professionals", user.uid), {
        email: user.email,
        // AQUÍ ESTÁ EL ARREGLO: USAMOS increment() EN LUGAR DE UN NÚMERO FIJO
        academyPoints: increment(activeCourse.points), 
        status: 'active',
        completedCourses: arrayUnion(activeCourse.id),
        createdAt: new Date().toISOString()
      }, { merge: true });
      navigate('/dashboard');
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="min-h-screen bg-[#282929] flex items-center justify-center text-white text-[10px] tracking-[0.35em] font-['Poppins']">CARGANDO ACADEMY...</div>;

  return (
    <div className="min-h-screen bg-[#282929] text-white font-['Open_Sans'] antialiased">
      <Hero categories={categories} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <CourseSection 
        courses={courses} 
        completed={completed} 
        activeTab={activeTab}
        onOpenCourse={(c) => {
          setQuizMode(false); setCurrentQuestion(0); setScore(0); setShowResult(false);
          setActiveCourse(c);
        }} 
      />

      {activeCourse && (
        <QuizModal 
          course={activeCourse} quizMode={quizMode} setQuizMode={setQuizMode} currentQuestion={currentQuestion}
          handleAnswer={(i) => {
            if (i === activeCourse.questions[currentQuestion].correct) setScore(score + 1);
            if (currentQuestion + 1 < activeCourse.questions.length) setCurrentQuestion(currentQuestion + 1);
            else setShowResult(true);
          }}
          showResult={showResult} score={score}
          handleSaveProgress={activeCourse.isRequiredForPro ? handleUpgradeToPro : async () => {
            const user = auth.currentUser;
            await updateDoc(doc(db, "professionals", user.uid), { completedCourses: arrayUnion(activeCourse.id), academyPoints: increment(activeCourse.points) });
            setCompleted([...completed, activeCourse.id]); setActiveCourse(null);
          }}
          onClose={() => setActiveCourse(null)}
        />
      )}
    </div>
  );
}
