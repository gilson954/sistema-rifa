/**
 * Utility functions for formatting time durations
 */

/**
 * Formats minutes into a human-readable string
 * Examples:
 * - 10 -> "10 minutos"
 * - 60 -> "1 hora"
 * - 1440 -> "1 dia"
 * - 2880 -> "2 dias"
 */
export const formatReservationTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else {
      return `${hours} ${hours === 1 ? 'hora' : 'horas'} e ${remainingMinutes} ${remainingMinutes === 1 ? 'minuto' : 'minutos'}`;
    }
  }
  
  const days = Math.floor(minutes / 1440);
  const remainingHours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;
  
  let result = `${days} ${days === 1 ? 'dia' : 'dias'}`;
  
  if (remainingHours > 0) {
    result += ` e ${remainingHours} ${remainingHours === 1 ? 'hora' : 'horas'}`;
  }
  
  if (remainingMinutes > 0) {
    result += ` e ${remainingMinutes} ${remainingMinutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  return result;
};

/**
 * Formats minutes into a short human-readable string
 * Examples:
 * - 10 -> "10min"
 * - 60 -> "1h"
 * - 1440 -> "1d"
 */
const formatReservationTimeShort = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h${remainingMinutes}min`;
    }
  }
  
  const days = Math.floor(minutes / 1440);
  const remainingHours = Math.floor((minutes % 1440) / 60);
  
  if (remainingHours === 0) {
    return `${days}d`;
  } else {
    return `${days}d${remainingHours}h`;
  }
};