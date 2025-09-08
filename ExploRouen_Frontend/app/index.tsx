import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';

export default function Index() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Attendre que le composant soit monté avant de naviguer
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      // Petit délai pour s'assurer que le layout est prêt
      const timer = setTimeout(() => {
        router.replace('/get-started' as any);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isMounted]);

  return <View style={{ flex: 1, backgroundColor: '#1A1A1A' }} />;
}
