import { useState, useEffect } from 'react';

/**
 * Custom hook for managing localStorage with TypeScript support
 * Automatically syncs state with localStorage and handles JSON serialization
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Remove item from localStorage
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
}

/**
 * Hook for managing user preferences
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useLocalStorage('user_preferences', {
    theme: 'dark',
    language: 'pt-BR',
    notifications: true,
    autoSave: true,
    showTutorials: true
  });

  const updatePreference = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return {
    preferences,
    updatePreference,
    setPreferences
  };
}