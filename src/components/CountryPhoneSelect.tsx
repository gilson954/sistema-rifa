import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Phone } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

interface CountryPhoneSelectProps {
  selectedCountry: Country;
  onCountryChange: (country: Country) => void;
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
  placeholder?: string;
  error?: string;
  theme?: 'claro' | 'escuro' | 'escuro-preto';
}

const countries: Country[] = [
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colômbia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪' },
  { code: 'UY', name: 'Uruguai', dialCode: '+598', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguai', dialCode: '+595', flag: '🇵🇾' },
  { code: 'BO', name: 'Bolívia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'EC', name: 'Equador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'ES', name: 'Espanha', dialCode: '+34', flag: '🇪🇸' },
  { code: 'FR', name: 'França', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Itália', dialCode: '+39', flag: '🇮🇹' },
  { code: 'DE', name: 'Alemanha', dialCode: '+49', flag: '🇩🇪' },
  { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧' },
  { code: 'JP', name: 'Japão', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'Índia', dialCode: '+91', flag: '🇮🇳' },
  { code: 'AU', name: 'Austrália', dialCode: '+61', flag: '🇦🇺' },
  { code: 'ZA', name: 'África do Sul', dialCode: '+27', flag: '🇿🇦' },
  { code: 'RU', name: 'Rússia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'KR', name: 'Coreia do Sul', dialCode: '+82', flag: '🇰🇷' },
  { code: 'TH', name: 'Tailândia', dialCode: '+66', flag: '🇹🇭' },
  { code: 'SG', name: 'Singapura', dialCode: '+65', flag: '🇸🇬' },
  { code: 'MY', name: 'Malásia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'ID', name: 'Indonésia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'PH', name: 'Filipinas', dialCode: '+63', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnã', dialCode: '+84', flag: '🇻🇳' },
  { code: 'TR', name: 'Turquia', dialCode: '+90', flag: '🇹🇷' },
  { code: 'EG', name: 'Egito', dialCode: '+20', flag: '🇪🇬' },
  { code: 'NG', name: 'Nigéria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Quênia', dialCode: '+254', flag: '🇰🇪' },
  { code: 'GH', name: 'Gana', dialCode: '+233', flag: '🇬🇭' },
  { code: 'MA', name: 'Marrocos', dialCode: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: 'Argélia', dialCode: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunísia', dialCode: '+216', flag: '🇹🇳' }
];

const CountryPhoneSelect: React.FC<CountryPhoneSelectProps> = ({
  selectedCountry,
  onCountryChange,
  phoneNumber,
  onPhoneChange,
  placeholder = "Número de telefone",
  error,
  theme
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sistema de temas aprimorado
  const getThemeClasses = () => {
    if (!theme) {
      return {
        buttonBg: 'bg-white dark:bg-gray-800',
        buttonBorder: 'border-gray-300 dark:border-gray-600',
        buttonHoverBorder: 'hover:border-purple-400 dark:hover:border-purple-500',
        buttonText: 'text-gray-900 dark:text-white',
        iconColor: 'text-gray-400 dark:text-gray-300',
        dropdownBg: 'bg-white dark:bg-gray-800',
        dropdownBorder: 'border-gray-200/50 dark:border-gray-700/50',
        headerBg: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
        headerBorder: 'border-gray-200/50 dark:border-gray-600/50',
        inputBg: 'bg-white dark:bg-gray-700',
        inputBorder: 'border-gray-300 dark:border-gray-600',
        inputText: 'text-gray-900 dark:text-white',
        inputPlaceholder: 'placeholder-gray-400 dark:placeholder-gray-300',
        clearButtonHover: 'hover:bg-gray-200 dark:hover:bg-gray-600',
        itemHover: 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
        itemSelected: 'bg-purple-50 dark:bg-purple-900/30',
        itemSelectedBorder: 'border-purple-600 dark:border-purple-400',
        itemTextPrimary: 'text-gray-900 dark:text-white',
        itemTextSecondary: 'text-gray-600 dark:text-gray-400',
        itemSelectedTextPrimary: 'text-purple-700 dark:text-purple-300',
        itemSelectedTextSecondary: 'text-purple-600 dark:text-purple-400',
        dotColor: 'bg-purple-600 dark:bg-purple-400',
        footerBg: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
        footerBorder: 'border-gray-200/50 dark:border-gray-600/50',
        footerText: 'text-gray-500 dark:text-gray-300',
        labelText: 'text-gray-900 dark:text-gray-100'
      };
    }

    if (theme === 'claro') {
      return {
        buttonBg: 'bg-white',
        buttonBorder: 'border-gray-300',
        buttonHoverBorder: 'hover:border-purple-400',
        buttonText: 'text-gray-900',
        iconColor: 'text-gray-400',
        dropdownBg: 'bg-white',
        dropdownBorder: 'border-gray-200/50',
        headerBg: 'bg-gradient-to-br from-gray-50 to-gray-100',
        headerBorder: 'border-gray-200/50',
        inputBg: 'bg-white',
        inputBorder: 'border-gray-300',
        inputText: 'text-gray-900',
        inputPlaceholder: 'placeholder-gray-400',
        clearButtonHover: 'hover:bg-gray-200',
        itemHover: 'hover:bg-gray-50',
        itemSelected: 'bg-purple-50',
        itemSelectedBorder: 'border-purple-600',
        itemTextPrimary: 'text-gray-900',
        itemTextSecondary: 'text-gray-600',
        itemSelectedTextPrimary: 'text-purple-700',
        itemSelectedTextSecondary: 'text-purple-600',
        dotColor: 'bg-purple-600',
        footerBg: 'bg-gradient-to-br from-gray-50 to-gray-100',
        footerBorder: 'border-gray-200/50',
        footerText: 'text-gray-500',
        labelText: 'text-gray-900'
      };
    }

    // theme === 'escuro' ou 'escuro-preto'
    return {
      buttonBg: 'bg-gray-800',
      buttonBorder: 'border-gray-600',
      buttonHoverBorder: 'hover:border-purple-500',
      buttonText: 'text-white',
      iconColor: 'text-gray-300',
      dropdownBg: 'bg-gray-800',
      dropdownBorder: 'border-gray-700/50',
      headerBg: 'bg-gradient-to-br from-gray-800 to-gray-900',
      headerBorder: 'border-gray-600/50',
      inputBg: 'bg-gray-700',
      inputBorder: 'border-gray-600',
      inputText: 'text-white',
      inputPlaceholder: 'placeholder-gray-300',
      clearButtonHover: 'hover:bg-gray-600',
      itemHover: 'hover:bg-gray-700/50',
      itemSelected: 'bg-purple-900/30',
      itemSelectedBorder: 'border-purple-400',
      itemTextPrimary: 'text-white',
      itemTextSecondary: 'text-gray-400',
      itemSelectedTextPrimary: 'text-purple-300',
      itemSelectedTextSecondary: 'text-purple-400',
      dotColor: 'bg-purple-400',
      footerBg: 'bg-gradient-to-br from-gray-800 to-gray-900',
      footerBorder: 'border-gray-600/50',
      footerText: 'text-gray-300',
      labelText: 'text-gray-100'
    };
  };

  const themeClasses = getThemeClasses();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountrySelect = (country: Country) => {
    onCountryChange(country);
    setIsOpen(false);
    setSearchTerm('');
  };

  const formatPhoneNumber = (value: string, countryCode: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (countryCode === 'BR') {
      const limitedNumbers = numbers.slice(0, 11);
      
      if (limitedNumbers.length <= 2) {
        return limitedNumbers;
      } else if (limitedNumbers.length <= 7) {
        return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
      } else {
        return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
      }
    } else if (countryCode === 'US' || countryCode === 'CA') {
      const limitedNumbers = numbers.slice(0, 10);
      
      if (limitedNumbers.length <= 3) {
        return limitedNumbers;
      } else if (limitedNumbers.length <= 6) {
        return `(${limitedNumbers.slice(0, 3)}) ${limitedNumbers.slice(3)}`;
      } else {
        return `(${limitedNumbers.slice(0, 3)}) ${limitedNumbers.slice(3, 6)}-${limitedNumbers.slice(6)}`;
      }
    } else {
      return numbers.slice(0, 15);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value, selectedCountry.code);
    onPhoneChange(formattedValue);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className={`block text-sm font-bold ${themeClasses.labelText} mb-2`}>
      </label>
      
      <div className="flex space-x-3">
        {/* Country Selector - Modernizado */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`group flex items-center space-x-2.5 px-4 h-[56px] ${themeClasses.buttonBg} border-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${
              error 
                ? 'border-red-500 hover:border-red-600' 
                : isOpen
                ? 'border-purple-500 ring-2 ring-purple-500/20'
                : `${themeClasses.buttonBorder} ${themeClasses.buttonHoverBorder}`
            } focus:outline-none hover:scale-[1.02] active:scale-[0.98]`}
          >
            <span className="text-2xl">{selectedCountry.flag}</span>
            <span className={`text-sm font-bold ${themeClasses.buttonText}`}>
              {selectedCountry.dialCode}
            </span>
            <ChevronDown className={`h-4 w-4 ${themeClasses.iconColor} transition-all duration-200 ${isOpen ? 'rotate-180 text-purple-600' : 'group-hover:text-purple-500'}`} />
          </button>

          {/* Dropdown Modernizado */}
          {isOpen && (
            <div className={`absolute top-full left-0 mt-2 w-96 ${themeClasses.dropdownBg} border-2 ${themeClasses.dropdownBorder} rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-sm animate-in slide-in-from-top-4 fade-in duration-200`}>
              
              {/* Search Header com gradiente */}
              <div className={`p-4 ${themeClasses.headerBg} border-b ${themeClasses.headerBorder}`}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar país..."
                    className={`w-full pl-12 pr-10 py-3 ${themeClasses.inputBg} border-2 ${themeClasses.inputBorder} rounded-xl ${themeClasses.inputText} ${themeClasses.inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm transition-all duration-200`}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 ${themeClasses.clearButtonHover} rounded-lg transition-all duration-200 hover:scale-110`}
                    >
                      <X className={`h-4 w-4 ${themeClasses.iconColor}`} />
                    </button>
                  )}
                </div>
              </div>

              {/* Countries List com animações */}
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {filteredCountries.map((country, index) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    style={{ animationDelay: `${index * 20}ms` }}
                    className={`w-full flex items-center space-x-4 px-4 py-3.5 text-left transition-all duration-150 animate-in fade-in slide-in-from-left-2 ${
                      selectedCountry.code === country.code 
                        ? `${themeClasses.itemSelected} border-l-4 ${themeClasses.itemSelectedBorder}` 
                        : `${themeClasses.itemHover} border-l-4 border-transparent hover:border-l-purple-300`
                    }`}
                  >
                    <span className="text-3xl transform transition-transform duration-200 hover:scale-110">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm font-bold ${
                          selectedCountry.code === country.code 
                            ? themeClasses.itemSelectedTextPrimary
                            : themeClasses.itemTextPrimary
                        }`}>
                          {country.dialCode}
                        </span>
                        <span className={`text-sm truncate ${
                          selectedCountry.code === country.code 
                            ? `${themeClasses.itemSelectedTextSecondary} font-semibold`
                            : themeClasses.itemTextSecondary
                        }`}>
                          {country.name}
                        </span>
                      </div>
                    </div>
                    {selectedCountry.code === country.code && (
                      <div className={`w-2.5 h-2.5 ${themeClasses.dotColor} rounded-full animate-pulse shadow-lg`}></div>
                    )}
                  </button>
                ))}
                
                {filteredCountries.length === 0 && (
                  <div className="px-4 py-12 text-center">
                    <div className="text-6xl mb-4 animate-bounce">🔍</div>
                    <p className={`${themeClasses.itemTextPrimary} text-sm font-bold mb-1`}>
                      Nenhum país encontrado
                    </p>
                    <p className={`${themeClasses.footerText} text-xs`}>
                      Tente buscar por nome ou código
                    </p>
                  </div>
                )}
              </div>

              {/* Footer com gradiente */}
              <div className={`p-3 ${themeClasses.footerBg} border-t ${themeClasses.footerBorder}`}>
                <p className={`text-xs ${themeClasses.footerText} text-center font-medium`}>
                  {filteredCountries.length} {filteredCountries.length === 1 ? 'país' : 'países'} {searchTerm && 'encontrado(s)'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input - Modernizado */}
        <div className="flex-1 relative">
          <div className="relative">
            <Phone className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${themeClasses.iconColor} transition-colors duration-200`} />
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder={placeholder}
              className={`w-full h-[56px] pl-12 pr-12 border-2 rounded-xl ${themeClasses.buttonBg} ${themeClasses.inputText} ${themeClasses.inputPlaceholder} focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md ${
                error 
                  ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/20' 
                  : `${themeClasses.buttonBorder} focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20`
              }`}
              required
            />
            {phoneNumber && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-3 flex items-center space-x-2 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2 fade-in">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
          border-radius: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #9333ea 0%, #4f46e5 100%);
        }
      `}</style>
    </div>
  );
};

export default CountryPhoneSelect;