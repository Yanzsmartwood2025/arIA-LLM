'use client';

import React from 'react';
import { X, Key, Zap } from 'lucide-react';

interface Props {
  onClose: () => void;
  onOpenSettings: () => void;
  onTryAria: () => void;
}

export function NoKeyModal({ onClose, onOpenSettings, onTryAria }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-gray-800 bg-[#0a0a0a] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 border border-gray-800">
              <Zap size={20} className="text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Se requiere API Key</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-300 text-center mb-4">
            Para enviar mensajes, necesitas conectar tu propia API key o usar el servicio gestionado de arIA.
          </p>

          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900 border border-gray-700 p-4 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <Key size={18} className="text-gray-400" />
            Conecta tu propia API key gratis
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-800"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-xs">O</span>
            <div className="flex-grow border-t border-gray-800"></div>
          </div>

          {/* TODO: TEMPORAL - este botón está abierto sin control de pago para pruebas internas.
              Antes de lanzar a producción, debe quedar bloqueado detrás de un sistema de pago real (Stripe u otro)
              y/o límite de uso gratuito controlado, o cualquier usuario podría consumir las keys propias de arIA sin pagar. */}
          <button
            onClick={() => {
              onClose();
              onTryAria();
            }}
            className="w-full flex flex-col items-center justify-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 p-4 text-sm font-medium text-white transition-colors"
          >
            <span>Probar arIA (modo prueba)</span>
            <span className="text-xs text-blue-200 font-normal">Temporalmente habilitado</span>
          </button>
        </div>
      </div>
    </div>
  );
}
