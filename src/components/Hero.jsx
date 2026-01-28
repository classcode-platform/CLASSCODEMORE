import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = ({ categories, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  return (
    <nav className="w-full px-6 py-4 border-b border-white/5 bg-[#282929] sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <div className="text-[14px] tracking-[0.35em] uppercase font-['Poppins'] text-white leading-none">CLASSCODE</div>
            <p className="text-purple-400 text-[8px] uppercase tracking-[0.3em] font-bold mt-1">ACADEMY</p>
          </div>
          <div className="hidden lg:flex gap-1.5 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveTab(cat)} className={`px-4 py-1.5 rounded-full text-[8px] font-bold tracking-[0.1em] uppercase transition-all ${activeTab === cat ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}>{cat}</button>
            ))}
          </div>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-[9px] tracking-[0.35em] uppercase text-gray-400 hover:text-white flex items-center gap-2 font-bold font-['Poppins']"><ArrowLeft size={11}/> VOLVER</button>
      </div>
    </nav>
  );
};
export default Hero;

