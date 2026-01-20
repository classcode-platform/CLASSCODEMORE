import React from 'react';
import { Play, CheckCircle, Lock } from 'lucide-react';

const CourseSection = ({ courses, completed, onOpenCourse, activeTab }) => {
  const filtered = activeTab === 'Todos' ? courses : courses.filter(c => c.category === activeTab);
  const certs = filtered.filter(c => c.level === 1);
  const specs = filtered.filter(c => c.level > 1);

  const Card = ({ course }) => {
    const isDone = completed.includes(course.id);
    const isLocked = course.level > 1 && !completed.some(id => id.startsWith('cert_') && courses.find(x => x.id === id).category === course.category);

    return (
      <div onClick={() => !isLocked && onOpenCourse(course)} className={`group bg-[#1e1e1e] rounded-[2rem] overflow-hidden border transition-all duration-500 ${isDone ? 'border-green-500/20' : isLocked ? 'opacity-40 grayscale cursor-not-allowed border-white/5' : 'border-white/5 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer'}`}>
        <div className="aspect-video bg-black flex items-center justify-center relative">
          {isLocked ? <Lock size={24} className="text-gray-600" /> : isDone ? <CheckCircle size={40} className="text-green-500/40" /> : <div className="bg-white/5 p-4 rounded-full backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform"><Play size={20} className="text-white fill-white ml-0.5" /></div>}
        </div>
        <div className="p-8">
          <p className="text-[8px] text-purple-500 font-bold uppercase tracking-[0.3em] mb-2 font-['Poppins']">{course.category}</p>
          <h4 className={`text-lg font-bold mb-6 font-['Poppins'] leading-tight ${isLocked ? 'text-gray-600' : 'text-white'}`}>{course.title}</h4>
          <div className="flex justify-between items-center pt-5 border-t border-white/5 text-[9px] font-bold uppercase tracking-widest font-['Open_Sans']">
            <span className="text-gray-600">{course.duration}</span>
            <span className={isDone ? 'text-green-600' : 'text-purple-500'}>{isDone ? 'COMPLETO' : `+${course.points} PTS`}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="w-full px-8 py-10 bg-[#282929]">
      <div className="max-w-[1600px] mx-auto space-y-12">
        {certs.length > 0 && (
          <div>
            <h3 className="text-[9px] font-bold text-gray-500 tracking-[0.5em] uppercase mb-6 font-['Poppins']">Nivel 1: Certificaciones CAP</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{certs.map(c => <Card key={c.id} course={c} />)}</div>
          </div>
        )}
        {specs.length > 0 && (
          <div>
            <h3 className="text-[9px] font-bold text-gray-500 tracking-[0.5em] uppercase mb-6 font-['Poppins']">Nivel 2: Especializaciones</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">{specs.map(c => <Card key={c.id} course={c} />)}</div>
          </div>
        )}
      </div>
    </section>
  );
};
export default CourseSection;
