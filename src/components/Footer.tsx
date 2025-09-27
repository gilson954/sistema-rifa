import React from 'react';
import { Youtube, MessageCircle, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full bg-gray-900 dark:bg-gray-950 text-white py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <img 
                src="/logo-chatgpt.png" 
                alt="Rifaqui Logo" 
                className="w-14 h-14 object-contain"
              />
              <span className="ml-2 text-2xl font-bold">Rifaqui</span>
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-sm transition-colors duration-300">
              A plataforma completa para criar e gerenciar rifas online de forma profissional.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-2 text-sm text-gray-400 dark:text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Funcionalidades</a></li>
              <li><a href="#precos" className="hover:text-white transition-colors duration-200">Preços</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Segurança</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm text-gray-400 dark:text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Documentação</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Contato</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Status</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400 dark:text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Cookies</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">LGPD</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 dark:border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center transition-colors duration-300">
          <p className="text-sm text-gray-400 dark:text-gray-500 transition-colors duration-300">
            © 2024 Rifaqui - Todos os direitos reservados
          </p>
          
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a 
              href="https://www.instagram.com/rifaqui.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 dark:text-purple-400 hover:text-white transition-colors duration-200" 
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-purple-400 dark:text-purple-400 hover:text-white transition-colors duration-200" aria-label="WhatsApp">
              <MessageCircle className="h-5 w-5" />
            </a>
            <a href="#" className="text-purple-400 dark:text-purple-400 hover:text-white transition-colors duration-200" aria-label="YouTube">
              <Youtube className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
