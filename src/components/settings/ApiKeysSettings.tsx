'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, X, Key, ExternalLink, GitBranch, Loader2 } from 'lucide-react';
import { useApiKeys } from '@/context/ApiKeysContext';

interface Props {
  onClose: () => void;
}

export function ApiKeysSettings({ onClose }: Props) {
  const { geminiKey, setGeminiKey, groqKey, setGroqKey, julesKey, setJulesKey } = useApiKeys();
  const [showGemini, setShowGemini] = useState(false);
  const [showGroq, setShowGroq] = useState(false);
  const [showJules, setShowJules] = useState(false);

  const [julesLoading, setJulesLoading] = useState(false);
  const [julesRepos, setJulesRepos] = useState<{ displayName: string }[] | null>(null);

  const handleJulesConnect = async () => {
    if (!julesKey) {
      window.open('https://jules.google.com/settings', '_blank');
      return;
    }

    setJulesLoading(true);
    try {
      // Intentar listar sources usando la key
      const response = await fetch('https://jules.googleapis.com/v1alpha/sources', {
        headers: {
          'x-goog-api-key': julesKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        const sources = data.sources || [];

        if (sources.length === 0) {
          // No hay repos conectados, redirigir
          window.open('https://jules.google.com/settings', '_blank');
        } else {
          // Mostrar los repos conectados
          setJulesRepos(sources.map((s: { githubRepo?: { repo: string, owner: string }, name: string }) => ({
            displayName: s.githubRepo?.repo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : s.name
          })));
        }
      } else {
        // Probablemente key inválida, o sin permisos
        window.open('https://jules.google.com/settings', '_blank');
      }
    } catch (error) {
      console.error("Error connecting to Jules", error);
      window.open('https://jules.google.com/settings', '_blank');
    } finally {
      setJulesLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-800 bg-[#0a0a0a] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 border border-gray-800">
              <Key size={20} className="text-gray-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Bandeja de API Keys (BYOK)</h2>
              <p className="text-sm text-gray-500">Conecta tus propias credenciales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border-b border-blue-500/20 p-4">
          <p className="text-sm text-blue-200 text-center leading-relaxed">
            <span className="font-semibold block mb-1">Tú usas tus propias claves gratuitas de IA</span>
            nosotros no cobramos por tokens, solo por el acceso a esta plataforma.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Gemini */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Obtener gratis en AI Studio <ExternalLink size={12} />
              </a>
            </label>
            <div className="relative">
              <input
                type={showGemini ? "text" : "password"}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Pega tu API key de Gemini aquí"
                className="w-full rounded-xl border border-gray-800 bg-[#111] px-4 py-3 text-white placeholder-gray-600 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
              >
                {showGemini ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Groq */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center justify-between">
              <span>Groq API Key</span>
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Obtener en console.groq.com <ExternalLink size={12} />
              </a>
            </label>
            <div className="relative">
              <input
                type={showGroq ? "text" : "password"}
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="Pega tu API key de Groq aquí"
                className="w-full rounded-xl border border-gray-800 bg-[#111] px-4 py-3 text-white placeholder-gray-600 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowGroq(!showGroq)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
              >
                {showGroq ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-800/50 my-4" />

          {/* Jules */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center justify-between">
                <span>Jules API Key (Agente)</span>
                <a href="https://jules.google.com/settings" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  Obtener en jules.google <ExternalLink size={12} />
                </a>
              </label>
              <div className="relative">
                <input
                  type={showJules ? "text" : "password"}
                  value={julesKey}
                  onChange={(e) => setJulesKey(e.target.value)}
                  placeholder="Pega tu API key de Jules aquí"
                  className="w-full rounded-xl border border-gray-800 bg-[#111] px-4 py-3 text-white placeholder-gray-600 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowJules(!showJules)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
                >
                  {showJules ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* GitHub Connect Button */}
            <div className="pt-2">
              {julesRepos ? (
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <GitBranch size={16} /> Repositorios conectados
                  </h4>
                  <ul className="space-y-1">
                    {julesRepos.map((repo, i) => (
                      <li key={i} className="text-sm text-gray-400 bg-[#111] p-2 rounded-lg border border-gray-800">
                        {repo.displayName}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => window.open('https://jules.google.com/settings', '_blank')}
                    className="mt-3 text-xs text-blue-400 hover:text-blue-300 w-full text-center"
                  >
                    Gestionar en Jules →
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleJulesConnect}
                  disabled={julesLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900 border border-gray-800 p-3 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  {julesLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <GitBranch size={16} />
                  )}
                  {julesKey ? "Conectar / Listar repositorios" : "Conectar tu repositorio en Jules"}
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-5 flex justify-end bg-[#0a0a0a] rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-gray-200 transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
