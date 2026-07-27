import React, { useState } from 'react';

export default function PublicLiveGallery({ onBack }) {
  // Simulación de fotos de la galería pública (podés conectarlo luego a tu base de datos o API)
  const [photos] = useState([
    { id: 1, title: 'Backstage Backstage', category: 'Producción', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80' },
    { id: 2, title: 'Rodaje en Estudio', category: 'Filmación', url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80' },
    { id: 3, title: 'Evento en Vivo', category: 'Shows', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80' },
    { id: 4, title: 'Sesión de Retratos', category: 'Fotografía', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80' },
  ]);

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 font-['Poppins']">
      {/* Cabecera de la sección */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <button 
            onClick={onBack}
            className="text-sm text-neutral-400 hover:text-white transition-colors mb-2 flex items-center gap-2"
          >
            ← Volver al Inicio
          </button>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-[0.05em] uppercase">
            Live Gallery <span className="font-light text-neutral-400 text-lg">Public</span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Explorá el detrás de escena y los mejores momentos de nuestras producciones.</p>
        </div>
      </div>

      {/* Grilla de Fotos */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <div 
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="group relative bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden cursor-pointer shadow-lg hover:border-neutral-600 transition-all duration-300"
          >
            <div className="aspect-video w-full overflow-hidden bg-neutral-950">
              <img 
                src={photo.url} 
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
              />
            </div>
            <div className="p-4 flex justify-between items-center bg-neutral-900/90 backdrop-blur-sm">
              <div>
                <h3 className="font-medium text-sm tracking-[0.05em]">{photo.title}</h3>
                <span className="text-xs text-neutral-400 font-light">{photo.category}</span>
              </div>
              <span className="text-xs border border-neutral-700 px-2 py-1 rounded text-neutral-300 group-hover:bg-white group-hover:text-black transition-colors">
                Ver
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para ampliar imagen */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50"
        >
          <div className="relative max-w-4xl w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden p-4">
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-neutral-800/80 rounded-full p-2 z-10"
            >
              ✕
            </button>
            <img 
              src={selectedPhoto.url} 
              alt={selectedPhoto.title}
              className="w-full max-h-[75vh] object-contain rounded-lg mb-4"
            />
            <div className="flex justify-between items-center px-2">
              <h3 className="font-medium tracking-[0.05em] text-lg">{selectedPhoto.title}</h3>
              <span className="text-xs text-neutral-400">{selectedPhoto.category}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}