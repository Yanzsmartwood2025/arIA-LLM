'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Menu,
  MoreHorizontal,
  X,
  Plus,
  Mic,
  Search,
  MessageSquarePlus,
  ChevronDown,
  User,
  MonitorSmartphone,
  Bot
} from 'lucide-react';
import { Send, Loader2 } from 'lucide-react';
import { ApiKeysSettings } from '@/components/settings/ApiKeysSettings';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useApiKeys } from '@/context/ApiKeysContext';
import { NoKeyModal } from '@/components/modals/NoKeyModal';
import { getProviderForKey, getModelName, ENGINES } from '@/utils/models';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  engine?: string;
}

const MAX_PAYLOAD_CHARS = 8000;

function truncateMessages(messages: Message[]): Message[] {
  let currentLength = 0;
  const truncated: Message[] = [];

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    // approximate chars per message (role + content)
    const msgLength = msg.role.length + msg.content.length;

    if (currentLength + msgLength > MAX_PAYLOAD_CHARS && truncated.length > 0) {
      break;
    }

    truncated.unshift(msg);
    currentLength += msgLength;
  }

  return truncated;
}

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [engineDropdownOpen, setEngineDropdownOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [plusDropdownOpen, setPlusDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [noKeyModalOpen, setNoKeyModalOpen] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  const { geminiKey, groqKey, useAriaKeys, setUseAriaKeys } = useApiKeys();
  const [selectedEngine, setSelectedEngine] = useState('arIA Flash');
  const [showSearchTooltip, setShowSearchTooltip] = useState(false);

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const engines = ENGINES;

  const engineDescriptions: Record<string, string> = {
    'arIA Flash': 'Respuestas rápidas y económicas',
    'arIA Visión': 'Analiza imágenes y fotos',
    'arIA Pro': 'Razonamiento profundo, el más potente',
    'arIA Núcleo': 'Ultra rápido, ideal para tareas simples',
    'arIA Órbita': 'Investiga y busca en internet',
    'arIA Cúmulo': 'Rápido con más capacidad de razonamiento',
  };

  const handleSendMessage = async (forceServerCall = false, overrideMessage?: string, providedTraceId?: string) => {
    const traceId = providedTraceId || Math.random().toString(36).substring(7);
    console.log(`[MainLayout] handleSendMessage triggered. traceId=${traceId}, forceServerCall=${forceServerCall}, overrideMessage=${!!overrideMessage}, pendingMessage=${!!pendingMessage}, inputMessage=${!!inputMessage.trim()}`);

    if (isLoading) return;
    const messageToSend = overrideMessage || pendingMessage || inputMessage.trim();
    if (!messageToSend) return;

    if (!overrideMessage && !pendingMessage) {
      setInputMessage('');
    }

    setPendingMessage(null);

    console.log(`[MainLayout] useEffect triggered: pendingMessage=${!!pendingMessage}, isLoading=${isLoading}, geminiKey=${!!geminiKey}, groqKey=${!!groqKey}, useAriaKeys=${useAriaKeys}`);
      const provider = getProviderForKey(selectedEngine);
    const userKey = provider === 'gemini' ? geminiKey : groqKey;

    if (!userKey && !useAriaKeys && !forceServerCall) {
      setPendingMessage(messageToSend);
      setNoKeyModalOpen(true);
      return;
    }

    const newMessages: Message[] = [...messages, { role: 'user', content: messageToSend }];
    setMessages(newMessages);
    setIsLoading(true);

    const isServerCall = forceServerCall || useAriaKeys || !userKey;
    const messagesToSend = truncateMessages(newMessages);
    console.log(`[MainLayout] Original messages: ${newMessages.length}, Truncated to send: ${messagesToSend.length}`);

    try {
      if (!isServerCall) {
        // Direct call to provider from client
        let responseText = '';
        const modelName = getModelName(selectedEngine);

        if (provider === 'gemini') {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${userKey}`;
          const prompt = messagesToSend.map(m => `${m.role}: ${m.content}`).join('\n') + '\nassistant:';

          const res = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              // Note: Activating google_search incurs additional costs per query.
              // The model decides autonomously when to execute a search.
              tools: [{ google_search: {} }]
            }),
          });

          if (!res.ok) throw new Error(`Gemini Error: ${res.statusText}`);
          const data = await res.json();
          responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        } else if (provider === 'groq') {
          const groqUrl = `https://api.groq.com/openai/v1/chat/completions`;

          const groqPayloadStr = JSON.stringify({
            model: modelName,
            messages: messagesToSend.map(m => ({ role: m.role, content: m.content }))
          });
          const payloadBytes = new TextEncoder().encode(groqPayloadStr).length;
          console.log(`[MainLayout] Groq BYOK payload size (bytes): ${payloadBytes}, chars: ${groqPayloadStr.length}`);

          const requestHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userKey}`
          };

          const censoredHeaders = {
            ...requestHeaders,
            'Authorization': `Bearer ********* (longitud: ${userKey.length})`
          };

          console.log(`[MainLayout] Groq BYOK User Key length: ${userKey.length}`);
          console.log(`[MainLayout] Groq BYOK Censored Headers:`, censoredHeaders);

          const res = await fetch(groqUrl, {
            method: 'POST',
            headers: requestHeaders,
            body: groqPayloadStr,
          });

          if (!res.ok) throw new Error(`Groq Error: ${res.statusText}`);
          const data = await res.json();
          responseText = data.choices?.[0]?.message?.content || '';
        }

        setMessages([...newMessages, { role: 'assistant', content: responseText, engine: selectedEngine }]);

      } else {
        // Call backend route
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: messagesToSend, engine: selectedEngine }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Server error');
        }

        setMessages([...newMessages, { role: 'assistant', content: data.content, engine: selectedEngine }]);
      }
    } catch (error: unknown) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${errorMsg}`, engine: selectedEngine }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log(`[MainLayout] pendingMessage useEffect triggered: pendingMessage=${!!pendingMessage}, isLoading=${isLoading}, geminiKey=${!!geminiKey}, groqKey=${!!groqKey}, useAriaKeys=${useAriaKeys}`);
    if (pendingMessage && (geminiKey || groqKey || useAriaKeys) && !isLoading) {
      const provider = getProviderForKey(selectedEngine);
      const userKey = provider === 'gemini' ? geminiKey : groqKey;

      if (userKey || useAriaKeys) {
        // We capture the pendingMessage and call handleSendMessage locally
        // to avoid infinite loops and re-renders if dependencies shift
        const messageToSend = pendingMessage;
        setPendingMessage(null);
        setTimeout(() => {
          handleSendMessage(false, messageToSend, 'useEffect-trace-' + Math.random().toString(36).substring(7));
        }, 0);
      }
    }
  }, [geminiKey, groqKey, useAriaKeys, pendingMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Avoid synchronous setState within effect by checking state first or running on next tick
    const tooltipDismissed = localStorage.getItem('aria_search_tooltip_dismissed');
    if (!tooltipDismissed) {
      setTimeout(() => setShowSearchTooltip(true), 0);
    }
  }, []);


  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setEngineDropdownOpen(false);
        setMenuDropdownOpen(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setPlusDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleDismissTooltip = () => {
    setShowSearchTooltip(false);
    localStorage.setItem('aria_search_tooltip_dismissed', 'true');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] text-white">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-800 bg-[#0a0a0a] transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2 px-2">
            <div className="w-6 h-6 relative overflow-hidden rounded-sm flex-shrink-0">
              <Image
                src="/branding/aria-logo-source.png"
                alt="arIA Logo"
                fill
                className="object-cover object-[right_center]"
                sizes="24px"
              />
            </div>
            <span className="text-xl font-bold tracking-tight">arIA</span>
          </div>
        </div>

        <div className="flex gap-2 p-4">
          <button className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-gray-800 bg-[#111] p-3 text-sm font-medium hover:bg-gray-900 transition-colors">
            <MessageSquarePlus size={16} />
            Nuevo chat
          </button>
          <button className="flex items-center justify-center rounded-lg border border-gray-800 bg-[#111] p-3 text-gray-400 hover:bg-gray-900 hover:text-white transition-colors" aria-label="Buscar">
            <Search size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {/* Conversaciones placeholder */}
          <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
            <p className="text-sm">Sin conversaciones</p>
          </div>
        </div>

        <div className="border-t border-gray-800 p-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg px-2 py-1">
            <span className="text-sm text-gray-300">Modo prueba (arIA)</span>
            <button
              onClick={() => setUseAriaKeys(!useAriaKeys)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 ${
                useAriaKeys ? 'bg-white' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                  useAriaKeys ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-gray-900 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800">
              <User size={16} className="text-gray-400" />
            </div>
            <span className="text-sm font-medium">Perfil de usuario / BYOK</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        {/* Topbar */}
        <header ref={headerRef} className={`flex h-16 items-center justify-between border-b border-gray-800/50 bg-[#0a0a0a]/80 px-4 backdrop-blur-sm ${engineDropdownOpen || menuDropdownOpen ? 'z-50' : 'z-30'}`}>
          <div className="flex items-center gap-3">
            <button
              className="p-2 text-gray-400 hover:text-white md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:block">
              <button
                className="p-2 text-gray-400 hover:text-white"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu size={24} />
              </button>
            </div>

            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-900 transition-colors"
                onClick={() => {
                  setEngineDropdownOpen(!engineDropdownOpen);
                  setMenuDropdownOpen(false);
                  setPlusDropdownOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 relative overflow-hidden rounded-sm flex-shrink-0">
                    <Image
                      src="/branding/aria-logo-source.png"
                      alt="arIA Logo"
                      fill
                      className="object-cover object-[right_center]"
                      sizes="20px"
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-bold leading-none tracking-tight">arIA</span>
                    <span className="text-xs text-gray-500">{selectedEngine}</span>
                  </div>
                </div>
                <ChevronDown size={14} className="text-gray-500 ml-1" />
              </button>

              {/* Engine Dropdown */}
              {engineDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 rounded-lg border border-gray-800 bg-[#111] p-1 shadow-xl z-50">
                  {engines.map(engine => (
                    <button
                      key={engine}
                      className={`flex w-full flex-col items-start px-3 py-2 text-sm hover:bg-gray-800 rounded-md ${selectedEngine === engine ? 'bg-gray-800' : ''}`}
                      onClick={() => {
                        setSelectedEngine(engine);
                        setEngineDropdownOpen(false);
                      }}
                    >
                      <span className="font-medium text-gray-200">{engine}</span>
                      <span className="text-xs text-gray-500 mt-0.5">{engineDescriptions[engine]}</span>
                    </button>
                  ))}
                  <div className="my-1 h-px bg-gray-800" />
                  <button className="flex w-full items-center px-3 py-2 text-sm text-blue-400 hover:bg-gray-800 rounded-md">
                    + Agregar motor
                  </button>
                </div>
              )}

              {/* First Time Search Tooltip */}
              {engineDropdownOpen && showSearchTooltip && (
                <div className="absolute left-[265px] top-full mt-2 w-72 rounded-lg border border-blue-900 bg-blue-950/80 p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-left-2 backdrop-blur-md">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-blue-100 leading-relaxed">
                      💡 Algunos modelos pueden buscar en internet automáticamente cuando la pregunta lo requiere.
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismissTooltip();
                      }}
                      className="text-blue-300 hover:text-white p-0.5 -mt-0.5 -mr-0.5 rounded-md hover:bg-blue-900/50 transition-colors shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <button
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-900 transition-colors"
              onClick={() => {
                setMenuDropdownOpen(!menuDropdownOpen);
                setEngineDropdownOpen(false);
                setPlusDropdownOpen(false);
              }}
            >
              <MoreHorizontal size={24} />
            </button>

            {/* Options Dropdown */}
            {menuDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-gray-800 bg-[#111] p-1 shadow-xl z-50">
                {['Compartir', 'Archivos en este chat', 'Fijar', 'Renombrar', 'Descargar', 'Exportar'].map((item) => (
                  <button key={item} className="flex w-full items-center px-3 py-2 text-sm hover:bg-gray-800 rounded-md">
                    {item}
                  </button>
                ))}
                <div className="my-1 h-px bg-gray-800" />
                <button className="flex w-full items-center px-3 py-2 text-sm text-red-500 hover:bg-gray-800 rounded-md">
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col overflow-y-auto p-4 md:px-8 lg:px-24 xl:px-48 space-y-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <Image
                src="/branding/aria-logo-source.png"
                alt="arIA Logo"
                width={240}
                height={90}
                className="mb-8 opacity-20 object-contain"
                priority
              />
              <h2 className="text-2xl font-medium text-gray-300">¿En qué te puedo ayudar?</h2>
            </div>
          ) : (
            <div className="flex flex-col space-y-6 pb-20 pt-8">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.role === 'user' ? 'bg-gray-800 text-white rounded-br-sm' : 'bg-transparent text-gray-200'}`}>
                    {msg.role === 'assistant' && (
                       <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 relative overflow-hidden rounded-sm flex-shrink-0">
                          <Image
                            src="/branding/aria-logo-source.png"
                            alt="arIA Logo"
                            fill
                            className="object-cover object-[right_center]"
                            sizes="20px"
                          />
                        </div>
                        <span className="font-semibold text-sm text-gray-400">{msg.engine || 'arIA Flash'}</span>
                       </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3 max-w-[80%] px-5 py-3 text-gray-400">
                    <Loader2 size={18} className="animate-spin" />
                    <span>arIA está pensando...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className={`p-4 md:px-8 lg:px-24 xl:px-48 ${plusDropdownOpen ? 'z-50' : 'z-20'}`}>
          <div className="relative flex items-end gap-2 rounded-2xl border border-gray-700 bg-[#1a1a1a] p-2 shadow-sm focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500 transition-all">

            <div className="relative" ref={plusMenuRef}>
              <button
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                onClick={() => {
                  setPlusDropdownOpen(!plusDropdownOpen);
                  setEngineDropdownOpen(false);
                  setMenuDropdownOpen(false);
                }}
              >
                <Plus size={20} />
              </button>

              {/* Plus Dropdown */}
              {plusDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-gray-800 bg-[#111] p-1 shadow-2xl z-50">
                  <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-gray-800 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                      <MonitorSmartphone size={18} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-white">Conectar mi computadora</span>
                      <span className="text-xs text-gray-500">Módulo SSH/Oracle</span>
                    </div>
                  </button>
                  <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-gray-800 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
                      <Bot size={18} />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-white">Agente</span>
                      <span className="text-xs text-gray-500">Módulo Jules/Repos</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <textarea
              className="max-h-32 min-h-[40px] w-full resize-none bg-transparent px-2 py-2 text-white placeholder-gray-400 outline-none"
              placeholder="Pregunta a arIA..."
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(false, undefined, 'enter-key-' + Math.random().toString(36).substring(7));
                }
              }}
            />

            {inputMessage.trim() ? (
              <button
                onClick={() => handleSendMessage(false, undefined, 'send-button-' + Math.random().toString(36).substring(7))}
                disabled={isLoading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            ) : (
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
                <Mic size={20} />
              </button>
            )}
          </div>
          <div className="mt-2 text-center text-xs text-gray-600">
            arIA puede cometer errores. Considera verificar la información importante.
          </div>
        </div>
      </main>



      {/* Settings Modal */}
      {settingsOpen && (
        <ErrorBoundary>
          <ApiKeysSettings onClose={() => setSettingsOpen(false)} />
        </ErrorBoundary>
      )}

      {/* No Key Modal */}
      {noKeyModalOpen && (
        <NoKeyModal
          onClose={() => setNoKeyModalOpen(false)}
          onOpenSettings={() => setSettingsOpen(true)}
          onTryAria={() => {
            setUseAriaKeys(true);
            setNoKeyModalOpen(false);
            handleSendMessage(true, undefined, 'aria-key-modal-' + Math.random().toString(36).substring(7));
          }}
        />
      )}
    </div>
  );
}
