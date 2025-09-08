import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useChat } from '@/contexts/ChatContext';
import { useUser } from '@clerk/clerk-expo';

export default function ChatScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const { chatRooms, refreshChatRooms } = useChat();
  const { user } = useUser();

  // Les chat rooms sont déjà filtrées par inscription dans le ChatContext
  const userChatRooms = chatRooms;

  // Filtrer les chats selon la recherche
  const filteredChatRooms = userChatRooms.filter(room => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return room.activityName.toLowerCase().includes(query) ||
           room.messages.some(msg => msg.text.toLowerCase().includes(query));
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshChatRooms();
    setRefreshing(false);
  }, [refreshChatRooms]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Search size={18} color={colors.textSecondary} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Chat List */}
        <View style={styles.chatSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Groupes d'activités</Text>
          
          {filteredChatRooms.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                {searchQuery.trim() ? 'Aucun résultat' : 'Aucun chat actif'}
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {searchQuery.trim() 
                  ? 'Aucun chat ne correspond à votre recherche'
                  : 'Rejoignez une activité pour accéder au chat de groupe'
                }
              </Text>
            </View>
          ) : (
          <View style={styles.chatList}>
              {filteredChatRooms.map((chat) => {
                const lastMessage = chat.messages[chat.messages.length - 1];
                return (
              <TouchableOpacity 
                key={chat.id} 
                style={styles.chatItem}
                onPress={() => router.push(`/chat/${chat.id}`)}
              >
                <View style={styles.chatAvatarContainer}>
                    <Image source={{ uri: chat.activityImage }} style={styles.chatAvatar} />
                    <View style={styles.activityIndicator} />
                </View>
                
                <View style={styles.chatContent}>
                  <View style={styles.chatHeader}>
                      <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>
                        {chat.activityName}
                      </Text>
                      <Text style={[styles.chatTime, { color: colors.textSecondary }]}>
                        {lastMessage ? formatTime(lastMessage.timestamp) : ''}
                      </Text>
                  </View>
                    <Text style={[styles.chatMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                      {lastMessage ? 
                        (lastMessage.type === 'image' ? '📷 Photo' : 
                         lastMessage.type === 'system' ? lastMessage.text :
                         `${lastMessage.isMe ? 'Vous: ' : `${lastMessage.senderName}: `}${lastMessage.text}`) 
                        : 'Aucun message'
                      }
                    </Text>
                </View>
                
                {chat.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{chat.unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
                );
              })}
          </View>
          )}
        </View>

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  emptyState: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  chatSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  chatList: {
    gap: 0,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  chatAvatarContainer: {
    position: 'relative',
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  chatOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#667EEA',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  activityIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#8B5CF6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 15,
    fontWeight: '600',
  },
  chatTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  chatMessage: {
    fontSize: 13,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 100,
  },
});