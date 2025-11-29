import React from 'react';
import { MessageCircle, Mail } from 'lucide-react';

const TutorialsPage = () => {
  const handleWhatsAppSupport = () => {
    window.open('https://wa.me/5562981127960', '_blank');
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-6 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      {/* Feature Request Section */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Precisa de ajuda?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Envie um email ou chame nosso suporte, queremos que sua experiência seja fantástica.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleWhatsAppSupport}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Chamar suporte</span>
          </button>
          
          <button className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Enviar email</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialsPage;
