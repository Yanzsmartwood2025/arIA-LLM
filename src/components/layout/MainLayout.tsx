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

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [engineDropdownOpen, setEngineDropdownOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [plusDropdownOpen, setPlusDropdownOpen] = useState(false);

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
        <div className="flex items-center justify-center p-6 pb-2">
          <Image
            src="/branding/aria-logo-source.png"
            alt="arIA Logo"
            width={120}
            height={45}
            className="object-contain"
            priority
          />
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
          <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-gray-900 transition-colors">
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
                <div className="flex flex-col items-start">
                  <span className="text-lg font-bold leading-none tracking-tight">arIA</span>
                  <span className="text-xs text-gray-500">Gemini</span>
                </div>
                <ChevronDown size={14} className="text-gray-500" />
              </button>

              {/* Engine Dropdown */}
              {engineDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 rounded-lg border border-gray-800 bg-[#111] p-1 shadow-xl z-50">
                  <button className="flex w-full items-center px-3 py-2 text-sm hover:bg-gray-800 rounded-md">
                    Gemini
                  </button>
                  <button className="flex w-full items-center px-3 py-2 text-sm hover:bg-gray-800 rounded-md">
                    Groq
                  </button>
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

        {/* Chat Area (Empty State) */}
        <div className="flex flex-1 flex-col items-center justify-center p-4">
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
            />

            <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <Mic size={20} />
            </button>
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
    </div>
  );
}
