import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ScanLine,
  Camera,
  Mic,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { ProcessedDocument, UserProfile } from '../../types/clinical';
import { ApiService } from '../../services/api';
import { InjuryCameraModal } from './InjuryCameraModal';

export interface ChatMessage {
  id: string;
  sender: 'care' | 'user';
  text: string;
  sourceDoc?: string;
  timestamp: string;
  isEmergency?: boolean;
}

interface AskAyuViewProps {
  profile?: UserProfile | null;
  documents: ProcessedDocument[];
  onBack: () => void;
  onNavigateToUpload: () => void;
  onNavigateToHistory: () => void;
}

function getQuickMedicalAnswer(query: string, documents: ProcessedDocument[]): string {
  const lower = query.toLowerCase();

  // 1. CPR / Resuscitation
  if (lower.includes('cpr') || lower.includes('resuscitation')) {
    return `CPR (Cardiopulmonary Resuscitation) steps:\n\n1. Call Emergency (112 / 108 / 102) immediately.\n2. Push hard & fast: Place hands in the center of the chest. Push down 2 inches deep at 100–120 beats per minute (rhythm of 'Stayin Alive').\n3. Don't stop: Continue firm compressions until emergency help arrives.`;
  }

  // 2. Choking / Heimlich
  if (lower.includes('chok') || lower.includes('heimlich')) {
    return `Choking First Aid (Heimlich Maneuver):\n\n1. Stand behind the person and lean them slightly forward.\n2. Place a fist just above their navel; grasp it with your other hand.\n3. Give 5 quick, inward and upward abdominal thrusts.\n4. Alternate with 5 back blows until the airway clears. Call 112 if unresponsive.`;
  }

  // 3. Fever & Temperature
  if (lower.includes('fever') || lower.includes('temperature') || lower.includes('pyrexia')) {
    return `Managing a fever:\n\n• Rest and drink plenty of fluids (water, electrolytes, warm soup).\n• Take Paracetamol (500–650 mg) after meals if advised.\n• Sponge forehead with room-temperature water.\n• See a doctor if fever exceeds 103°F (39.4°C), lasts >3 days, or causes stiff neck.`;
  }

  // 4. Headache / Migraine
  if (lower.includes('headache') || lower.includes('migraine')) {
    return `Relieving a headache:\n\n• Drink water immediately (dehydration is a common cause).\n• Rest in a quiet, dimly lit room.\n• Apply a cold cloth to forehead or a warm compress to the neck.\n• Seek immediate care if headache is sudden, extremely severe ('thunderclap'), or accompanied by vision loss.`;
  }

  // 5. Blood Pressure / Hypertension
  if (lower.includes('bp') || lower.includes('blood pressure') || lower.includes('hypertension')) {
    return `High Blood Pressure (Hypertension):\n\n• Target BP is below 120/80 mmHg.\n• Take prescribed medication (e.g. Telmisartan) daily without skipping.\n• Cut down salt (<1 tsp/day), avoid oily food, and walk 30 minutes daily.\n• Check BP weekly and keep a log for your doctor.`;
  }

  // 6. Diabetes / Blood Glucose
  if (lower.includes('diabetes') || lower.includes('sugar') || lower.includes('glucose') || lower.includes('hba1c')) {
    return `Managing Blood Sugar (Diabetes):\n\n• Target Fasting Glucose: 70–99 mg/dL; HbA1c: < 7.0%.\n• Take prescribed tablets (e.g. Metformin) with meals.\n• Avoid sugary sodas, sweets, and refined flour; choose whole grains.\n• If feeling shaky or sweaty (low sugar), consume 15g quick sugar immediately.`;
  }

  // 7. Minor Burns
  if (lower.includes('burn')) {
    return `First Aid for Minor Burns:\n\n1. Cool immediately: Run cool (not ice-cold) tap water over the burn for 10–15 minutes.\n2. Do NOT use ice, butter, oil, or toothpaste.\n3. Cover loosely with clean gauze or non-stick dressing.\n4. Go to a hospital if burn is blistering, large, or on the face or hands.`;
  }

  // 8. Cuts & Bleeding
  if (lower.includes('cut') || lower.includes('bleed') || lower.includes('wound')) {
    return `First Aid for Bleeding & Cuts:\n\n1. Press firmly on the wound with a clean cloth or gauze for 5 minutes.\n2. Elevate the injured limb above heart level.\n3. Once bleeding stops, rinse with clean water, apply antiseptic, and bandage.\n4. Seek stitches if the cut is deep, gaping, or edges won't stay together.`;
  }

  // 9. Chest Pain / Heart Attack
  if (lower.includes('chest pain') || lower.includes('heart attack')) {
    return `⚠️ EMERGENCY: Chest Pain / Suspected Heart Attack:\n\n1. Call Emergency (112 / 108 / 102) IMMEDIATELY.\n2. Have the person sit quietly and stay calm; loosen tight collar/clothing.\n3. If prescribed, take sublingual Nitroglycerin or chew 300 mg Aspirin (if not allergic).\n4. Do not leave the person alone.`;
  }

  // 10. Stroke FAST
  if (lower.includes('stroke') || lower.includes('paralysis')) {
    return `⚠️ Stroke Warning — Think FAST:\n\n• F (Face): Face drooping on one side?\n• A (Arms): Weakness in one arm when raised?\n• S (Speech): Slurred or strange speech?\n• T (Time): Time to call Emergency (112 / 108) IMMEDIATELY. Every minute counts!`;
  }

  // 11. Cough / Cold / Sore Throat
  if (lower.includes('cough') || lower.includes('cold') || lower.includes('sore throat')) {
    return `Soothing Cough & Cold:\n\n• Gargle with warm salt water 2-3 times daily for sore throat.\n• Steam inhalation helps clear nasal congestion.\n• Drink warm honey-ginger water or tea.\n• Consult a doctor if cough lasts >2 weeks or is accompanied by high fever or breathlessness.`;
  }

  // 12. Acidity / Heartburn / Stomach Ache
  if (lower.includes('acid') || lower.includes('heartburn') || lower.includes('gas') || lower.includes('stomach')) {
    return `Relieving Acidity & Gas:\n\n• Drink a glass of cold milk or water.\n• Avoid spicy, greasy foods, and late-night heavy meals.\n• Don't lie down flat immediately after eating (wait at least 2 hours).\n• Take antacid if prescribed. Consult a doctor if abdominal pain is sharp or persistent.`;
  }

  // 13. Dehydration / Diarrhea / Vomiting
  if (lower.includes('dehydration') || lower.includes('diarrhea') || lower.includes('vomit') || lower.includes('loose motion')) {
    return `Managing Dehydration & Diarrhea:\n\n• Drink ORS (Oral Rehydration Solution) sip-by-sip after every loose stool.\n• Eat light foods like bananas, rice, curd (probiotics), and boiled potatoes.\n• Avoid milk, dairy, and caffeine until settled.\n• Seek medical care if vomiting prevents drinking fluids or blood is present.`;
  }

  // 14. Asking about records
  if (lower.includes('record') || lower.includes('document') || lower.includes('prescription') || lower.includes('report') || lower.includes('my medicine')) {
    if (documents.length === 0) {
      return 'You currently have no documents uploaded. Tap the Camera icon or "Scan medical documents" on your Home screen to add your first record.';
    }
    const confirmedCount = documents.flatMap((d) => d.extractedEntities).filter((e) => e.status === 'Confirmed').length;
    return `You have ${documents.length} medical document(s) and ${confirmedCount} confirmed findings in your health vault. You can view full details in My Medical History or the Health Summary tab.`;
  }

  // 15. General fallback: Short and simple answer
  return `Quick medical guidance for "${query}":\n\n• Stay well hydrated with plenty of water and get adequate rest.\n• Follow any prescribed medication schedule accurately without skipping doses.\n• If symptoms are severe, painful, or persist longer than 48 hours, please consult a licensed healthcare professional for an in-person clinical evaluation.`;
}

export const AskAyuView: React.FC<AskAyuViewProps> = ({
  profile,
  documents,
  onBack,
  onNavigateToUpload,
  onNavigateToHistory,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-initial-1',
      sender: 'care',
      text: "Hi! I'm Care, your personal health assistant. I can help you understand your medical records, prescriptions, and lab reports within the app.\n\nYou can share documents with your doctor directly from the app during your consultation. Is there a medical document or health concern you'd like help with today?",
      timestamp: '11:42 AM',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [wasVoiceUsed, setWasVoiceUsed] = useState(false);
  const [micStatusHint, setMicStatusHint] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isInjuryCameraOpen, setIsInjuryCameraOpen] = useState(false);
  const [showCameraActionMenu, setShowCameraActionMenu] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputQueryRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const speakText = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (isSpeaking && speakingMsgId === msgId) {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      return;
    }

    const cleanSpeechText = text
      .replace(/[*#•_]/g, ' ')
      .replace(/⚠️/g, 'Warning: ')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    setIsSpeaking(true);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMsgId(null);
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const lower = query.toLowerCase();

      // Quick offline/local checks
      if (lower.includes('show my medical history') || lower.includes('medical history')) {
        setTimeout(() => {
          if (documents.length === 0) {
            setMessages((prev) => [
              ...prev,
              {
                id: 'msg-' + Date.now(),
                sender: 'care',
                text: 'There is no medical history uploaded yet. Tap the Scan button to add your first record.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          } else {
            const confirmedMeds = documents.flatMap((d) =>
              d.extractedEntities.filter((e) => e.category === 'medication' && e.status === 'Confirmed')
            );
            const confirmedConditions = documents.flatMap((d) =>
              d.extractedEntities.filter((e) => e.category === 'condition' && e.status === 'Confirmed')
            );
            const confirmedLabs = documents.flatMap((d) =>
              d.extractedEntities.filter((e) => e.category === 'lab' && e.status === 'Confirmed')
            );

            let summaryText = `Here is a summary of your ${documents.length} verified record(s):\n\n`;
            if (confirmedConditions.length > 0) {
              summaryText += `• Diagnoses: ${confirmedConditions.map((c) => c.value).join(', ')}\n`;
            }
            if (confirmedMeds.length > 0) {
              summaryText += `• Active Medications: ${confirmedMeds.map((m) => m.value).join(', ')}\n`;
            }
            if (confirmedLabs.length > 0) {
              summaryText += `• Lab Results: ${confirmedLabs.map((l) => l.value).join(', ')}\n`;
            }
            if (confirmedConditions.length === 0 && confirmedMeds.length === 0 && confirmedLabs.length === 0) {
              summaryText += 'Your records are securely stored in My Medical History. Tap to review extracted details.';
            }

            setMessages((prev) => [
              ...prev,
              {
                id: 'msg-' + Date.now(),
                sender: 'care',
                text: summaryText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
          setIsLoading(false);
        }, 500);
        return;
      }

      if (lower.includes('how do i upload') || lower.includes('upload files')) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: 'msg-' + Date.now(),
              sender: 'care',
              text: 'You can upload medical documents anytime by tapping the "Scan Medical Documents" card on your Home screen, or directly selecting files (PDF, JPG, PNG). Our clinical AI will securely read the medicines, dosages, and test results for your verification.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setIsLoading(false);
        }, 500);
        return;
      }

      // API backend query
      let answerText = '';
      let sourceDocument: string | undefined = undefined;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(ApiService.url('/api/chat/ask-ayu'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        let isEmergency = lower.includes('chest pain') || lower.includes('heart attack') || lower.includes('stroke') || lower.includes('cpr') || lower.includes('severe bleeding');
        const cType = res.headers.get('content-type') || '';
        if (res.ok && cType.includes('application/json')) {
          const data = await res.json();
          answerText = data.answer || data.reply || '';
          sourceDocument = data.sourceDoc;
          if (data.isEmergency) isEmergency = true;
        }
      } catch (chatErr) {
        console.warn('Backend assistant chat warning:', chatErr);
      }

      if (!answerText) {
        answerText = getQuickMedicalAnswer(query, documents);
      }

      const isEmerg = lower.includes('chest pain') || lower.includes('heart attack') || lower.includes('stroke') || lower.includes('cpr');
      const msgId = 'msg-' + Date.now();
      const newCareMsg: ChatMessage = {
        id: msgId,
        sender: 'care',
        text: answerText,
        sourceDoc: sourceDocument,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEmergency: isEmerg || answerText.includes('EMERGENCY:'),
      };

      setMessages((prev) => [...prev, newCareMsg]);

      // If user used voice input, read the response aloud automatically
      if (wasVoiceUsed) {
        speakText(answerText, msgId);
        setWasVoiceUsed(false);
      }
    } catch {
      const fallback = getQuickMedicalAnswer(query, documents);
      const isEmerg = lower.includes('chest pain') || lower.includes('heart attack') || lower.includes('stroke');
      const msgId = 'msg-' + Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: msgId,
          sender: 'care',
          text: fallback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEmergency: isEmerg,
        },
      ]);
      if (wasVoiceUsed) {
        speakText(fallback, msgId);
        setWasVoiceUsed(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicToggle = async () => {
    // If already active, stop listening
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setMicStatusHint(null);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // Check / prompt native Android mic permission via getUserMedia
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr) {
      console.warn('Microphone permission request warning:', permErr);
    }

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-IN';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
          setMicStatusHint('Listening... Speak now');
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setInputQuery(currentTranscript);
            setWasVoiceUsed(true);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition status:', event.error);
          setIsListening(false);
          setMicStatusHint('Voice typing: Tap the mic icon on your keyboard to speak');
          setTimeout(() => setMicStatusHint(null), 4000);
        };

        recognition.onend = () => {
          setIsListening(false);
          setMicStatusHint(null);
        };

        recognition.start();
        return;
      } catch (recErr) {
        console.warn('Speech recognition start failed:', recErr);
      }
    }

    // Direct mobile fallback: focus text box where native keyboard voice mic (Gboard/Samsung) is immediately accessible
    inputQueryRef.current?.focus();
    setMicStatusHint('Tap the mic icon on your keyboard to speak');
    setTimeout(() => setMicStatusHint(null), 4500);
  };

  return (
    <div
      className="flex flex-col h-[calc(100dvh-4rem)] max-w-md mx-auto w-full bg-slate-50 select-none pb-1"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)' }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-white border-b border-slate-200/90 shadow-2xs shrink-0">
        <div className="flex items-center gap-2">
          {/* Prominent Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-800 transition cursor-pointer"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-5 h-5 text-slate-800" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Ask Care</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">AI Clinical Health Assistant</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-[#006D60] px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200/70 hover:bg-teal-100 transition cursor-pointer"
        >
          Exit
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
          >
            {msg.sender === 'care' ? (
              <div className="flex items-start gap-2 max-w-[92%]">
                <div className="w-7 h-7 rounded-xl bg-[#006D60] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="space-y-1.5 w-full">
                  {msg.isEmergency && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-900 shadow-2xs">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        <strong className="block font-bold uppercase text-[10px] text-rose-700 tracking-wider">
                          Emergency Clinical Guidance
                        </strong>
                        For sudden, severe, or worsening symptoms (e.g. chest pain, breathing difficulty, severe burns), call <strong>112 / 108</strong> immediately. Do not delay emergency care.
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-800 leading-relaxed shadow-2xs border border-slate-200/80 whitespace-pre-wrap">
                    {msg.text}
                  </div>

                  {/* Feedback thumbs, Voice playback & Source button */}
                  <div className="flex items-center gap-2 pl-1">
                    <button
                      type="button"
                      onClick={() => speakText(msg.text, msg.id)}
                      className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold ${
                        isSpeaking && speakingMsgId === msg.id
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'text-slate-500 hover:text-[#006D60] hover:bg-teal-50'
                      }`}
                      title={isSpeaking && speakingMsgId === msg.id ? 'Stop reading' : 'Read aloud'}
                      aria-label="Read response aloud"
                    >
                      {isSpeaking && speakingMsgId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                          <span className="text-[10px]">Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Listen</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-slate-600 transition"
                      title="Helpful"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-slate-600 transition"
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>

                    {msg.sourceDoc && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        <span>Source</span>
                        <ChevronDown className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#006D60] text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs font-semibold shadow-2xs max-w-[85%]">
                {msg.text}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#006D60] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className="bg-white rounded-2xl px-3 py-2 text-xs text-slate-500 shadow-2xs flex items-center gap-1.5 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-75"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-150"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-3 py-1 bg-slate-50 flex items-center justify-end gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => handleSendMessage('Show my medical history')}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-[11px] font-semibold text-slate-800 shadow-2xs transition cursor-pointer shrink-0"
        >
          Show my medical history
        </button>

        <button
          type="button"
          onClick={() => handleSendMessage('How do I upload files?')}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-[11px] font-semibold text-slate-800 shadow-2xs transition cursor-pointer inline-flex items-center gap-1 shrink-0"
        >
          <span>How do I upload files?</span>
          <ScanLine className="w-3 h-3 text-[#006D60]" />
        </button>
      </div>

      {/* Dedicated Ask Follow-Up Quick Bar */}
      <div className="px-3 py-1.5 bg-white border-t border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] font-bold text-[#006D60] uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-[#006D60]" />
          <span>Ask follow up:</span>
        </span>
        <button
          type="button"
          onClick={() => handleSendMessage('Explain my diagnosed condition and percentage in simple words')}
          className="px-2.5 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-[#006D60] border border-slate-200 rounded-full text-[10px] font-semibold text-slate-700 whitespace-nowrap transition cursor-pointer shrink-0"
        >
          Explain problem &amp; %
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage('What treatment medication is prescribed for this problem?')}
          className="px-2.5 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-[#006D60] border border-slate-200 rounded-full text-[10px] font-semibold text-slate-700 whitespace-nowrap transition cursor-pointer shrink-0"
        >
          Treatment &amp; doses
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage('What follow-up checkup should I do next?')}
          className="px-2.5 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-[#006D60] border border-slate-200 rounded-full text-[10px] font-semibold text-slate-700 whitespace-nowrap transition cursor-pointer shrink-0"
        >
          Next follow-up
        </button>
      </div>

      {/* Bottom Query Bar (Positioned cleanly above bottom nav) */}
      <div
        className="p-2.5 bg-white border-t border-slate-200/90 shadow-md relative shrink-0"
      >
        {micStatusHint && (
          <div className="mb-2 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-medium flex items-center justify-between animate-fadeIn shadow-2xs">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-teal-600'}`}></span>
              <span>{micStatusHint}</span>
            </span>
            <button
              type="button"
              onClick={() => setMicStatusHint(null)}
              className="text-[10px] text-teal-600 font-bold ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Capsule Search Bar */}
          <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-full px-3.5 py-2 border border-transparent focus-within:border-teal-600 focus-within:bg-white transition shadow-2xs">
            <input
              ref={inputQueryRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={isListening ? "Listening... Speak now" : "Ask a follow up..."}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none"
            />
          </div>

          {/* Camera Button with Menu Options */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCameraActionMenu(!showCameraActionMenu)}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-[#006D60] active:scale-95 flex items-center justify-center text-slate-700 transition shrink-0 cursor-pointer"
              title="Camera: Take Photo of Injury or Scan Document"
              aria-label="Camera Scan"
            >
              <Camera className="w-4 h-4" />
            </button>

            {showCameraActionMenu && (
              <div className="absolute bottom-11 left-0 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 w-56 space-y-1 z-30 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => {
                    setShowCameraActionMenu(false);
                    setIsInjuryCameraOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-rose-600" />
                  <span>Take Photo (Wounds / Burns)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCameraActionMenu(false);
                    onNavigateToUpload();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                >
                  <ScanLine className="w-4 h-4 text-[#006D60]" />
                  <span>Scan Medical Document</span>
                </button>
              </div>
            )}
          </div>

          {/* Microphone Button */}
          <button
            type="button"
            onClick={handleMicToggle}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition shrink-0 cursor-pointer shadow-xs active:scale-95 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-[#006D60]'
            }`}
            title="Voice input"
            aria-label="Microphone Voice"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="w-9 h-9 rounded-full bg-[#006D60] hover:bg-[#005248] disabled:opacity-40 text-white flex items-center justify-center transition shrink-0 cursor-pointer shadow-xs active:scale-95"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Injury & Visible Wound Camera Modal */}
      <InjuryCameraModal
        isOpen={isInjuryCameraOpen}
        onClose={() => setIsInjuryCameraOpen(false)}
        onSavedToRecords={() => {
          setIsInjuryCameraOpen(false);
          onNavigateToHistory();
        }}
      />
    </div>
  );
};
