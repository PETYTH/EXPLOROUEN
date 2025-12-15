import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Clock, MapPin, Calendar, Users, Trash2, X, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@clerk/clerk-expo';

interface Notification {
  id: string;
  type: 'message' | 'visit' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
  chatId?: string;
  data?: any;
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { unreadMessages, markAsRead, refreshUnreadCounts, refreshSystemNotifications } = useNotifications();
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger les notifications système
  const loadSystemNotifications = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/monuments/user-notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Notifications système:', data.data?.length || 0);
        setSystemNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Error loading system notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemNotifications();
  }, []);

  // Convertir les messages non lus et notifications système en liste unifiée
  useEffect(() => {
    const notificationsList: Notification[] = [];
    
    // Ajouter uniquement les notifications système NON LUES
    systemNotifications.forEach((notif) => {
      if (!notif.isRead) {
        notificationsList.push({
          id: notif.id,
          type: notif.type === 'VISIT_PLANNED' ? 'visit' : 'system',
          title: notif.title,
          message: notif.message,
          time: formatTimeAgo(new Date(notif.createdAt)),
          read: notif.isRead,
          icon: notif.type === 'VISIT_PLANNED' ? '📅' : '🔔',
          data: notif.data ? JSON.parse(notif.data) : null
        });
      }
    });
    
    // Ajouter les notifications de messages
    unreadMessages.forEach((unread, chatId) => {
      const timeAgo = formatTimeAgo(unread.timestamp);
      
      notificationsList.push({
        id: chatId,
        type: 'message',
        title: `${unread.count} nouveau${unread.count > 1 ? 'x' : ''} message${unread.count > 1 ? 's' : ''}`,
        message: `${unread.chatName}: ${unread.lastMessage}`,
        time: timeAgo,
        read: false,
        icon: '💬',
        chatId: chatId
      });
    });

    // Trier par date (plus récent en premier)
    notificationsList.sort((a, b) => {
      if (!a.chatId || !b.chatId) return 0;
      const aUnread = unreadMessages.get(a.chatId);
      const bUnread = unreadMessages.get(b.chatId);
      if (!aUnread || !bUnread) return 0;
      return bUnread.timestamp.getTime() - aUnread.timestamp.getTime();
    });

    setNotifications(notificationsList);
  }, [unreadMessages, systemNotifications]);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Hier';
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  const handleMarkAsRead = async (chatId: string) => {
    await markAsRead(chatId);
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Marquer toutes les conversations comme lues
      const promises = Array.from(unreadMessages.keys()).map(chatId => markAsRead(chatId));
      
      // Marquer toutes les notifications système comme lues
      const token = await getToken();
      if (token) {
        const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
        const systemPromises = systemNotifications
          .filter(notif => !notif.isRead)
          .map(notif => 
            fetch(`${API_URL}/monuments/notifications/${notif.id}/read`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}` }
            })
          );
        await Promise.all([...promises, ...systemPromises]);
      }
      
      // Recharger les notifications
      await loadSystemNotifications();
      await refreshSystemNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notification: Notification) => {
    if (notification.type === 'visit' || notification.type === 'system') {
      // Pour les notifications système
      Alert.alert(
        'Marquer comme lu',
        'Voulez-vous marquer cette notification comme lue ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Marquer comme lu',
            style: 'default',
            onPress: async () => {
              try {
                const token = await getToken();
                if (token) {
                  const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
                  await fetch(`${API_URL}/monuments/notifications/${notification.id}/read`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                }
                setSystemNotifications(prev => prev.filter(n => n.id !== notification.id));
                await refreshSystemNotifications();
              } catch (error) {
                console.error('Error marking notification as read:', error);
              }
            }
          }
        ]
      );
    } else if (notification.chatId) {
      // Pour les messages
      Alert.alert(
        'Marquer comme lu',
        'Voulez-vous marquer cette notification comme lue ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Marquer comme lu',
            style: 'default',
            onPress: () => {
              handleMarkAsRead(notification.chatId!);
            }
          }
        ]
      );
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Tout marquer comme lu',
      'Voulez-vous marquer toutes les notifications comme lues ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout marquer comme lu',
          style: 'default',
          onPress: () => {
            handleMarkAllAsRead();
          }
        }
      ]
    );
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Marquer les notifications système comme lues
    if (notification.type === 'visit' || notification.type === 'system') {
      try {
        const token = await getToken();
        if (token) {
          const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
          await fetch(`${API_URL}/monuments/notifications/${notification.id}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
      
      // Retirer la notification de la liste locale immédiatement
      setSystemNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      // Rafraîchir le compteur dans le contexte
      await refreshSystemNotifications();
      
      // Naviguer vers le profil pour voir les visites planifiées
      if (notification.type === 'visit') {
        router.push('/profile');
      }
    } else {
      // Marquer comme lu et naviguer vers le chat pour les messages
      if (notification.chatId) {
        handleMarkAsRead(notification.chatId);
        
        // Nettoyer l'ID du chat pour la navigation
        // Si c'est un chat d'activité (ex: activity-123), on veut juste l'ID (123)
        // Si c'est un chat privé (ex: private-456), on garde tout
        let targetId = notification.chatId;
        if (targetId.startsWith('activity-')) {
          targetId = targetId.replace('activity-', '');
        }
        
        router.push(`/chat/${targetId}`);
      }
    }
  };

  const unreadCount = notifications.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: '#1E40AF' }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Action Buttons */}
      {unreadCount > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={64} color="#FFFFFF" strokeWidth={1.5} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune notification</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Vous n'avez aucune notification pour le moment
            </Text>
          </View>
        ) : (
          notifications.map((notification, index) => {
            const renderRightActions = () => (
              <TouchableOpacity 
                style={styles.deleteAction}
                onPress={() => handleDeleteNotification(notification)}
              >
                <LinearGradient
                  colors={['#1E40AF', '#3B82F6']}
                  style={styles.deleteGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MessageCircle size={24} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.deleteText}>Ouvrir</Text>
                </LinearGradient>
              </TouchableOpacity>
            );

            return (
              <Swipeable
                key={notification.id}
                renderRightActions={renderRightActions}
                overshootRight={false}
              >
                <TouchableOpacity
                  style={[
                    styles.notificationCard,
                    { backgroundColor: colors.surface },
                    styles.unreadCard
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <View style={[
                    styles.notificationIconContainer,
                    { backgroundColor: 'rgba(99, 102, 241, 0.1)' }
                  ]}>
                    <MessageCircle size={28} color="#1E40AF" strokeWidth={2} />
                  </View>

                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={[
                        styles.notificationTitle,
                        { color: colors.text },
                        styles.unreadTitle
                      ]}>
                        {notification.title}
                      </Text>
                      <View style={styles.unreadDot} />
                    </View>
                    
                    <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    
                    <View style={styles.notificationFooter}>
                      <Clock size={14} color="#9CA3AF" strokeWidth={2} />
                      <Text style={styles.notificationTime}>{notification.time}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.quickDeleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification);
                    }}
                  >
                    <X size={18} color={colors.textSecondary} strokeWidth={2} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Swipeable>
            );
          })
        )}

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
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 28,
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
    fontWeight: '700',
  },
  clearAllButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  markAllButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#1E40AF',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
    gap: 6,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1E40AF',
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  quickDeleteButton: {
    padding: 4,
  },
  deleteAction: {
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteGradient: {
    height: '100%',
    width: 100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 100,
  },
});
