import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-expo';
import ApiService from '@/services/api';

interface Message {
  id: string;
  text: string;
  content: string;
  senderId: string;
  userId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: string;
  createdAt: string;
  type: 'text' | 'image' | 'system';
  messageType: string;
  isMe?: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    imageUrl: string;
  };
}

interface ChatRoom {
  id: string;
  activityId: string;
  activityName: string;
  activityImage: string;
  participants: Array<{
    id: string;
    name: string;
    fullName: string;
    avatar: string;
    imageUrl: string;
    isOnline: boolean;
  }>;
  messages: Message[];
  isActive: boolean;
  createdAt: string;
  lastMessage?: Message;
  unread: number;
}

interface ChatContextType {
  chatRooms: ChatRoom[];
  privateChats: ChatRoom[];
  isLoading: boolean;
  refreshChatRooms: () => Promise<void>;
  getChatRoom: (activityId: string) => ChatRoom | undefined;
  sendMessage: (activityId: string, content: string) => Promise<void>;
  leaveChatRoom: (chatRoomId: string, userId: string) => void;
  getAllMessages: () => Message[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [privateChats, setPrivateChats] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();

  // Charger les chat rooms au démarrage
  useEffect(() => {
    if (isSignedIn && user) {
      refreshChatRooms();
    }
  }, [isSignedIn, user]);

  const refreshChatRooms = async () => {
    if (!isSignedIn || !user) return;
    
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      
      // Récupérer les activités auxquelles l'utilisateur est inscrit
      const userActivities = await ApiService.getUserActivities(token);
      
      // Créer les chat rooms pour chaque activité inscrite
      const rooms: ChatRoom[] = [];
      const privateRooms: ChatRoom[] = [];
      
      for (const activity of userActivities) {
        try {
          // Récupérer les messages et participants pour cette activité
          const [messagesData, participantsData] = await Promise.all([
            fetch(`${process.env.EXPO_PUBLIC_URL_BACKEND}/messages/activity/${activity.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.ok ? res.json() : { messages: [] }),
            fetch(`${process.env.EXPO_PUBLIC_URL_BACKEND}/messages/activity/${activity.id}/participants`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.ok ? res.json() : { participants: [] })
          ]);
          
          const messages = (messagesData.messages || []).map((msg: any) => ({
            ...msg,
            text: msg.content,
            senderId: msg.userId,
            senderName: msg.user?.fullName || 'Utilisateur',
            senderAvatar: msg.user?.imageUrl || '',
            timestamp: msg.createdAt,
            type: msg.messageType === 'TEXT' ? 'text' : 'image',
            isMe: msg.userId === user.id
          }));
          
          const participants = (participantsData.participants || []).map((p: any) => ({
            id: p.id,
            name: p.fullName,
            fullName: p.fullName,
            avatar: p.imageUrl || '',
            imageUrl: p.imageUrl || '',
            isOnline: Math.random() > 0.5 // Simulation statut en ligne
          }));
          
          const lastMessage = messages[messages.length - 1];
          
          // Chat de groupe pour l'activité
          rooms.push({
            id: `activity-${activity.id}`,
            activityId: activity.id,
            activityName: activity.title,
            activityImage: activity.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
            participants,
            messages,
            isActive: true,
            createdAt: activity.createdAt || new Date().toISOString(),
            lastMessage,
            unread: 0
          });
          
          // Créer un chat privé avec l'organisateur si ce n'est pas l'utilisateur actuel
          if (activity.createdBy && activity.createdBy !== user.id) {
            const privateMessages = [
              {
                id: `private-msg-${activity.id}-1`,
                content: `Bonjour ! J'ai une question concernant l'activité "${activity.title}".`,
                userId: user.id,
                messageType: 'TEXT',
                createdAt: new Date(Date.now() - 3600000).toISOString(), // Il y a 1h
                text: `Bonjour ! J'ai une question concernant l'activité "${activity.title}".`,
                senderId: user.id,
                senderName: user.fullName || 'Vous',
                senderAvatar: user.imageUrl || '',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                type: 'text' as const,
                isMe: true,
                user: {
                  id: user.id,
                  firstName: user.firstName || '',
                  lastName: user.lastName || '',
                  fullName: user.fullName || '',
                  imageUrl: user.imageUrl || ''
                }
              },
              {
                id: `private-msg-${activity.id}-2`,
                content: 'Bonjour ! Je suis disponible pour répondre à vos questions. N\'hésitez pas !',
                userId: activity.createdBy,
                messageType: 'TEXT',
                createdAt: new Date(Date.now() - 1800000).toISOString(), // Il y a 30min
                text: 'Bonjour ! Je suis disponible pour répondre à vos questions. N\'hésitez pas !',
                senderId: activity.createdBy,
                senderName: activity.organizerName || 'Organisateur',
                senderAvatar: activity.organizerAvatar || '',
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                type: 'text' as const,
                isMe: false,
                user: {
                  id: activity.createdBy,
                  firstName: activity.organizerName?.split(' ')[0] || 'Organisateur',
                  lastName: activity.organizerName?.split(' ')[1] || '',
                  fullName: activity.organizerName || 'Organisateur',
                  imageUrl: activity.organizerAvatar || ''
                }
              }
            ];
            
            privateRooms.push({
              id: `private-${user.id}-${activity.createdBy}`,
              activityId: activity.id,
              activityName: `Chat avec ${activity.organizerName || 'Organisateur'}`,
              activityImage: activity.organizerAvatar || activity.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
              participants: [{
                id: activity.createdBy,
                name: activity.organizerName || 'Organisateur',
                fullName: activity.organizerName || 'Organisateur',
                avatar: activity.organizerAvatar || '',
                imageUrl: activity.organizerAvatar || '',
                isOnline: Math.random() > 0.3 // Plus de chance d'être en ligne
              }],
              messages: privateMessages,
              isActive: true,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              lastMessage: privateMessages[privateMessages.length - 1],
              unread: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0
            });
          }
        } catch (error) {
          // Erreur silencieuse lors du chargement du chat
        }
      }
      
      setChatRooms(rooms);
      setPrivateChats(privateRooms);
    } catch (error) {
      // Erreur silencieuse lors du chargement des chat rooms
    } finally {
      setIsLoading(false);
    }
  };

  const getChatRoom = (activityId: string): ChatRoom | undefined => {
    return chatRooms.find(room => room.activityId === activityId);
  };

  const sendMessage = async (activityId: string, content: string) => {
    if (!isSignedIn || !user) return;
    
    try {
      const token = await getToken();
      if (!token) return;
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_URL_BACKEND}/messages/activity/${activityId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content.trim(),
          messageType: 'TEXT'
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        console.log('✅ Message envoyé:', newMessage);
        
        // Mettre à jour localement
        setChatRooms(prev => prev.map(room => {
          if (room.activityId === activityId) {
            const message = {
              ...newMessage,
              text: newMessage.content,
              senderId: newMessage.userId,
              senderName: newMessage.user?.fullName || user.fullName || 'Vous',
              senderAvatar: newMessage.user?.imageUrl || user.imageUrl || '',
              timestamp: newMessage.createdAt,
              type: 'text' as const,
              isMe: true
            };
            return {
              ...room,
              messages: [...room.messages, message],
              lastMessage: message
            };
          }
          return room;
        }));
      } else {
        // Erreur silencieuse lors de l'envoi du message
      }
    } catch (error) {
      // Erreur réseau silencieuse
    }
  };






  const leaveChatRoom = (chatRoomId: string, userId: string) => {
    console.log(`🚪 Quitter le chat room: ${chatRoomId} pour l'utilisateur: ${userId}`);
    
    // Supprimer de la liste des chat rooms
    setChatRooms(prev => prev.filter(room => room.id !== chatRoomId));
    setPrivateChats(prev => prev.filter(room => room.id !== chatRoomId));
  };

  const getAllMessages = (): Message[] => {
    const allMessages: Message[] = [];
    
    // Messages des groupes
    chatRooms.forEach(room => {
      room.messages.forEach(msg => {
        allMessages.push({
          ...msg,
          chatType: 'group',
          chatRoomName: room.activityName,
          chatRoomId: room.id
        } as Message & { chatType: string; chatRoomName: string; chatRoomId: string });
      });
    });
    
    // Messages privés
    privateChats.forEach(room => {
      room.messages.forEach(msg => {
        allMessages.push({
          ...msg,
          chatType: 'private',
          chatRoomName: room.activityName,
          chatRoomId: room.id
        } as Message & { chatType: string; chatRoomName: string; chatRoomId: string });
      });
    });
    
    // Trier par date
    return allMessages.sort((a, b) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime());
  };

  const value: ChatContextType = {
    chatRooms,
    privateChats,
    isLoading,
    refreshChatRooms,
    getChatRoom,
    sendMessage,
    leaveChatRoom,
    getAllMessages,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}