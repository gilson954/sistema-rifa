import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';

const FAQ = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  const handleWhatsAppSupport = () => {
    window.open('https://wa.me/5562981127960', '_blank');
  };

  const faqs = [
    {
      question: "Como criar uma campanha?",
      answer: "Criar sua campanha é simples e rápido: Acesse sua conta na plataforma, clique em \"Criar nova campanha\" e siga as etapas guiadas. Em poucos minutos, sua rifa estará pronta para começar a vender!"
    },
    {
      question: "Quem recebe o valor das vendas?",
      answer: "Todo o dinheiro arrecadado com a venda de bilhetes vai direto pra sua conta bancária. Você escolhe e configura as formas de pagamento desejadas no seu painel."
    },
    {
      question: "Os bilhetes são atualizados automaticamente após o pagamento?",
      answer: "Sim! Se você optar por pagamentos automáticos (como Pix ou cartão), os bilhetes pagos são atualizados sozinhos no sistema. Se preferir, também é possível usar formas de pagamento manuais — nesse caso, você confirma os pagamentos no painel."
    },
    {
      question: "Quantas campanhas posso criar?",
      answer: "Você pode criar quantas campanhas quiser! Só é cobrada uma pequena taxa de ativação para cada campanha publicada."
    },
    {
      question: "O Rifaqui é responsável pelas campanhas?",
      answer: "Não. O Rifaqui oferece a plataforma e estrutura para você criar e gerenciar campanhas. Toda a responsabilidade pela campanha (legalização, prêmios, divulgação e sorteio) é do organizador."
    },
    {
      question: "Preciso de autorização legal para fazer uma rifa?",
      answer: "Depende. Regras e exigências legais variam de acordo com sua cidade, estado ou país. No Brasil, por exemplo, promoções devem seguir normas da SECAP (Secretaria de Avaliação, Planejamento, Energia e Loteria). A autorização pode ser feita pelo sistema SCPC. Mais informações: 0800 978 2332 (atendimento 24h)."
    }
  ];

  return (
    <section id="duvidas" className="w-full py-20 bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 transition-colors duration-300">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Dúvidas Frequentes
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto transition-colors duration-300">
            Se não encontrar sua dúvida por aqui, fale com a gente. Estamos prontos pra ajudar!
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openItems.includes(index);
            return (
              <div
                key={index}
                className="bg-transparent dark:bg-transparent rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-white/5 dark:hover:bg-white/3 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4 transition-colors duration-300">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`text-purple-600 dark:text-purple-400 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    size={24}
                  />
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 transition-colors duration-300">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="text-white" size={32} />
            </div>

            <h3 className="text-2xl font-bold mb-4 transition-colors duration-300">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Ainda tem dúvidas?
              </span>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto transition-colors duration-300">
              Nossa equipe está sempre disponível para ajudar você a tirar suas dúvidas e começar a vender suas rifas.
            </p>
            <button
              onClick={handleWhatsAppSupport}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-semibold"
            >
              Falar com Suporte
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
