import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, X, Mic, Paperclip, Send, BrainCircuit, Sparkles, 
  HelpCircle, CheckCircle2, AlertCircle, Fingerprint, RefreshCw, 
  PhoneCall, Zap, Smartphone, Lightbulb, Tv, GraduationCap, ChevronRight, Play, Loader2
} from 'lucide-react';
import { Transaction } from '../types';

interface MiaAssistantProps {
  user: {
    name: string;
    email: string;
    walletBalance: number;
    phone?: string;
  };
  onInterceptPurchase: (params: {
    type: 'airtime' | 'data' | 'electricity' | 'cable' | 'education' | 'withdrawal';
    amount: number;
    recipient: string;
    description: string;
    details: any;
  }) => void;
  transactions: Transaction[];
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'mia';
  text: string;
  timestamp: string;
  image?: string; // base64 representation if sent
  isVoice?: boolean;
  action?: {
    type: 'TRANSACTION_PREPARE';
    tx: {
      type: 'airtime' | 'data' | 'electricity' | 'cable' | 'education' | 'withdrawal';
      amount: number;
      recipient: string;
      description: string;
      details: {
        network?: string;
        disco?: string;
        provider?: string;
        saveBeneficiary?: boolean;
        beneficiaryName?: string;
      };
    };
  } | null;
}

export const MiaAssistant: React.FC<MiaAssistantProps> = ({
  user,
  onInterceptPurchase,
  transactions,
  addToast
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'mia',
      text: `Hello **${user.name}**! I am **Mia**, your Wavie automation bot. 💖\n\nI can help you audit your account, and instantly automate mobile recharges, bills, and diagnostics via typing, voice commands, or receipt parsing!\n\n**Try asking me:**\n- *"Buy ₦1000 MTN airtime on 08012345678"*\n- *"Subscribe Glo data plan for 09011122233"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceSimLoading, setIsVoiceSimLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [txHistoryCount, setTxHistoryCount] = useState(transactions.length);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Monitor transactions success to celebrate in chat
  useEffect(() => {
    if (transactions.length > txHistoryCount) {
      const lastTx = transactions[0];
      if (lastTx && lastTx.status === 'success') {
        setMessages((prev) => [
          ...prev,
          {
            id: `success-${Date.now()}`,
            sender: 'mia',
            text: `🎉 **Success!** Your transaction of **₦${lastTx.amount.toLocaleString('en-NG')}** to \`${lastTx.recipient}\` has been authorized, secured and settled!\n\nReference: \`${lastTx.reference}\`. Cashback has been instantly credited. Let me know if you need any other automation!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        addToast(`Mia automated transaction successful!`, 'success');
      }
      setTxHistoryCount(transactions.length);
    }
  }, [transactions, txHistoryCount]);

  // Handle scrolling of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        addToast("Please upload an image under 1.5MB for scanner optimization", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        addToast("Invoice attached. Tap Send to scan!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const startVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsRecording(true);
          addToast("Listening for your top-up request...", "info");
        };

        recognition.onresult = (event: any) => {
          const speechToText = event.results[0][0].transcript;
          setInputValue(speechToText);
          addToast("Speech captured perfectly!", "success");
        };

        recognition.onerror = (err: any) => {
          console.warn("SpeechRecognition constrained, falling back to simulated dictation module.", err);
          runVoiceSimulation();
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
      } catch (e) {
        runVoiceSimulation();
      }
    } else {
      runVoiceSimulation();
    }
  };

  const runVoiceSimulation = () => {
    setShowVoicePicker(true);
  };

  const triggerMockVoice = (promptText: string) => {
    setShowVoicePicker(false);
    setIsVoiceSimLoading(true);
    addToast("Listening for voice statement...", "info");
    
    setTimeout(() => {
      setInputValue(promptText);
      setIsVoiceSimLoading(false);
      addToast("Speech transcribed successfully!", "success");
    }, 1800);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() && !selectedImage) return;

    const userMsgText = inputValue || "Attached Document Invoice Scan request";
    const userMsgId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: selectedImage || undefined
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/mia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          messages: [...messages, userMessage].map((m) => ({
            sender: m.sender,
            text: m.text,
            image: m.image
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Chat api communication error");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `mia-${Date.now()}`,
          sender: 'mia',
          text: data.text || "I processed your request but could not construct a reply.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: data.action
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `mia-error-${Date.now()}`,
          sender: 'mia',
          text: "⚠️ **Connection Error:** I was unable to connect to Wavie's intelligent cloud cortex. Please make sure your server is running or try typing shortly!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecutePreparedTx = (tx: any) => {
    // Intercept checkout
    onInterceptPurchase({
      type: tx.type,
      amount: tx.amount,
      recipient: tx.recipient,
      description: tx.description,
      details: tx.details
    });
    setIsOpen(false); // minimize chatbot to expose WebAuthn module
    addToast("Prepared transaction locked! Initializing security authorization...", "info");
  };

  return (
    <>
      {/* Immersive Floating Launcher Badge with Radar Sweep Pulse */}
      <div 
        id="mia-persistent-launcher"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-slate-900 border-2 border-slate-800 text-white rounded-full p-3.5 shadow-2xl hover:shadow-cyan-500/10 hover:border-indigo-500/60 duration-300 group cursor-pointer flex items-center gap-2.5 select-none"
      >
        <div className="relative">
          <BrainCircuit className="w-6 h-6 text-indigo-400 group-hover:scale-110 duration-300 animate-[pulse_2.5s_infinite]" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-slate-900 animate-ping" />
        </div>
        <span className="text-xs font-black font-display tracking-tight text-slate-100 pr-1 select-none">Mia Smart Bot</span>
      </div>

      {/* Slide-over Drawer Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md p-0 overflow-hidden flex" id="mia-chat-drawer-backdrop">
            {/* Soft dark overlay screen constraint */}
            <div 
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full h-full bg-slate-950 text-white border-l border-slate-850 flex flex-col shadow-2xl ml-auto rounded-l-3xl overflow-hidden"
              id="mia-chat-drawer-panel"
            >
              {/* Star constellation glow backdrop effects */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />
              <div className="absolute bottom-20 left-10 w-60 h-60 bg-gradient-to-tr from-cyan-500/5 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />

              {/* Chat Header */}
              <div className="relative px-5 py-4 border-b border-slate-900 bg-slate-950/70 backdrop-blur-md flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 flex items-center justify-center border border-white/10 shadow-inner">
                    <BrainCircuit className="w-5.5 h-5.5 text-white animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-black text-sm tracking-tight text-white uppercase">Mia</span>
                      <span className="text-[9px] font-black bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-md tracking-wider border border-emerald-500/20">AI BOT</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Smart Assistant
                    </p>
                  </div>
                </div>

                <button
                  id="close-mia-drawer-btn"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Body Scroll Canvas */}
              <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-5 z-10" id="mia-chat-scroll-container">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      msg.sender === 'user' ? 'self-end bg-indigo-600 text-white rounded-2xl rounded-tr-none py-3 px-4 shadow-md' : 'self-start bg-slate-900 border border-slate-850/60 rounded-2xl rounded-tl-none py-3 px-4 shadow-sm'
                    }`}
                  >
                    {/* User attachment display inside bubbles */}
                    {msg.image && (
                      <div className="mb-2.5 rounded-xl overflow-hidden border border-white/10 max-h-40">
                        <img src={msg.image} alt="Uploaded Invoice Scan" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Speech message subtitle display */}
                    {msg.isVoice && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                        <Mic className="w-3 h-3 text-cyan-400" />
                        <span>Voice Request</span>
                      </div>
                    )}

                    {/* Content formatted */}
                    <div className="text-xs leading-relaxed font-sans font-medium break-words text-slate-100">
                      {msg.text.split('\n').map((item, key) => {
                        // Very simple local markdown helper for bold syntax **bold**
                        let formattedLine = item;
                        
                        // Parse simple bold
                        const boldRegex = /\*\*(.*?)\*\*/g;
                        const hasBold = boldRegex.test(item);
                        
                        // Parse simple inline monospaced/code
                        const codeRegex = /`(.*?)`/g;

                        if (hasBold || codeRegex.test(item)) {
                          const parts = [];
                          let lastIndex = 0;
                          
                          // Convert line dynamically
                          let parsedItem = item
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-white">$1</strong>')
                            .replace(/`(.*?)`/g, '<code class="bg-slate-950 px-1 py-0.5 rounded text-cyan-300 font-mono text-[10px]">$1</code>');
                          
                          return <p key={key} dangerouslySetInnerHTML={{ __html: parsedItem }} className="mb-1.5" />;
                        }

                        return <p key={key} className="mb-1.5">{formattedLine}</p>;
                      })}
                    </div>

                    <span className="text-[9px] font-mono text-slate-400 mt-1 self-end block leading-none">
                      {msg.timestamp}
                    </span>

                    {/* TRANSACTION HOOK BLOCK - RENDER CUSTOM AUTOFILLED DEBITS */}
                    {msg.action && msg.action.type === 'TRANSACTION_PREPARE' && (
                      <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 flex flex-col gap-3" id={`checkout-card-${msg.id}`}>
                        <div className="bg-slate-950 rounded-xl p-3.5 border border-indigo-500/20 shadow-inner flex flex-col gap-2 relative">
                          {/* Pulsing techno grids */}
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[9px] font-mono text-cyan-400">
                            <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                            <span>MIA AUTH</span>
                          </div>

                          <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                            {msg.action.tx.type === 'airtime' || msg.action.tx.type === 'data' ? (
                              <Smartphone className="w-4 h-4 text-emerald-400" />
                            ) : msg.action.tx.type === 'electricity' ? (
                              <Lightbulb className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Tv className="w-4 h-4 text-violet-400" />
                            )}
                            <div className="leading-none">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transaction ready</span>
                              <p className="text-xs font-black text-white font-display mt-0.5 capitalize">
                                {msg.action.tx.type === 'airtime' ? 'Telco Airtime' : msg.action.tx.type === 'data' ? 'Internet Bundle' : msg.action.tx.type} Payment
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] font-medium leading-tight">
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Recipient</span>
                              <span className="font-mono text-white text-xs block truncate">{msg.action.tx.recipient}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Category</span>
                              <span className="text-slate-100 text-xs block font-bold capitalize">
                                {msg.action.tx.details?.network || msg.action.tx.details?.disco || msg.action.tx.details?.provider || 'Wavie Core'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-1.5 flex items-center justify-between bg-slate-900/40 p-2 rounded-lg border border-slate-900 text-xs">
                            <span className="text-slate-300 font-semibold font-sans">Payment Amount:</span>
                            <span className="font-mono font-black text-white text-sm">
                              ₦{msg.action.tx.amount.toLocaleString('en-NG')}
                            </span>
                          </div>
                        </div>

                        <button
                          id={`mia-checkout-authorize-btn-${msg.id}`}
                          onClick={() => handleExecutePreparedTx(msg.action?.tx)}
                          className="w-full py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg duration-200 cursor-pointer flex items-center justify-center gap-2 border border-white/5 active:scale-[0.98]"
                        >
                          <Zap className="w-3.5 h-3.5 text-white animate-bounce" />
                          Confirm & Authorize
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading state indicator */}
                {isLoading && (
                  <div className="self-start bg-slate-900 border border-slate-850/60 rounded-2xl rounded-tl-none py-3 px-4 shadow-sm flex items-center gap-2 max-w-[60%]">
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    <span className="text-xs text-slate-400 font-bold tracking-widest animate-pulse">Scanning system...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* MOCK VOICE PROMPTS MODAL */}
              {showVoicePicker && (
                <div className="mx-5 my-2 p-3.5 bg-slate-900 border border-indigo-500/25 rounded-2xl flex flex-col gap-2 z-10">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                      <Mic className="w-3 h-3 text-cyan-400 animate-pulse" />
                      Select Vocal Command Sample
                    </span>
                    <button onClick={() => setShowVoicePicker(false)} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                    {[
                      "Buy ₦1000 MTN airtime on 08012345678",
                      "Subscribe Glo data plan 1000 on 09011122233",
                      "Pay Ikeja Electric Prepaid 3500 for meter 109287"
                    ].map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => triggerMockVoice(prompt)}
                        className="py-2 px-3 text-left hover:bg-slate-800 rounded-xl text-slate-200 text-xs font-medium truncate flex items-center gap-2 border border-slate-850 hover:border-indigo-500/40 select-none cursor-pointer"
                      >
                        <Play className="w-3 h-3 text-indigo-450 fill-indigo-450 shrink-0" />
                        <span className="truncate">{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcription Loading State */}
              {isVoiceSimLoading && (
                <div className="mx-5 my-2 p-4 bg-slate-900 rounded-2xl border border-cyan-400/25 flex flex-col items-center justify-center gap-2 z-10 text-center animate-pulse">
                  <div className="flex gap-1 h-4 items-end">
                    <span className="w-1 bg-cyan-400 rounded-full animate-[voiceWave_1.2s_infinite_0.1s] h-1" />
                    <span className="w-1 bg-cyan-400 rounded-full animate-[voiceWave_1.2s_infinite_0.3s] h-4" />
                    <span className="w-1 bg-cyan-400 rounded-full animate-[voiceWave_1.2s_infinite_0.5s] h-2" />
                    <span className="w-1 bg-cyan-400 rounded-full animate-[voiceWave_1.2s_infinite_0.2s] h-5" />
                    <span className="w-1 bg-cyan-400 rounded-full animate-[voiceWave_1.2s_infinite_0.4s] h-3" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Analyzing voice frequency spectrum...</span>
                </div>
              )}

              {/* Attachment preview panel */}
              {selectedImage && (
                <div className="mx-5 my-1.5 p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3 z-10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-800">
                      <img src={selectedImage} alt="attached document" className="w-full h-full object-cover" />
                    </div>
                    <div className="truncate shrink">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Ready to scan</span>
                      <span className="text-xs text-slate-200 font-mono truncate block">Attached_Invoice_Bill.jpg</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Chat Input Footer Form */}
              <form 
                onSubmit={handleSendMessage}
                className="relative p-4 border-t border-slate-900 bg-slate-950/80 backdrop-blur-md flex items-center gap-2.5 z-10"
              >
                <div className="flex items-center gap-1.5">
                  {/* Image Attachment Trigger Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-400 rounded-xl border border-slate-800 transition-colors cursor-pointer relative"
                    title="Upload utility invoice image"
                    id="mia-image-upload-btn"
                  >
                    <Paperclip className="w-4 h-4" />
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageSelect} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </button>

                  {/* Microphone dictation trigger */}
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isRecording 
                        ? 'bg-red-500/25 border-red-500 text-red-400 animate-pulse' 
                        : 'bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-400 border-slate-800'
                    }`}
                    title="Hold or click to dictate"
                    id="mia-voice-dictation-btn"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>

                {/* Input Text box field */}
                <input
                  id="mia-prompt-input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Mia to buy airtime, pay bills..."
                  className="flex-1 bg-slate-900 border border-slate-850 text-slate-100 placeholder-slate-500 rounded-xl py-2.5 px-3.5 outline-none focus:border-indigo-500 text-xs font-sans font-medium"
                />

                <button
                  id="mia-send-chat-btn"
                  type="submit"
                  disabled={!inputValue.trim() && !selectedImage}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:bg-slate-905 disabled:text-slate-600 border border-indigo-700/20 disabled:border-none cursor-pointer active:scale-95 duration-100 font-bold flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes voiceWave {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
      `}</style>
    </>
  );
};
