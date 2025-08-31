import React, { useState } from 'react';
import { Search, Phone, CheckCircle, Calendar, Trophy, ArrowLeft, Eye, AlertCircle, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CountryPhoneSelect from '../components/CountryPhoneSelect';
import { TicketsAPI, CustomerTicket } from '../lib/api/tickets';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

interface GroupedTickets {
  campaign_id: string;
  campaign_title: string;
  campaign_slug: string | null;
  prize_image_urls: string[] | null;
  tickets: CustomerTicket[];
  total_tickets: number;
}

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷'
  });
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!phoneNumber.trim()) {
      setError('Por favor, digite seu número de celular');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Format phone number for search (remove formatting, keep only numbers)
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const fullPhoneNumber = `${selectedCountry.dialCode} ${phoneNumber}`;

      const { data, error: apiError } = await TicketsAPI.getTicketsByPhoneNumber(fullPhoneNumber);

      if (apiError) {
        setError('Erro ao buscar suas cotas. Tente novamente.');
        console.error('Error fetching tickets:', apiError);
      } else {
        setTickets(data || []);
      }
    } catch (error) {
      console.error('Error searching tickets:', error);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const handleViewCampaign = (slug: string | null, campaignId: string) => {
    if (slug) {
      window.open(`/c/${slug}`, '_blank');
    } else {
      window.open(`/c/${campaignId}`, '_blank');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data não disponível';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group tickets by campaign
  const groupedTickets: GroupedTickets[] = tickets.reduce((groups, ticket) => {
    const existingGroup = groups.find(g => g.campaign_id === ticket.campaign_id);
    
    if (existingGroup) {
      existingGroup.tickets.push(ticket);
      existingGroup.total_tickets++;
    } else {
      groups.push({
        campaign_id: ticket.campaign_id,
        campaign_title: ticket.campaign_title,
        campaign_slug: ticket.campaign_slug,
        prize_image_urls: ticket.prize_image_urls,
        tickets: [ticket],
        total_tickets: 1
      });
    }
    
    return groups;
  }, [] as GroupedTickets[]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Voltar</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <img 
                src="/logo criado pelo Chatgpt.png" 
                alt="Rifaqui Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Rifaqui</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Login Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 mb-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Minhas Cotas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Digite seu número de celular para ver suas cotas compradas
            </p>
          </div>

          {/* Phone Number Input */}
          <div className="max-w-md mx-auto">
            <CountryPhoneSelect
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
              phoneNumber={phoneNumber}
              onPhoneChange={setPhoneNumber}
              placeholder="Seu número de celular"
              error={error}
            />

            <button
              onClick={handleSearch}
              onKeyPress={handleKeyPress}
              disabled={loading || !phoneNumber.trim()}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>Buscar Minhas Cotas</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-gray-800">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Buscando suas cotas...</p>
              </div>
            ) : error ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-6 w-6" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            ) : groupedTickets.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 text-center border border-gray-200 dark:border-gray-800">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Ticket className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Nenhuma cota encontrada
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Não encontramos cotas compradas com este número de celular.
                </p>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Dica:</strong> Verifique se o número está correto e se você já comprou cotas em alguma campanha.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Success Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Cotas Encontradas!</h2>
                      <p className="text-green-100">
                        Encontramos {tickets.length} {tickets.length === 1 ? 'cota' : 'cotas'} em {groupedTickets.length} {groupedTickets.length === 1 ? 'campanha' : 'campanhas'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Campaigns List */}
                <div className="space-y-6">
                  {groupedTickets.map((group) => (
                    <div
                      key={group.campaign_id}
                      className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                    >
                      {/* Campaign Header */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-4">
                          <img
                            src={group.prize_image_urls?.[0] || 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1'}
                            alt={group.campaign_title}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                          />
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                              {group.campaign_title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Ticket className="h-4 w-4" />
                                <span>{group.total_tickets} {group.total_tickets === 1 ? 'cota' : 'cotas'}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Compradas</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewCampaign(group.campaign_slug, group.campaign_id)}
                            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Ver Campanha</span>
                          </button>
                        </div>
                      </div>

                      {/* Tickets Grid */}
                      <div className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Seus Números da Sorte
                        </h4>
                        
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3 mb-6">
                          {group.tickets
                            .sort((a, b) => a.quota_number - b.quota_number)
                            .map((ticket) => (
                              <div
                                key={ticket.ticket_id}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-3 text-center font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                title={`Cota ${ticket.quota_number.toString().padStart(3, '0')} - Comprada em ${formatDate(ticket.bought_at)}`}
                              >
                                <div className="text-lg">
                                  {ticket.quota_number.toString().padStart(3, '0')}
                                </div>
                                <div className="text-xs opacity-80 mt-1">
                                  ✓ Pago
                                </div>
                              </div>
                            ))}
                        </div>

                        {/* Purchase Details */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">Primeira compra:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatDate(group.tickets[0]?.bought_at)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Trophy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">Status:</span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                Participando do sorteio
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer Info Summary */}
                {tickets.length > 0 && tickets[0].customer_name && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Dados do Participante
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 dark:text-purple-400 font-bold">
                            {tickets[0].customer_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Nome</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {tickets[0].customer_name}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Telefone</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {tickets[0].customer_phone}
                          </div>
                        </div>
                      </div>

                      {tickets[0].customer_email && (
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <span className="text-green-600 dark:text-green-400 text-lg">@</span>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {tickets[0].customer_email}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Help Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Dúvidas sobre suas cotas?
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                        Se você tem dúvidas sobre suas cotas, data do sorteio ou qualquer problema com sua compra, 
                        entre em contato com o organizador da campanha ou com nosso suporte.
                      </p>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
                        Falar com Suporte
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-600 dark:text-gray-400">
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200">
              Termos de Uso
            </a>
            <span className="hidden sm:block">•</span>
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200">
              Política de Privacidade
            </a>
            <span className="hidden sm:block">•</span>
            <span>Sistema desenvolvido por Rifaqui</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MyTicketsPage;