import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Phone } from 'lucide-react';
import FlagIcon from './FlagIcon';

interface Country {
  code: string;
  name: string;
  dialCode: string;
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
  { code: 'BR', name: 'Brasil', dialCode: '+55' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1' },
  { code: 'CA', name: 'Canadá', dialCode: '+1' },
  { code: 'AR', name: 'Argentina', dialCode: '+54' },
  { code: 'CL', name: 'Chile', dialCode: '+56' },
  { code: 'CO', name: 'Colômbia', dialCode: '+57' },
  { code: 'PE', name: 'Peru', dialCode: '+51' },
  { code: 'UY', name: 'Uruguai', dialCode: '+598' },
  { code: 'PY', name: 'Paraguai', dialCode: '+595' },
  { code: 'BO', name: 'Bolívia', dialCode: '+591' },
  { code: 'EC', name: 'Equador', dialCode: '+593' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58' },
  { code: 'MX', name: 'México', dialCode: '+52' },
  { code: 'PT', name: 'Portugal', dialCode: '+351' },
  { code: 'ES', name: 'Espanha', dialCode: '+34' },
  { code: 'FR', name: 'França', dialCode: '+33' },
  { code: 'IT', name: 'Itália', dialCode: '+39' },
  { code: 'DE', name: 'Alemanha', dialCode: '+49' },
  { code: 'GB', name: 'Reino Unido', dialCode: '+44' },
  { code: 'JP', name: 'Japão', dialCode: '+81' },
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'IN', name: 'Índia', dialCode: '+91' },
  { code: 'AU', name: 'Austrália', dialCode: '+61' },
  { code: 'ZA', name: 'África do Sul', dialCode: '+27' },
  { code: 'RU', name: 'Rússia', dialCode: '+7' },
  { code: 'KR', name: 'Coreia do Sul', dialCode: '+82' },
  { code: 'TH', name: 'Tailândia', dialCode: '+66' },
  { code: 'SG', name: 'Singapura', dialCode: '+65' },
  { code: 'MY', name: 'Malásia', dialCode: '+60' },
  { code: 'ID', name: 'Indonésia', dialCode: '+62' },
  { code: 'PH', name: 'Filipinas', dialCode: '+63' },
  { code: 'VN', name: 'Vietnã', dialCode: '+84' },
  { code: 'TR', name: 'Turquia', dialCode: '+90' },
  { code: 'EG', name: 'Egito', dialCode: '+20' },
  { code: 'NG', name: 'Nigéria', dialCode: '+234' },
  { code: 'KE', name: 'Quênia', dialCode: '+254' },
  { code: 'GH', name: 'Gana', dialCode: '+233' },
  { code: 'MA', name: 'Marrocos', dialCode: '+212' },
  { code: 'DZ', name: 'Argélia', dialCode: '+213' },
  { code: 'TN', name: 'Tunísia', dialCode: '+216' }
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

  const getThemeClasses = () => {
    if (!theme) {
      return {
        buttonBg: 'bg-white dark:bg-gray-800',
        buttonBorder: 'border-gray-300 dark:border-gray-600',
        buttonHoverBorder: 'hover:border-blue-400 dark:hover:border-blue-500',
        buttonText: 'text-gray-900 dark:text-white',
        iconColor: 'text-gray-400 dark:text-gray-300',
        dropdownBg: 'bg-white dark:bg-gray-800',
        dropdownBorder: 'border-gray-200 dark:border-gray-700',
        inputBg: 'bg-gray-50 dark:bg-gray-700',
        inputBorder: 'border-gray-300 dark:border-gray-600',
        inputText: 'text-gray-900 dark:text-white',
        inputPlaceholder: 'placeholder-gray-400 dark:placeholder-gray-400',
        itemHover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
        itemSelected: 'bg-blue-50 dark:bg-blue-900/20',
        itemTextPrimary: 'text-gray-900 dark:text-white',
        itemTextSecondary: 'text-gray-500 dark:text-gray-400',
        labelText: 'text-gray-900 dark:text-gray-100'
      };
    }

    if (theme === 'claro') {
      return {
        buttonBg: 'bg-white',
        buttonBorder: 'border-gray-300',
        buttonHoverBorder: 'hover:border-blue-400',
        buttonText: 'text-gray-900',
        iconColor: 'text-gray-400',
        dropdownBg: 'bg-white',
        dropdownBorder: 'border-gray-200',
        inputBg: 'bg-gray-50',
        inputBorder: 'border-gray-300',
        inputText: 'text-gray-900',
        inputPlaceholder: 'placeholder-gray-400',
        itemHover: 'hover:bg-gray-50',
        itemSelected: 'bg-blue-50',
        itemTextPrimary: 'text-gray-900',
        itemTextSecondary: 'text-gray-500',
        labelText: 'text-gray-900'
      };
    }

    return {
      buttonBg: 'bg-gray-800',
      buttonBorder: 'border-gray-600',
      buttonHoverBorder: 'hover:border-blue-500',
      buttonText: 'text-white',
      iconColor: 'text-gray-300',
      dropdownBg: 'bg-gray-800',
      dropdownBorder: 'border-gray-700',
      inputBg: 'bg-gray-700',
      inputBorder: 'border-gray-600',
      inputText: 'text-white',
      inputPlaceholder: 'placeholder-gray-400',
      itemHover: 'hover:bg-gray-700',
      itemSelected: 'bg-blue-900/20',
      itemTextPrimary: 'text-white',
      itemTextSecondary: 'text-gray-400',
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
      <label className={`block text-sm font-semibold ${themeClasses.labelText} mb-2`}>
        Número de Telefone
      </label>
      
      <div className="flex space-x-2">
        {/* Country Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`group flex items-center justify-center space-x-2 px-3 h-[48px] min-w-[90px] ${themeClasses.buttonBg} border ${themeClasses.buttonBorder} rounded-lg transition-all duration-200 ${
              error 
                ? 'border-red-500 hover:border-red-600' 
                : isOpen
                ? 'border-blue-500 ring-2 ring-blue-500/20'
                : themeClasses.buttonHoverBorder
            } focus:outline-none hover:shadow-sm`}
          >
            <FlagIcon countryCode={selectedCountry.code} size="md" theme={theme} />
            <ChevronDown className={`h-4 w-4 ${themeClasses.iconColor} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div 
              className={`absolute top-full left-0 mt-2 w-80 ${themeClasses.dropdownBg} border ${themeClasses.dropdownBorder} rounded-lg shadow-2xl z-50 overflow-hidden`}
              style={{
                animation: 'slideDown 0.2s ease-out'
              }}
            >
              {/* Search Input */}
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${themeClasses.iconColor}`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search country..."
                    className={`w-full pl-9 pr-9 py-2 ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-md ${themeClasses.inputText} ${themeClasses.inputPlaceholder} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm`}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors`}
                    >
                      <X className={`h-4 w-4 ${themeClasses.iconColor}`} />
                    </button>
                  )}
                </div>
              </div>

              {/* Countries List */}
              <div
                className={`max-h-72 overflow-y-auto ${
                  theme === 'claro' ? 'custom-scrollbar-light' : 'custom-scrollbar-dark'
                }`}
              >
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                      selectedCountry.code === country.code 
                        ? themeClasses.itemSelected
                        : themeClasses.itemHover
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FlagIcon countryCode={country.code} size="lg" theme={theme} />
                      <span className={`text-sm font-medium truncate ${themeClasses.itemTextPrimary}`}>
                        {country.name}
                      </span>
                    </div>
                    <span className={`text-sm ${themeClasses.itemTextSecondary} ml-2 flex-shrink-0`}>
                      {country.dialCode}
                    </span>
                  </button>
                ))}
                
                {filteredCountries.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className={`${themeClasses.itemTextPrimary} text-sm`}>
                      Nenhum país encontrado
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <div className="flex-1 relative">
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            className={`w-full h-[48px] px-4 border ${themeClasses.buttonBg} ${themeClasses.inputText} ${themeClasses.inputPlaceholder} focus:outline-none transition-all duration-200 rounded-lg ${
              error 
                ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/20' 
                : `${themeClasses.buttonBorder} focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`
            }`}
            required
          />
        </div>
      </div>
      
      {error && (
        <div className="mt-2 flex items-center space-x-2 text-red-600 dark:text-red-400">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CountryPhoneSelect;