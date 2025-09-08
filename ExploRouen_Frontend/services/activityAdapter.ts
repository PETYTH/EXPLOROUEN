import { BackendActivity } from './api';
import { Activity } from '@/data/activities';

/**
 * Adaptateur pour convertir les données du backend vers la structure frontend
 */
export class ActivityAdapter {
  /**
   * Convertit une activité backend vers le format frontend
   */
  static backendToFrontend(backendActivity: BackendActivity): Activity {
    // Mapping des types backend vers frontend
    const typeMapping: Record<string, 'sport' | 'cultural' | 'easter-hunt'> = {
      'RUNNING': 'sport',
      'WALKING': 'sport',
      'CYCLING': 'sport',
      'HIKING': 'sport',
      'KAYAK': 'sport',
      'CLIMBING': 'sport',
      'CULTURAL_VISIT': 'cultural',
      'PHOTOGRAPHY': 'cultural',
      'TREASURE_HUNT': 'easter-hunt'
    };

    // Mapping des difficultés backend vers frontend
    const difficultyMapping: Record<string, 'Facile' | 'Modéré' | 'Difficile'> = {
      'EASY': 'Facile',
      'MEDIUM': 'Modéré',
      'HARD': 'Difficile'
    };

    // Déterminer le statut de l'activité
    const now = new Date();
    const startDate = new Date(backendActivity.startDate);
    const endDate = backendActivity.endDate 
      ? new Date(backendActivity.endDate) 
      : new Date(startDate.getTime() + (backendActivity.duration * 60 * 1000));

    let status: 'upcoming' | 'active' | 'completed';
    if (now < startDate) {
      status = 'upcoming';
    } else if (now >= startDate && now <= endDate) {
      status = 'active';
    } else {
      status = 'completed';
    }

    // Parser les prérequis depuis JSON ou string
    let requirements: string[] = [];
    const requirementsSource = (backendActivity as any).requirements || backendActivity.equipment;
    if (requirementsSource) {
      try {
        // Si c'est déjà un tableau
        if (Array.isArray(requirementsSource)) {
          requirements = requirementsSource;
        } else if (typeof requirementsSource === 'string') {
          // Essayer de parser en JSON, sinon diviser par lignes
          try {
            requirements = JSON.parse(requirementsSource);
          } catch (e) {
            // Diviser par lignes ou virgules
            requirements = requirementsSource.split(/[,\n]/).map(req => req.trim()).filter(req => req.length > 0);
          }
        }
      } catch (e) {
        requirements = [requirementsSource];
      }
    }

    // Formater la durée
    const formatDuration = (minutes: number): string => {
      if (minutes < 60) {
        return `${minutes}min`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes === 0) {
          return `${hours}h`;
        } else {
          return `${hours}h${remainingMinutes}`;
        }
      }
    };

    // Déterminer la localisation à partir du meetingPoint
    const location = this.extractLocationFromMeetingPoint(backendActivity.meetingPoint);

    return {
      id: backendActivity.id,
      title: backendActivity.title,
      description: backendActivity.description,
      type: typeMapping[backendActivity.type] || 'cultural',
      date: startDate.toISOString().split('T')[0], // Format YYYY-MM-DD
      time: startDate.toTimeString().slice(0, 5), // Format HH:MM
      location: location,
      maxParticipants: backendActivity.maxParticipants,
      currentParticipants: backendActivity.participantsCount || 0,
      difficulty: difficultyMapping[backendActivity.difficulty] || 'Facile',
      duration: formatDuration(backendActivity.duration),
      price: backendActivity.price || 0,
      organizer: {
        id: backendActivity.createdBy,
        name: backendActivity.organizerName || 'Organisateur',
        avatar: backendActivity.organizerAvatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        rating: backendActivity.organizerRating || 4.5
      },
      image: backendActivity.image || 'https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg',
      status: status,
      chatRoomId: backendActivity.discussion?.id,
      requirements: requirements,
      meetingPoint: backendActivity.meetingPoint,
      category: backendActivity.category || this.getCategoryFromType(backendActivity.type)
    };
  }

  /**
   * Convertit un tableau d'activités backend vers frontend
   */
  static backendArrayToFrontend(backendActivities: BackendActivity[]): Activity[] {
    return backendActivities.map(activity => this.backendToFrontend(activity));
  }

  /**
   * Extrait une localisation lisible du point de rendez-vous
   */
  private static extractLocationFromMeetingPoint(meetingPoint: string): string {
    // Essayer d'extraire le nom du lieu principal
    const patterns = [
      /(?:Place|Parvis|Entrée|Pont)\s+(.+)/i,
      /(.+?)\s*(?:,|$)/,
    ];

    for (const pattern of patterns) {
      const match = meetingPoint.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return meetingPoint;
  }

  /**
   * Détermine la catégorie à partir du type d'activité
   */
  private static getCategoryFromType(type: string): string {
    const categoryMapping: Record<string, string> = {
      'RUNNING': 'Running',
      'WALKING': 'Marche',
      'CYCLING': 'Cyclisme',
      'HIKING': 'Randonnée',
      'KAYAK': 'Kayak',
      'CLIMBING': 'Escalade',
      'CULTURAL_VISIT': 'Culture',
      'PHOTOGRAPHY': 'Photographie',
      'TREASURE_HUNT': 'Jeu'
    };

    return categoryMapping[type] || 'Activité';
  }

  /**
   * Convertit les données frontend vers backend pour la création d'activité
   */
  static frontendToBackend(frontendActivity: Partial<Activity>): any {
    // Mapping inverse des types
    const typeMapping: Record<string, string> = {
      'sport': 'RUNNING', // Par défaut pour sport
      'cultural': 'CULTURAL_VISIT',
      'easter-hunt': 'TREASURE_HUNT'
    };

    // Mapping inverse des difficultés
    const difficultyMapping: Record<string, string> = {
      'Facile': 'EASY',
      'Modéré': 'MEDIUM',
      'Difficile': 'HARD'
    };

    // Parser la durée
    const parseDuration = (duration: string): number => {
      const match = duration.match(/(\d+)h?(\d+)?/);
      if (match) {
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        return hours * 60 + minutes;
      }
      return 60; // Défaut 1h
    };

    return {
      title: frontendActivity.title,
      description: frontendActivity.description,
      type: frontendActivity.type ? typeMapping[frontendActivity.type] : 'CULTURAL_VISIT',
      difficulty: frontendActivity.difficulty ? difficultyMapping[frontendActivity.difficulty] : 'EASY',
      duration: frontendActivity.duration ? parseDuration(frontendActivity.duration) : 60,
      maxParticipants: frontendActivity.maxParticipants || 10,
      startDate: frontendActivity.date && frontendActivity.time 
        ? new Date(`${frontendActivity.date}T${frontendActivity.time}:00`)
        : new Date(),
      meetingPoint: frontendActivity.meetingPoint || frontendActivity.location || '',
      latitude: 49.4431, // Coordonnées par défaut (Rouen)
      longitude: 1.0993,
      price: frontendActivity.price || 0,
      image: frontendActivity.image,
      category: frontendActivity.category,
      organizerName: frontendActivity.organizer?.name,
      organizerAvatar: frontendActivity.organizer?.avatar,
      organizerRating: frontendActivity.organizer?.rating,
      requirements: frontendActivity.requirements ? (Array.isArray(frontendActivity.requirements) ? frontendActivity.requirements.join('\n') : frontendActivity.requirements) : undefined,
      equipment: frontendActivity.requirements ? JSON.stringify(frontendActivity.requirements) : undefined
    };
  }
}

export default ActivityAdapter;
