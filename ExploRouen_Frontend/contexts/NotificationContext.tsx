import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router, usePathname } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useToast } from './ToastContext';
import chatService from '@/services/chatService';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface UnreadMessage {
  chatId: string;
  chatName: string;
  count: number;
  lastMessage: string;
  timestamp: Date;
}

interface NotificationContextType {
  unreadMessages: Map<string, UnreadMessage>;
  totalUnreadCount: number;
  systemNotificationCount: number;
  markAsRead: (chatId: string) => void;
  addUnreadMessage: (chatId: string, chatName: string, message: string) => void;
  refreshUnreadCounts: () => Promise<void>;
  refreshSystemNotifications: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadMessages, setUnreadMessages] = useState<Map<string, UnreadMessage>>(new Map());
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [systemNotificationCount, setSystemNotificationCount] = useState(0);
  const { getToken } = useAuth();
  const { user } = useUser();
  const { showToast } = useToast();
  const pathname = usePathname();

  // Écouter les nouveaux messages via WebSocket pour les notifications instantanées
  useEffect(() => {
    if (!user) return;

    chatService.connect();
    chatService.identify(user.id);

    const callbackId = chatService.onNewMessage((message) => {
      // Ignorer ses propres messages pour les notifications
      if (message.userId === user.id) return;

      // Ne pas notifier si on est déjà sur la page de chat correspondante
      const currentChatId = pathname.split('/').pop();
      
      // Déterminer l'ID du chat pour la notification
      // Si le message contient activityId, on l'utilise (format chat-ID)
      // Sinon on utilise discussionId (format activity-ID ou private-ID)
      let messageChatId = message.discussionId;
      
      // @ts-ignore - activityId ajouté dynamiquement par le backend
      if (message.activityId) {
        // @ts-ignore
        messageChatId = `chat-${message.activityId}`;
      } else if ((message as any).chatId) {
        // Si le backend envoie explicitement l'ID du chat (ex: private-...)
        messageChatId = (message as any).chatId;
      } else if (message.discussionId && !message.discussionId.startsWith('private-') && !message.discussionId.startsWith('activity-')) {
        // Si c'est un ID brut de discussion (UUID), on suppose que c'est une activité
        // Mais idéalement on devrait avoir l'activityId
        // Pour l'instant on garde l'ID tel quel, mais ça risque de poser problème si le frontend attend activityId
      }

      if (!messageChatId) {
        return; // Pas de chat ID disponible
      }

      const isPrivate = messageChatId.startsWith('private-');
      
      // Vérifier si on est dans le chat actif
      // On nettoie les IDs pour comparer
      const cleanCurrentId = currentChatId?.replace('chat-', '').replace('activity-', '') || '';
      const cleanMessageId = messageChatId.replace('chat-', '').replace('activity-', '');
      
      const isActiveChat = cleanCurrentId === cleanMessageId;

      if (isActiveChat) {
        return; // L'utilisateur voit déjà le message
      }

      // Ajouter aux non lus
      const chatName = message.user?.fullName || 'Nouveau message';
      addUnreadMessage(messageChatId, chatName, message.content);
    });

    // Écouter les notifications système
    const notifCallbackId = chatService.onNewNotification((notification) => {
      console.log('🔔 Notification reçue dans le contexte:', notification);
      
      // Afficher un toast
      showToast(notification.message || notification.title, 'success');
      
      // Mettre à jour le compteur
      setSystemNotificationCount(prev => prev + 1);
      // Envoyer une notification système locale (comme pour les messages)
      if (Platform.OS !== 'web') {
        try {
          const notificationData = notification.data 
            ? (typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data) 
            : {};

          Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title || 'Nouvelle notification',
              body: notification.message || 'Vous avez reçu une nouvelle notification',
              data: notificationData,
            },
            trigger: null, // Notification immédiate
          });
        } catch (error) {
          console.error('Erreur lors de la planification de la notification locale:', error);
        }
      }      
      // Si on est sur la page de notifications, on pourrait vouloir rafraîchir la liste
      // Mais pour l'instant on se contente de mettre à jour le compteur
    });

    return () => {
      chatService.offNewMessage(callbackId);
      chatService.offNewNotification(notifCallbackId);
    };
  }, [user, pathname]);
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }, []);

  // Charger les notifications système non lues
  const refreshSystemNotifications = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/monuments/user-notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const unreadCount = data.data?.filter((notif: any) => !notif.isRead).length || 0;
        setSystemNotificationCount(unreadCount);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications système:', error);
    }
  }, [getToken]);

  // Charger les messages non lus au démarrage
  const refreshUnreadCounts = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/discussions/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const newUnreadMap = new Map<string, UnreadMessage>();
        let totalCount = 0;

        // Traiter les conversations
        if (data.groupChats && Array.isArray(data.groupChats)) {
          data.groupChats.forEach((chat: any) => {
            if (chat.unreadCount > 0) {
              const chatId = `chat-${chat.activityId}`;
              newUnreadMap.set(chatId, {
                chatId,
                chatName: chat.activityTitle,
                count: chat.unreadCount,
                lastMessage: chat.lastMessage?.content || '',
                timestamp: new Date(chat.lastMessage?.createdAt || Date.now())
              });
              totalCount += chat.unreadCount;
            }
          });
        }

        if (data.privateChats && Array.isArray(data.privateChats)) {
          data.privateChats.forEach((chat: any) => {
            if (chat.unreadCount > 0) {
              const chatId = `private-${chat.otherUser?.id}`;
              newUnreadMap.set(chatId, {
                chatId,
                chatName: chat.otherUser?.fullName || 'Utilisateur',
                count: chat.unreadCount,
                lastMessage: chat.lastMessage?.content || '',
                timestamp: new Date(chat.lastMessage?.createdAt || Date.now())
              });
              totalCount += chat.unreadCount;
            }
          });
        }

        setUnreadMessages(newUnreadMap);
        setTotalUnreadCount(totalCount);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages non lus:', error);
    }
  }, [getToken]);

  // Ajouter un message non lu
  const addUnreadMessage = useCallback((chatId: string, chatName: string, message: string) => {
    setUnreadMessages(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(chatId);
      
      if (existing) {
        existing.count += 1;
        existing.lastMessage = message;
        existing.timestamp = new Date();
      } else {
        newMap.set(chatId, {
          chatId,
          chatName,
          count: 1,
          lastMessage: message,
          timestamp: new Date()
        });
      }
      
      return newMap;
    });

    setTotalUnreadCount(prev => prev + 1);

    // Afficher une notification toast
    showToast(`Nouveau message de ${chatName}`, 'info');

    // Envoyer une notification système (si permissions accordées)
    if (Platform.OS !== 'web') {
      Notifications.scheduleNotificationAsync({
        content: {
          title: `Nouveau message de ${chatName}`,
          body: message.length > 100 ? message.substring(0, 100) + '...' : message,
          data: { chatId, chatName },
        },
        trigger: null, // Notification immédiate
      });
    }
  }, [showToast]);

  // Marquer une conversation comme lue
  const markAsRead = useCallback(async (chatId: string) => {
    let shouldUpdate = false;
    
    setUnreadMessages(prev => {
      if (!prev.has(chatId)) {
        return prev;
      }
      
      shouldUpdate = true;
      const newMap = new Map(prev);
      const unread = newMap.get(chatId);
      
      if (unread) {
        setTotalUnreadCount(prevTotal => Math.max(0, prevTotal - unread.count));
        newMap.delete(chatId);
      }
      
      return newMap;
    });

    if (!shouldUpdate) return;

    // Envoyer au backend pour synchroniser
    try {
      const token = await getToken();
      if (!token) return;

      const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
      
      // Extraire l'ID de l'activité ou de l'utilisateur du chatId
      const isPrivate = chatId.startsWith('private-');
      const actualId = chatId.replace('chat-', '').replace('private-', '');
      
      const endpoint = isPrivate 
        ? `${API_URL}/discussions/private/${actualId}/read`
        : `${API_URL}/discussions/${actualId}/read`;

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  }, [getToken]);

  // Écouter les clics sur les notifications
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const { chatId } = response.notification.request.content.data as { chatId: string };
      if (chatId) {
        router.push(`/chat/${chatId}`);
      }
    });

    return () => subscription.remove();
  }, []);

  // Rafraîchir périodiquement les compteurs
  useEffect(() => {
    if (!user) return;

    refreshUnreadCounts();
    refreshSystemNotifications();
    requestPermissions();

    const interval = setInterval(() => {
      refreshUnreadCounts();
      refreshSystemNotifications();
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Seulement dépendre de user, pas des fonctions

  const value: NotificationContextType = React.useMemo(() => ({
    unreadMessages,
    totalUnreadCount,
    systemNotificationCount,
    markAsRead,
    addUnreadMessage,
    refreshUnreadCounts,
    refreshSystemNotifications,
    requestPermissions,
  }), [
    unreadMessages,
    totalUnreadCount,
    systemNotificationCount,
    markAsRead,
    addUnreadMessage,
    refreshUnreadCounts,
    refreshSystemNotifications,
    requestPermissions,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
