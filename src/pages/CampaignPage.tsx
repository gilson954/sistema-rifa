
// CampaignPage.tsx - corrigido para ajustar largura dos blocos

import React from 'react';

const CampaignPage = () => {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      
      {/* Organizador */}
      <div className="w-full max-w-5xl mx-auto bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-center text-xl font-semibold mb-4">Organizador</h2>
        <p className="text-center text-gray-300">Informações do organizador não disponíveis</p>
      </div>

      {/* Escolha a Quantidade */}
      <div className="w-full max-w-5xl mx-auto bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-center text-xl font-semibold mb-4">Escolha a Quantidade</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <button className="bg-red-500 py-2 rounded">+1</button>
          <button className="bg-red-500 py-2 rounded">+5</button>
          <button className="bg-red-500 py-2 rounded">+15</button>
          <button className="bg-red-500 py-2 rounded">+150</button>
          <button className="bg-red-500 py-2 rounded">+1000</button>
          <button className="bg-red-500 py-2 rounded">+5000</button>
        </div>
        <div className="text-center mt-4 font-bold">R$ 200,00</div>
      </div>

      {/* Descrição / Regulamento */}
      <div className="w-full max-w-5xl mx-auto bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-center text-xl font-semibold mb-4">Descrição/Regulamento</h2>
        <p className="text-gray-300">Aqui entra a descrição da campanha...</p>
      </div>

      {/* Métodos de Pagamento e Sorteio */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Seção de Métodos de Pagamento</h3>
          <p>PIX</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Seção de Método de Sorteio</h3>
          <p>Loteria Federal</p>
        </div>
      </div>

      {/* Compartilhar Campanha */}
      <div className="w-full max-w-5xl mx-auto bg-gray-800 p-6 rounded-lg mb-6 text-center">
        <h2 className="text-xl font-semibold mb-4">Compartilhar Campanha</h2>
        <div className="flex justify-center space-x-4">
          <button className="bg-blue-600 px-4 py-2 rounded">Facebook</button>
          <button className="bg-green-600 px-4 py-2 rounded">WhatsApp</button>
        </div>
      </div>
    </main>
  );
};

export default CampaignPage;
