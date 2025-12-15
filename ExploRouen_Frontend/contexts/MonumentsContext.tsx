import React, { createContext, useContext, useState, useCallback } from 'react';
import ApiService, { BackendMonument } from '@/services/api';

interface MonumentsContextType {
  monuments: BackendMonument[];
  loading: boolean;
  loadMonuments: () => Promise<void>;
  updateMonument: (id: string, updatedData: Partial<BackendMonument>) => void;
  refreshMonuments: () => Promise<void>;
}

const MonumentsContext = createContext<MonumentsContextType | undefined>(undefined);

export function MonumentsProvider({ children }: { children: React.ReactNode }) {
  const [monuments, setMonuments] = useState<BackendMonument[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMonuments = useCallback(async () => {
    if (loading) return; // Éviter les appels multiples
    
    try {
      setLoading(true);
      const data = await ApiService.getMonuments();
      setMonuments(data || []);
    } catch (error) {
      console.error('Erreur chargement monuments:', error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const updateMonument = useCallback((id: string, updatedData: Partial<BackendMonument>) => {
    setMonuments(prev => 
      prev.map(monument => 
        monument.id === id 
          ? { ...monument, ...updatedData }
          : monument
      )
    );
  }, []);

  const refreshMonuments = useCallback(async () => {
    try {
      const data = await ApiService.getMonuments();
      setMonuments(data || []);
    } catch (error) {
      console.error('Erreur refresh monuments:', error);
    }
  }, []);

  return (
    <MonumentsContext.Provider value={{ monuments, loading, loadMonuments, updateMonument, refreshMonuments }}>
      {children}
    </MonumentsContext.Provider>
  );
}

export function useMonuments() {
  const context = useContext(MonumentsContext);
  if (!context) {
    throw new Error('useMonuments doit être utilisé dans MonumentsProvider');
  }
  return context;
}
