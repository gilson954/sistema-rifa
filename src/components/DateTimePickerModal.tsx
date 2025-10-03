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
}

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedDate,
  minDate = new Date(),
}) => {
  const [tempDate, setTempDate] = useState<Date | null>(selectedDate);
  const [tempTime, setTempTime] = useState<string>('');

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden text-white shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Selecione a data e hora do sorteio</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-200">Calendário</h3>
              </div>
              <div className="date-picker-modal-calendar">
                <DatePicker
                  selected={tempDate}
                  onChange={handleDateChange}
                  inline
                  minDate={minDate}
                  locale="pt-BR"
                  calendarClassName="modal-calendar-dark"
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

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-200">Horário</h3>
              </div>
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  <div className="p-2 space-y-1">
                    {timeSlots.map((time) => {
                      const disabled = isTimeDisabled(time);
                      const isSelected = tempTime === time;

                      return (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          disabled={disabled}
                          className={`w-full px-4 py-2.5 rounded-lg text-center font-medium transition-all duration-200 ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-lg border-2 border-blue-400'
                              : disabled
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                              : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-2 border-transparent'
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

        <div className="p-6 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400">
              {tempDate && tempTime ? (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Selecionado: {tempDate.toLocaleDateString('pt-BR')} às {tempTime}
                  </span>
                </div>
              ) : (
                <span>Selecione uma data e horário</span>
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
          background-color: #1f2937;
          border: 1px solid #374151;
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
          background-color: #374151;
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
          color: #e5e7eb;
          width: 2.5rem;
          height: 2.5rem;
          line-height: 2.5rem;
          margin: 0.25rem;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .date-picker-modal-calendar .react-datepicker__day:hover {
          background-color: #374151;
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
          background-color: #374151;
          color: #60a5fa;
          font-weight: 600;
        }

        .date-picker-modal-calendar .react-datepicker__day--disabled {
          color: #4b5563 !important;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .date-picker-modal-calendar .react-datepicker__day--outside-month {
          color: #4b5563;
          opacity: 0.5;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default DateTimePickerModal;
