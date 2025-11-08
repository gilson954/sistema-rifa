        return {
            background: gradientStyle,
            backgroundSize: '200% 200%'
          };
        }
      }
      return {};
    }
    return { backgroundColor: primaryColor || '#3B82F6' };
  };

  const getColorClassName = (baseClasses: string = '') => {
    if (colorMode === 'gradient') {
      if (gradientClasses === 'custom' && customGradientColors) {
        return `${baseClasses} animate-gradient-x bg-[length:200%_200%]`;
      }
      if (gradientClasses && gradientClasses !== 'custom') {
        return `${baseClasses} bg-gradient-to-r ${gradientClasses} animate-gradient-x bg-[length:200%_200%]`;
      }
    }
    return baseClasses;
  };

  if (mode === 'manual') {
    return null;
  }

  const theme = getThemeClasses(campaignTheme);

  return (
    <div className={`quota-selector rounded-xl shadow-md p-4 sm:p-5 border transition-all duration-300 ${theme.cardBg} ${theme.border}`}>
      
      {/* Header com ícone */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
          <TrendingUp className={`w-4 h-4 ${theme.text}`} />
        </div>
        <h2 className={`text-lg font-bold ${theme.text} tracking-tight`}>
          Escolha suas Cotas
        </h2>
      </div>

      {/* Increment Buttons */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5 mb-4">
        {incrementButtons.map((button, index) => (
          <button
            key={index}
            onClick={() => handleIncrement(button.value)}
            className={getColorClassName(`
              relative overflow-hidden
              text-white py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg 
              font-bold text-xs sm:text-sm
              transition-all duration-300
              hover:scale-105 hover:shadow-lg
              active:scale-95
              before:absolute before:inset-0 before:bg-white/0 hover:before:bg-white/10
              before:transition-all before:duration-300
            `)}
            style={getColorStyle()}
          >
            <span className="relative z-10">{button.label}</span>
          </button>
        ))}
      </div>

      {/* Quantity Input - Novo Design */}
      <div className="flex items-center justify-center mb-4">
        <div className={`
          flex items-stretch rounded-md text-3xl font-semibold ring transition-all duration-200 
          ${theme.inputRing} ${theme.inputFocusRing} focus-within:ring-2
          ${promotionApplied ? 'ring-2 ring-green-500 animate-pulse' : ''}
        `}>
          <button
            aria-hidden
            tabIndex={-1}
            className={`flex items-center pl-[.5em] pr-[.325em] ${theme.text} disabled:opacity-30 disabled:cursor-not-allowed transition-opacity`}
            disabled={quantity <= minTicketsPerPurchase}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') {
                e.preventDefault();
                inputRef.current?.focus();
              }
              startIncrement(-1);
            }}
            onPointerUp={stopIncrement}
            onPointerLeave={stopIncrement}
          >
            <Minus className="size-4" strokeWidth={3.5} />
          </button>
          
          <div className="relative grid items-center justify-items-center text-center [grid-template-areas:'overlap'] *:[grid-area:overlap]">
            <input
              ref={inputRef}
              className={`
                caret-blue-500
                w-[3em] bg-transparent py-2 text-center font-[inherit] text-transparent outline-none
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
              `}
              style={{ fontKerning: 'none' }}
              type="number"
              min={minTicketsPerPurchase}
              step={1}
              autoComplete="off"
              inputMode="numeric"
              max={maxTicketsPerPurchase}
              value={quantity}
              onChange={handleQuantityChange}
            />
            <div 
              key={quantity}
              className={`
                pointer-events-none ${theme.text} font-semibold
                ${animationDirection === 'up' ? 'number-slide-up' : ''}
                ${animationDirection === 'down' ? 'number-slide-down' : ''}
              `}
              aria-hidden
              style={{ fontKerning: 'none' }}
            >
              {quantity.toLocaleString('pt-BR', { useGrouping: false })}
            </div>
          </div>
          
          <button
            aria-hidden
            tabIndex={-1}
            className={`flex items-center pl-[.325em] pr-[.5em] ${theme.text} disabled:opacity-30 disabled:cursor-not-allowed transition-opacity`}
            disabled={quantity >= maxTicketsPerPurchase}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') {
                e.preventDefault();
                inputRef.current?.focus();
              }
              startIncrement(1);
            }}
            onPointerUp={stopIncrement}
            onPointerLeave={stopIncrement}
          >
            <Plus className="size-4" strokeWidth={3.5} />
          </button>
        </div>
      </div>

      {/* Indicador de Promoção Aplicada */}
      {promotionApplied && (
        <div className="text-center mb-3 animate-fade-in">
          <div className="inline-block px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-green-500 text-sm font-semibold flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Promoção aplicada!
            </p>
          </div>
        </div>
      )}

      {/* Label de cotas */}
      <div className="text-center mb-4">
        <div 
          className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${theme.textSecondary}`}
          style={{ backgroundColor: campaignTheme === 'claro' ? '#00000020' : '#FFFFFF20' }}
        >
          {quantity === 1 ? 'cota' : 'cotas'}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="text-center mb-3">
          <div className="inline-block px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-500 text-sm font-semibold">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Total Value */}
      <div className={`text-center mb-4 mt-6 p-4 rounded-xl ${theme.inputBg} border ${theme.border}`}>
        {promotionInfo && (
          <div className="mb-1.5">
            <span className={`text-sm ${theme.textSecondary} line-through`}>
              {formatCurrency(promotionInfo.originalTotal)}
            </span>
            <span className="ml-2 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
              -{promotionInfo.discountPercentage}%
            </span>
          </div>
        )}
        <div className={`text-xs font-semibold ${theme.textSecondary} mb-1 tracking-wider uppercase`}>
          Valor Total
        </div>
        <div 
          className={`text-3xl font-black tracking-tight ${promotionInfo ? '' : theme.text}`}
          style={promotionInfo ? { color: '#10B981' } : {}}
        >
          R$ {calculateTotal()}
        </div>
        <div className={`text-xs ${theme.textSecondary} mt-1`}>
          {quantity}x R$ {ticketPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Buy Button */}
      <button
        onClick={onReserve}
        disabled={reserving || disabled || !onReserve}
        className={getColorClassName(`
          relative overflow-hidden
          w-full py-3 rounded-lg 
          font-black text-base tracking-wide
          transition-all duration-300 
          shadow-lg hover:shadow-xl
          disabled:opacity-50 disabled:cursor-not-allowed 
          text-white
          hover:scale-[1.02] active:scale-[0.98]
          before:absolute before:inset-0 before:bg-white/0 hover:before:bg-white/10
          before:transition-all before:duration-300
        `)}
        style={getColorStyle()}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {reserving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              RESERVANDO...
            </>
          ) : disabled ? (
            'INDISPONÍVEL'
          ) : (
            <>
              RESERVAR AGORA
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </span>
      </button>

      {/* Rodapé informativo */}
      <div className={`text-center mt-3 text-xs ${theme.textSecondary}`}>
        <div className="flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Compra 100% segura</span>
        </div>
      </div>
    </div>
  );
};

export default QuotaSelector;