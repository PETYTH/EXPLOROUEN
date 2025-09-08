export interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'sport' | 'cultural' | 'easter-hunt';
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
  };
  image: string;
  status: 'upcoming' | 'active' | 'completed';
  chatRoomId?: string;
  requirements: string[];
  meetingPoint: string;
  category: string;
}

export const activities: Activity[] = [
  {
    id: 'activity-1',
    title: 'Course matinale aux Jardins',
    description: 'Jogging matinal dans les magnifiques jardins de l\'Hôtel de Ville avec vue sur la Seine',
    type: 'sport',
    date: '2024-03-15',
    time: '08:00',
    location: 'Jardins de l\'Hôtel de Ville',
    maxParticipants: 15,
    currentParticipants: 8,
    difficulty: 'Facile',
    duration: '1h30',
    price: 0,
    organizer: {
      id: 'org-1',
      name: 'Thomas Martin',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      rating: 4.8
    },
    image: 'https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg',
    status: 'active',
    chatRoomId: 'chat-1',
    requirements: ['Tenue de sport', 'Bouteille d\'eau'],
    meetingPoint: 'Entrée principale des jardins',
    category: 'Running'
  },
  {
    id: 'activity-2',
    title: 'Visite guidée Cathédrale',
    description: 'Découverte approfondie de la cathédrale Notre-Dame et de son histoire millénaire',
    type: 'cultural',
    date: '2024-03-15',
    time: '14:00',
    location: 'Cathédrale Notre-Dame',
    maxParticipants: 20,
    currentParticipants: 12,
    difficulty: 'Facile',
    duration: '2h',
    price: 8,
    organizer: {
      id: 'org-2',
      name: 'Sophie Leclerc',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      rating: 4.9
    },
    image: 'https://images.pexels.com/photos/2363/france-landmark-lights-night.jpg',
    status: 'upcoming',
    requirements: ['Chaussures confortables'],
    meetingPoint: 'Parvis de la cathédrale',
    category: 'Culture'
  },
  {
    id: 'activity-3',
    title: 'Chasse aux Œufs - Vieux Rouen',
    description: 'Chasse aux œufs de Pâques dans les ruelles historiques du vieux Rouen',
    type: 'easter-hunt',
    date: '2024-03-31',
    time: '10:00',
    location: 'Vieux Rouen',
    maxParticipants: 30,
    currentParticipants: 18,
    difficulty: 'Modéré',
    duration: '2h30',
    price: 5,
    organizer: {
      id: 'org-3',
      name: 'Pierre Dubois',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      rating: 4.7
    },
    image: 'https://images.pexels.com/photos/1308881/pexels-photo-1308881.jpeg',
    status: 'upcoming',
    requirements: ['Application mobile', 'Bonne humeur'],
    meetingPoint: 'Place du Vieux-Marché',
    category: 'Jeu'
  },
  {
    id: 'activity-4',
    title: 'Yoga au bord de Seine',
    description: 'Séance de yoga relaxante avec vue sur la Seine et les quais historiques',
    type: 'sport',
    date: '2024-03-16',
    time: '07:30',
    location: 'Quais de Seine',
    maxParticipants: 12,
    currentParticipants: 9,
    difficulty: 'Facile',
    duration: '1h',
    price: 12,
    organizer: {
      id: 'org-4',
      name: 'Emma Rousseau',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      rating: 4.9
    },
    image: 'https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg',
    status: 'upcoming',
    requirements: ['Tapis de yoga', 'Tenue confortable'],
    meetingPoint: 'Pont Gustave-Flaubert',
    category: 'Bien-être'
  }
];