// src/hooks/useLocalStorage.ts - Hook para localStorage com TypeScript completo
import { useState, useEffect, useCallback } from 'react';

// Interface para configurações avançadas
interface LocalStorageOptions<T> {
  serializer?: {
    parse: (value: string) => T;
    stringify: (value: T) => string;
  };
  defaultValue: T;
  errorCallback?: (error: Error) => void;
  syncAcrossTabs?: boolean;
}

// Hook principal
export const useLocalStorage = <T>(
  key: string, 
  initialValue: T,
  options?: Partial<LocalStorageOptions<T>>
): [T, (value: T | ((val: T) => T)) => void, () => void] => {
  
  // Configurações padrão
  const opts: LocalStorageOptions<T> = {
    serializer: {
      parse: JSON.parse,
      stringify: JSON.stringify
    },
    defaultValue: initialValue,
    errorCallback: (error) => console.warn(`useLocalStorage error for key "${key}":`, error),
    syncAcrossTabs: true,
    ...options
  };

  // Estado do valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return opts.defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      
      if (item === null) {
        return opts.defaultValue;
      }
      
      return opts.serializer!.parse(item);
    } catch (error) {
      opts.errorCallback?.(error as Error);
      return opts.defaultValue;
    }
  });

  // Função para definir valor
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Permitir função para atualizar o valor
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Salvar no estado
      setStoredValue(valueToStore);
      
      // Salvar no localStorage se estiver no navegador
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, opts.serializer!.stringify(valueToStore));
      }
    } catch (error) {
      opts.errorCallback?.(error as Error);
    }
  }, [key, storedValue, opts]);

  // Função para remover valor
  const removeValue = useCallback(() => {
    try {
      setStoredValue(opts.defaultValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      opts.errorCallback?.(error as Error);
    }
  }, [key, opts]);

  // Sincronização entre abas (se habilitada)
  useEffect(() => {
    if (!opts.syncAcrossTabs || typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = opts.serializer!.parse(e.newValue);
          setStoredValue(newValue);
        } catch (error) {
          opts.errorCallback?.(error as Error);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(opts.defaultValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, opts]);

  return [storedValue, setValue, removeValue];
};

// Hook simplificado para casos básicos
export const useSimpleLocalStorage = <T>(
  key: string, 
  defaultValue: T
): [T, (value: T) => void] => {
  const [value, setValue] = useLocalStorage(key, defaultValue);
  
  const simpleSetValue = useCallback((newValue: T) => {
    setValue(newValue);
  }, [setValue]);
  
  return [value, simpleSetValue];
};

// Hook para objetos complexos
export const useObjectLocalStorage = <T extends Record<string, any>>(
  key: string,
  defaultValue: T
) => {
  const [value, setValue, removeValue] = useLocalStorage(key, defaultValue);
  
  const updateField = useCallback((field: keyof T, fieldValue: any) => {
    setValue(prev => ({
      ...prev,
      [field]: fieldValue
    }));
  }, [setValue]);
  
  const updateFields = useCallback((updates: Partial<T>) => {
    setValue(prev => ({
      ...prev,
      ...updates
    }));
  }, [setValue]);
  
  return {
    value,
    setValue,
    removeValue,
    updateField,
    updateFields
  };
};

// Hook para arrays
export const useArrayLocalStorage = <T>(
  key: string,
  defaultValue: T[] = []
) => {
  const [array, setArray, removeArray] = useLocalStorage(key, defaultValue);
  
  const addItem = useCallback((item: T) => {
    setArray(prev => [...prev, item]);
  }, [setArray]);
  
  const removeItem = useCallback((index: number) => {
    setArray(prev => prev.filter((_, i) => i !== index));
  }, [setArray]);
  
  const removeItemByValue = useCallback((item: T) => {
    setArray(prev => prev.filter(i => i !== item));
  }, [setArray]);
  
  const updateItem = useCallback((index: number, newItem: T) => {
    setArray(prev => prev.map((item, i) => i === index ? newItem : item));
  }, [setArray]);
  
  const clear = useCallback(() => {
    setArray([]);
  }, [setArray]);
  
  return {
    array,
    setArray,
    removeArray,
    addItem,
    removeItem,
    removeItemByValue,
    updateItem,
    clear,
    length: array.length,
    isEmpty: array.length === 0
  };
};

// ✅ FUNÇÕES UTILITÁRIAS EXPORTADAS DIRETAMENTE (USADAS PELO APP.TSX)
export const saveToStorage = (key: string, value: any): void => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
      console.log(`✅ Salvo no localStorage: ${key}`);
    }
  } catch (error) {
    console.error(`Erro ao salvar ${key}:`, error);
  }
};

export const getFromStorage = <T = any>(key: string): T | null => {
  try {
    if (typeof window !== 'undefined') {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
    return null;
  } catch (error) {
    console.error(`Erro ao carregar ${key}:`, error);
    return null;
  }
};

export const removeFromStorage = (key: string): void => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
      console.log(`🗑️ Removido do localStorage: ${key}`);
    }
  } catch (error) {
    console.error(`Erro ao remover ${key}:`, error);
  }
};

export const clearAllStorage = (): void => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      console.log('🧹 localStorage limpo completamente');
    }
  } catch (error) {
    console.error('Erro ao limpar localStorage:', error);
  }
};

export const getStorageSize = (): string => {
  if (typeof window === 'undefined') return '0 KB';
  
  let total = 0;
  for (const key in window.localStorage) {
    if (window.localStorage.hasOwnProperty(key)) {
      total += window.localStorage[key].length + key.length;
    }
  }
  return (total / 1024).toFixed(2) + ' KB';
};

// Hook que retorna todas as funções utilitárias
export const useLocalStorageUtils = () => {
  return {
    saveToStorage,
    getFromStorage,
    removeFromStorage,
    clearAllStorage,
    getStorageSize
  };
};

export default useLocalStorage;