import React, { useState } from 'react';
import { ArrowLeft, Plus, X, Facebook } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PixelsAnalyticsPage = () => {
  const navigate = useNavigate();
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [facebookPixelKey, setFacebookPixelKey] = useState('');
  const [googleAnalyticsKey, setGoogleAnalyticsKey] = useState('');

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleAddFacebookPixel = () => {
    // Handle adding Facebook pixel
    console.log('Facebook Pixel Key:', facebookPixelKey);
    setShowFacebookModal(false);
    setFacebookPixelKey('');
  };

  const handleAddGoogleAnalytics = () => {
    // Handle adding Google Analytics
    console.log('Google Analytics Key:', googleAnalyticsKey);
    setShowGoogleModal(false);
    setGoogleAnalyticsKey('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center space-x-4 p-6 border-b border-gray-800">
        <button
          onClick={handleGoBack}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </button>
        <h1 className="text-xl font-medium text-white">
          Seus Pixels
        </h1>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-4">
        {/* Facebook Pixel Card */}
        <div className="bg-gray-800 rounded-lg p-6 flex items-center justify-between hover:bg-gray-750 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Facebook className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Facebook Pixel
              </h3>
              <p className="text-sm text-gray-400">
                Mensure e otimiza públicos dos seus anúncios do Facebook.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFacebookModal(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <Plus className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Google Analytics Card */}
        <div className="bg-gray-800 rounded-lg p-6 flex items-center justify-between hover:bg-gray-750 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Google Analytics
              </h3>
              <p className="text-sm text-gray-400">
                Monitore quem acessa sua rifa, dispositivos, cidades e outros dados.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowGoogleModal(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <Plus className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Facebook Pixel Modal */}
      {showFacebookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Adicionar Facebook Pixel
              </h2>
              <button
                onClick={() => setShowFacebookModal(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-6">
              Mensure e otimiza públicos dos seus anúncios do Facebook.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cole chave pixel
              </label>
              <input
                type="text"
                value={facebookPixelKey}
                onChange={(e) => setFacebookPixelKey(e.target.value)}
                placeholder="Sua chave"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              />
            </div>

            <button
              onClick={handleAddFacebookPixel}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>Adicionar</span>
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* Google Analytics Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Adicionar Google Analytics
              </h2>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-6">
              Monitore quem acessa sua rifa, dispositivos, cidades e outros dados.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cole chave pixel
              </label>
              <input
                type="text"
                value={googleAnalyticsKey}
                onChange={(e) => setGoogleAnalyticsKey(e.target.value)}
                placeholder="Sua chave"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              />
            </div>

            <button
              onClick={handleAddGoogleAnalytics}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>Adicionar</span>
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PixelsAnalyticsPage;