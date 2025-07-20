import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuotaSelectorProps {
  ticketPrice: number;
  onQuantityChange: (quantity: number) => void;
  initialQuantity?: number;
  mode: 'manual' | 'automatic';
}

const QuotaSelector: React.FC<QuotaSelectorProps> = ({
  ticketPrice,
  onQuantityChange,
  initialQuantity = 1,
  mode
}) => {
  const [quantity, setQuantity] = useState(initialQuantity);

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
    const newQuantity = Math.max(1, quantity + value);
    setQuantity(newQuantity);
    onQuantityChange(newQuantity);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    const newQuantity = Math.max(1, value);
    setQuantity(newQuantity);
    onQuantityChange(newQuantity);
  };

  const calculateTotal = () => {
    return (quantity * ticketPrice).toFixed(2).replace('.', ',');
  };

  if (mode === 'manual') {
    return null; // Manual mode uses the quota grid for selection
  }

  return (
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
          onClick={() => handleIncrement(-1)}
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
          onClick={() => handleIncrement(1)}
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
        RESERVAR
      </button>
    </div>
  );
};

export default QuotaSelector;