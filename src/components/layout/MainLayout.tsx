'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Menu,
  MoreHorizontal,
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

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [engineDropdownOpen, setEngineDropdownOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [plusDropdownOpen, setPlusDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [noKeyModalOpen, setNoKeyModalOpen] = useState(false);

  const { geminiKey, groqKey } = useApiKeys();
  const [selectedEngine, setSelectedEngine] = useState('arIA Flash');

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const engines = ['arIA Flash', 'arIA Núcleo', 'arIA Visión', 'arIA Órbita'];

  const getProviderForKey = (engine: string) => {
    if (engine === 'arIA Flash' || engine === 'arIA Visión') return 'gemini';
    if (engine === 'arIA Núcleo' || engine === 'arIA Órbita') return 'groq';
    return 'gemini';
  };

  const getModelName = (engine: string) => {
    if (engine === 'arIA Flash') return 'gemini-1.5-flash';
    if (engine === 'arIA Núcleo') return 'llama3-8b-8192';
    if (engine === 'arIA Visión') return 'gemini-1.5-pro';
    if (engine === 'arIA Órbita') return 'mixtral-8x7b-32768';
    return 'gemini-1.5-flash';
  };

  const handleSendMessage = async (forceServerCall = false) => {
    const messageToSend = pendingMessage || inputMessage.trim();
    if (!messageToSend) return;

    if (!pendingMessage) {
      setInputMessage('');
    }

    setPendingMessage(null);

    const provider = getProviderForKey(selectedEngine);
    const userKey = provider === 'gemini' ? geminiKey : groqKey;

    if (!userKey && !forceServerCall) {
      setPendingMessage(messageToSend);
      setNoKeyModalOpen(true);
      return;
    }

    const newMessages: Message[] = [...messages, { role: 'user', content: messageToSend }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      if (userKey) {
        // Direct call to provider from client
        let responseText = '';
        const modelName = getModelName(selectedEngine);

        if (provider === 'gemini') {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${userKey}`;
          const prompt = newMessages.map(m => `${m.role}: ${m.content}`).join('\n') + '\nassistant:';

          const res = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            }),
          });

          if (!res.ok) throw new Error(`Gemini Error: ${res.statusText}`);
          const data = await res.json();
          responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        } else if (provider === 'groq') {
          const groqUrl = `https://api.groq.com/openai/v1/chat/completions`;

          const res = await fetch(groqUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userKey}`
            },
            body: JSON.stringify({
              model: modelName,
              messages: newMessages.map(m => ({ role: m.role, content: m.content }))
            }),
          });

          if (!res.ok) throw new Error(`Groq Error: ${res.statusText}`);
          const data = await res.json();
          responseText = data.choices?.[0]?.message?.content || '';
        }

        setMessages([...newMessages, { role: 'assistant', content: responseText }]);

      } else {
        // Call backend route
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages, engine: selectedEngine }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Server error');
        }

        setMessages([...newMessages, { role: 'assistant', content: data.content }]);
      }
    } catch (error: unknown) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
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

        <div className="border-t border-gray-800 p-4">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-gray-900 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800">
              <User size={16} className="text-gray-400" />
            </div>
            <span className="text-sm font-medium">Perfil de usuario</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-800/50 bg-[#0a0a0a]/80 px-4 backdrop-blur-sm z-30">
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
                <div className="absolute left-0 top-full mt-2 w-48 rounded-lg border border-gray-800 bg-[#111] p-1 shadow-xl z-50">
                  {engines.map(engine => (
                    <button
                      key={engine}
                      className={`flex w-full items-center px-3 py-2 text-sm hover:bg-gray-800 rounded-md ${selectedEngine === engine ? 'bg-gray-800' : ''}`}
                      onClick={() => {
                        setSelectedEngine(engine);
                        setEngineDropdownOpen(false);
                      }}
                    >
                      {engine}
                    </button>
                  ))}
                  <div className="my-1 h-px bg-gray-800" />
                  <button className="flex w-full items-center px-3 py-2 text-sm text-blue-400 hover:bg-gray-800 rounded-md">
                    + Agregar motor
                  </button>
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
                        <span className="font-semibold text-sm text-gray-400">{selectedEngine}</span>
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
        <div className="p-4 md:px-8 lg:px-24 xl:px-48 z-20">
          <div className="relative flex items-end gap-2 rounded-2xl border border-gray-700 bg-[#1a1a1a] p-2 shadow-sm focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500 transition-all">

            <div className="relative">
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
                  handleSendMessage();
                }
              }}
            />

            {inputMessage.trim() ? (
              <button
                onClick={() => handleSendMessage()}
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

      {/* Global Click Handler to close dropdowns */}
      {(engineDropdownOpen || menuDropdownOpen || plusDropdownOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setEngineDropdownOpen(false);
            setMenuDropdownOpen(false);
            setPlusDropdownOpen(false);
          }}
        />
      )}

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
          onTryAria={() => handleSendMessage(true)}
        />
      )}
    </div>
  );
}
