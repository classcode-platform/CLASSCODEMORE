import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Send, X, ShieldCheck, Zap, User } from 'lucide-react';

export default function BusinessChat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [chatData, setChatData] = useState(null);
  const scrollRef = useRef();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setCurrentUser(user);
      else navigate('/');
    });
    return () => unsubscribe();
  }, [navigate]);

  // LÓGICA PARA REPARAR EL "CONECTANDO..."
  useEffect(() => {
    const fetchAndSyncChatData = async () => {
      if (!chatId || !currentUser) return;
      
      const docRef = doc(db, "chats", chatId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setChatData(data);

        // Si el chat no tiene el email del cliente, lo vinculamos ahora
        if (!data.clientEmail) {
          // Buscamos quién es el participante que NO es el profesional actual
          const clientId = data.participants.find(id => id !== currentUser.uid);
          if (clientId) {
            const clientSnap = await getDoc(doc(db, "users", clientId));
            if (clientSnap.exists()) {
              const clientInfo = clientSnap.data();
              // Actualizamos el chat en Firebase para que el Dashboard lo lea bien
              await updateDoc(docRef, {
                clientEmail: clientInfo.email,
                clientPhoto: clientInfo.photoURL || clientInfo.photo1 || ''
              });
                            // Actualizamos el estado local
                            setChatData(prev => ({
                              ...prev,
                              clientEmail: clientInfo.email,
                              clientPhoto: clientInfo.photoURL || clientInfo.photo1 || ''
                            }));
                          }
                        }
                      }
                    }
                  };
                  fetchAndSyncChatData();
                }, [chatId, currentUser]);
              
                useEffect(() => {
                  if (!chatId) return;
                  const q = query(
                    collection(db, "chats", chatId, "messages"),
                    orderBy("createdAt", "asc")
                  );
                  const unsubscribe = onSnapshot(q, (snapshot) => {
                    setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                  });
                  return () => unsubscribe();
                }, [chatId]);
              
                useEffect(() => {
                  scrollRef.current?.scrollIntoView({ behavior: "smooth" });
                }, [messages]);
              
                const sendMessage = async (e) => {
                  e.preventDefault();
                  if (!newMessage.trim() || !currentUser) return;
                  try {
                    await addDoc(collection(db, "chats", chatId, "messages"), {
                      text: newMessage.toUpperCase(),
                      senderId: currentUser.uid,
                      createdAt: serverTimestamp(),
                    });
                    setNewMessage('');
                  } catch (error) { console.error(error); }
                };
                return (
                  <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-[#0a0a0a] border-l border-white/10 shadow-2xl z-[200] flex flex-col animate-in slide-in-from-right duration-500">
                    
                    <nav className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
                      <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                          <X size={20} />
                        </button>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-purple-500/30 bg-black flex items-center justify-center">
                            {chatData?.clientPhoto ? (
                              <img src={chatData.clientPhoto} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <User size={18} className="text-purple-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-[8px] font-bold tracking-[0.4em] text-purple-500 uppercase mb-0.5">VÍNCULO DIRECTO</p>
                            <h2 className="text-[11px] font-bold text-white uppercase tracking-wider truncate max-w-[180px]">
                              {chatData?.clientEmail || "SINCRONIZANDO..."}
                            </h2>
                          </div>
                        </div>
                      </div>
                    </nav>
              
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-[#0f0f0f]">
                      {messages.map((msg) => {
                        const isMe = msg.senderId === currentUser?.uid;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[10px] font-bold tracking-wider leading-relaxed border ${
                              isMe ? 'bg-purple-600/20 border-purple-500/30 text-white rounded-tr-none' : 'bg-white/5 border-white/10 text-gray-300 rounded-tl-none'
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={scrollRef} />
                    </div>
              
                    <div className="p-6 border-t border-white/5 bg-[#0a0a0a]">
                      <form onSubmit={sendMessage} className="flex flex-col gap-4">
                        <div className="relative flex items-center gap-2">
                          <input 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="INGRESAR COMUNICADO..."
                            className="flex-1 bg-black border border-white/10 rounded-full py-4 px-6 text-[10px] text-white font-bold tracking-[0.1em] focus:outline-none focus:border-purple-500/50 placeholder:text-gray-800"
                          />
                                      <button className="p-4 bg-purple-600 rounded-full hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/20">
              <Send size={16} className="text-white" />
            </button>
          </div>
          <div className="flex justify-between items-center px-2 opacity-20 text-[6px] font-bold tracking-widest uppercase">
            <span className="flex items-center gap-1"><ShieldCheck size={8}/> SISTEMA CLASSCODE® VERIFICADO</span>
            <span className="flex items-center gap-1"><Zap size={8}/> LATENCIA: 14MS</span>
          </div>
        </form>
      </div>
    </div>
  );
}              