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
}

export const monuments: Monument[] = [
  {
    id: 'cathedrale-notre-dame',
    name: 'Cathédrale Notre-Dame',
    description: 'Chef-d\'œuvre de l\'art gothique, immortalisée par Claude Monet',
    image: 'https://images.pexels.com/photos/2363/france-landmark-lights-night.jpg',
    rating: 4.8,
    visitDuration: '1h30',
    category: 'religious',
    location: {
      latitude: 49.4404,
      longitude: 1.0939,
      address: 'Place de la Cathédrale, 76000 Rouen'
    },
    openingHours: '8h00 - 19h00',
    price: 'Gratuit',
    highlights: [
      'Façade gothique flamboyant',
      'Tombeau de Richard Cœur de Lion',
      'Série de peintures de Monet'
    ],
    history: 'Construite entre le XIIe et le XVIe siècle, la cathédrale Notre-Dame de Rouen est un joyau de l\'architecture gothique.',
    easterEggHints: [
      'Cherchez près du portail des Libraires',
      'Un œuf se cache dans les jardins adjacents'
    ]
  },
  {
    id: 'gros-horloge',
    name: 'Gros-Horloge',
    description: 'Beffroi du XIVe siècle avec une horloge astronomique Renaissance',
    image: 'https://images.pexels.com/photos/1308881/pexels-photo-1308881.jpeg',
    rating: 4.6,
    visitDuration: '45min',
    category: 'historical',
    location: {
      latitude: 49.4431,
      longitude: 1.0890,
      address: 'Rue du Gros-Horloge, 76000 Rouen'
    },
    openingHours: '10h00 - 18h00',
    price: '7€',
    highlights: [
      'Mécanisme d\'horloge du XIVe siècle',
      'Vue panoramique sur Rouen',
      'Cadran astronomique Renaissance'
    ],
    history: 'Le Gros-Horloge est l\'un des plus anciens mécanismes horlogers de France encore en fonctionnement.',
    easterEggHints: [
      'Regardez sous l\'arche du beffroi',
      'Un indice se trouve sur le cadran'
    ]
  },
  {
    id: 'place-vieux-marche',
    name: 'Place du Vieux-Marché',
    description: 'Lieu historique du martyre de Jeanne d\'Arc',
    image: 'https://images.pexels.com/photos/1308881/pexels-photo-1308881.jpeg',
    rating: 4.5,
    visitDuration: '1h',
    category: 'historical',
    location: {
      latitude: 49.4429,
      longitude: 1.0877,
      address: 'Place du Vieux-Marché, 76000 Rouen'
    },
    openingHours: '24h/24',
    price: 'Gratuit',
    highlights: [
      'Église Sainte-Jeanne-d\'Arc',
      'Marché traditionnel',
      'Restaurants typiques normands'
    ],
    history: 'C\'est sur cette place que Jeanne d\'Arc fut brûlée vive le 30 mai 1431.',
    easterEggHints: [
      'Près de la statue de Jeanne d\'Arc',
      'Dans les jardins commémoratifs'
    ]
  },
  {
    id: 'abbatiale-saint-ouen',
    name: 'Abbatiale Saint-Ouen',
    description: 'Magnifique église gothique rayonnant',
    image: 'https://images.pexels.com/photos/2363/france-landmark-lights-night.jpg',
    rating: 4.7,
    visitDuration: '1h15',
    category: 'religious',
    location: {
      latitude: 49.4456,
      longitude: 1.0994,
      address: 'Place du Général de Gaulle, 76000 Rouen'
    },
    openingHours: '10h00 - 18h00',
    price: 'Gratuit',
    highlights: [
      'Verrières du XIVe siècle',
      'Orgue Cavaillé-Coll',
      'Architecture gothique rayonnant'
    ],
    history: 'Ancienne église abbatiale bénédictine, chef-d\'œuvre du gothique rayonnant.',
    easterEggHints: [
      'Dans le jardin de l\'abbaye',
      'Près du portail sud'
    ]
  },
  {
    id: 'palais-justice',
    name: 'Palais de Justice',
    description: 'Ancien Échiquier de Normandie, architecture gothique flamboyant',
    image: 'https://images.pexels.com/photos/1308881/pexels-photo-1308881.jpeg',
    rating: 4.4,
    visitDuration: '1h',
    category: 'architectural',
    location: {
      latitude: 49.4442,
      longitude: 1.0916,
      address: '36 Rue aux Juifs, 76000 Rouen'
    },
    openingHours: '9h00 - 17h00 (visites guidées)',
    price: '5€',
    highlights: [
      'Salle des Procureurs',
      'Architecture gothique flamboyant',
      'Vestiges gallo-romains'
    ],
    history: 'Ancien siège de l\'Échiquier de Normandie, le palais abrite aujourd\'hui la Cour d\'appel.',
    easterEggHints: [
      'Dans la cour d\'honneur',
      'Près des vestiges antiques'
    ]
  }
];