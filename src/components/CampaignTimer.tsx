import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertTriangle } from 'lucide-react';

interface CampaignTimerProps {
  endDate: string;
  status: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

const CampaignTimer: React.FC<CampaignTimerProps> = ({ endDate, status }) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });

  const calculateTimeRemaining = (targetDate: string): TimeRemaining => {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, expired: false };
  };

  useEffect(() => {
    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining(endDate));
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  // Don't show timer for completed or cancelled campaigns
  if (status === 'completed' || status === 'cancelled') {
    return null;
  }

  const isUrgent = timeRemaining.days === 0 && timeRemaining.hours < 24;
  const isCritical = timeRemaining.days === 0 && timeRemaining.hours < 6;

  return (
    <div className={`rounded-2xl shadow-xl p-6 border transition-colors duration-300 ${
      timeRemaining.expired 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        : isCritical
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        : isUrgent
        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
    }`}>
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          {timeRemaining.expired ? (
            <AlertTriangle className="h-8 w-8 text-red-500 mr-2" />
          ) : (
            <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-2" />
          )}
          <h2 className={`text-xl font-bold ${
            timeRemaining.expired 
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-900 dark:text-white'
          }`}>
            {timeRemaining.expired ? 'Campanha Encerrada' : 'Tempo Restante'}
          </h2>
        </div>

        {!timeRemaining.expired ? (
          <>
            {/* Countdown Display */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  isCritical ? 'text-red-600 dark:text-red-400' :
                  isUrgent ? 'text-orange-600 dark:text-orange-400' :
                  'text-purple-600 dark:text-purple-400'
                }`}>
                  {timeRemaining.days.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">DIAS</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  isCritical ? 'text-red-600 dark:text-red-400' :
                  isUrgent ? 'text-orange-600 dark:text-orange-400' :
                  'text-purple-600 dark:text-purple-400'
                }`}>
                  {timeRemaining.hours.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">HORAS</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  isCritical ? 'text-red-600 dark:text-red-400' :
                  isUrgent ? 'text-orange-600 dark:text-orange-400' :
                  'text-purple-600 dark:text-purple-400'
                }`}>
                  {timeRemaining.minutes.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">MIN</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  isCritical ? 'text-red-600 dark:text-red-400' :
                  isUrgent ? 'text-orange-600 dark:text-orange-400' :
                  'text-purple-600 dark:text-purple-400'
                }`}>
                  {timeRemaining.seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">SEG</div>
              </div>
            </div>

            {/* Urgency Messages */}
            {isCritical && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3 mb-4">
                <p className="text-red-800 dark:text-red-300 text-sm font-medium">
                  ⚠️ Últimas horas! Garante já sua participação!
                </p>
              </div>
            )}
            
            {isUrgent && !isCritical && (
              <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg p-3 mb-4">
                <p className="text-orange-800 dark:text-orange-300 text-sm font-medium">
                  🔥 Últimas 24 horas! Não perca essa oportunidade!
                </p>
              </div>
            )}

            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Participe antes que o tempo acabe!
            </p>
          </>
        ) : (
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 font-medium mb-2">
              Esta campanha foi encerrada
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Fique atento às próximas oportunidades!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignTimer;