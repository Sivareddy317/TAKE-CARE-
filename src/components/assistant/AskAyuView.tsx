import React, { useState, useRef, useEffect } from 'react';
import { ProcessedDocument, UserProfile } from '../../types/clinical';

export interface ChatMessage {
  id: string;
  sender: 'ayusha' | 'user';
  text: string;
  sourceDoc?: string;
  timestamp: string;
}

interface AskAyuViewProps {
  profile?: UserProfile | null;
  documents: ProcessedDocument[];
  onBack: () => void;
  onNavigateToUpload: () => void;
  onNavigateToHistory: () => void;
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
      sender: 'ayusha',
      text: "I'm Ayusha, your personal health assistant! I'm here to help with your health and medical questions. While I can help you organize, store, and understand your medical records within the app, I don't have the capability to directly share your private medical history with doctors or third parties.\n\nHowever, you can easily share your records yourself! You can download your documents or show your digital medical history directly from the app to your doctor during your consultation. This ensures you have all your important information, like prescriptions and lab reports, right at your fingertips when you need it. Is there a specific medical document or health concern you'd like to look at today?",
      timestamp: '11:42 AM',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      // Check query keywords
      const lower = query.toLowerCase();

      // Case 1: "Show my medical history" (exact scenario from Image 14)
      if (lower.includes('show my medical history') || lower.includes('medical history')) {
        setTimeout(() => {
          if (documents.length === 0) {
            setMessages((prev) => [
              ...prev,
              {
                id: 'msg-' + Date.now(),
                sender: 'ayusha',
                text: 'There is no diagnosis history documented in your records.',
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
              summaryText += `You have ${documents.length} document(s) uploaded awaiting clinician review.`;
            }

            setMessages((prev) => [
              ...prev,
              {
                id: 'msg-' + Date.now(),
                sender: 'ayusha',
                text: summaryText,
                sourceDoc: documents[0]?.filename,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
          setIsLoading(false);
        }, 500);
        return;
      }

      // Case 2: "How do I upload files?"
      if (lower.includes('how do i upload') || lower.includes('upload files')) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: 'msg-' + Date.now(),
              sender: 'ayusha',
              text: 'You can upload medical documents anytime by tapping the "Scan medical documents" button on your Home screen, or directly selecting files (PDF, JPG, PNG). Our clinical AI will securely read the medicines, dosages, and test results for your verification.',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setIsLoading(false);
        }, 400);
        return;
      }

      // Call server /api/chat/ask-ayu endpoint
      const res = await fetch('/api/chat/ask-ayu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          patientName: profile?.fullName || 'Patient',
          documentsCount: documents.length,
          documentsSummary: documents.map((d) => ({
            filename: d.filename,
            category: d.category,
            entities: d.extractedEntities.map((e) => `${e.category}: ${e.value}`),
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: 'msg-' + Date.now(),
            sender: 'ayusha',
            text: data.reply || 'I am here to help you understand your medical records.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error('Fallback to local assistant');
      }
    } catch {
      // Fallback helpful assistant response
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-' + Date.now(),
          sender: 'ayusha',
          text: `I'm here to assist with any questions about your prescriptions or test results. ${
            documents.length === 0
              ? 'You currently have no documents uploaded. Tap "Scan medical documents" on your Home screen to add your first record.'
              : `You have ${documents.length} document(s) safely indexed.`
          }`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicToggle = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';

    if (!isListening) {
      setIsListening(true);
      recognition.start();
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-md mx-auto w-full bg-[#FAF8F5] animate-fadeIn select-none">
      {/* Top Header (Matching Image 13 & 14) */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#FAF8F5] border-b border-slate-200/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-700 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Ask Ayu</h1>
        </div>

        <button
          type="button"
          className="w-8 h-8 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 transition"
        >
          <span className="material-symbols-outlined text-[20px]">more_horiz</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
          >
            {msg.sender === 'ayusha' ? (
              <div className="flex items-start gap-2 max-w-[92%]">
                <div className="w-6 h-6 rounded-lg bg-[#FFE6E0] text-[#F05336] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs font-bold text-[10px]">
                  ••
                </div>
                <div className="space-y-2">
                  <div className="bg-white rounded-3xl rounded-tl-sm p-4 text-xs text-slate-800 leading-relaxed shadow-2xs border border-slate-100 whitespace-pre-wrap">
                    {msg.text}
                  </div>

                  {/* Feedback thumbs & Source button */}
                  <div className="flex items-center gap-2 pl-2">
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-700 transition"
                      title="Helpful"
                    >
                      <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                    </button>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-700 transition"
                      title="Not helpful"
                    >
                      <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                    </button>

                    {msg.sourceDoc && (
                      <span className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        <span>Source</span>
                        <span className="material-symbols-outlined text-[14px]">expand_more</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs font-semibold text-slate-900 shadow-2xs border border-slate-200 max-w-[85%]">
                {msg.text}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#FFE6E0] text-[#F05336] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs font-bold text-[10px]">
              ••
            </div>
            <div className="bg-white rounded-2xl px-3 py-2 text-xs text-slate-500 shadow-2xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-75"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-150"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips (Matching Image 13 & 14) */}
      <div className="px-4 py-2 flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          onClick={() => handleSendMessage('Show my medical history')}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-800 shadow-2xs transition cursor-pointer"
        >
          Show my medical history
        </button>

        <button
          type="button"
          onClick={() => handleSendMessage('How do I upload files?')}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-full text-xs font-semibold text-slate-800 shadow-2xs transition cursor-pointer flex items-center gap-1"
        >
          <span>How do I upload files?</span>
          <span className="material-symbols-outlined text-[14px] text-slate-500">crop_free</span>
        </button>
      </div>

      {/* Bottom Query Bar (Matching Image 13 & 14) */}
      <div className="p-3 bg-[#FAF8F5] border-t border-slate-200/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Capsule Search Bar */}
          <div className="flex-1 flex items-center bg-[#EFF1F4] rounded-full px-4 py-2 border border-transparent focus-within:border-slate-400 focus-within:bg-white transition">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask me anything!"
              className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none"
            />
          </div>

          {/* Plus (+) Button to upload file directly */}
          <button
            type="button"
            onClick={onNavigateToUpload}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition flex-shrink-0 cursor-pointer shadow-2xs"
            title="Scan or upload medical document"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>

          {/* Microphone Button */}
          <button
            type="button"
            onClick={handleMicToggle}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition flex-shrink-0 cursor-pointer shadow-2xs ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
            title="Voice input"
          >
            <span className="material-symbols-outlined text-[18px]">mic</span>
          </button>
        </form>
      </div>
    </div>
  );
};
