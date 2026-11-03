import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  X,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Printer,
  ChevronDown,
  Minimize2,
  Maximize2,
  HelpCircle,
  Scale,
  FileText,
  Users,
  Truck,
  MessageSquare,
} from 'lucide-react';
import { PandaMascot } from './PandaMascot';
import { aiService } from '../../services/aiService';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

const INITIAL_GREETING: ChatMessage = {
  id: 'greeting',
  role: 'model',
  text: `مرحباً بك! أنا **باندا نيو هوب 🐼** (New Hope Panda AI).  
مستشارك الذكي لإدارة الموارد البشرية وشؤون العاملين بمصنع نيو هوب جمصة.

أستطيع مساعدتك في:
- ⚖️ **قانون العمل المصري والتأمينات** (الغياب، الإجازات، مكافأة نهاية الخدمة، المادة 69).
- 📝 **صياغة الخطابات والمستندات الرسمية** (إنذارات، خطابات بنكية، قرارات إدارية).
- 📊 **استعراض وتلخيص بيانات السيستم** (الموظفين، السائقين، الموقف التأميني).
- 🇨🇳 **الترجمة الإدارية والتنسيق الصيني** (支持中文人力资源咨询).

كيف أستطيع خدمتك اليوم؟ 🐼✨`,
  timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
};

const QUICK_PROMPTS = [
  { label: '⚖️ المادة 69 (الغياب والفصل)', prompt: 'ما هي الشروط والإجراءات القانونية لفصل عامل بسبب الغياب طبقاً للمادة 69 من قانون العمل المصري؟' },
  { label: '💰 حساب مكافأة نهاية الخدمة', prompt: 'كيف تُحسب مكافأة نهاية الخدمة لعامل قضى 6 سنوات في الشركة وراتبه 5000 جنيه؟' },
  { label: '📝 صياغة إنذار غياب رسمي', prompt: 'اكتب لي صيغة إنذار رسمي بالانقطاع عن العمل بعلم الوصول موجه لعامل غائب بدون إذن قانوني لشركة نيو هوب.' },
  { label: '📊 ملخص الموظفين والتأمينات', prompt: 'لخص لي بيانات الموظفين والتأمينات المسجلة في مصنع جمصة حالياً.' },
  { label: '🚗 مستحقات السائقين', prompt: 'كيف يتم احتساب وتسوية مستحقات ونقلات السائقين الأسبوعية في مصنع جمصة؟' },
  { label: '🇨🇳 ترجمة خطاب للصينية (中文)', prompt: 'صغ لي إعلان إداري بتنظيم مواعيد العمل باللغتين العربية والصينية (中阿双语).' },
];

export const PandaAIWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('newhope_panda_chat_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [INITIAL_GREETING];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Persist messages in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('newhope_panda_chat_v1', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
      setShowTooltip(false);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Gather live context snapshot from system based on the user's specific inquiry
      const liveContext = await aiService.getPandaLiveContext(query);

      // Send to Gemini
      const apiHistory = newHistory.slice(1).map(m => ({
        role: m.role,
        text: m.text,
      }));

      const replyText = await aiService.chatWithPanda(apiHistory, liveContext);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([...newHistory, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'عذراً، حدث خطأ مؤقت في الاتصال بذكاء باندا. يرجى إعادة المحاولة بعد لحظات 🐼.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...newHistory, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('هل تريد مسح سجل المحادثة والبدء من جديد مع باندا؟')) {
      setMessages([INITIAL_GREETING]);
      localStorage.removeItem('newhope_panda_chat_v1');
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrint = (text: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>خطاب رسمي - نيو هوب إيجيبت</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            margin: 40px;
            color: #111827;
            line-height: 1.8;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #059669;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .header h2 { margin: 0; color: #047857; }
          .header p { margin: 4px 0; font-size: 13px; color: #6b7280; }
          .content { font-size: 15px; white-space: pre-wrap; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>شركة نيو هوب إيجيبت أكواتك تكنولوجي المحدودة</h2>
          <p>NEW HOPE EGYPT AQUATIC TECHNOLOGY CO., LTD - مصنع مدينة جمصة</p>
          <p>إدارة الموارد البشرية والشؤون الإدارية</p>
        </div>
        <div class="content">${text.replace(/###/g, '').replace(/\*\*/g, '')}</div>
        <div class="footer">
          <div>يعتمد، مدير الموارد البشرية</div>
          <div>خاتم المنشأة</div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2 select-none">
        {/* Welcome Tooltip */}
        {showTooltip && !isOpen && (
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-semibold px-3 py-2 rounded-2xl shadow-xl border border-emerald-300 dark:border-emerald-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span>أهلاً بك! أنا باندا نيو هوب 🐼 محتاج أي مساعدة في الـ HR؟</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setIsMinimized(false);
            setShowTooltip(false);
          }}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white p-2.5 rounded-full shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/40 dark:border-slate-800"
          title="افتح مساعد باندا الذكي للـ HR (New Hope Panda AI 🐼)"
        >
          <PandaMascot size="md" isThinking={isLoading} />
          <div className="hidden sm:flex flex-col text-right pr-1 pl-3">
            <span className="text-xs font-black tracking-wide flex items-center gap-1">
              Panda AI 🐼
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </span>
            <span className="text-[10px] text-emerald-100 font-medium">مساعد نيو هوب الذكي</span>
          </div>
        </button>
      </div>

      {/* CHAT WINDOW MODAL */}
      {isOpen && (
        <div
          className={`fixed bottom-24 left-6 z-50 w-[92vw] sm:w-[420px] bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
            isMinimized ? 'h-14' : 'h-[600px] max-h-[82vh]'
          }`}
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white p-3.5 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5">
              <PandaMascot size="sm" isThinking={isLoading} showStatusDot={false} />
              <div>
                <h3 className="text-xs font-black tracking-wide flex items-center gap-1.5">
                  New Hope Panda AI 🐼
                  <span className="text-[9px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded font-mono">
                    ONLINE
                  </span>
                </h3>
                <p className="text-[10px] text-emerald-200/80">مستشارك الذكي لقانون العمل والموارد البشرية</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="مسح سجل المحادثة"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={isMinimized ? 'تكبير' : 'تصغير'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="إغلاق الشات"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Quick Action Chips Bar */}
              <div className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 p-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 shrink-0 flex items-center gap-1 pl-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> اقتراحات:
                </span>
                {QUICK_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="shrink-0 text-[10px] font-semibold bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 rounded-full px-2.5 py-1 transition-all"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'model' && (
                      <div className="shrink-0 mt-0.5">
                        <PandaMascot size="sm" isThinking={false} showStatusDot={false} />
                      </div>
                    )}

                    <div
                      className={`relative group max-w-[85%] rounded-2xl p-3 shadow-xs ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-2xs'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-2xs'
                      }`}
                    >
                      {/* Message Content */}
                      <div className="whitespace-pre-wrap leading-relaxed select-text space-y-1">
                        {msg.text.split('\n').map((line, lIdx) => {
                          if (line.startsWith('### ')) {
                            return (
                              <h4 key={lIdx} className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-1">
                                {line.replace('### ', '')}
                              </h4>
                            );
                          }
                          return <p key={lIdx}>{line}</p>;
                        })}
                      </div>

                      {/* Footer Actions (Timestamp + Copy / Print buttons) */}
                      <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-slate-200/40 dark:border-slate-700/40 text-[9px] opacity-75">
                        <span>{msg.timestamp}</span>

                        {msg.role === 'model' && (
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="hover:text-emerald-600 flex items-center gap-0.5 font-semibold cursor-pointer"
                              title="نسخ النص"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500">تم النسخ</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>نسخ</span>
                                </>
                              )}
                            </button>

                            {(msg.text.includes('إنذار') || msg.text.includes('خطاب') || msg.text.includes('شهادة')) && (
                              <button
                                onClick={() => handlePrint(msg.text)}
                                className="hover:text-emerald-600 flex items-center gap-0.5 font-semibold cursor-pointer mr-1"
                                title="طباعة الخطاب الرسمي"
                              >
                                <Printer className="w-3 h-3" />
                                <span>طباعة</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Thinking / Typing Indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2.5 text-xs text-slate-400 animate-pulse">
                    <PandaMascot size="sm" isThinking={true} showStatusDot={false} />
                    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">باندا يفكّر ويحلل البيانات... 🐼</span>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input & Send Form */}
              <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-end gap-2"
                >
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="اسأل باندا عن قانون العمل، صياغة الخطابات، أو بيانات السيستم... 🐼"
                    className="flex-1 resize-none text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-h-24 leading-relaxed"
                  />

                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white p-2.5 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 cursor-pointer disabled:cursor-not-allowed shrink-0"
                    title="إرسال"
                  >
                    <Send className="w-4 h-4 rotate-180" />
                  </button>
                </form>

                <p className="text-[9px] text-center text-slate-400 mt-1.5 font-medium">
                  مدعوم بالذكاء الاصطناعي لـ New Hope Gamasa • مطابق لقانون العمل والتأمينات المصري
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

