import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pt-BR', ptBR);

interface DateTimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  selectedDate: Date | null;
  minDate?: Date;
  campaignTheme?: string;
}

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedDate,
  minDate = new Date(),
  campaignTheme = 'claro',
}) => {
  const [tempDate, setTempDate] = useState<Date | null>(selectedDate);
  const [tempTime, setTempTime] = useState<string>('');

  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'claro':
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
          border: 'border-gray-200',
          buttonBg: 'bg-gray-100',
          buttonHover: 'hover:bg-gray-200',
          overlayBg: 'bg-gray-900/40',
          calendarBg: '#f9fafb',
          calendarBorder: '#e5e7eb',
          calendarHeaderBg: '#f3f4f6',
          dayColor: '#111827',
          dayHoverBg: '#e5e7eb',
          dayDisabledColor: '#9ca3af',
        };
      case 'escuro':
        return {
          background: 'bg-gray-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-800',
          border: 'border-gray-600',
          buttonBg: 'bg-gray-700',
          buttonHover: 'hover:bg-gray-600',
          overlayBg: 'bg-black/60',
          calendarBg: '#1f2937',
          calendarBorder: '#374151',
          calendarHeaderBg: '#374151',
          dayColor: '#e5e7eb',
          dayHoverBg: '#374151',
          dayDisabledColor: '#4b5563',
        };
      case 'escuro-preto':
        return {
          background: 'bg-gray-900',
          text: 'text-white',
          textSecondary: 'text-gray-300',
          cardBg: 'bg-gray-800',
          border: 'border-gray-700',
          buttonBg: 'bg-gray-700',
          buttonHover: 'hover:bg-gray-600',
          overlayBg: 'bg-black/60',
          calendarBg: '#1f2937',
          calendarBorder: '#374151',
          calendarHeaderBg: '#374151',
          dayColor: '#e5e7eb',
          dayHoverBg: '#374151',
          dayDisabledColor: '#4b5563',
        };
      case 'escuro-cinza':
        return {
          background: 'bg-[#1A1A1A]',
          text: 'text-white',
          textSecondary: 'text-gray-400',
          cardBg: 'bg-[#141414]',
          border: 'border-[#1f1f1f]',
          buttonBg: 'bg-[#2C2C2C]',
          buttonHover: 'hover:bg-[#3C3C3C]',
          overlayBg: 'bg-black/60',
          calendarBg: '#2C2C2C',
          calendarBorder: '#3C3C3C',
          calendarHeaderBg: '#3C3C3C',
          dayColor: '#ffffff',
          dayHoverBg: '#3C3C3C',
          dayDisabledColor: '#6b7280',
        };
      default:
        return {
          background: 'bg-white',
          text: 'text-gray-900',
          textSecondary: 'text-gray-600',
          cardBg: 'bg-gray-50',
          border: 'border-gray-200',
          buttonBg: 'bg-gray-100',
          buttonHover: 'hover:bg-gray-200',
          overlayBg: 'bg-gray-900/40',
          calendarBg: '#f9fafb',
          calendarBorder: '#e5e7eb',
          calendarHeaderBg: '#f3f4f6',
          dayColor: '#111827',
          dayHoverBg: '#e5e7eb',
          dayDisabledColor: '#9ca3af',
        };
    }
  };

  const themeClasses = getThemeClasses(campaignTheme);

  useEffect(() => {
    if (isOpen) {
      if (selectedDate) {
        setTempDate(selectedDate);
        const hours = selectedDate.getHours().toString().padStart(2, '0');
        const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
        setTempTime(`${hours}:${minutes}`);
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(20, 0, 0, 0);
        setTempDate(tomorrow);
        setTempTime('20:00');
      }
    }
  }, [isOpen, selectedDate]);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  }, []);

  const isTimeDisabled = (time: string): boolean => {
    if (!tempDate) return false;

    const now = new Date();
    const selectedDateOnly = new Date(tempDate);
    selectedDateOnly.setHours(0, 0, 0, 0);

    const todayOnly = new Date(now);
    todayOnly.setHours(0, 0, 0, 0);

    if (selectedDateOnly.getTime() === todayOnly.getTime()) {
      const [hours, minutes] = time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      const nowInMinutes = now.getHours() * 60 + now.getMinutes();
      return timeInMinutes <= nowInMinutes;
    }

    return false;
  };

  const handleDateChange = (date: Date | null) => {
    setTempDate(date);
  };

  const handleTimeSelect = (time: string) => {
    if (!isTimeDisabled(time)) {
      setTempTime(time);
    }
  };

  const handleConfirm = () => {
    if (tempDate && tempTime) {
      const [hours, minutes] = tempTime.split(':').map(Number);
      const finalDate = new Date(tempDate);
      finalDate.setHours(hours, minutes, 0, 0);
      onConfirm(finalDate);
      onClose();
    }
  };

  const handleClose = () => {
    setTempDate(selectedDate);
    setTempTime('');
    onClose();
  };

  const isConfirmEnabled = tempDate !== null && tempTime !== '';

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${themeClasses.overlayBg} flex items-center justify-center z-50 p-4`}>
      <div className={`${themeClasses.background} rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto ${themeClasses.text} shadow-2xl custom-scrollbar-dark`}>
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${themeClasses.border} sticky top-0 ${themeClasses.background} z-10`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold">Selecione a data e hora do sorteio</h2>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-full ${themeClasses.buttonHover} transition-colors duration-200`}
          >
            <X className={`h-6 w-6 ${themeClasses.textSecondary}`} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendário */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h3 className={`text-lg font-semibold ${themeClasses.textSecondary}`}>Calendário</h3>
              </div>
              <div className="date-picker-modal-calendar">
                <DatePicker
                  selected={tempDate}
                  onChange={handleDateChange}
                  inline
                  minDate={minDate}
                  locale="pt-BR"
                  calendarClassName="modal-calendar-themed"
                  renderCustomHeader={({
                    date,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                  }) => (
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-t-xl">
                      <button
                        onClick={decreaseMonth}
                        disabled={prevMonthButtonDisabled}
                        type="button"
                        className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <span className="text-white font-bold text-base capitalize">
                        {date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </span>

                      <button
                        onClick={increaseMonth}
                        disabled={nextMonthButtonDisabled}
                        type="button"
                        className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Horários */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className={`text-lg font-semibold ${themeClasses.textSecondary}`}>Horário</h3>
              </div>
              <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.border} overflow-hidden`}>
                <div className="max-h-[300px] lg:max-h-[400px] overflow-y-auto custom-scrollbar">
                  <div className="p-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 lg:gap-1">
                    {timeSlots.map((time) => {
                      const disabled = isTimeDisabled(time);
                      const isSelected = tempTime === time;

                      return (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          disabled={disabled}
                          className={`w-full px-3 py-2 lg:px-4 lg:py-2.5 rounded-lg text-center font-medium transition-all duration-200 text-sm lg:text-base ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-lg border-2 border-blue-400'
                              : disabled
                              ? `${themeClasses.buttonBg} ${themeClasses.textSecondary} cursor-not-allowed opacity-50`
                              : `${themeClasses.buttonBg} ${themeClasses.text} ${themeClasses.buttonHover} border-2 border-transparent`
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 sm:p-6 border-t ${themeClasses.border} ${themeClasses.cardBg} sticky bottom-0`}>
          <div className="mb-4">
            <div className="text-sm">
              {tempDate && tempTime ? (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-semibold">
                    Selecionado: {tempDate.toLocaleDateString('pt-BR')} às {tempTime}
                  </span>
                </div>
              ) : (
                <span className={themeClasses.textSecondary}>Selecione uma data e horário</span>
              )}
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmEnabled}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-base transition-all duration-200 shadow-lg disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      </div>

      <style>{`
        .date-picker-modal-calendar .react-datepicker {
          background-color: ${themeClasses.calendarBg};
          border: 1px solid ${themeClasses.calendarBorder};
          border-radius: 0.75rem;
          font-family: inherit;
          width: 100%;
        }

        .date-picker-modal-calendar .react-datepicker__month-container {
          width: 100%;
        }

        .date-picker-modal-calendar .react-datepicker__header {
          background-color: transparent;
          border-bottom: none;
          padding: 0;
        }

        .date-picker-modal-calendar .react-datepicker__day-names {
          display: flex;
          justify-content: space-around;
          padding: 0.75rem 0.5rem;
          background-color: ${themeClasses.calendarHeaderBg};
          margin: 0;
        }

        .date-picker-modal-calendar .react-datepicker__day-name {
          color: #9ca3af;
          font-weight: 600;
          font-size: 0.875rem;
          width: 2.5rem;
          line-height: 2.5rem;
          margin: 0;
        }

        .date-picker-modal-calendar .react-datepicker__month {
          margin: 0;
          padding: 0.5rem;
        }

        .date-picker-modal-calendar .react-datepicker__week {
          display: flex;
          justify-content: space-around;
        }

        .date-picker-modal-calendar .react-datepicker__day {
          color: ${themeClasses.dayColor};
          width: 2.5rem;
          height: 2.5rem;
          line-height: 2.5rem;
          margin: 0.25rem;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .date-picker-modal-calendar .react-datepicker__day:hover {
          background-color: ${themeClasses.dayHoverBg};
          color: #fff;
        }

        .date-picker-modal-calendar .react-datepicker__day--selected {
          background-color: #2563eb !important;
          color: #fff !important;
          font-weight: 700;
          box-shadow: 0 0 0 2px #60a5fa;
        }

        .date-picker-modal-calendar .react-datepicker__day--keyboard-selected {
          background-color: #1e40af;
          color: #fff;
        }

        .date-picker-modal-calendar .react-datepicker__day--today {
          background-color: ${themeClasses.dayHoverBg};
          color: #60a5fa;
          font-weight: 600;
        }

        .date-picker-modal-calendar .react-datepicker__day--disabled {
          color: ${themeClasses.dayDisabledColor} !important;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .date-picker-modal-calendar .react-datepicker__day--outside-month {
          color: ${themeClasses.dayDisabledColor};
          opacity: 0.5;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${themeClasses.calendarBg};
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }

        /* Responsividade adicional */
        @media (max-width: 640px) {
          .date-picker-modal-calendar .react-datepicker__day {
            width: 2rem;
            height: 2rem;
            line-height: 2rem;
            font-size: 0.875rem;
          }
          
          .date-picker-modal-calendar .react-datepicker__day-name {
            width: 2rem;
            line-height: 2rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DateTimePickerModal;