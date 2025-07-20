import React, { useState } from 'react';
import { Minus, Plus, Shield } from 'lucide-react';

const CampaignPage = () => {
  const [quantity, setQuantity] = useState(1);
  
  // Mock data - em produção, estes dados viriam de props ou contexto
  const campaignData = {
    title: 'Setup Gamer',
    ticketPrice: 1.00,
    totalTickets: 100,
    image: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    organizer: {
      name: 'Gilson',
      verified: true
    },
    promotion: {
      active: true,
      text: 'Compre 4578 cotas por R$ 0,42'
    }
  };

  const incrementButtons = [
    { label: '+1', value: 1 },
    { label: '+5', value: 5 },
    { label: '+15', value: 15 },
    { label: '+150', value: 150 },
    { label: '+1000', value: 1000 },
    { label: '+5000', value: 5000 },
    { label: '+10000', value: 10000 },
    { label: '+20000', value: 20000 }
  ];

  const handleIncrement = (value: number) => {
    setQuantity(prev => Math.max(1, prev + value));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, value));
  };

  const calculateTotal = () => {
    return (quantity * campaignData.ticketPrice).toFixed(2).replace('.', ',');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Demo Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 py-4 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2 text-yellow-800 dark:text-yellow-200">
            <span className="text-lg">🔒</span>
            <div className="text-center">
              <div className="font-semibold">Modo de Demonstração</div>
              <div className="text-sm">Para liberar sua campanha e iniciar sua divulgação, conclua o pagamento.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Image */}
        <div className="relative mb-8">
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <img
              src={campaignData.image}
              alt={campaignData.title}
              className="w-full h-64 sm:h-80 lg:h-96 object-cover"
            />
            {/* Price Tag */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Participe por apenas</span>
                <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                  R$ {campaignData.ticketPrice.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-lg">🔥</span>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6 text-center transition-colors duration-300">
          {campaignData.title}
        </h1>

        {/* Organizer Info */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3 bg-white dark:bg-gray-900 px-6 py-3 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {campaignData.organizer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Organizado por:</div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900 dark:text-white">{campaignData.organizer.name}</span>
                {campaignData.organizer.verified && (
                  <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                    <Shield className="h-3 w-3" />
                    <span>Suporte</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Promotion Banner */}
        {campaignData.promotion.active && (
          <div className="bg-green-500 dark:bg-green-600 text-white rounded-lg p-4 mb-8 transition-colors duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-lg">🎉</span>
              </div>
              <div>
                <div className="font-semibold">Promoção</div>
                <div className="text-sm opacity-90">{campaignData.promotion.text}</div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            SELECIONE A QUANTIDADE DE COTAS
          </h2>

          {/* Increment Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {incrementButtons.map((button, index) => (
              <button
                key={index}
                onClick={() => handleIncrement(button.value)}
                className="bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-900 dark:text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 border border-gray-200 dark:border-gray-700"
              >
                {button.label}
              </button>
            ))}
          </div>

          {/* Quantity Input */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              className="w-10 h-10 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors duration-200"
            >
              <Minus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
            
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              min="1"
              className="w-20 text-center py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
            />
            
            <button
              onClick={() => setQuantity(prev => prev + 1)}
              className="w-10 h-10 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors duration-200"
            >
              <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Total Value */}
          <div className="text-center mb-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor final</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              R$ {calculateTotal()}
            </div>
          </div>

          {/* Buy Button */}
          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg transition-colors duration-200 shadow-md">
            COMPRAR
          </button>
        </div>

        {/* Payment and Draw Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
          {/* Payment Method */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">MÉTODO DE PAGAMENTO</h3>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">₽</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300">PIX</span>
            </div>
          </div>

          {/* Draw Method */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">SORTEIO</h3>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎲</span>
              </div>
              <span className="text-gray-700 dark:text-gray-300">LOTERIA FEDERAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-8 mt-16 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                Termos de Uso
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                Política de Privacidade
              </a>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Sistema desenvolvido por</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white">Rifaqui</span>
                <img 
                  src="/32132123.png" 
                  alt="Rifaqui Logo" 
                  className="w-6 h-6 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CampaignPage;