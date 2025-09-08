import { io, Socket } from 'socket.io-client';
import ApiService from './api';

export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO';
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
    fullName: string;
  };
  isSystemMessage?: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  thumbnailUrl?: string;
}

export interface ChatParticipant {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  fullName: string;
  joinedAt: string;
}

class ChatService {
  private socket: Socket | null = null;
  private messageCallbacks: Map<string, (message: ChatMessage) => void> = new Map();
  private typingCallbacks: Map<string, (user: any) => void> = new Map();
  private stopTypingCallbacks: Map<string, (user: any) => void> = new Map();
  
  // State for messages screen
  public chatRooms: any[] = [];
  public privateChats: any[] = [];
  public isLoading: boolean = false;

  // Initialiser la connexion WebSocket
  connect() {
    if (this.socket?.connected) return;

    const backendUrl = process.env.EXPO_PUBLIC_URL_BACKEND?.replace('/api', '') || 'http://localhost:5000';
    
    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connecté:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket déconnecté');
    });

    this.socket.on('new-message', (message: ChatMessage) => {
      console.log('📨 Nouveau message reçu:', message);
      this.messageCallbacks.forEach(callback => callback(message));
    });

    this.socket.on('user-typing', (user: any) => {
      this.typingCallbacks.forEach(callback => callback(user));
    });

    this.socket.on('user-stop-typing', (user: any) => {
      this.stopTypingCallbacks.forEach(callback => callback(user));
    });

    this.socket.on('connect_error', (error: any) => {
      // Erreur de connexion WebSocket silencieuse
    });
  }

  // Déconnecter WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.messageCallbacks.clear();
    this.typingCallbacks.clear();
    this.stopTypingCallbacks.clear();
  }

  // Rejoindre une discussion d'activité
  joinActivityChat(activityId: string) {
    if (!this.socket?.connected) {
      console.warn('⚠️ WebSocket non connecté, tentative de reconnexion...');
      this.connect();
    }

    // Nettoyer l'ID pour éviter le double préfixe
    const cleanActivityId = activityId.replace(/^activity-/, '');
    const discussionId = `activity-${cleanActivityId}`;
    this.socket?.emit('join-discussion', discussionId);
    console.log(`🔗 Rejoint la discussion: ${discussionId}`);
  }

  // Quitter une discussion d'activité
  leaveActivityChat(activityId: string) {
    // Nettoyer l'ID pour éviter le double préfixe
    const cleanActivityId = activityId.replace(/^activity-/, '');
    const discussionId = `activity-${cleanActivityId}`;
    this.socket?.emit('leave-discussion', discussionId);
    console.log(`👋 Quitté la discussion: ${discussionId}`);
  }

  // Envoyer un message via WebSocket
  sendMessageViaSocket(activityId: string, message: ChatMessage) {
    // Nettoyer l'ID pour éviter le double préfixe
    const cleanActivityId = activityId.replace(/^activity-/, '');
    const discussionId = `activity-${cleanActivityId}`;
    this.socket?.emit('send-message', {
      discussionId,
      message
    });
  }

  // Envoyer notification de frappe
  sendTyping(activityId: string, user: any) {
    // Nettoyer l'ID pour éviter le double préfixe
    const cleanActivityId = activityId.replace(/^activity-/, '');
    const discussionId = `activity-${cleanActivityId}`;
    this.socket?.emit('typing', {
      discussionId,
      user
    });
  }

  // Arrêter notification de frappe
  sendStopTyping(activityId: string, user: any) {
    // Nettoyer l'ID pour éviter le double préfixe
    const cleanActivityId = activityId.replace(/^activity-/, '');
    const discussionId = `activity-${cleanActivityId}`;
    this.socket?.emit('stop-typing', {
      discussionId,
      user
    });
  }

  // Load chat rooms from API
  async loadChatRooms() {
    this.isLoading = true;
    try {
      // Fetch group chats (activities) - use direct URL that works
      const activitiesResponse = await fetch(`http://192.168.1.62:5000/api/activities`);
      if (activitiesResponse.ok) {
        const responseData = await activitiesResponse.json();
        console.log('📊 Activities API response:', responseData);
        
        // Handle different response formats
        const activities = Array.isArray(responseData) ? responseData : 
                          responseData.activities ? responseData.activities :
                          responseData.data ? responseData.data : [];
        
        if (Array.isArray(activities)) {
          this.chatRooms = activities.map((activity: any) => ({
            id: `activity-${activity.id}`,
            activityName: activity.title || activity.name || 'Activité sans nom',
            activityImage: activity.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
            participants: [],
            lastMessage: null,
            unread: 0
          }));
          console.log('✅ Chat rooms loaded:', this.chatRooms.length);
        } else {
          console.warn('⚠️ Activities is not an array:', activities);
          this.chatRooms = [];
        }
      } else {
        this.chatRooms = [];
      }

      // Fetch private chats - for now empty, will be implemented later
      this.privateChats = [];
      
    } catch (error) {
      this.chatRooms = [];
    } finally {
      this.isLoading = false;
    }
  }

  // Refresh chat rooms
  async refreshChatRooms() {
    await this.loadChatRooms();
  }

  // S'abonner aux nouveaux messages
  onNewMessage(callback: (message: ChatMessage) => void) {
    const callbackId = Math.random().toString(36).substr(2, 9);
    this.messageCallbacks.set(callbackId, callback);
    return callbackId;
  }

  // Se désabonner des nouveaux messages
  offNewMessage(callbackId: string) {
    this.messageCallbacks.delete(callbackId);
  }

  // S'abonner aux notifications de frappe
  onUserTyping(callback: (user: any) => void) {
    const callbackId = Math.random().toString(36).substr(2, 9);
    this.typingCallbacks.set(callbackId, callback);
    return callbackId;
  }

  // S'abonner aux arrêts de frappe
  onUserStopTyping(callback: (user: any) => void) {
    const callbackId = Math.random().toString(36).substr(2, 9);
    this.stopTypingCallbacks.set(callbackId, callback);
    return callbackId;
  }

  // API: Récupérer les messages d'une activité
  async getActivityMessages(activityId: string, token: string): Promise<{ discussionId: string; messages: ChatMessage[] }> {
    try {
      // Nettoyer l'ID pour éviter le double préfixe
      const cleanActivityId = activityId.replace(/^activity-/, '');
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_URL_BACKEND}/messages/activity/${cleanActivityId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expiré - erreur silencieuse
          throw new Error('UNAUTHORIZED');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des messages');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // API: Envoyer un message
  async sendMessage(activityId: string, content: string, token: string, messageType: 'TEXT' | 'IMAGE' | 'VIDEO' = 'TEXT', mediaFile?: File): Promise<ChatMessage> {
    try {
      // Nettoyer l'ID pour éviter le double préfixe
      const cleanActivityId = activityId.replace(/^activity-/, '');
      
      let body;
      let headers: any = {
        'Authorization': `Bearer ${token}`,
      };

      if (mediaFile) {
        // Pour les fichiers média, utiliser FormData
        const formData = new FormData();
        formData.append('content', content);
        formData.append('messageType', messageType);
        formData.append('media', mediaFile);
        body = formData;
      } else {
        // Pour les messages texte
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          content,
          messageType: 'TEXT'
        });
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_URL_BACKEND}/messages/activity/${cleanActivityId}`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expiré - erreur silencieuse
          throw new Error('UNAUTHORIZED');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi du message');
      }

      const message = await response.json();
      
      // Envoyer via WebSocket pour la synchronisation temps réel
      this.sendMessageViaSocket(cleanActivityId, message);
      
      return message;
    } catch (error) {
      throw error;
    }
  }

  // API: Récupérer les participants du chat
  async getChatParticipants(activityId: string, token: string): Promise<ChatParticipant[]> {
    try {
      // Nettoyer l'ID pour éviter le double préfixe
      const cleanActivityId = activityId.replace(/^activity-/, '');
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_URL_BACKEND}/messages/activity/${cleanActivityId}/participants`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expiré - erreur silencieuse
          throw new Error('UNAUTHORIZED');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des participants');
      }

      const data = await response.json();
      return data.participants;
    } catch (error) {
      throw error;
    }
  }

  // API: Créer un chat privé avec l'organisateur
  async createPrivateChat(organizerId: string, token: string): Promise<{ chatId: string; discussionId: string }> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_URL_BACKEND}/messages/private/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizerId
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expiré - erreur silencieuse
          throw new Error('UNAUTHORIZED');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du chat privé');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // API: Récupérer les messages d'un chat privé
  async getPrivateMessages(chatId: string, token: string): Promise<{ discussionId: string; messages: ChatMessage[] }> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_URL_BACKEND}/messages/private/${chatId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expiré - erreur silencieuse
          throw new Error('UNAUTHORIZED');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la récupération des messages privés');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // API: Envoyer un message dans un chat privé
  async sendPrivateMessage(chatId: string, content: string, token: string, messageType: 'TEXT' | 'IMAGE' | 'VIDEO' = 'TEXT', mediaFile?: File): Promise<ChatMessage> {
    try {
      let body;
      let headers: any = {
        'Authorization': `Bearer ${token}`,
      };

      if (mediaFile) {
        // Pour les fichiers média, utiliser FormData
        const formData = new FormData();
        formData.append('content', content);
        formData.append('messageType', messageType);
        formData.append('media', mediaFile);
        body = formData;
      } else {
        // Pour les messages texte
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          content,
          messageType: 'TEXT'
        });
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_URL_BACKEND}/messages/private/${chatId}`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expiré - erreur silencieuse
          throw new Error('UNAUTHORIZED');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi du message privé');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Rejoindre un chat privé
  joinPrivateChat(chatId: string) {
    if (!this.socket?.connected) {
      console.warn('⚠️ WebSocket non connecté, tentative de reconnexion...');
      this.connect();
    }

    this.socket?.emit('join-discussion', chatId);
    console.log(`🔗 Rejoint le chat privé: ${chatId}`);
  }

  // Quitter un chat privé
  leavePrivateChat(chatId: string) {
    this.socket?.emit('leave-discussion', chatId);
    console.log(`👋 Quitté le chat privé: ${chatId}`);
  }
}

// Instance singleton
const chatService = new ChatService();
export default chatService;
