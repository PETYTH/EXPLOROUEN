import { useAuth } from '@clerk/clerk-expo';

const API_BASE_URL = process.env.EXPO_PUBLIC_URL_BACKEND || 'http://localhost:5000/api';

// Debug: Log l'URL utilisée (production seulement)
if (__DEV__) {
  console.log('🔗 API_BASE_URL:', API_BASE_URL);
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

class ApiService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Debug: Log l'URL complète appelée (erreurs seulement)
    // console.log('🌐 Calling API:', url);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const error = {
          status: response.status,
          message: response.status === 401 ? 'UNAUTHORIZED' : `HTTP error! status: ${response.status}`,
          code: response.status.toString()
        };
        throw error;
      }

      const result: ApiResponse<T> = await response.json();
      
      if (!result.success) {
        const error = {
          status: 400,
          message: result.message || 'API request failed',
          code: 'API_ERROR'
        };
        throw error;
      }

      return result.data as T;
    } catch (error: any) {
      // Log seulement si ce n'est pas une erreur 401 (token expiré)
      if (error.status !== 401) {
        console.error(`API Error for ${endpoint}:`, error);
      }
      
      // Si c'est une erreur réseau (pas de status), on l'indique
      if (!error.status) {
        error.message = 'Network request failed';
      }
      
      throw error;
    }
  }

  private static async makeAuthenticatedRequest<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  }


  static async getUserActivities(token: string): Promise<BackendActivity[]> {
    return this.makeAuthenticatedRequest<BackendActivity[]>('/activities/user/registered', token);
  }

  // Activities endpoints
  static async getActivities(filters?: {
    type?: string;
    difficulty?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }, token?: string): Promise<BackendActivity[]> {
    // console.log('🎯 getActivities called with filters:', filters);
    // console.log('🔑 Token provided:', !!token);
    
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/activities${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    // console.log('📍 Final endpoint:', endpoint);
    
    if (token) {
      return this.makeAuthenticatedRequest<BackendActivity[]>(endpoint, token);
    }
    return this.makeRequest<BackendActivity[]>(endpoint);
  }

  static async getActivityById(id: string, token?: string): Promise<BackendActivityDetail> {
    const endpoint = `/activities/${id}`;
    
    if (token) {
      return this.makeAuthenticatedRequest<BackendActivityDetail>(endpoint, token);
    }
    return this.makeRequest<BackendActivityDetail>(endpoint);
  }

  static async createActivity(
    activityData: CreateActivityData,
    token: string
  ): Promise<BackendActivity> {
    return this.makeAuthenticatedRequest<BackendActivity>('/activities', token, {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }

  static async registerToActivity(activityId: string, token: string): Promise<any> {
    return this.makeAuthenticatedRequest<any>(`/activities/${activityId}/register`, token, {
      method: 'POST',
    });
  }

  static async unregisterFromActivity(activityId: string, token: string): Promise<any> {
    return this.makeAuthenticatedRequest<any>(`/activities/${activityId}/register`, token, {
      method: 'DELETE',
    });
  }

  static async getUserRegisteredActivities(token: string): Promise<BackendActivity[]> {
    return this.makeAuthenticatedRequest<BackendActivity[]>('/activities/user/registered', token);
  }

  // Places/Monuments endpoints
  static async getPlaces(filters?: {
    category?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    search?: string;
  }): Promise<BackendPlace[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/places${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<BackendPlace[]>(endpoint);
  }

  static async getPlaceById(id: string): Promise<BackendPlaceDetail> {
    return this.makeRequest<BackendPlaceDetail>(`/places/${id}`);
  }

  static async createPlace(placeData: CreatePlaceData, token: string): Promise<BackendPlace> {
    return this.makeAuthenticatedRequest<BackendPlace>('/places', token, {
      method: 'POST',
      body: JSON.stringify(placeData),
    });
  }

  static async updatePlace(id: string, placeData: Partial<CreatePlaceData>, token: string): Promise<BackendPlace> {
    return this.makeAuthenticatedRequest<BackendPlace>(`/places/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify(placeData),
    });
  }

  static async deletePlace(id: string, token: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/places/${id}`, token, {
      method: 'DELETE',
    });
  }

  static async addPlaceToFavorites(id: string, token: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/places/${id}/favorite`, token, {
      method: 'POST',
    });
  }

  static async addPlaceReview(id: string, reviewData: PlaceReviewData, token: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/places/${id}/review`, token, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // Monuments endpoints
  static async getMonuments(): Promise<BackendMonument[]> {
    return this.makeRequest<BackendMonument[]>('/monuments');
  }

  static async getMonumentById(id: string): Promise<BackendMonument> {
    return this.makeRequest<BackendMonument>(`/monuments/${id}`);
  }

  static async createMonument(monumentData: CreateMonumentData, token: string): Promise<BackendPlace> {
    return this.makeAuthenticatedRequest<BackendPlace>('/places', token, {
      method: 'POST',
      body: JSON.stringify(monumentData),
    });
  }

  // Chat/Discussion endpoints
  static async getRoomMessages(roomId: string, token: string, limit?: number, offset?: number): Promise<BackendMessage[]> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());
    
    const endpoint = `/chat/rooms/${roomId}/messages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeAuthenticatedRequest<BackendMessage[]>(endpoint, token);
  }

  static async sendMessage(roomId: string, messageData: SendMessageData, token: string): Promise<BackendMessage> {
    return this.makeAuthenticatedRequest<BackendMessage>(`/chat/rooms/${roomId}/messages`, token, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  static async updateMessage(messageId: string, content: string, token: string): Promise<BackendMessage> {
    return this.makeAuthenticatedRequest<BackendMessage>(`/chat/messages/${messageId}`, token, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  static async deleteMessage(messageId: string, token: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/chat/messages/${messageId}`, token, {
      method: 'DELETE',
    });
  }

  static async addReaction(messageId: string, emoji: string, token: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/chat/messages/${messageId}/reactions`, token, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  static async removeReaction(messageId: string, emoji: string, token: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/chat/messages/${messageId}/reactions`, token, {
      method: 'DELETE',
      body: JSON.stringify({ emoji }),
    });
  }

  static async joinRoom(roomId: string, token: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/chat/rooms/${roomId}/join`, token, {
      method: 'POST',
    });
  }

  static async leaveRoom(roomId: string, token: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/chat/rooms/${roomId}/leave`, token, {
      method: 'POST',
    });
  }

  static async getRoomParticipants(roomId: string, token: string): Promise<BackendUser[]> {
    return this.makeAuthenticatedRequest<BackendUser[]>(`/chat/rooms/${roomId}/participants`, token);
  }

  // Activity Discussion endpoints (specific to activities)
  static async getActivityMessages(activityId: string, token: string, limit?: number, offset?: number): Promise<BackendMessage[]> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());
    
    const endpoint = `/activities/${activityId}/discussion/messages${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeAuthenticatedRequest<BackendMessage[]>(endpoint, token);
  }

  static async sendActivityMessage(activityId: string, messageData: SendMessageData, token: string): Promise<BackendMessage> {
    return this.makeAuthenticatedRequest<BackendMessage>(`/activities/${activityId}/discussion/messages`, token, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  static async getActivityParticipants(activityId: string, token: string): Promise<BackendUser[]> {
    return this.makeAuthenticatedRequest<BackendUser[]>(`/activities/${activityId}/discussion/participants`, token);
  }

  // Notifications endpoints
  static async getNotifications(token: string): Promise<BackendNotification[]> {
    return this.makeAuthenticatedRequest<BackendNotification[]>('/notifications', token);
  }

  static async markNotificationAsRead(notificationId: string, token: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/notifications/${notificationId}/read`, token, {
      method: 'PUT',
    });
  }

  static async markAllNotificationsAsRead(token: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>('/notifications/read-all', token, {
      method: 'PUT',
    });
  }

  // Treasures/Easter Eggs endpoints
  static async getTreasures(filters?: {
    category?: string;
    difficulty?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<BackendTreasure[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/treasures${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest<BackendTreasure[]>(endpoint);
  }

  static async getTreasureById(id: string): Promise<BackendTreasureDetail> {
    return this.makeRequest<BackendTreasureDetail>(`/treasures/${id}`);
  }

  static async claimTreasure(id: string, token: string): Promise<BackendTreasureClaim> {
    return this.makeAuthenticatedRequest<BackendTreasureClaim>(`/treasures/${id}/claim`, token, {
      method: 'POST',
    });
  }

  static async getUserTreasures(token: string): Promise<BackendTreasureClaim[]> {
    return this.makeAuthenticatedRequest<BackendTreasureClaim[]>('/treasures/user/claims', token);
  }

  static async getTreasureLeaderboard(): Promise<BackendTreasureLeaderboard[]> {
    return this.makeRequest<BackendTreasureLeaderboard[]>('/treasures/leaderboard');
  }

  // Maps endpoints
  static async getNearbyPois(lat: number, lng: number, radius?: number): Promise<BackendPoi[]> {
    const queryParams = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    });
    if (radius) queryParams.append('radius', radius.toString());
    
    return this.makeRequest<BackendPoi[]>(`/maps/nearby?${queryParams.toString()}`);
  }

  static async getRoute(startLat: number, startLng: number, endLat: number, endLng: number): Promise<BackendRoute> {
    const queryParams = new URLSearchParams({
      startLat: startLat.toString(),
      startLng: startLng.toString(),
      endLat: endLat.toString(),
      endLng: endLng.toString(),
    });
    
    return this.makeRequest<BackendRoute>(`/maps/route?${queryParams.toString()}`);
  }

  // Contact endpoint
  static async sendContactMessage(contactData: ContactMessageData): Promise<void> {
    return this.makeRequest<void>('/contact', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  // User stats (derived from activities)
  static async getUserStats(token: string): Promise<UserStats> {
    try {
      const userActivities = await this.getUserActivities(token);
      const allActivities = await this.getActivities({}, token);
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const completedActivities = userActivities.filter(
        activity => activity.registrationStatus === 'COMPLETED'
      ).length;
      
      const activeActivities = userActivities.filter(
        activity => activity.registrationStatus === 'ACCEPTED' && 
        new Date(activity.startDate) > now
      ).length;
      
      const todayActivities = allActivities.filter(
        activity => activity.startDate.split('T')[0] === today
      ).length;
      
      const totalParticipants = allActivities.reduce(
        (sum, activity) => sum + (activity.participantsCount || 0), 0
      );
      
      const avgRating = allActivities.length > 0 ? 4.8 : 0; // Placeholder for now
      
      return {
        totalActivities: userActivities.length,
        activeActivities,
        completedActivities,
        monumentsVisited: Math.floor(completedActivities * 0.6), // Estimation
        easterEggs: Math.floor(completedActivities * 0.5), // Estimation
        easterLocations: Math.floor(completedActivities * 0.3), // Estimation
        todayActivities,
        totalParticipants,
        averageRating: avgRating,
        recentActivities: userActivities.slice(0, 3).map(activity => ({
          name: activity.title,
          date: this.formatDate(activity.startDate),
          status: this.mapActivityStatus(activity, now)
        }))
      };
    } catch (error) {
      // Return default stats if API fails
      return {
        totalActivities: 0,
        activeActivities: 0,
        completedActivities: 0,
        monumentsVisited: 0,
        easterEggs: 0,
        easterLocations: 0,
        todayActivities: 0,
        totalParticipants: 0,
        averageRating: 0,
        recentActivities: []
      };
    }
  }

  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === -1) return "Hier";
    if (diffDays === 1) return "Demain";
    if (diffDays > 1) return `Dans ${diffDays} jours`;
    if (diffDays < -1) return `Il y a ${Math.abs(diffDays)} jours`;
    
    return date.toLocaleDateString('fr-FR');
  }

  private static mapActivityStatus(activity: BackendActivity, now: Date): 'completed' | 'upcoming' | 'active' {
    const startDate = new Date(activity.startDate);
    const endDate = activity.endDate ? new Date(activity.endDate) : new Date(startDate.getTime() + (activity.duration * 60 * 1000));
    
    if (activity.registrationStatus === 'COMPLETED') return 'completed';
    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'active';
    return 'completed';
  }
}

// Backend data types
export interface BackendActivity {
  id: string;
  title: string;
  description: string;
  type: string; // 'RUNNING', 'WALKING', 'CYCLING', etc.
  difficulty: string; // 'EASY', 'MEDIUM', 'HARD'
  duration: number; // in minutes
  distance?: number; // in km
  maxParticipants: number;
  startDate: string; // ISO string
  endDate?: string; // ISO string
  meetingPoint: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  price?: number;
  equipment?: string; // JSON string
  level?: string;
  createdBy: string;
  image?: string; // URL de l'image de l'activité
  category?: string; // Catégorie lisible (Running, Culture, etc.)
  organizerName?: string; // Nom de l'organisateur
  organizerAvatar?: string; // Avatar de l'organisateur
  organizerRating?: number; // Note de l'organisateur
  createdAt: string;
  updatedAt: string;
  participantsCount: number;
  isRegistered?: boolean;
  registrationStatus?: string;
  messagesCount?: number;
  calculatedDistance?: number; // calculated distance from user
  discussion?: {
    id: string;
    messages?: Array<{
      id: string;
      userId: string;
      content: string;
      messageType: string;
      createdAt: string;
    }>;
  };
}

export interface BackendActivityDetail extends BackendActivity {
  participants: Array<{ id: string }>;
  places?: Array<{
    id: string;
    place: {
      id: string;
      name: string;
      category: string;
      latitude: number;
      longitude: number;
    };
    order: number;
    description?: string;
  }>;
  discussion?: {
    id: string;
    messages: Array<{
      id: string;
      userId: string;
      content: string;
      messageType: string;
      createdAt: string;
    }>;
  };
}

export interface CreateActivityData {
  title: string;
  description: string;
  type: string;
  difficulty: string;
  duration: number;
  maxParticipants: number;
  startDate: Date;
  endDate?: Date;
  meetingPoint: string;
  latitude: number;
  longitude: number;
  places?: string[];
}

// Places/Monuments types
export interface BackendPlace {
  id: string;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string;
  website?: string;
  phone?: string;
  openingHours?: string;
  rating?: number;
  reviewsCount?: number;
  images?: string[];
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendPlaceDetail extends BackendPlace {
  reviews?: Array<{
    id: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  activities?: BackendActivity[];
}

export interface CreatePlaceData {
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string;
  website?: string;
  phone?: string;
  openingHours?: string;
}

export interface CreateMonumentData {
  name: string;
  description: string;
  address: string;
  category: string;
  latitude: number;
  longitude: number;
  historicalPeriod?: string;
  visitDuration?: string;
  images: string[];
  createdBy?: string;
  isActive: boolean;
}

export interface PlaceReviewData {
  rating: number;
  comment: string;
}

export interface BackendMonument {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  historicalPeriod?: string;
  architect?: string;
  constructionYear?: number;
  images?: string[];
  visitInfo?: string;
  accessibility?: string;
  createdAt: string;
  updatedAt: string;
}

// Chat/Messages types
export interface BackendMessage {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'LOCATION' | 'SYSTEM';
  roomId?: string;
  activityId?: string;
  reactions?: Array<{
    emoji: string;
    userId: string;
    userName: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageData {
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'LOCATION';
}

export interface BackendUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

// Notifications types
export interface BackendNotification {
  id: string;
  userId: string;
  type: 'ACTIVITY_REMINDER' | 'NEW_MESSAGE' | 'ACTIVITY_UPDATE' | 'TREASURE_FOUND' | 'SYSTEM';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

// Treasures/Easter Eggs types
export interface BackendTreasure {
  id: string;
  name: string;
  description: string;
  category: 'HISTORICAL' | 'CULTURAL' | 'NATURE' | 'ARCHITECTURE' | 'SECRET';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  latitude: number;
  longitude: number;
  hint: string;
  image?: string;
  points: number;
  isActive: boolean;
  claimsCount: number;
  createdAt: string;
}

export interface BackendTreasureDetail extends BackendTreasure {
  clues?: Array<{
    id: string;
    order: number;
    text: string;
    image?: string;
  }>;
  recentClaims?: Array<{
    id: string;
    userName: string;
    claimedAt: string;
  }>;
}

export interface BackendTreasureClaim {
  id: string;
  treasureId: string;
  treasure: BackendTreasure;
  userId: string;
  claimedAt: string;
  points: number;
}

export interface BackendTreasureLeaderboard {
  userId: string;
  userName: string;
  userAvatar?: string;
  totalPoints: number;
  treasuresFound: number;
  rank: number;
}

// Maps types
export interface BackendPoi {
  id: string;
  name: string;
  type: 'MONUMENT' | 'RESTAURANT' | 'SHOP' | 'PARK' | 'MUSEUM' | 'OTHER';
  latitude: number;
  longitude: number;
  description?: string;
  rating?: number;
  distance?: number;
}

export interface BackendRoute {
  distance: number; // in meters
  duration: number; // in seconds
  coordinates: Array<[number, number]>; // [lng, lat] pairs
  instructions?: Array<{
    text: string;
    distance: number;
    duration: number;
  }>;
}

// Contact types
export interface ContactMessageData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface UserStats {
  totalActivities: number;
  activeActivities: number;
  completedActivities: number;
  monumentsVisited: number;
  easterEggs: number;
  easterLocations: number;
  todayActivities: number;
  totalParticipants: number;
  averageRating: number;
  recentActivities: Array<{
    name: string;
    date: string;
    status: 'completed' | 'upcoming' | 'active';
  }>;
}

export default ApiService;
