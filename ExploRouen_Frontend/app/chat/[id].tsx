import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Camera, Image as ImageIcon, Plus, X, Lock, Users } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth, useUser } from '@clerk/clerk-expo';
import chatService, { ChatMessage, ChatParticipant } from '@/services/chatService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
  isMe: boolean;
  type: 'text' | 'image';
  imageUri?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
    fullName: string;
  };
}

export default function ChatScreen() {
  const { id, displayName } = useLocalSearchParams();
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [organizerName, setOrganizerName] = useState<string>('');
  const [activityName, setActivityName] = useState<string>('');
  const [organizerAvatar, setOrganizerAvatar] = useState<string>('');
  const [activityImage, setActivityImage] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Détecter le type de chat et extraire l'ID approprié
  const chatId = typeof id === 'string' ? id : '';
  const isPrivateChat = chatId.startsWith('private-');
  const activityId = isPrivateChat ? '' : chatId.replace('chat-', '');

  const sendMessage = async () => {
    if (!message.trim() || sending || !chatId) return;
    
    setSending(true);
    const messageText = message.trim();
    setMessage('');
    
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Erreur', 'Impossible de récupérer le token d\'authentification');
        return;
      }
      
      const newMessage = isPrivateChat 
        ? await chatService.sendPrivateMessage(chatId, messageText, token)
        : await chatService.sendMessage(activityId, messageText, token);
      console.log('✅ Message envoyé:', newMessage);
      
      // Ajouter le message localement pour un affichage immédiat
      const localMessage: Message = {
        id: newMessage.id,
        text: newMessage.content,
        sender: user?.fullName || `${user?.firstName} ${user?.lastName}`.trim() || 'Vous',
        timestamp: new Date(newMessage.createdAt),
        isMe: true,
        type: 'text',
        user: {
          id: user?.id || '',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          imageUrl: user?.imageUrl || '',
          fullName: user?.fullName || ''
        }
      };
      
      setMessages(prev => [...prev, localMessage]);
    } catch (error) {
      console.error('Erreur envoi message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
      setMessage(messageText); // Restaurer le message en cas d'erreur
    } finally {
      setSending(false);
    }
  };

  const sendImageMessage = async (imageUri: string, caption: string = '') => {
    if (sending || !chatId) return;
    
    setSending(true);
    
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Erreur', 'Impossible de récupérer le token d\'authentification');
        return;
      }

      // Créer un FormData pour React Native
      const formData = new FormData();
      formData.append('media', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `image_${Date.now()}.jpg`,
      } as any);
      formData.append('content', caption);
      formData.append('messageType', 'IMAGE');
      
      // Envoyer directement avec fetch pour gérer FormData correctement
      const url = isPrivateChat 
        ? `${process.env.EXPO_PUBLIC_URL_BACKEND}/discussions/private/${chatId}/message`
        : `${process.env.EXPO_PUBLIC_URL_BACKEND}/discussions/activity/${activityId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'image');
      }

      const newMessage = await response.json();
      
      console.log('✅ Image envoyée:', newMessage);
      
      // Ajouter le message localement pour un affichage immédiat
      const localMessage: Message = {
        id: newMessage.id,
        text: newMessage.content,
        sender: user?.fullName || `${user?.firstName} ${user?.lastName}`.trim() || 'Vous',
        timestamp: new Date(newMessage.createdAt),
        isMe: true,
        type: 'image',
        imageUri: newMessage.mediaUrl ? `${process.env.EXPO_PUBLIC_URL_BACKEND?.replace('/api', '')}${newMessage.mediaUrl}` : imageUri,
        user: {
          id: user?.id || '',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          imageUrl: user?.imageUrl || '',
          fullName: user?.fullName || ''
        }
      };
      
      setMessages(prev => [...prev, localMessage]);
    } catch (error) {
      console.error('Erreur envoi image:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'image');
    } finally {
      setSending(false);
    }
  };

  const pickImage = async (source: 'camera' | 'library') => {
    setShowImageOptions(false);
    
    let result;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la caméra est nécessaire pour prendre des photos.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la galerie est nécessaire pour sélectionner des photos.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0]) {
      // Envoyer l'image via l'API
      sendImageMessage(result.assets[0].uri, source === 'camera' ? 'Photo prise' : 'Image partagée');
    }
  };

  // Charger les messages et participants au montage
  useEffect(() => {
    const loadChatData = async () => {
      if ((!activityId && !isPrivateChat) || !user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const token = await getToken();
        if (!token) {
          setError('Impossible de récupérer le token d\'authentification');
          return;
        }
        
        // Connecter WebSocket
        chatService.connect();
        
        if (isPrivateChat) {
          // Pour les chats privés, récupérer les données depuis l'API conversations
          const conversationsResponse = await fetch(`http://192.168.1.62:5000/api/discussions/conversations`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          let extractedOrganizerName = 'Organisateur';
          let extractedOrganizerAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';

          if (conversationsResponse.ok) {
            const data = await conversationsResponse.json();
            const privateChats = data.privateChats || [];
            
            // Trouver la conversation privée correspondante
            const currentPrivateChat = privateChats.find((chat: any) => 
              chat.id === chatId || `private-${chat.id}` === chatId
            );
            
            if (currentPrivateChat) {
              extractedOrganizerName = currentPrivateChat.organizerName || 'Organisateur';
              extractedOrganizerAvatar = currentPrivateChat.organizerAvatar || extractedOrganizerAvatar;
            }
          }

          chatService.joinPrivateChat(chatId);
          
          // Charger les messages privés
          const { messages: chatMessages } = await chatService.getPrivateMessages(chatId, token);
          console.log('📨 Messages privés reçus:', chatMessages);
          
          const formattedMessages: Message[] = chatMessages.map((msg: ChatMessage) => ({
            id: msg.id,
            text: msg.content,
            sender: msg.user.fullName || `${msg.user.firstName} ${msg.user.lastName}`.trim(),
            timestamp: new Date(msg.createdAt),
            isMe: msg.userId === user.id,
            type: msg.messageType === 'IMAGE' ? 'image' : 'text',
            imageUri: msg.mediaUrl ? `${process.env.EXPO_PUBLIC_URL_BACKEND?.replace('/api', '')}${msg.mediaUrl}` : undefined,
            user: msg.user
          }));
          
          console.log('📝 Messages privés formatés:', formattedMessages);
          setMessages(formattedMessages);
          
          console.log('🖼️ Avatar organisateur extrait:', extractedOrganizerAvatar);
          setOrganizerName(extractedOrganizerName);
          setOrganizerAvatar(extractedOrganizerAvatar);
          
          // Pour les chats privés, pas de participants à charger
          setParticipants([]);
        } else {
          // Pour les chats d'activité
          chatService.joinActivityChat(activityId);
          
          // Charger les messages existants
          const { messages: chatMessages } = await chatService.getActivityMessages(activityId, token);
          console.log('📨 Messages reçus:', chatMessages);
          
          const formattedMessages: Message[] = chatMessages.map((msg: ChatMessage) => ({
            id: msg.id,
            text: msg.content,
            sender: msg.user.fullName || `${msg.user.firstName} ${msg.user.lastName}`.trim(),
            timestamp: new Date(msg.createdAt),
            isMe: msg.userId === user.id,
            type: msg.messageType === 'IMAGE' ? 'image' : 'text',
            imageUri: msg.mediaUrl ? `${process.env.EXPO_PUBLIC_URL_BACKEND?.replace('/api', '')}${msg.mediaUrl}` : undefined,
            user: msg.user
          }));
          
          console.log('📝 Messages formatés:', formattedMessages);
          setMessages(formattedMessages);
          
          // Charger les participants
          const chatParticipants = await chatService.getChatParticipants(activityId, token);
          console.log('👥 Participants reçus:', chatParticipants);
          setParticipants(chatParticipants);
          
          // Récupérer les données de l'activité depuis l'API conversations
          let extractedActivityName = 'Chat de l\'activité';
          let extractedActivityImage = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=150&h=150&fit=crop';
          
          try {
            // Récupérer les données depuis l'API conversations
            const conversationsResponse = await fetch(`http://192.168.1.62:5000/api/discussions/conversations`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (conversationsResponse.ok) {
              const data = await conversationsResponse.json();
              const groupChats = data.groupChats || [];
              
              // Trouver l'activité correspondante
              const currentActivity = groupChats.find((chat: any) => 
                chat.id === `activity-${activityId}` || chat.id === activityId
              );
              
              if (currentActivity) {
                extractedActivityName = currentActivity.activityName || 'Chat de l\'activité';
                extractedActivityImage = currentActivity.activityImage || extractedActivityImage;
              }
            }
          } catch (error) {
            console.error('Erreur lors de la récupération des données de l\'activité:', error);
          }
          
          console.log('🖼️ Image activité extraite:', extractedActivityImage);
          setActivityName(extractedActivityName);
          setActivityImage(extractedActivityImage);
        }
        
      } catch (error) {
        console.error('Erreur chargement chat:', error);
        setError(error instanceof Error ? error.message : 'Erreur lors du chargement du chat');
      } finally {
        setLoading(false);
      }
    };
    
    loadChatData();
    
    // Cleanup au démontage
    return () => {
      if (isPrivateChat) {
        chatService.leavePrivateChat(chatId);
      } else if (activityId) {
        chatService.leaveActivityChat(activityId);
      }
    };
  }, [chatId, activityId, isPrivateChat, user]);
  
  // S'abonner aux nouveaux messages
  useEffect(() => {
    const handleNewMessage = (newMessage: ChatMessage) => {
      const formattedMessage: Message = {
        id: newMessage.id,
        text: newMessage.content,
        sender: newMessage.user.fullName || `${newMessage.user.firstName} ${newMessage.user.lastName}`.trim(),
        timestamp: new Date(newMessage.createdAt),
        isMe: newMessage.userId === user?.id,
        type: newMessage.messageType === 'IMAGE' ? 'image' : 'text',
        imageUri: newMessage.mediaUrl ? `${process.env.EXPO_PUBLIC_URL_BACKEND?.replace('/api', '')}${newMessage.mediaUrl}` : undefined,
        user: newMessage.user
      };
      
      setMessages(prev => [...prev, formattedMessage]);
    };
    
    const callbackId = chatService.onNewMessage(handleNewMessage);
    
    return () => {
      chatService.offNewMessage(callbackId);
    };
  }, [user]);
  
  // Auto-scroll vers le bas
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerAvatarContainer}>
          <Image 
            source={{ uri: isPrivateChat ? organizerAvatar : activityImage }} 
            style={[styles.headerAvatar, { borderWidth: 3, borderColor: '#A855F7' }]}
          />
          <View style={[styles.headerTypeIcon, { backgroundColor: isPrivateChat ? '#8B5CF6' : '#10B981' }]}>
            {isPrivateChat ? (
              <Lock size={9} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <Users size={9} color="#FFFFFF" strokeWidth={2} />
            )}
          </View>
          {!isPrivateChat && participants.some((p: any) => p.isOnline) && (
            <View style={styles.headerOnlineIndicator} />
          )}
        </View>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: '#8B5CF6' }]} numberOfLines={1} ellipsizeMode="tail">
            {displayName ? (typeof displayName === 'string' ? displayName : displayName[0]) : 
             (isPrivateChat ? (organizerName || 'Organisateur') : (activityName || 'Chat de l\'activité'))}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {isPrivateChat 
              ? 'Conversation privée' 
              : `${participants.length} participant${participants.length > 1 ? 's' : ''}`
            }
          </Text>
          {isPrivateChat && (
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={styles.headerPrivateBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.headerPrivateBadgeText}>PRIVÉ</Text>
            </LinearGradient>
          )}
          {!isPrivateChat && (
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.headerGroupBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.headerGroupBadgeText}>GROUPE</Text>
            </LinearGradient>
          )}
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Chargement du chat...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              {error}
            </Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Aucun message
                </Text>
              </View>
            ) : 
              messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageContainer,
                msg.isMe ? styles.myMessageContainer : styles.otherMessageContainer
              ]}
            >
              {!msg.isMe && (
                <Text style={[styles.senderName, { color: colors.textSecondary }]}>
                  {msg.sender}
                </Text>
              )}
              <View style={[
                styles.messageBubble,
                msg.isMe ? styles.myMessageBubble : [styles.otherMessageBubble, { backgroundColor: colors.surface }]
              ]}>
                {msg.type === 'image' && msg.imageUri ? (
                  <TouchableOpacity onPress={() => setSelectedImage(msg.imageUri!)}>
                    <Image 
                      source={{ uri: msg.imageUri }} 
                      style={styles.messageImage}
                    />
                  </TouchableOpacity>
                ) : (
                  <Text style={[
                    styles.messageText,
                    msg.isMe ? styles.myMessageText : { color: colors.text }
                  ]}>
                    {msg.text}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.messageTime,
                { color: colors.textSecondary },
                msg.isMe ? styles.myMessageTime : styles.otherMessageTime
              ]}>
                {formatTime(msg.timestamp)}
              </Text>
            </View>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: 'rgba(0, 0, 0, 0.3)' }]}>
          {showImageOptions && (
            <View style={[styles.imageOptionsContainer, { backgroundColor: colors.surface }]}>
              <TouchableOpacity 
                style={[styles.imageOption, { backgroundColor: colors.background }]}
                onPress={() => pickImage('camera')}
              >
                <Camera size={20} color={colors.text} strokeWidth={2} />
                <Text style={[styles.imageOptionText, { color: colors.text }]}>Caméra</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.imageOption, { backgroundColor: colors.background }]}
                onPress={() => pickImage('library')}
              >
                <ImageIcon size={20} color={colors.text} strokeWidth={2} />
                <Text style={[styles.imageOptionText, { color: colors.text }]}>Galerie</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.imageButton}
            onPress={() => setShowImageOptions(!showImageOptions)}
          >
            <Plus 
              size={20} 
              color="white" 
              strokeWidth={2}
              style={{ transform: [{ rotate: showImageOptions ? '45deg' : '0deg' }] }}
            />
          </TouchableOpacity>
          
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Tapez votre message..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.textInput, { color: colors.text }]}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!message.trim() || sending}
            style={[
              styles.sendButton,
              { backgroundColor: message.trim() && !sending ? '#8B5CF6' : colors.border }
            ]}
          >
            {sending ? (
              <ActivityIndicator size={18} color="#FFFFFF" />
            ) : (
              <Send 
                size={18} 
                color={message.trim() && !sending ? '#FFFFFF' : colors.textSecondary} 
                strokeWidth={2} 
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Image Viewer Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity 
            style={styles.imageViewerBackground}
            onPress={() => setSelectedImage(null)}
          >
            <View style={styles.imageViewerContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedImage(null)}
              >
                <X size={24} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
              {selectedImage && (
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 12,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'left',
    paddingHorizontal: 0,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerAvatarContainer: {
    position: 'relative',
    marginLeft: 16,
  },
  headerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  headerTypeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerOnlineIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerPrivateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  headerPrivateBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  headerGroupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  headerGroupBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  keyboardContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  myMessageBubble: {
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    alignSelf: 'flex-end',
    marginRight: 12,
  },
  otherMessageTime: {
    alignSelf: 'flex-start',
    marginLeft: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    gap: 12,
    position: 'relative',
  },
  imageOptionsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  imageOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  imageOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  imageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 20,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginTop: 8,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContent: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  fullScreenImage: {
    width: screenWidth - 40,
    height: screenHeight - 200,
    borderRadius: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  systemMessage: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  privateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginLeft: 8,
  },
  privateBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});