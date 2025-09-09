import React, { useState } from 'react';

const ThemeSettings = () => {
  const [selectedTheme, setSelectedTheme] = useState<'claro' | 'escuro' | 'escuro-preto'>('escuro-preto');

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Cor de tema</h2>
      <p className="text-sm text-gray-400 mb-4">
        Selecione um tema para deixar sua rifa ainda mais elegante
      </p>

      {/* Cards de tema - responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* Claro */}
        <div
          onClick={() => setSelectedTheme('claro')}
          className={`w-full p-4 border rounded-lg cursor-pointer ${
            selectedTheme === 'claro'
              ? 'ring-2 ring-purple-500'
              : 'hover:shadow-md'
          }`}
        >
          <h3 className="font-medium">Rifa do iPhone</h3>
          <p className="text-sm text-gray-500">R$ 5,00 por bilhete</p>
          <div className="h-2 bg-gray-200 rounded mt-2">
            <div className="h-2 bg-teal-500 rounded w-1/2"></div>
          </div>
          <button className="mt-2 w-full bg-teal-500 text-white rounded py-1">
            Participar
          </button>
          <p className="mt-2 text-sm text-gray-500">Claro</p>
        </div>

        {/* Escuro */}
        <div
          onClick={() => setSelectedTheme('escuro')}
          className={`w-full p-4 border rounded-lg cursor-pointer ${
            selectedTheme === 'escuro'
              ? 'ring-2 ring-purple-500'
              : 'hover:shadow-md'
          }`}
        >
          <h3 className="font-medium">Rifa do iPhone</h3>
          <p className="text-sm text-gray-500">R$ 5,00 por bilhete</p>
          <div className="h-2 bg-gray-200 rounded mt-2">
            <div className="h-2 bg-teal-500 rounded w-1/2"></div>
          </div>
          <button className="mt-2 w-full bg-teal-500 text-white rounded py-1">
            Participar
          </button>
          <p className="mt-2 text-sm text-gray-500">Escuro</p>
        </div>

        {/* Escuro Preto */}
        <div
          onClick={() => setSelectedTheme('escuro-preto')}
          className={`w-full p-4 border rounded-lg cursor-pointer ${
            selectedTheme === 'escuro-preto'
              ? 'ring-2 ring-purple-500'
              : 'hover:shadow-md'
          }`}
        >
          <h3 className="font-medium">Rifa do iPhone</h3>
          <p className="text-sm text-gray-500">R$ 5,00 por bilhete</p>
          <div className="h-2 bg-gray-200 rounded mt-2">
            <div className="h-2 bg-teal-500 rounded w-1/2"></div>
          </div>
          <button className="mt-2 w-full bg-teal-500 text-white rounded py-1">
            Participar
          </button>
          <p className="mt-2 text-sm text-gray-500">Escuro Preto</p>
        </div>
      </div>

      {/* Pré-visualização */}
      <h3 className="text-base font-semibold mb-4">Pré-visualização</h3>
      <div className="p-4 border rounded-lg bg-black">
        <h4 className="text-lg font-bold text-white mb-2">
          Rifa do iPhone 15 Pro Max
        </h4>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white">
            G
          </div>
          <div className="ml-2 text-sm text-white">
            Organizado por: <span className="font-semibold">João Silva</span>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-1">Progresso da campanha</p>
          <div className="h-2 bg-gray-700 rounded">
            <div className="h-2 bg-teal-500 rounded" style={{ width: '75%' }}></div>
          </div>
          <p className="text-sm text-gray-300 mt-1">
            750/1000 bilhetes vendidos
          </p>
        </div>
        <button className="w-full bg-teal-500 text-white rounded py-2">
          Participar da Rifa
        </button>
      </div>
    </div>
  );
};

export default ThemeSettings;
