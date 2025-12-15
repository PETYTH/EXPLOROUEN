import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Home, Calendar, MessageCircle, Map, User, Plus, Trash2, Search, Users, Lock } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';
import chatService from '@/services/chatService';
import { Swipeable } from 'react-native-gesture-handler';
import { useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '@/contexts/NotificationContext';

interface ExtendedMessage {
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
  chatType: 'group' | 'private';
  chatRoomName: string;
  chatRoomId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    imageUrl: string;
  };
}

// Composant pour gérer chaque élément de la liste avec sa propre référence Swipeable
const MessageItem = ({ conversation, index, chatType, isPrivate, colors, unreadMessages, navigateToChat, handleDeleteConversation, formatTime }: {
  conversation: any;
  index: number;
  chatType: 'group' | 'private';
  isPrivate: boolean;
  colors: any;
  unreadMessages: Map<string, any>;
  navigateToChat: (chatId: string, chatType: 'group' | 'private', displayName?: string) => void;
  handleDeleteConversation: (chatId: string, chatType: 'group' | 'private', swipeableRef?: React.RefObject<Swipeable | null>) => void;
  formatTime: (timestamp: string) => string;
}) => {
  const swipeableRef = React.useRef<Swipeable>(null);

  const renderRightActions = () => {
    if (chatType === 'group') {
      return null;
    }
    return (
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => {
          handleDeleteConversation(conversation.id, chatType, swipeableRef);
        }}
      >
        <Trash2 size={24} color="#FFFFFF" strokeWidth={2} />
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <Swipeable ref={swipeableRef} renderRightActions={renderRightActions}>
        <TouchableOpacity
          style={[styles.messageCard, { backgroundColor: colors.surface }]}
          onPress={() => navigateToChat(conversation.id, chatType, isPrivate ? conversation.organizerName : conversation.activityName)}
        >
          <View style={styles.profileRow}>
            <View style={styles.profileAvatarContainer}>
              <Image 
                source={{ uri: isPrivate ? conversation.organizerAvatar : conversation.activityImage }} 
                style={[styles.profileAvatar, { borderWidth: 3, borderColor: isPrivate ? '#1E40AF' : '#EAB308' }]}
              />
              {isPrivate ? (
                <View style={[styles.typeIcon, { backgroundColor: '#1E40AF' }]}>
                  <Lock size={9} color="#FFFFFF" strokeWidth={2} />
                </View>
              ) : (
                <LinearGradient
                  colors={['#EAB308', '#FACC15']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.typeIcon}
                >
                  <Users size={9} color="#FFFFFF" strokeWidth={2} />
                </LinearGradient>
              )}
              {!isPrivate && conversation.participants?.some((p: any) => p.isOnline) && (
                <View style={styles.onlineIndicator} />
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <View style={styles.profileHeader}>
                <Text style={[styles.profileName, { color: isPrivate ? '#1E40AF' : '#EAB308' }]} numberOfLines={1} ellipsizeMode="tail">
                  {conversation.activityName || conversation.organizerName || 'Chat'}
                </Text>
                <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
                  {conversation.lastMessage ? formatTime(conversation.lastMessage.createdAt || conversation.lastMessage.timestamp) : 'Nouveau'}
                </Text>
              </View>
              <View style={styles.subtitleRow}>
                <Text style={[styles.profileSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {conversation.lastMessage ? (
                    conversation.lastMessage.messageType === 'IMAGE' ? '📷 Image' :
                    conversation.lastMessage.messageType === 'VIDEO' ? '🎥 Vidéo' :
                    conversation.lastMessage.content
                  ) : (
                    isPrivate ? 'Chat avec l\'organisateur' : `Groupe • ${conversation.participants?.length || 0} participants`
                  )}
                </Text>
                {isPrivate ? (
                  <LinearGradient
                    colors={['#1E40AF', '#3B82F6']}
                    style={styles.privateBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.privateBadgeText}>PRIVÉ</Text>
                  </LinearGradient>
                ) : (
                  <LinearGradient
                    colors={['#EAB308', '#FACC15']}
                    style={styles.groupBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.groupBadgeText}>GROUPE</Text>
                  </LinearGradient>
                )}
              </View>
            </View>
            
            <View style={styles.profileAction}>
              {(() => {
                const chatId = conversation.id;
                const unread = unreadMessages.get(chatId);
                const count = unread?.count || conversation.unreadCount || 0;
                
                return count > 0 ? (
                  isPrivate ? (
                    <View style={[styles.unreadBadge, { backgroundColor: '#3B82F6' }]}>
                      <Text style={styles.unreadText}>
                        {count > 99 ? '99+' : count}
                      </Text>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={['#EAB308', '#FACC15']}
                      style={styles.unreadBadge}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.unreadText}>
                        {count > 99 ? '99+' : count}
                      </Text>
                    </LinearGradient>
                  )
                ) : (
                  <Text style={[styles.arrow, { color: colors.textSecondary }]}>›</Text>
                );
              })()}
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </View>
  );
};

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'groups' | 'private'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  
  const filterOptions = [
    { id: 'all', label: 'Tous' },
    { id: 'private', label: 'Privé' },
    { id: 'group', label: 'Groupe' }
  ];

  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const { getToken } = useAuth();
  const { unreadMessages, refreshUnreadCounts } = useNotifications();
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [privateChats, setPrivateChats] = useState<any[]>([]);

  const loadChatRooms = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        // Session expirée, nettoyer silencieusement
        setChatRooms([]);
        setPrivateChats([]);
        return;
      }

      const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';

      // Utiliser l'endpoint conversations qui retourne tout
      const conversationsResponse = await fetch(`${API_URL}/discussions/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (conversationsResponse.ok) {
        const data = await conversationsResponse.json();
        
        const groupChats = data.groupChats || [];
        const privateChats = data.privateChats || [];
        
        setChatRooms(groupChats);
        setPrivateChats(privateChats);

        // Rejoindre les rooms des groupes pour le temps réel
        groupChats.forEach((chat: any) => {
          const activityId = chat.id.replace('activity-', '');
          chatService.joinActivityChat(activityId);
        });
      } else if (conversationsResponse.status === 401) {
        // Session expirée, nettoyer silencieusement sans afficher d'erreur
        setChatRooms([]);
        setPrivateChats([]);
      } else {
        // Autres erreurs serveur
        setChatRooms([]);
        setPrivateChats([]);
      }
    } catch (error: any) {
      // Gérer les erreurs silencieusement pour ne pas perturber l'utilisateur
      if (error?.message?.includes('authenticate') || error?.status === 401) {
        // Session expirée - pas de message d'erreur
        setChatRooms([]);
        setPrivateChats([]);
      } else {
        // Erreur réseau ou autre - nettoyer sans alerte
        setChatRooms([]);
        setPrivateChats([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshChatRooms = async () => {
    await loadChatRooms();
  };

  useEffect(() => {
    chatService.connect();
    if (user) {
      chatService.identify(user.id);
    }
    loadChatRooms();
    
    return () => {
      // Ne pas déconnecter le socket ici car il est utilisé globalement par NotificationContext
      // chatService.disconnect();
    };
  }, []);

  // Recharger les conversations quand l'écran devient actif
  useFocusEffect(
    useCallback(() => {
      loadChatRooms();
    }, [])
  );

  // Filtrer les conversations selon la recherche et l'onglet sélectionné
  const getFilteredConversations = () => {
    let allConversations: any[] = [];
    
    if (selectedTab === 'all' || selectedTab === 'groups') {
      allConversations = [...allConversations, ...chatRooms];
    }
    
    if (selectedTab === 'all' || selectedTab === 'private') {
      allConversations = [...allConversations, ...privateChats];
    }
    
    // Filtrer par recherche
    if (searchQuery) {
      allConversations = allConversations.filter(conversation => 
        conversation.activityName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return allConversations;
  };

  const filteredConversations = getFilteredConversations();

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshChatRooms(), refreshUnreadCounts()]);
    setRefreshing(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    // Moins de 1 minute
    if (diffInMinutes < 1) {
      return 'À l\'instant';
    }
    
    // Moins de 60 minutes
    if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)} min`;
    }
    
    // Aujourd'hui - afficher l'heure
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Hier
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }
    
    // Cette semaine
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    }
    
    // Plus ancien - afficher la date
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };


  const navigateToChat = (chatId: string, chatType: 'group' | 'private', displayName?: string) => {
    // Corriger le double "activity-" pour les groupes
    const correctedId = chatType === 'group' && chatId.startsWith('activity-activity-') 
      ? chatId.replace('activity-activity-', 'activity-')
      : chatId;
    
    // Passer le nom d'affichage en paramètre de query
    const params = displayName ? `?displayName=${encodeURIComponent(displayName)}` : '';
    router.push(`/chat/${correctedId}${params}`);
  };

  const handleDeleteConversation = async (chatId: string, chatType: 'group' | 'private', swipeableRef?: React.RefObject<Swipeable | null>) => {
    // Empêcher la suppression des conversations de groupe
    if (chatType === 'group') {
      Alert.alert(
        'Action non autorisée',
        'Vous ne pouvez pas supprimer les conversations de groupe. Quittez l\'activité pour ne plus recevoir de messages.',
        [{ text: 'OK', style: 'default' }]
      );
      swipeableRef?.current?.close();
      return;
    }

    Alert.alert(
      'Supprimer la conversation',
      'Voulez-vous supprimer ce message ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => {
            swipeableRef?.current?.close();
          }
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) return;

              const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
              // Appeler l'API pour supprimer la conversation privée
              const response = await fetch(`${API_URL}/discussions/private/${chatId}/delete`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (response.ok) {
                // Recharger les conversations
                await loadChatRooms();
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer la conversation');
                swipeableRef?.current?.close();
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la conversation');
              swipeableRef?.current?.close();
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllPrivateChats = () => {
    Alert.alert(
      'Supprimer tous les messages privés',
      'Voulez-vous supprimer tous les messages privés ?',
      [
        {
          text: 'Non',
          style: 'cancel',
        },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) return;

              const API_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';
              
              // Supprimer chaque conversation privée une par une
              // Note: Idéalement, il faudrait un endpoint backend pour la suppression en masse
              const deletePromises = privateChats.map(chat => 
                fetch(`${API_URL}/discussions/private/${chat.id}/delete`, {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                })
              );

              await Promise.all(deletePromises);
              await loadChatRooms();
              
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer les conversations');
            }
          },
        },
      ]
    );
  };

  const tabs = [
    { id: 'all', label: 'Tous', icon: Search },
    { id: 'groups', label: 'Groupes', icon: Users },
    { id: 'private', label: 'Privés', icon: Lock },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={[styles.headerTitle, { color: colors.text, marginBottom: 0 }]}>Messages</Text>
          <TouchableOpacity 
            onPress={handleDeleteAllPrivateChats}
            style={{
              backgroundColor: '#EF4444',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 25,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>Tout supprimer</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Search size={18} color="#FFFFFF" strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="  Rechercher dans les messages..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              { backgroundColor: selectedTab === 'all' ? '#1E40AF' : 'rgba(255, 255, 255, 0.1)' }
            ]}
            onPress={() => setSelectedTab('all')}
          >
            <Text style={[
              styles.tabButtonText,
              { color: selectedTab === 'all' ? '#FFFFFF' : colors.text }
            ]}>
              Tous
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              { backgroundColor: selectedTab === 'groups' ? '#F59E0B' : 'rgba(255, 255, 255, 0.1)' }
            ]}
            onPress={() => setSelectedTab('groups')}
          >
            <Users size={16} color={selectedTab === 'groups' ? '#FFFFFF' : colors.text} strokeWidth={2} />
            <Text style={[
              styles.tabButtonText,
              { color: selectedTab === 'groups' ? '#FFFFFF' : colors.text, marginLeft: 6 }
            ]}>
              Groupes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              { backgroundColor: selectedTab === 'private' ? '#1E40AF' : 'rgba(255, 255, 255, 0.1)' }
            ]}
            onPress={() => setSelectedTab('private')}
          >
            <Lock size={16} color={selectedTab === 'private' ? '#FFFFFF' : '#1E40AF'} strokeWidth={2} />
            <Text style={[
              styles.tabButtonText,
              { color: selectedTab === 'private' ? '#FFFFFF' : colors.text, marginLeft: 6 }
            ]}>
              Privés
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Messages Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement des messages...
          </Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color={colors.textSecondary} strokeWidth={1.5} style={{ opacity: 0.3 }} />
          <Text style={[styles.emptyTitle, { color: colors.text, marginTop: 16, fontSize: 18, fontWeight: '600' }]}>
            Aucune conversation
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }]}>
            {selectedTab === 'all' ? 'Rejoignez une activité pour commencer à discuter' :
             selectedTab === 'groups' ? 'Aucune discussion de groupe active' :
             'Aucune conversation privée'}
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.messagesList}
          contentContainerStyle={{ 
            paddingBottom: 120,
            flexGrow: 1 
          }}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1E40AF"
            />
          }
        >
          {filteredConversations.map((conversation, index) => {
            const isPrivate = conversation.id.startsWith('private-');
            const chatType = isPrivate ? 'private' : 'group';
            const uniqueKey = `${conversation.id}-${index}-${chatType}`;

            return (
              <MessageItem
                key={uniqueKey}
                conversation={conversation}
                index={index}
                chatType={chatType}
                isPrivate={isPrivate}
                colors={colors}
                unreadMessages={unreadMessages}
                navigateToChat={navigateToChat}
                handleDeleteConversation={handleDeleteConversation}
                formatTime={formatTime}
              />
            );
          })}
        </ScrollView>
      )}
      
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabsScroll: {
    flexDirection: 'row',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 12,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messagesList: {
    paddingHorizontal: 20,
    flex: 1,
  },
  messageCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarContainer: {
    position: 'relative',
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  typeIcon: {
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
  onlineIndicator: {
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
  profileInfo: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  privateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  privateBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  groupBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profileAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 18,
    fontWeight: '300',
  },
  unreadBadge: {
    backgroundColor: '#3B82F6', // Bleu demandé par l'utilisateur
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 150,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignSelf: 'center',
    marginRight: 20,
  },
});
