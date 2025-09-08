import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Home, Landmark, Calendar, MessageCircle, Map, User } from "lucide-react-native";
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter, usePathname } from 'expo-router';

const { width } = Dimensions.get('window');

interface FloatingMenuProps {
  onNavigate?: (route: string) => void;
}

export default function FloatingMenu({ onNavigate }: FloatingMenuProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { 
      icon: Home, 
      route: '/', 
      label: 'Accueil'
    },
    { 
      icon: Landmark, 
      route: '/all-monuments', 
      label: 'Monuments'
    },
    { 
      icon: Calendar, 
      route: '/activities', 
      label: 'Activités'
    },
    { 
      icon: MessageCircle, 
      route: '/messages', 
      label: 'Messages'
    },
    { 
      icon: Map, 
      route: '/map', 
      label: 'Carte'
    },
    { 
      icon: User, 
      route: '/profile', 
      label: 'Profil'
    },
  ];

  const handleItemPress = (route: string) => {
    // Ne navigue que si on n'est pas déjà sur cette page
    if (!isCurrentRoute(route)) {
      router.replace(route as any);
    }
    onNavigate?.(route);
  };

  const isCurrentRoute = (route: string) => {
    if (route === '/' && pathname === '/') return true;
    if (route !== '/' && pathname.startsWith(route)) return true;
    return false;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.menuContainer, { backgroundColor: 'rgba(40, 40, 40, 0.95)' }]}>
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive = isCurrentRoute(item.route);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuButton,
                isActive && styles.activeButton
              ]}
              onPress={() => handleItemPress(item.route)}
              activeOpacity={0.7}
            >
              <IconComponent
                size={24}
                color={isActive ? '#FFFFFF' : '#CCCCCC'}
                strokeWidth={2}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    left: 10,
    right: 10,
    alignItems: 'center',
    zIndex: 1000,
  },
  menuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  activeButton: {
    backgroundColor: '#8B5CF6',
  },
});
