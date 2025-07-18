import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, Save, Eye, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface CampaignFormData {
  title: string;
  ticketQuantity: number;
  ticketPrice: string;
  drawMethod: string;
  phoneNumber: string;
}

const CreateCampaignPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showTaxes, setShowTaxes] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    ticketQuantity: 25,
    ticketPrice: '0,00',
    drawMethod: '',
    phoneNumber: ''
  });

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleInputChange = (field: keyof CampaignFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCurrency = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // If empty, return default
    if (!numericValue) {
      return '0,00';
    }
    
    // Convert to number (treating as cents)
    const cents = parseInt(numericValue, 10);
    
    // Convert cents to reais
    const reais = cents / 100;
    
    // Format as Brazilian currency
    return reais.toFixed(2).replace('.', ',');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatCurrency(inputValue);
    setFormData({ ...formData, ticketPrice: formattedValue });
  };

  // Predefined ticket quantity options
  const ticketOptions = [
    25, 50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 
    10000, 20000, 30000, 50000, 100000, 200000, 300000, 
    500000, 1000000, 2000000, 3000000, 5000000, 10000000
  ];

  // Draw method options
  const drawMethods = [
    'Loteria Federal',
    'Sorteador.com.br',
    'Live no Instagram',
    'Live no Youtube',
    'Live no TikTok',
    'Outros'
  ];

  // Calculate estimated revenue
  const calculateRevenue = () => {
    const price = parseFloat(formData.ticketPrice.replace(',', '.'));
    return (price * formData.ticketQuantity).toFixed(2).replace('.', ',');
  };

  // Calculate publication tax based on revenue ranges
  const calculatePublicationTax = () => {
    const revenue = parseFloat(calculateRevenue().replace(',', '.'));
    
    if (revenue <= 100) return 7.00;
    if (revenue <= 200) return 17.00;
    if (revenue <= 400) return 27.00;
    if (revenue <= 701) return 37.00;
    if (revenue <= 1000) return 47.00;
    if (revenue <= 2000) return 67.00;
    if (revenue <= 4000) return 77.00;
    if (revenue <= 7100) return 127.00;
    if (revenue <= 10000) return 197.00;
    if (revenue <= 20000) return 247.00;
    if (revenue <= 30000) return 497.00;
    if (revenue <= 50000) return 997.00;
    if (revenue <= 70000) return 1497.00;
    if (revenue <= 100000) return 1997.00;
    if (revenue <= 150000) return 2997.00;
    
    return 3997.00; // Above R$ 150,000
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      alert('Por favor, preencha o título da campanha.');
      return;
    }

    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const price = parseFloat(formData.ticketPrice.replace(',', '.'));
      
      const { error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          title: formData.title,
          prize_description: 'Prêmio a ser definido',
          ticket_price: price,
          total_tickets: formData.ticketQuantity,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          status: 'draft'
        });

      if (error) {
        console.error('Error creating campaign:', error);
        alert('Erro ao salvar campanha. Tente novamente.');
      } else {
        alert('Campanha salva como rascunho com sucesso!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Erro ao salvar campanha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.title.trim() || !formData.drawMethod || !acceptTerms) {
      alert('Por favor, preencha todos os campos obrigatórios e aceite os termos.');
      return;
    }

    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      const price = parseFloat(formData.ticketPrice.replace(',', '.'));
      
      const { error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          title: formData.title,
          prize_description: 'Prêmio a ser definido',
          ticket_price: price,
          total_tickets: formData.ticketQuantity,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        });

      if (error) {
        console.error('Error creating campaign:', error);
        alert('Erro ao publicar campanha. Tente novamente.');
      } else {
        alert('Campanha publicada com sucesso!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Erro ao publicar campanha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleGoBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Criar campanha
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Insira os dados de como deseja a sua campanha abaixo, eles poderão ser editados depois
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Digite o título sua campanha"
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
            />
          </div>

          {/* Ticket Quantity and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ticket Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantidade de cotas
              </label>
              <div className="relative">
                <select
                  value={formData.ticketQuantity}
                  onChange={(e) => handleInputChange('ticketQuantity', parseInt(e.target.value))}
                  className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="">Escolha uma opção</option>
                  {ticketOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.toLocaleString('pt-BR')} cotas
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Ticket Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor da cota
              </label>
              <input
                type="text"
                value={formData.ticketPrice}
                onChange={handlePriceChange}
                placeholder="0,00"
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
          </div>

          {/* Draw Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Por onde será feito o sorteio?
            </label>
            <div className="relative">
              <select
                value={formData.drawMethod}
                onChange={(e) => handleInputChange('drawMethod', e.target.value)}
                className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              >
                <option value="">Escolha uma opção</option>
                {drawMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de celular
            </label>
            <div className="flex space-x-2">
              <div className="relative">
                <select className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-8 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200">
                  <option value="BR">🇧🇷 Brasil (+55)</option>
                  <option value="AD">🇦🇩 Andorra (+376)</option>
                  <option value="AE">🇦🇪 Emirados Árabes Unidos (+971)</option>
                  <option value="AF">🇦🇫 Afeganistão (+93)</option>
                  <option value="AG">🇦🇬 Antígua e Barbuda (+1268)</option>
                  <option value="AI">🇦🇮 Anguilla (+1264)</option>
                  <option value="AL">🇦🇱 Albânia (+355)</option>
                  <option value="AM">🇦🇲 Armênia (+374)</option>
                  <option value="AO">🇦🇴 Angola (+244)</option>
                  <option value="AQ">🇦🇶 Antártida (+672)</option>
                  <option value="AR">🇦🇷 Argentina (+54)</option>
                  <option value="AS">🇦🇸 Samoa Americana (+1684)</option>
                  <option value="AT">🇦🇹 Áustria (+43)</option>
                  <option value="AU">🇦🇺 Austrália (+61)</option>
                  <option value="AW">🇦🇼 Aruba (+297)</option>
                  <option value="AX">🇦🇽 Ilhas Åland (+358)</option>
                  <option value="AZ">🇦🇿 Azerbaijão (+994)</option>
                  <option value="BA">🇧🇦 Bósnia e Herzegovina (+387)</option>
                  <option value="BB">🇧🇧 Barbados (+1246)</option>
                  <option value="BD">🇧🇩 Bangladesh (+880)</option>
                  <option value="BE">🇧🇪 Bélgica (+32)</option>
                  <option value="BF">🇧🇫 Burkina Faso (+226)</option>
                  <option value="BG">🇧🇬 Bulgária (+359)</option>
                  <option value="BH">🇧🇭 Bahrein (+973)</option>
                  <option value="BI">🇧🇮 Burundi (+257)</option>
                  <option value="BJ">🇧🇯 Benin (+229)</option>
                  <option value="BL">🇧🇱 São Bartolomeu (+590)</option>
                  <option value="BM">🇧🇲 Bermudas (+1441)</option>
                  <option value="BN">🇧🇳 Brunei (+673)</option>
                  <option value="BO">🇧🇴 Bolívia (+591)</option>
                  <option value="BQ">🇧🇶 Bonaire (+599)</option>
                  <option value="BR">🇧🇷 Brasil (+55)</option>
                  <option value="BS">🇧🇸 Bahamas (+1242)</option>
                  <option value="BT">🇧🇹 Butão (+975)</option>
                  <option value="BV">🇧🇻 Ilha Bouvet (+47)</option>
                  <option value="BW">🇧🇼 Botsuana (+267)</option>
                  <option value="BY">🇧🇾 Bielorrússia (+375)</option>
                  <option value="BZ">🇧🇿 Belize (+501)</option>
                  <option value="CA">🇨🇦 Canadá (+1)</option>
                  <option value="CC">🇨🇨 Ilhas Cocos (+61)</option>
                  <option value="CD">🇨🇩 República Democrática do Congo (+243)</option>
                  <option value="CF">🇨🇫 República Centro-Africana (+236)</option>
                  <option value="CG">🇨🇬 República do Congo (+242)</option>
                  <option value="CH">🇨🇭 Suíça (+41)</option>
                  <option value="CI">🇨🇮 Costa do Marfim (+225)</option>
                  <option value="CK">🇨🇰 Ilhas Cook (+682)</option>
                  <option value="CL">🇨🇱 Chile (+56)</option>
                  <option value="CM">🇨🇲 Camarões (+237)</option>
                  <option value="CN">🇨🇳 China (+86)</option>
                  <option value="CO">🇨🇴 Colômbia (+57)</option>
                  <option value="CR">🇨🇷 Costa Rica (+506)</option>
                  <option value="CU">🇨🇺 Cuba (+53)</option>
                  <option value="CV">🇨🇻 Cabo Verde (+238)</option>
                  <option value="CW">🇨🇼 Curaçao (+599)</option>
                  <option value="CX">🇨🇽 Ilha Christmas (+61)</option>
                  <option value="CY">🇨🇾 Chipre (+357)</option>
                  <option value="CZ">🇨🇿 República Tcheca (+420)</option>
                  <option value="DE">🇩🇪 Alemanha (+49)</option>
                  <option value="DJ">🇩🇯 Djibuti (+253)</option>
                  <option value="DK">🇩🇰 Dinamarca (+45)</option>
                  <option value="DM">🇩🇲 Dominica (+1767)</option>
                  <option value="DO">🇩🇴 República Dominicana (+1809)</option>
                  <option value="DZ">🇩🇿 Argélia (+213)</option>
                  <option value="EC">🇪🇨 Equador (+593)</option>
                  <option value="EE">🇪🇪 Estônia (+372)</option>
                  <option value="EG">🇪🇬 Egito (+20)</option>
                  <option value="EH">🇪🇭 Saara Ocidental (+212)</option>
                  <option value="ER">🇪🇷 Eritreia (+291)</option>
                  <option value="ES">🇪🇸 Espanha (+34)</option>
                  <option value="ET">🇪🇹 Etiópia (+251)</option>
                  <option value="FI">🇫🇮 Finlândia (+358)</option>
                  <option value="FJ">🇫🇯 Fiji (+679)</option>
                  <option value="FK">🇫🇰 Ilhas Malvinas (+500)</option>
                  <option value="FM">🇫🇲 Micronésia (+691)</option>
                  <option value="FO">🇫🇴 Ilhas Faroé (+298)</option>
                  <option value="FR">🇫🇷 França (+33)</option>
                  <option value="GA">🇬🇦 Gabão (+241)</option>
                  <option value="GB">🇬🇧 Reino Unido (+44)</option>
                  <option value="GD">🇬🇩 Granada (+1473)</option>
                  <option value="GE">🇬🇪 Geórgia (+995)</option>
                  <option value="GF">🇬🇫 Guiana Francesa (+594)</option>
                  <option value="GG">🇬🇬 Guernsey (+44)</option>
                  <option value="GH">🇬🇭 Gana (+233)</option>
                  <option value="GI">🇬🇮 Gibraltar (+350)</option>
                  <option value="GL">🇬🇱 Groenlândia (+299)</option>
                  <option value="GM">🇬🇲 Gâmbia (+220)</option>
                  <option value="GN">🇬🇳 Guiné (+224)</option>
                  <option value="GP">🇬🇵 Guadalupe (+590)</option>
                  <option value="GQ">🇬🇶 Guiné Equatorial (+240)</option>
                  <option value="GR">🇬🇷 Grécia (+30)</option>
                  <option value="GS">🇬🇸 Geórgia do Sul (+500)</option>
                  <option value="GT">🇬🇹 Guatemala (+502)</option>
                  <option value="GU">🇬🇺 Guam (+1671)</option>
                  <option value="GW">🇬🇼 Guiné-Bissau (+245)</option>
                  <option value="GY">🇬🇾 Guiana (+592)</option>
                  <option value="HK">🇭🇰 Hong Kong (+852)</option>
                  <option value="HM">🇭🇲 Ilha Heard (+672)</option>
                  <option value="HN">🇭🇳 Honduras (+504)</option>
                  <option value="HR">🇭🇷 Croácia (+385)</option>
                  <option value="HT">🇭🇹 Haiti (+509)</option>
                  <option value="HU">🇭🇺 Hungria (+36)</option>
                  <option value="ID">🇮🇩 Indonésia (+62)</option>
                  <option value="IE">🇮🇪 Irlanda (+353)</option>
                  <option value="IL">🇮🇱 Israel (+972)</option>
                  <option value="IM">🇮🇲 Ilha de Man (+44)</option>
                  <option value="IN">🇮🇳 Índia (+91)</option>
                  <option value="IO">🇮🇴 Território Britânico do Oceano Índico (+246)</option>
                  <option value="IQ">🇮🇶 Iraque (+964)</option>
                  <option value="IR">🇮🇷 Irã (+98)</option>
                  <option value="IS">🇮🇸 Islândia (+354)</option>
                  <option value="IT">🇮🇹 Itália (+39)</option>
                  <option value="JE">🇯🇪 Jersey (+44)</option>
                  <option value="JM">🇯🇲 Jamaica (+1876)</option>
                  <option value="JO">🇯🇴 Jordânia (+962)</option>
                  <option value="JP">🇯🇵 Japão (+81)</option>
                  <option value="KE">🇰🇪 Quênia (+254)</option>
                  <option value="KG">🇰🇬 Quirguistão (+996)</option>
                  <option value="KH">🇰🇭 Camboja (+855)</option>
                  <option value="KI">🇰🇮 Kiribati (+686)</option>
                  <option value="KM">🇰🇲 Comores (+269)</option>
                  <option value="KN">🇰🇳 São Cristóvão e Nevis (+1869)</option>
                  <option value="KP">🇰🇵 Coreia do Norte (+850)</option>
                  <option value="KR">🇰🇷 Coreia do Sul (+82)</option>
                  <option value="KW">🇰🇼 Kuwait (+965)</option>
                  <option value="KY">🇰🇾 Ilhas Cayman (+1345)</option>
                  <option value="KZ">🇰🇿 Cazaquistão (+7)</option>
                  <option value="LA">🇱🇦 Laos (+856)</option>
                  <option value="LB">🇱🇧 Líbano (+961)</option>
                  <option value="LC">🇱🇨 Santa Lúcia (+1758)</option>
                  <option value="LI">🇱🇮 Liechtenstein (+423)</option>
                  <option value="LK">🇱🇰 Sri Lanka (+94)</option>
                  <option value="LR">🇱🇷 Libéria (+231)</option>
                  <option value="LS">🇱🇸 Lesoto (+266)</option>
                  <option value="LT">🇱🇹 Lituânia (+370)</option>
                  <option value="LU">🇱🇺 Luxemburgo (+352)</option>
                  <option value="LV">🇱🇻 Letônia (+371)</option>
                  <option value="LY">🇱🇾 Líbia (+218)</option>
                  <option value="MA">🇲🇦 Marrocos (+212)</option>
                  <option value="MC">🇲🇨 Mônaco (+377)</option>
                  <option value="MD">🇲🇩 Moldávia (+373)</option>
                  <option value="ME">🇲🇪 Montenegro (+382)</option>
                  <option value="MF">🇲🇫 São Martinho (+590)</option>
                  <option value="MG">🇲🇬 Madagascar (+261)</option>
                  <option value="MH">🇲🇭 Ilhas Marshall (+692)</option>
                  <option value="MK">🇲🇰 Macedônia do Norte (+389)</option>
                  <option value="ML">🇲🇱 Mali (+223)</option>
                  <option value="MM">🇲🇲 Myanmar (+95)</option>
                  <option value="MN">🇲🇳 Mongólia (+976)</option>
                  <option value="MO">🇲🇴 Macau (+853)</option>
                  <option value="MP">🇲🇵 Ilhas Marianas do Norte (+1670)</option>
                  <option value="MQ">🇲🇶 Martinica (+596)</option>
                  <option value="MR">🇲🇷 Mauritânia (+222)</option>
                  <option value="MS">🇲🇸 Montserrat (+1664)</option>
                  <option value="MT">🇲🇹 Malta (+356)</option>
                  <option value="MU">🇲🇺 Maurício (+230)</option>
                  <option value="MV">🇲🇻 Maldivas (+960)</option>
                  <option value="MW">🇲🇼 Malawi (+265)</option>
                  <option value="MX">🇲🇽 México (+52)</option>
                  <option value="MY">🇲🇾 Malásia (+60)</option>
                  <option value="MZ">🇲🇿 Moçambique (+258)</option>
                  <option value="NA">🇳🇦 Namíbia (+264)</option>
                  <option value="NC">🇳🇨 Nova Caledônia (+687)</option>
                  <option value="NE">🇳🇪 Níger (+227)</option>
                  <option value="NF">🇳🇫 Ilha Norfolk (+672)</option>
                  <option value="NG">🇳🇬 Nigéria (+234)</option>
                  <option value="NI">🇳🇮 Nicarágua (+505)</option>
                  <option value="NL">🇳🇱 Países Baixos (+31)</option>
                  <option value="NO">🇳🇴 Noruega (+47)</option>
                  <option value="NP">🇳🇵 Nepal (+977)</option>
                  <option value="NR">🇳🇷 Nauru (+674)</option>
                  <option value="NU">🇳🇺 Niue (+683)</option>
                  <option value="NZ">🇳🇿 Nova Zelândia (+64)</option>
                  <option value="OM">🇴🇲 Omã (+968)</option>
                  <option value="PA">🇵🇦 Panamá (+507)</option>
                  <option value="PE">🇵🇪 Peru (+51)</option>
                  <option value="PF">🇵🇫 Polinésia Francesa (+689)</option>
                  <option value="PG">🇵🇬 Papua-Nova Guiné (+675)</option>
                  <option value="PH">🇵🇭 Filipinas (+63)</option>
                  <option value="PK">🇵🇰 Paquistão (+92)</option>
                  <option value="PL">🇵🇱 Polônia (+48)</option>
                  <option value="PM">🇵🇲 São Pedro e Miquelon (+508)</option>
                  <option value="PN">🇵🇳 Ilhas Pitcairn (+64)</option>
                  <option value="PR">🇵🇷 Porto Rico (+1787)</option>
                  <option value="PS">🇵🇸 Palestina (+970)</option>
                  <option value="PT">🇵🇹 Portugal (+351)</option>
                  <option value="PW">🇵🇼 Palau (+680)</option>
                  <option value="PY">🇵🇾 Paraguai (+595)</option>
                  <option value="QA">🇶🇦 Catar (+974)</option>
                  <option value="RE">🇷🇪 Reunião (+262)</option>
                  <option value="RO">🇷🇴 Romênia (+40)</option>
                  <option value="RS">🇷🇸 Sérvia (+381)</option>
                  <option value="RU">🇷🇺 Rússia (+7)</option>
                  <option value="RW">🇷🇼 Ruanda (+250)</option>
                  <option value="SA">🇸🇦 Arábia Saudita (+966)</option>
                  <option value="SB">🇸🇧 Ilhas Salomão (+677)</option>
                  <option value="SC">🇸🇨 Seicheles (+248)</option>
                  <option value="SD">🇸🇩 Sudão (+249)</option>
                  <option value="SE">🇸🇪 Suécia (+46)</option>
                  <option value="SG">🇸🇬 Singapura (+65)</option>
                  <option value="SH">🇸🇭 Santa Helena (+290)</option>
                  <option value="SI">🇸🇮 Eslovênia (+386)</option>
                  <option value="SJ">🇸🇯 Svalbard e Jan Mayen (+47)</option>
                  <option value="SK">🇸🇰 Eslováquia (+421)</option>
                  <option value="SL">🇸🇱 Serra Leoa (+232)</option>
                  <option value="SM">🇸🇲 San Marino (+378)</option>
                  <option value="SN">🇸🇳 Senegal (+221)</option>
                  <option value="SO">🇸🇴 Somália (+252)</option>
                  <option value="SR">🇸🇷 Suriname (+597)</option>
                  <option value="SS">🇸🇸 Sudão do Sul (+211)</option>
                  <option value="ST">🇸🇹 São Tomé e Príncipe (+239)</option>
                  <option value="SV">🇸🇻 El Salvador (+503)</option>
                  <option value="SX">🇸🇽 Sint Maarten (+1721)</option>
                  <option value="SY">🇸🇾 Síria (+963)</option>
                  <option value="SZ">🇸🇿 Eswatini (+268)</option>
                  <option value="TC">🇹🇨 Ilhas Turks e Caicos (+1649)</option>
                  <option value="TD">🇹🇩 Chade (+235)</option>
                  <option value="TF">🇹🇫 Terras Austrais Francesas (+262)</option>
                  <option value="TG">🇹🇬 Togo (+228)</option>
                  <option value="TH">🇹🇭 Tailândia (+66)</option>
                  <option value="TJ">🇹🇯 Tajiquistão (+992)</option>
                  <option value="TK">🇹🇰 Tokelau (+690)</option>
                  <option value="TL">🇹🇱 Timor-Leste (+670)</option>
                  <option value="TM">🇹🇲 Turcomenistão (+993)</option>
                  <option value="TN">🇹🇳 Tunísia (+216)</option>
                  <option value="TO">🇹🇴 Tonga (+676)</option>
                  <option value="TR">🇹🇷 Turquia (+90)</option>
                  <option value="TT">🇹🇹 Trinidad e Tobago (+1868)</option>
                  <option value="TV">🇹🇻 Tuvalu (+688)</option>
                  <option value="TW">🇹🇼 Taiwan (+886)</option>
                  <option value="TZ">🇹🇿 Tanzânia (+255)</option>
                  <option value="UA">🇺🇦 Ucrânia (+380)</option>
                  <option value="UG">🇺🇬 Uganda (+256)</option>
                  <option value="UM">🇺🇲 Ilhas Menores dos EUA (+1)</option>
                  <option value="US">🇺🇸 Estados Unidos (+1)</option>
                  <option value="UY">🇺🇾 Uruguai (+598)</option>
                  <option value="UZ">🇺🇿 Uzbequistão (+998)</option>
                  <option value="VA">🇻🇦 Vaticano (+39)</option>
                  <option value="VC">🇻🇨 São Vicente e Granadinas (+1784)</option>
                  <option value="VE">🇻🇪 Venezuela (+58)</option>
                  <option value="VG">🇻🇬 Ilhas Virgens Britânicas (+1284)</option>
                  <option value="VI">🇻🇮 Ilhas Virgens Americanas (+1340)</option>
                  <option value="VN">🇻🇳 Vietnã (+84)</option>
                  <option value="VU">🇻🇺 Vanuatu (+678)</option>
                  <option value="WF">🇼🇫 Wallis e Futuna (+681)</option>
                  <option value="WS">🇼🇸 Samoa (+685)</option>
                  <option value="YE">🇾🇪 Iêmen (+967)</option>
                  <option value="YT">🇾🇹 Mayotte (+262)</option>
                  <option value="ZA">🇿🇦 África do Sul (+27)</option>
                  <option value="ZM">🇿🇲 Zâmbia (+260)</option>
                  <option value="ZW">🇿🇼 Zimbábue (+263)</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="Digite seu número"
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
          </div>

          {/* Publication Taxes */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Taxas de publicação
              </h3>
              <button
                onClick={() => setShowTaxes(!showTaxes)}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium transition-colors duration-200"
              >
                Ver taxas
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Taxa de publicação</span>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  - R$ {calculatePublicationTax().toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Arrecadação estimada</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  + R$ {calculateRevenue()}
                </span>
              </div>
            </div>

            {/* Tax Table Modal */}
            {showTaxes && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Tabela de Taxas
                    </h3>
                    <button
                      onClick={() => setShowTaxes(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-2 gap-px bg-gray-600">
                      <div className="bg-gray-700 px-4 py-3 text-center">
                        <span className="text-green-400 font-semibold">ARRECADAÇÃO</span>
                      </div>
                      <div className="bg-gray-700 px-4 py-3 text-center">
                        <span className="text-yellow-400 font-semibold">TAXA</span>
                      </div>
                    </div>
                    
                    {[
                      ['R$ 0,00 a R$ 100,00', 'R$ 7,00'],
                      ['R$ 100,00 a R$ 200,00', 'R$ 17,00'],
                      ['R$ 200,00 a R$ 400,00', 'R$ 27,00'],
                      ['R$ 400,00 a R$ 701,00', 'R$ 37,00'],
                      ['R$ 701,00 a R$ 1.000,00', 'R$ 47,00'],
                      ['R$ 1.000,00 a R$ 2.000,00', 'R$ 67,00'],
                      ['R$ 2.000,00 a R$ 4.000,00', 'R$ 77,00'],
                      ['R$ 4.000,00 a R$ 7.100,00', 'R$ 127,00'],
                      ['R$ 7.100,00 a R$ 10.000,00', 'R$ 197,00'],
                      ['R$ 10.000,00 a R$ 20.000,00', 'R$ 247,00'],
                      ['R$ 20.000,00 a R$ 30.000,00', 'R$ 497,00'],
                      ['R$ 30.000,00 a R$ 50.000,00', 'R$ 997,00'],
                      ['R$ 50.000,00 a R$ 70.000,00', 'R$ 1.497,00'],
                      ['R$ 70.000,00 a R$ 100.000,00', 'R$ 1.997,00'],
                      ['R$ 100.000,00 a R$ 150.000,00', 'R$ 2.997,00'],
                      ['Acima de R$ 150.000,00', 'R$ 3.997,00']
                    ].map(([range, tax], index) => (
                      <div key={index} className="grid grid-cols-2 gap-px bg-gray-600">
                        <div className="bg-gray-800 px-4 py-2 text-center">
                          <span className="text-green-400 text-sm">{range}</span>
                        </div>
                        <div className="bg-gray-800 px-4 py-2 text-center">
                          <span className="text-yellow-400 text-sm">{tax}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 dark:focus:ring-purple-600 focus:ring-2"
            />
            <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
              Ao criar esta campanha, você aceita nossos{' '}
              <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
                Termos de Uso
              </a>{' '}
              e a nossa{' '}
              <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
                Política de Privacidade
              </a>
              .
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              onClick={handleSaveDraft}
              disabled={loading || !formData.title.trim()}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>Salvar Rascunho</span>
            </button>
            
            <button
              onClick={handlePublish}
              disabled={loading || !formData.title.trim() || !formData.drawMethod || !acceptTerms}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Prosseguir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignPage;