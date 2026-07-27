import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Sparkles, Play } from 'lucide-react';

export default function PublicLiveGallery({ onBack }) {
  // Showcase estático con imágenes de distintas proporciones (variedad de aspect ratios)
  const [showcaseItems] = useState([
    { 
      id: 1, 
      title: 'BAKSTAGE 01', 
      category: 'PRODUCCIÓN', 
      type: 'image',
      aspect: 'aspect-[3/4]', // Vertical alta
      url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80' 
    },
    { 
      id: 2, 
      title: 'RODAJE EN ESTUDIO', 
      category: 'FILMACIÓN', 
      type: 'image',
      aspect: 'aspect-[16/9]', // Horizontal wide
      url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80' 
    },
    { 
      id: 3, 
      title: 'SHOW EN VIVO', 
      category: 'ESCÉNICO', 
      type: 'image',
      aspect: 'aspect-square', // Cuadrada
      url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80' 
    },
    { 
      id: 4, 
      title: 'EDITORIAL DE MODA', 
      category: 'ESTILISMO', 
      type: 'image',
      aspect: 'aspect-[4/5]', // Vertical intermedia
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80' 
    },
    { 
      id: 5, 
      title: 'DIRECCIÓN DE ARTE', 
      category: 'CINE', 
      type: 'image',
      aspect: 'aspect-[16/9]', // Horizontal
      url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80' 
    },
    { 
      id: 6, 
      title: 'BACKSTAGE SHOW', 
      category: 'FOTOGRAFÍA', 
      type: 'image',
      aspect: 'aspect-[3/4]', // Vertical
      url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80' 
    }
  ]);

  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['Open_Sans'] flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      
      {/* HEADER DE LA GALERÍA */}
      <header className="px-6 py-6 md:px-12 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-white/5">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 hover:text-white transition-all"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          VOLVER AL INICIO
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
          <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-gray-400">SHOWCASE / PROMO</span>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12 w-full flex-grow">
        
        {/* TÍTULO PRINCIPAL ESTILO IA SHOWCASE */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-purple-400 text-[9px] font-bold tracking-[0.3em] uppercase">
            <Sparkles size={12} /> CLASSCODE VISUALS
          </div>
          <h1 className="text-4xl md:text-6xl font-normal font-['Poppins'] tracking-[0.05em] uppercase text-white">
            LIVE GALLERY
          </h1>
          <p className="text-gray-400 text-xs md:text-sm font-light leading-relaxed">
            Explorá una selección exclusiva de nuestras producciones, rodajes y el detrás de escena del talento argentino.
          </p>
        </div>

        {/* GRILLA MASONRY DINÁMICA CON DIFERENTES PROPORCIONES */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {showcaseItems.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              onClick={() => setSelectedItem(item)}
              className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer shadow-2xl hover:border-purple-500/50 transition-all duration-500"
            >
              {/* Contenedor de la imagen respetando su proporción */}
              <div className={`w-full ${item.aspect} overflow-hidden bg-[#121215]`}>
                <img 
                  src={item.url} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
              </div>

              {/* Overlay minimalista al hacer hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <span className="text-[9px] uppercase font-bold tracking-[0.3em] text-purple-400 mb-1">
                  {item.category}
                </span>
                <h3 className="text-sm font-['Poppins'] tracking-[0.05em] uppercase text-white font-medium">
                  {item.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>

      </main>

      {/* FOOTER SIMPLE */}
      <footer className="border-t border-white/5 py-8 text-center text-gray-600 text-[9px] uppercase tracking-[0.3em]">
        CLASSCODE • ARGENTINA © 2026
      </footer>

      {/* MODAL LIGHTBOX PARA AMPLIAR */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full bg-[#121215] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 p-2.5 text-gray-400 hover:text-white rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md transition-all"
              >
                <X size={18} />
              </button>

              <div className="w-full flex-grow overflow-hidden flex items-center justify-center bg-black/50 p-2">
                <img 
                  src={selectedItem.url} 
                  alt={selectedItem.title}
                  className="max-h-[70vh] w-auto object-contain rounded-xl"
                />
              </div>

              <div className="p-6 bg-[#0e0e11] border-t border-white/1odd flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-[0.3em] text-purple-400">
                    {selectedItem.category}
                  </span>
                  <h3 className="text-lg font-['Poppins'] tracking-[0.05em] uppercase text-white font-medium mt-0.5">
                    {selectedItem.title}
                  </h3>
                </div>
                <span className="text-[9px] tracking-widest text-gray-500 uppercase">
                  CLASSCODE SHOWCASE
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}