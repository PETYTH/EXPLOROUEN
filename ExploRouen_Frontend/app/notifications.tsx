import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Clock, MapPin, Calendar, Users } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

interface Notification {
  id: string;
  type: 'activity' | 'monument' | 'system' | 'social';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'activity',
      title: 'Nouvelle activité disponible',
      message: 'Visite guidée de la Cathédrale Notre-Dame demain à 14h',
      time: 'Il y a 5 minutes',
      read: false,
      icon: '🎯'
    },
    {
      id: '2',
      type: 'social',
      title: 'Nouveau participant',
      message: 'Marie a rejoint votre activité "Découverte du Vieux Rouen"',
      time: 'Il y a 1 heure',
      read: false,
      icon: '👥'
    },
    {
      id: '3',
      type: 'monument',
      title: 'Monument visité',
      message: 'Félicitations ! Vous avez découvert le Gros-Horloge',
      time: 'Il y a 2 heures',
      read: true,
      icon: '🏛️'
    },
    {
      id: '4',
      type: 'system',
      title: 'Mise à jour disponible',
      message: 'Une nouvelle version de l\'application est disponible',
      time: 'Il y a 3 heures',
      read: true,
      icon: '🔄'
    },
    {
      id: '5',
      type: 'activity',
      title: 'Rappel d\'activité',
      message: 'N\'oubliez pas votre activité "Balade en Seine" dans 1 heure',
      time: 'Il y a 4 heures',
      read: true,
      icon: '⏰'
    },
    {
      id: '6',
      type: 'social',
      title: 'Nouveau message',
      message: 'Thomas vous a envoyé un message dans le chat de groupe',
      time: 'Hier',
      read: true,
      icon: '💬'
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'activity': return <Calendar size={20} color="#8B5CF6" strokeWidth={2} />;
      case 'monument': return <MapPin size={20} color="#8B5CF6" strokeWidth={2} />;
      case 'social': return <Users size={20} color="#8B5CF6" strokeWidth={2} />;
      case 'system': return <Bell size={20} color="#8B5CF6" strokeWidth={2} />;
      default: return <Bell size={20} color="#8B5CF6" strokeWidth={2} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.map((notification, index) => (
          <Animated.View 
            key={notification.id}
            entering={FadeInDown.delay(200 + index * 50)}
          >
            <TouchableOpacity
              style={[
                styles.notificationCard,
                { backgroundColor: colors.surface },
                !notification.read && styles.unreadCard
              ]}
              onPress={() => markAsRead(notification.id)}
            >
              <View style={styles.notificationIcon}>
                <Text style={styles.iconEmoji}>{notification.icon}</Text>
                <View style={styles.iconBadge}>
                  {getNotificationIcon(notification.type)}
                </View>
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={[
                    styles.notificationTitle,
                    { color: colors.text },
                    !notification.read && styles.unreadTitle
                  ]}>
                    {notification.title}
                  </Text>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>
                
                <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
                  {notification.message}
                </Text>
                
                <View style={styles.notificationFooter}>
                  <Clock size={12} color="#9CA3AF" strokeWidth={2} />
                  <Text style={styles.notificationTime}>{notification.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  markAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  notificationIcon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 24,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 6,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 100,
  },
});
