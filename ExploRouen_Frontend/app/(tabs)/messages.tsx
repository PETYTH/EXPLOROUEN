import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Home, Calendar, MessageCircle, Map, User, Plus, Trash2, Search, Users, Lock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@clerk/clerk-expo';
import chatService from '@/services/chatService';
import { Swipeable } from 'react-native-gesture-handler';
import { useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';

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

  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [privateChats, setPrivateChats] = useState<any[]>([]);

  const loadChatRooms = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        console.warn('⚠️ No auth token available');
        setChatRooms([]);
        setPrivateChats([]);
        return;
      }

      // Utiliser l'endpoint conversations qui retourne tout
      const conversationsResponse = await fetch(`http://192.168.1.62:5000/api/discussions/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (conversationsResponse.ok) {
        const data = await conversationsResponse.json();
        // console.log('📊 Conversations:', data);
        
        const groupChats = data.groupChats || [];
        const privateChats = data.privateChats || [];
        
        setChatRooms(groupChats);
        setPrivateChats(privateChats);
        
        // console.log('✅ Conversations loaded:', groupChats.length, 'group chats,', privateChats.length, 'private chats');
      } else {
        setChatRooms([]);
        setPrivateChats([]);
      }
    } catch (error) {
      setChatRooms([]);
      setPrivateChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshChatRooms = async () => {
    await loadChatRooms();
  };

  useEffect(() => {
    chatService.connect();
    loadChatRooms();
    
    return () => {
      chatService.disconnect();
    };
  }, []);

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
    await refreshChatRooms();
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

  const handleDeleteConversation = (chatId: string, chatType: 'group' | 'private') => {
    // Empêcher la suppression des conversations de groupe
    if (chatType === 'group') {
      Alert.alert(
        'Action non autorisée',
        'Vous ne pouvez pas supprimer les conversations de groupe. Quittez l\'activité pour ne plus recevoir de messages.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Supprimer la conversation privée',
      'Êtes-vous sûr de vouloir supprimer cette conversation privée ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) return;

              // Appeler l'API pour supprimer la conversation privée
              const response = await fetch(`http://192.168.1.62:5000/api/discussions/private/${chatId}/delete`, {
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
              }
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la conversation');
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
      <Animated.View entering={FadeInDown.delay(100)} style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Search size={18} color={colors.textSecondary} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="  Rechercher dans les messages..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </Animated.View>


      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              { backgroundColor: selectedTab === 'all' ? '#8B5CF6' : 'rgba(255, 255, 255, 0.1)' }
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
              { backgroundColor: selectedTab === 'groups' ? '#10B981' : 'rgba(255, 255, 255, 0.1)' }
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
              { backgroundColor: selectedTab === 'private' ? '#A855F7' : 'rgba(255, 255, 255, 0.1)' }
            ]}
            onPress={() => setSelectedTab('private')}
          >
            <Lock size={16} color={selectedTab === 'private' ? '#FFFFFF' : colors.text} strokeWidth={2} />
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
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement des messages...
          </Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {selectedTab === 'all' ? 'Vous n\'avez encore aucun message' :
             selectedTab === 'groups' ? 'Aucun message de groupe' :
             'Aucun message privé'}
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
              tintColor="#8B5CF6"
            />
          }
        >
          {filteredConversations.map((conversation, index) => {
            const isPrivate = conversation.id.startsWith('private-');
            const chatType = isPrivate ? 'private' : 'group';
            
            const renderRightActions = () => {
              if (chatType === 'group') {
                return null;
              }
              return (
                <View style={styles.deleteButton}>
                  <Trash2 size={20} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.deleteText}>Supprimer</Text>
                </View>
              );
            };

            return (
              <Animated.View
                key={conversation.id}
                entering={FadeInDown.delay(200 + index * 50)}
              >
                <Swipeable renderRightActions={renderRightActions}>
                  <TouchableOpacity
                    style={[styles.messageCard, { backgroundColor: colors.surface }]}
                    onPress={() => navigateToChat(conversation.id, chatType, isPrivate ? conversation.organizerName : conversation.activityName)}
                  >
                    <View style={styles.profileRow}>
                      <View style={styles.profileAvatarContainer}>
                        <Image 
                          source={{ uri: isPrivate ? conversation.organizerAvatar : conversation.activityImage }} 
                          style={[styles.profileAvatar, { borderWidth: 3, borderColor: '#A855F7' }]}
                        />
                        <View style={[styles.typeIcon, { backgroundColor: isPrivate ? '#8B5CF6' : '#10B981' }]}>
                          {isPrivate ? (
                            <Lock size={9} color="#FFFFFF" strokeWidth={2} />
                          ) : (
                            <Users size={9} color="#FFFFFF" strokeWidth={2} />
                          )}
                        </View>
                        {!isPrivate && conversation.participants?.some((p: any) => p.isOnline) && (
                          <View style={styles.onlineIndicator} />
                        )}
                      </View>
                      
                      <View style={styles.profileInfo}>
                        <View style={styles.profileHeader}>
                          <Text style={[styles.profileName, { color: '#A855F7' }]} numberOfLines={1} ellipsizeMode="tail">
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
                              colors={['#6366F1', '#8B5CF6']}
                              style={styles.privateBadge}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              <Text style={styles.privateBadgeText}>PRIVÉ</Text>
                            </LinearGradient>
                          ) : (
                            <LinearGradient
                              colors={['#10B981', '#059669']}
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
                        {conversation.unreadCount && conversation.unreadCount > 0 ? (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </Text>
                          </View>
                        ) : (
                          <Text style={[styles.arrow, { color: colors.textSecondary }]}>›</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 18,
    fontWeight: '300',
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
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
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 16,
    marginVertical: 6,
    marginRight: 12,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
