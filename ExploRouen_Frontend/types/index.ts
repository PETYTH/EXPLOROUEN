export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: number;
  xp: number;
  joinedDate: string;
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    language: 'fr' | 'en';
  };
  stats: {
    totalActivities: number;
    completedActivities: number;
    monumentsVisited: number;
    easterEggsFound: number;
    totalDistance: number;
    totalTime: number;
  };
}

export interface Monument {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  visitDuration: string;
  category: 'religious' | 'historical' | 'cultural' | 'architectural';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  openingHours: string;
  price: string;
  highlights: string[];
  history: string;
  easterEggHints?: string[];
  isVisited?: boolean;
  visitedAt?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'sport' | 'cultural' | 'easter-hunt' | 'social';
  date: string;
  time: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  difficulty: 'Facile' | 'Modéré' | 'Difficile';
  duration: string;
  price: number;
  organizer: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    verified: boolean;
  };
  image: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  chatRoomId?: string;
  requirements: string[];
  meetingPoint: string;
  category: string;
  tags: string[];
  isJoined?: boolean;
  joinedAt?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  type: 'text' | 'image' | 'system' | 'location';
  isRead?: boolean;
  reactions?: { emoji: string; users: string[] }[];
}

export interface ChatRoom {
  id: string;
  activityId: string;
  activityName: string;
  activityImage?: string;
  participants: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
    lastSeen?: string;
  }[];
  messages: ChatMessage[];
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
  unreadCount: number;
  lastMessage?: ChatMessage;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}