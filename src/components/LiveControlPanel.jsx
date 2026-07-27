import React from 'react';
import { QrCode, Play, Pause, Power, Link as LinkIcon, Share2, Monitor, Trash2 } from 'lucide-react';
import { updateDoc, doc, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

export default function LiveControlPanel({ 
  currentEvent, 
  events, 
  selectedEventIndex, 
  setSelectedEventIndex, 
  onTogglePause, 
  onConfirmFinish, 
  onCopyGuestLink, 
  onShareTV, 
  onOpenTV, 
  onOpenCreate, 
  setPreviewImage 
}) {
  return (
    <section className="bg-[#0c0c0e] border border-white/10 rounded-[2.5rem] p-6 md:p-10 space-y-8 shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h3 className="text-[9px] text-gray-400 tracking-[0.4em]">Live Control Panel</h3>
          <p className="text-[8px] text-gray-500 tracking-widest mt-1">Gestionando evento actual en tiempo real</p>
        </div>

        {events.length > 1 && (
          <select 
            value={selectedEventIndex} 
            onChange={(e) => setSelectedEventIndex(Number(e.target.value))}
            className="bg-black border border-white/10 text-white text-[9px] tracking-widest px-4 py-2.5 rounded-xl outline-none"
          >
            {events.map((ev, idx) => (
              <option key={ev.id} value={idx}>{ev.eventName || ev.title}</option>
            ))}
          </select>
        )}
      </div>

      {currentEvent ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          <div className="bg-black/40 p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white p-3 rounded-2xl shadow-2xl flex-shrink-0">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.classcode.com.ar/guest-upload/${currentEvent.eventCode || currentEvent.id}`} 
                alt="QR" 
                className="w-24 h-24 md:w-28 md:h-28 block" 
              />
              <p className="text-black text-[5px] mt-1 tracking-[0.2em] text-center">Scan to upload</p>
            </div>
            
            <div className="flex-1 space-y-4 text-center lg:text-left w-full leading-none">
              <h4 className="text-[18px] md:text-[20px] font-['Poppins'] text-white">{currentEvent.eventName || currentEvent.title}</h4>
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <span className={`w-2 h-2 rounded-full animate-pulse ${currentEvent.status === 'paused' ? 'bg-amber-400' : 'bg-green-400'}`}></span>
                <p className="text-[9px] tracking-[0.2em] text-gray-400">{currentEvent.eventCode || 'ACTIVO'}</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center lg:justify-start pt-2">
                <button onClick={onTogglePause} className="w-11 h-11 flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/30 text-white rounded-xl transition-all" title="Pausar / Activar">
                   {currentEvent.status === 'paused' ? <Play size={15}/> : <Pause size={15}/>}
                </button>
                <button onClick={onConfirmFinish} className="w-11 h-11 flex items-center justify-center bg-white/5 border border-white/10 text-gray-400 hover:text-amber-400 rounded-xl transition-all" title="Finalizar"><Power size={15}/></button>
                <button onClick={onCopyGuestLink} className="w-11 h-11 flex items-center justify-center bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-xl transition-all" title="Copiar Link"><LinkIcon size={15}/></button>
                <button onClick={onShareTV} className="w-11 h-11 flex items-center justify-center bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-xl transition-all" title="Compartir"><Share2 size={15}/></button>
                <button onClick={onOpenTV} className="w-11 h-11 flex items-center justify-center bg-white text-black rounded-xl hover:bg-gray-200 transition-all" title="Pantalla TV"><Monitor size={15}/></button>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h4 className="text-[9px] text-gray-400 tracking-[0.4em]">Live Gallery</h4>
              <span className="text-[9px] text-white bg-white/5 border border-white/10 px-3 py-1 rounded-full">{currentEvent.liveGallery?.length || 0} Items</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
              {currentEvent.liveGallery?.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-white/10 cursor-pointer" onClick={() => setPreviewImage(url)}>
                  <img src={url} className="w-full h-full object-cover" alt="Upload" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center pb-2">
                    <button 
                      onClick={async (e) => { 
                        e.stopPropagation(); 
                        await updateDoc(doc(db, "events", currentEvent.id), { liveGallery: arrayRemove(url) }); 
                      }} 
                      className="p-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center opacity-40 border border-dashed border-white/10 rounded-3xl flex flex-col items-center gap-4 bg-black/20">
           <QrCode size={40} strokeWidth={1} className="text-gray-500"/>
           <button onClick={onOpenCreate} className="px-6 py-3 bg-white text-black rounded-xl text-[9px] tracking-widest hover:bg-gray-200 transition-all">CREAR PRIMER EVENTO</button>
        </div>
      )}
    </section>
  );
}