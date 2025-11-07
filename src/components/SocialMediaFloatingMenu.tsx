import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X } from 'lucide-react';
import { socialMediaConfig } from './SocialMediaIcons';

// Tipos para as props do componente
interface SocialMediaLink {
  platform: string;
  url: string;
  enabled?: boolean;
}

interface SocialMediaFloatingMenuProps {
  socialMediaLinks?: Record<string, string | boolean | null>;
  whatsappSupport?: string | null;
  whatsappGroup?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  useGradient?: boolean;
  animatedGradient?: boolean;
  colorMode?: string;
  gradientClasses?: string;
  customGradientColors?: string;
}

/**
 * Componente de menu flutuante de redes sociais (FAB / Speed Dial)
 * Exibe um botão fixo no canto inferior direito que expande para mostrar links de redes sociais
 */
const SocialMediaFloatingMenu: React.FC<SocialMediaFloatingMenuProps> = ({
  socialMediaLinks = {},
  whatsappSupport = null,
  whatsappGroup = null,
  primaryColor = '#3B82F6',
  secondaryColor = '#8B5CF6',
  useGradient = false,
  animatedGradient = false,
  colorMode = 'solid',
  gradientClasses = '',
  customGradientColors = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Processar links de redes sociais vindos do organizador
  const processedSocialMedia: Array<{ platform: string; url: string; label: string; icon: any; color: string }> = [];

  // Adicionar WhatsApp de Suporte se disponível
  if (whatsappSupport && whatsappSupport.trim() !== '') {
    const cleanPhone = whatsappSupport.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    const config = socialMediaConfig['whatsapp' as keyof typeof socialMediaConfig];
    if (config) {
      processedSocialMedia.push({
        platform: 'whatsapp-support',
        url: whatsappUrl,
        label: 'WhatsApp Suporte',
        icon: config.icon,
        color: config.color
      });
    }
  }

  // Adicionar WhatsApp de Grupo se disponível
  if (whatsappGroup && whatsappGroup.trim() !== '') {
    const config = socialMediaConfig['whatsapp' as keyof typeof socialMediaConfig];
    if (config) {
      processedSocialMedia.push({
        platform: 'whatsapp-group',
        url: whatsappGroup,
        label: 'Grupo WhatsApp',
        icon: config.icon,
        color: config.color
      });
    }
  }

  // Adicionar outras redes sociais do organizador
  if (socialMediaLinks && typeof socialMediaLinks === 'object') {
    Object.entries(socialMediaLinks).forEach(([platform, url]) => {
      if (url && typeof url === 'string' && url.trim() !== '') {
        const config = socialMediaConfig[platform as keyof typeof socialMediaConfig];
        if (config) {
          processedSocialMedia.push({
            platform: platform,
            url: url,
            label: config.name,
            icon: config.icon,
            color: config.color
          });
        }
      }
    });
  }

  // Se não houver redes sociais configuradas, não renderizar o componente
  if (processedSocialMedia.length === 0) {
    return null;
  }

  // Alternar estado de abertura/fechamento
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Abrir menu ao passar o mouse (com pequeno delay)
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 200); // Delay de 200ms para evitar aberturas acidentais
  };

  // Fechar menu ao remover o mouse (com pequeno delay)
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300); // Delay de 300ms para dar tempo de mover o mouse para os botões
  };

  // Fechar menu ao clicar fora ou pressionar ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Limpar timeout ao desmontar componente
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Gerar estilo de gradiente customizado
  const getCustomGradientStyle = (customColorsJson: string) => {
    try {
      const colors = JSON.parse(customColorsJson);
      if (Array.isArray(colors) && colors.length >= 2) {
        if (colors.length === 2) {
          return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
        } else if (colors.length === 3) {
          return `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`;
        }
      }
    } catch (error) {
      console.error('Error parsing custom gradient colors:', error);
    }
    return null;
  };

  // Gerar estilo de fundo (sólido ou gradiente)
  const getBackgroundStyle = () => {
    if (colorMode === 'gradient') {
      // Gradiente customizado
      if (gradientClasses === 'custom' && customGradientColors) {
        const gradientStyle = getCustomGradientStyle(customGradientColors);
        if (gradientStyle) {
          return {
            background: gradientStyle,
            backgroundSize: animatedGradient ? '200% 200%' : 'auto',
            animation: animatedGradient ? 'gradient-animation 3s ease infinite' : 'none',
          };
        }
      }
      
      // Gradiente pré-definido
      if (gradientClasses && gradientClasses !== 'custom') {
        return {};
      }
    }
    
    // Cor sólida
    return {
      backgroundColor: primaryColor,
    };
  };

  // Gerar classe CSS para gradiente
  const getGradientClassName = () => {
    if (colorMode === 'gradient') {
      if (gradientClasses === 'custom' && customGradientColors) {
        return 'animate-gradient-x bg-[length:200%_200%]';
      }
      if (gradientClasses && gradientClasses !== 'custom') {
        return `bg-gradient-to-r ${gradientClasses} animate-gradient-x bg-[length:200%_200%]`;
      }
    }
    return '';
  };

  // Abrir link em nova aba e fechar menu
  const handleSocialClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <>
      {/* Estilos CSS para animação de gradiente */}
      <style>{`
        @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .fab-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        @media (max-width: 768px) {
          .fab-container {
            bottom: 20px;
            right: 20px;
          }
        }

        .fab-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
          color: white;
          font-weight: 600;
          font-size: 13px;
          outline: none;
        }

        .fab-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .fab-button:active {
          transform: translateY(0);
        }

        .social-button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          font-weight: 500;
          font-size: 14px;
          background-color: white;
          color: #333;
          outline: none;
        }

        .social-button:hover {
          transform: translateX(-12px) scale(1.15);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
        }

        .social-icon {
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          color: white;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .social-label {
          white-space: nowrap;
        }
      `}</style>

      {/* Container do menu flutuante */}
      <div 
        className="fab-container" 
        ref={menuRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Lista de redes sociais (renderizada quando o menu está aberto) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                alignItems: 'flex-end',
              }}
            >
              {processedSocialMedia.map((social, index) => {
                const IconComponent = social.icon;

                return (
                  <motion.button
                    key={`${social.platform}-${index}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="social-button"
                    onClick={() => handleSocialClick(social.url)}
                    aria-label={`Abrir ${social.label}`}
                    style={{
                      borderLeft: `4px solid ${social.color}`,
                    }}
                  >
                    <span 
                      className="social-icon"
                      style={{ backgroundColor: social.color }}
                    >
                      <IconComponent size={14} />
                    </span>
                    <span className="social-label">{social.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão principal (FAB) */}
        <motion.button
          className={`fab-button ${getGradientClassName()}`}
          onClick={toggleMenu}
          aria-label={isOpen ? 'Fechar menu de redes sociais' : 'Abrir menu de redes sociais'}
          aria-expanded={isOpen}
          style={getBackgroundStyle()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isOpen ? <X size={18} /> : <Share2 size={18} />}
          </motion.div>
          <span className="hidden sm:inline">Redes Sociais</span>
          <span className="sm:hidden">Redes</span>
        </motion.button>
      </div>
    </>
  );
};

export default SocialMediaFloatingMenu;