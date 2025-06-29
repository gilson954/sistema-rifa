import React, { useState } from 'react';
import { 
  HelpCircle, 
  MessageCircle, 
  Book, 
  Video, 
  Search,
  ChevronRight,
  Play,
  ExternalLink,
  Mail,
  Phone
} from 'lucide-react';

const SupportPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const faqCategories = [
    { id: 'all', label: 'Todas' },
    { id: 'getting-started', label: 'Primeiros Passos' },
    { id: 'campaigns', label: 'Campanhas' },
    { id: 'payments', label: 'Pagamentos' },
    { id: 'technical', label: 'Técnico' }
  ];

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'Como criar minha primeira campanha?',
      answer: 'Para criar sua primeira campanha, acesse o dashboard e clique em "Criar Campanha". Siga o assistente passo a passo para configurar seu prêmio, bilhetes e formas de pagamento.'
    },
    {
      id: 2,
      category: 'payments',
      question: 'Como configurar o PIX para receber pagamentos?',
      answer: 'Vá em "Configure seu PIX" no menu lateral, escolha o tipo de chave (CPF, email, telefone ou aleatória) e digite sua chave PIX exatamente como está cadastrada no seu banco.'
    },
    {
      id: 3,
      category: 'campaigns',
      question: 'Posso editar uma campanha depois de publicada?',
      answer: 'Sim, você pode editar informações como descrição e imagens. Porém, não é possível alterar o valor dos bilhetes ou quantidade total após a primeira venda.'
    },
    {
      id: 4,
      category: 'technical',
      question: 'Como personalizar a aparência da minha rifa?',
      answer: 'Acesse "Personalizar Rifas" no menu para alterar cores, fontes, layout e adicionar seu logo. As mudanças são aplicadas automaticamente a todas as suas campanhas.'
    }
  ];

  const tutorials = [
    {
      title: 'Como criar uma rifa do zero',
      duration: '5:32',
      thumbnail: '/api/placeholder/300/200',
      description: 'Tutorial completo mostrando todos os passos para criar sua primeira rifa'
    },
    {
      title: 'Configurando pagamentos automáticos',
      duration: '3:45',
      thumbnail: '/api/placeholder/300/200',
      description: 'Aprenda a configurar PIX e outros métodos de pagamento'
    },
    {
      title: 'Personalizando sua página de rifa',
      duration: '4:18',
      thumbnail: '/api/placeholder/300/200',
      description: 'Como deixar sua rifa com a cara da sua marca'
    },
    {
      title: 'Estratégias para vender mais bilhetes',
      duration: '7:22',
      thumbnail: '/api/placeholder/300/200',
      description: 'Dicas e estratégias para aumentar suas vendas'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suporte e Tutoriais</h1>
        <p className="text-gray-600 dark:text-gray-400">Encontre respostas para suas dúvidas e aprenda a usar a plataforma</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
            <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Chat ao Vivo</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Fale conosco em tempo real</p>
          <button className="text-blue-600 dark:text-blue-400 font-medium text-sm flex items-center">
            Iniciar Chat <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">E-mail</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Envie sua dúvida por e-mail</p>
          <button className="text-green-600 dark:text-green-400 font-medium text-sm flex items-center">
            Enviar E-mail <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
            <Phone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">WhatsApp</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Suporte via WhatsApp</p>
          <button className="text-purple-600 dark:text-purple-400 font-medium text-sm flex items-center">
            Abrir WhatsApp <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Video Tutorials */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tutoriais em Vídeo</h2>
          <button className="text-purple-600 dark:text-purple-400 font-medium flex items-center">
            Ver Todos <ExternalLink className="h-4 w-4 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tutorials.map((tutorial, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-3">
                <div className="aspect-video bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-colors duration-200">
                    <Play className="h-6 w-6 text-gray-900 ml-1" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {tutorial.duration}
                </div>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                {tutorial.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{tutorial.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Perguntas Frequentes</h2>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar nas perguntas frequentes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {faqCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeCategory === category.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <details key={faq.id} className="group border border-gray-200 dark:border-gray-700 rounded-lg">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                <h3 className="font-medium text-gray-900 dark:text-white pr-4">{faq.question}</h3>
                <ChevronRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform duration-200" />
              </summary>
              <div className="px-4 pb-4">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-8">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhuma pergunta encontrada</h3>
            <p className="text-gray-600 dark:text-gray-400">Tente ajustar sua busca ou entre em contato conosco.</p>
          </div>
        )}
      </div>

      {/* Documentation */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Documentação</h2>
          <button className="text-purple-600 dark:text-purple-400 font-medium flex items-center">
            Ver Documentação Completa <ExternalLink className="h-4 w-4 ml-1" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Guia de Início Rápido', description: 'Primeiros passos na plataforma' },
            { title: 'API de Integração', description: 'Documentação técnica da API' },
            { title: 'Políticas e Termos', description: 'Termos de uso e políticas' },
            { title: 'Melhores Práticas', description: 'Dicas para otimizar suas rifas' }
          ].map((doc, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer">
              <Book className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{doc.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{doc.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;