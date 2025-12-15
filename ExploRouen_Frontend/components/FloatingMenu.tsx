import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';
import { Home, Landmark, Calendar, MessageCircle, Map, User } from "lucide-react-native";
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '@/contexts/NotificationContext';

const { width } = Dimensions.get('window');

interface FloatingMenuProps {
  onNavigate?: (route: string) => void;
}

export default function FloatingMenu({ onNavigate }: FloatingMenuProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { totalUnreadCount, systemNotificationCount } = useNotifications();
  const totalNotifications = totalUnreadCount + systemNotificationCount;

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
      <View style={[styles.menuContainer, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const isActive = isCurrentRoute(item.route);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuButton,
              ]}
              onPress={() => handleItemPress(item.route)}
              activeOpacity={0.7}
            >
              {isActive ? (
                <LinearGradient
                  colors={[colors.buttonPrimary, colors.buttonPrimary]}
                  style={styles.activeButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <IconComponent
                    size={24}
                    color="#FFFFFF"
                    strokeWidth={2}
                  />
                </LinearGradient>
              ) : (
                <IconComponent
                  size={24}
                  color={colors.textSecondary}
                  strokeWidth={2}
                />
              )}
              {item.route === '/messages' && totalUnreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.badgeText}>
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Text>
                </View>
              )}
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
    position: 'relative',
  },
  activeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
