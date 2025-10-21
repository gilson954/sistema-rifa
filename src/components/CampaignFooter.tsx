import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface CampaignFooterProps {
  campaignTheme?: string;
}

const CampaignFooter: React.FC<CampaignFooterProps> = ({ campaignTheme = 'claro' }) => {
  const navigate = useNavigate();
  
  // Footer branco no tema claro, preto no tema escuro, cinza escuro no tema escuro-preto
  const bgClass = campaignTheme === 'claro' ? 'bg-white' : campaignTheme === 'escuro' ? 'bg-black' : 'bg-gray-900';
  const borderClass = campaignTheme === 'claro' ? 'border-gray-300' : 'border-gray-800';
  const textClass = campaignTheme === 'claro' ? 'text-gray-800' : 'text-white';
  
  return (
    <footer className={`${bgClass} border-t ${borderClass} py-6 mt-auto`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-2">
          <span className={`text-sm ${textClass}`}>Sistema desenvolvido por</span>
          <motion.button
            onClick={() => navigate('/')}
            className="inline-flex items-center transition-opacity duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Logo animado */}
            <motion.img
              src="/logo-chatgpt.png"
              alt="Rifaqui"
              className="h-6 w-6 object-contain"
              whileHover={{ 
                rotate: [0, -10, 10, -10, 0],
                transition: { 
                  duration: 0.5,
                  ease: "easeInOut"
                }
              }}
            />
            
            {/* Texto com gradiente animado ao hover */}
            <motion.span
              className={`ml-2 text-sm font-bold ${textClass} relative overflow-hidden`}
              whileHover="hover"
              initial="initial"
            >
              <motion.span
                className="relative z-10"
                variants={{
                  initial: { y: 0 },
                  hover: { 
                    y: [-2, 0],
                    transition: { 
                      duration: 0.3,
                      ease: "easeOut"
                    }
                  }
                }}
              >
                Rifaqui
              </motion.span>
              
              {/* Underline animado */}
              <motion.span
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-pink-500 to-purple-500"
                variants={{
                  initial: { width: '0%' },
                  hover: { 
                    width: '100%',
                    transition: { 
                      duration: 0.3,
                      ease: "easeOut"
                    }
                  }
                }}
              />
            </motion.span>
          </motion.button>
        </div>
      </div>
    </footer>
  );
};

export default CampaignFooter;