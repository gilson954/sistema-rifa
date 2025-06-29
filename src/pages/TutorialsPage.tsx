import React, { useState } from 'react';
import { ChevronRight, MessageCircle, Mail } from 'lucide-react';

const TutorialsPage = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handleWhatsAppSupport = () => {
    window.open('https://wa.me/5562981127960', '_blank');
  };

  const faqs = [
    {
      question: "Como criar uma rifa online?",
      answer: "Para criar uma rifa online, acesse sua conta, clique em 'Criar nova campanha' e siga as etapas guiadas. Configure o prêmio, defina os bilhetes, valores e formas de pagamento."
    },
    {
      question: "Como personalizar as cores e adicionar redes sociais à sua rifa?",
      answer: "Acesse a seção 'Personalização' no menu lateral para alterar cores e tema. Para redes sociais, vá em 'Redes sociais' e adicione os links das suas plataformas."
    },
    {
      question: "Como integrar o mercado pago à minha rifa online?",
      answer: "Vá em 'Métodos de pagamento', selecione Mercado Pago e siga as instruções para conectar sua conta. Você precisará das suas credenciais de API."
    },
    {
      question: "Como integrar o efi bank à minha rifa online?",
      answer: "Acesse 'Métodos de pagamento', escolha Efi Bank e configure suas credenciais de API para começar a receber pagamentos automaticamente."
    },
    {
      question: "Como sortear sua rifa?",
      answer: "Quando sua rifa estiver completa, use a ferramenta de sorteio integrada na plataforma. O sistema garante transparência e aleatoriedade no processo."
    },
    {
      question: "Como configurar o pix manual na sua rifa?",
      answer: "Em 'Métodos de pagamento', selecione PIX manual e configure sua chave PIX. Os pagamentos precisarão ser confirmados manualmente por você."
    },
    {
      question: "Como configurar meu domínio personalizado?",
      answer: "Acesse 'Personalização' > 'Domínios', clique em 'Criar' e adicione seu domínio. Você precisará configurar os DNS do seu domínio para apontar para nossa plataforma."
    },
    {
      question: "Como integrar o Banco Paggue à minha rifa online?",
      answer: "Vá em 'Métodos de pagamento', selecione Paggue e insira suas credenciais de API. O sistema processará os pagamentos automaticamente."
    }
  ];

  return (
    <div className="bg-gray-900 text-white -mx-4 -mt-6 min-h-screen p-6">
      {/* FAQ Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-2">
          Dúvidas frequentes
        </h2>
        <p className="text-gray-400 mb-6">
          Confira nossas respostas para as perguntas mais comuns sobre o RifaUp
        </p>

        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-750 transition-colors duration-200"
              >
                <span className="text-white font-medium pr-4">
                  {faq.question}
                </span>
                <ChevronRight 
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                    openFAQ === index ? 'rotate-90' : ''
                  }`}
                />
              </button>
              
              {openFAQ === index && (
                <div className="px-4 pb-4">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Request Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-2">
          Precisa de ajuda?
        </h2>
        <p className="text-gray-400 mb-6">
          Envie um email ou chame nosso suporte, queremos que sua experiência seja fantástica.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleWhatsAppSupport}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Chamar suporte</span>
          </button>
          
          <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Enviar email</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialsPage;