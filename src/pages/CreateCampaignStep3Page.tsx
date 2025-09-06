import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaign } from '@/context/CampaignContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const CreateCampaignStep3Page: React.FC = () => {
  const navigate = useNavigate();
  const { campaign } = useCampaign();

  // Garantindo dados da campanha
  const prizeImages = campaign?.prizes?.flatMap(p => p.images || []) || [];
  const campaignTitle = campaign?.title || 'Campanha sem título';

  // Controle de imagens
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePreviousImage = () => {
    setCurrentImageIndex(prev =>
      prev === 0 ? prizeImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev =>
      prev === prizeImages.length - 1 ? 0 : prev + 1
    );
  };

  const currentImage = prizeImages[currentImageIndex];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Resumo da Campanha</h2>

      {/* Galeria de imagens */}
      <div className="relative w-full mb-6">
        {currentImage ? (
          <>
            <img
              src={currentImage}
              alt={campaignTitle}
              className="w-full h-64 object-cover rounded-lg transition-opacity duration-300"
            />
            {prizeImages.length > 1 && (
              <>
                <button
                  onClick={handlePreviousImage}
                  className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {prizeImages.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-64 flex items-center justify-center bg-gray-200 rounded-lg text-gray-500">
            Nenhuma imagem disponível
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {prizeImages.length > 1 && (
        <div className="flex space-x-2 mt-4 overflow-x-auto pb-2 px-2">
          {prizeImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                index === currentImageIndex
                  ? 'border-purple-500 opacity-100'
                  : 'border-gray-300 dark:border-gray-600 opacity-60 hover:opacity-80'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Título da campanha */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-6">
        {campaignTitle}
      </h3>

      {/* Botões de navegação */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Voltar
        </Button>
        <Button onClick={() => navigate('/dashboard')}>
          Finalizar
        </Button>
      </div>
    </div>
  );
};

export default CreateCampaignStep3Page;
