import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function LiveGallery({ onClose }) {
  const [selectedItem, setSelectedItem] = useState(null);

  const items = [
    { id: 1, aspect: 'aspect-[3/4]', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80' },
    { id: 2, aspect: 'aspect-[16/9]', url: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80' },
    { id: 3, aspect: 'aspect-square', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80' },
    { id: 4, aspect: 'aspect-[4/5]', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80' },
    { id: 5, aspect: 'aspect-[16/9]', url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80' },
    { id: 6, aspect: 'aspect-[3/4]', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] bg-[#0a0a0a] overflow-y-auto flex flex-col"
    >
      <div className="sticky top-0 z-50 px-4 py-4 md:px-8 max-w-7xl mx-auto w-full flex justify-end pointer-events-none">
        <button 
          onClick={onClose}
          className="pointer-events-auto p-2.5 rounded-full bg-black/70 hover:bg-black text-white transition-all backdrop-blur-md cursor-pointer border border-white/20 shadow-2xl flex items-center justify-center"
        >
          <X size={18} />
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-12 pt-2 w-full flex-grow">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {items.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => setSelectedItem(item)}
              className="break-inside-avoid group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer shadow-2xl hover:border-white/30 transition-all duration-500"
            >
              <div className={`w-full ${item.aspect} overflow-hidden bg-[#121215]`}>
                <img 
                  src={item.url} 
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95 group-hover:opacity-100"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-6xl w-full flex items-center justify-center"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute -top-12 right-0 p-2.5 text-gray-400 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
              <img 
                src={selectedItem.url} 
                alt=""
                className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}