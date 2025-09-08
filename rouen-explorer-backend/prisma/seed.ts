// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed Rouen XXL (20 monuments, 15 activités, 4 chasses)…');

  // ---------- Cleanup (respecte les FK) ----------
  await prisma.activityPlace.deleteMany({});
  await prisma.treasureHuntPlace.deleteMany({});
  await prisma.registration.deleteMany({});
  await prisma.discussionMessage.deleteMany({});
  await prisma.discussion.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.favoritePlace.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.treasureHunt.deleteMany({});
  await prisma.monument.deleteMany({});
  await prisma.place.deleteMany({});
  try { await prisma.image.deleteMany({}); } catch { /* optionnel */ }

  // ---------- PLACES (points d’intérêt utilisables par les activités) ----------
  const places = await Promise.all([
    prisma.place.create({
      data: {
        name: 'Cathédrale Notre-Dame de Rouen',
        description:
          "Chef-d'œuvre gothique immortalisé par Monet. Série de 30 toiles de la façade ouest.",
        address: 'Place de la Cathédrale, 76000 Rouen',
        latitude: 49.4431,
        longitude: 1.0993,
        category: 'CHURCH',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=1600',
          'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1600',
        ]),
        historicalPeriod: 'XIIe–XVIe',
        openingHours: JSON.stringify({
          lundi: '14:00-18:00',
          mardi: '9:00-12:00,14:00-18:00',
          mercredi: '9:00-12:00,14:00-18:00',
          jeudi: '9:00-12:00,14:00-18:00',
          vendredi: '9:00-12:00,14:00-18:00',
          samedi: '9:00-12:00,14:00-17:00',
          dimanche: '14:00-17:00',
        }),
        estimatedDuration: 90,
      },
    }),
    prisma.place.create({
      data: {
        name: 'Église Saint-Maclou',
        description:
          "Joyau du gothique flamboyant (1437–1521), portail à cinq porches.",
        address: 'Place Barthélémy, 76000 Rouen',
        latitude: 49.4425,
        longitude: 1.0985,
        category: 'CHURCH',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?q=80&w=1600',
        ]),
        estimatedDuration: 45,
      },
    }),
    prisma.place.create({
      data: {
        name: 'Abbatiale Saint-Ouen',
        description:
          'Gothique rayonnant, verrières XIVe, grand orgue Cavaillé-Coll.',
        address: 'Place du Général de Gaulle, 76000 Rouen',
        latitude: 49.4445,
        longitude: 1.0975,
        category: 'CHURCH',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1566044966085-eb4eb4c639a5?q=80&w=1600',
        ]),
        estimatedDuration: 60,
      },
    }),
    prisma.place.create({
      data: {
        name: 'Gros-Horloge',
        description:
          'Beffroi XIVe & horloge astronomique Renaissance, mécanisme ancien.',
        address: 'Rue du Gros-Horloge, 76000 Rouen',
        latitude: 49.4415,
        longitude: 1.0895,
        category: 'MONUMENT',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1600',
        ]),
        estimatedDuration: 45,
        entryPrice: 7.5,
      },
    }),
    prisma.place.create({
      data: {
        name: 'Place du Vieux-Marché',
        description:
          "Lieu du martyre de Jeanne d'Arc (1431), église Sainte-Jeanne-d'Arc.",
        address: 'Place du Vieux-Marché, 76000 Rouen',
        latitude: 49.4429,
        longitude: 1.0877,
        category: 'MONUMENT',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1618330834831-2c19e0c26c2f?q=80&w=1600',
        ]),
        estimatedDuration: 30,
      },
    }),
    prisma.place.create({
      data: {
        name: 'Donjon de Rouen',
        description:
          "Tour Jeanne d'Arc (XIIIe), vestige du château de Philippe Auguste.",
        address: 'Rue Bouvreuil, 76000 Rouen',
        latitude: 49.4462,
        longitude: 1.0964,
        category: 'MONUMENT',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1549641206-fe5a735d6b8f?q=80&w=1600',
        ]),
        estimatedDuration: 40,
      },
    }),
    prisma.place.create({
      data: {
        name: 'Musée des Beaux-Arts',
        description:
          'Collections du XVe au XXIe, Monet, Sisley, Caravage, Delacroix.',
        address: 'Esplanade Marcel Duchamp, 76000 Rouen',
        latitude: 49.4449,
        longitude: 1.0959,
        category: 'MUSEUM',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1520697222862-79e5850b9b9e?q=80&w=1600',
        ]),
        estimatedDuration: 90,
      },
    }),
    prisma.place.create({
      data: {
        name: 'Pont Gustave-Flaubert',
        description:
          'Pont levant spectaculaire (2008), points de vue sur la Seine.',
        address: 'Quais de la Seine, 76000 Rouen',
        latitude: 49.4514,
        longitude: 1.0459,
        category: 'MONUMENT',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1514957677981-11220d1fd55e?q=80&w=1600',
        ]),
        estimatedDuration: 20,
      },
    }),
    prisma.place.create({
      data: {
        name: 'Jardin des Plantes',
        description: 'Jardin botanique (1840), serres tropicales, roseraie.',
        address: 'Av. des Martyrs de la Résistance, 76100 Rouen',
        latitude: 49.4209,
        longitude: 1.0932,
        category: 'PARK',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?q=80&w=1600',
        ]),
        estimatedDuration: 60,
      },
    }),
    prisma.place.create({
      data: {
        name: 'Aître Saint-Maclou',
        description:
          'Ancien ossuaire de peste (XVIe), sculptures macabres, cour cloîtrée.',
        address: '186 Rue Martainville, 76000 Rouen',
        latitude: 49.4417,
        longitude: 1.1044,
        category: 'MONUMENT',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1598188306155-c1fef38376a1?q=80&w=1600',
        ]),
        estimatedDuration: 35,
      },
    }),
  ]);

  // ---------- MONUMENTS (20) ----------
  const monumentsData = [
    // 1
    {
      name: 'Cathédrale Notre-Dame',
      description:
        "Chef-d'œuvre de l'art gothique français, série de Monet dédiée à sa façade.",
      image:
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=1600',
      rating: 4.8,
      visitDuration: '1h30',
      category: 'religious',
      latitude: 49.4431,
      longitude: 1.0993,
      address: 'Place de la Cathédrale, 76000 Rouen',
      openingHours: '8h-19h (dim 14h-17h)',
      price: 'Gratuit (tours 6€)',
      highlights: JSON.stringify([
        'Façade peinte par Monet',
        'Tombeau de Richard Cœur de Lion',
        'Tour de Beurre',
      ]),
      history:
        'XIIe–XVIe, crypte XIe, évolution complète du gothique normand.',
      easterEggHints: JSON.stringify([
        'Un petit diable se cache au portail des Libraires',
      ]),
    },
    // 2
    {
      name: 'Gros-Horloge',
      description:
        "Beffroi médiéval & horloge astronomique, mécanisme historique.",
      image:
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1600',
      rating: 4.6,
      visitDuration: '45min',
      category: 'historical',
      latitude: 49.4415,
      longitude: 1.0895,
      address: 'Rue du Gros-Horloge, 76000 Rouen',
      openingHours: '10h-19h (lun fermé)',
      price: '7,5€',
      highlights: JSON.stringify([
        'Cadran Renaissance 1529',
        'Vue panoramique',
      ]),
      history: 'Beffroi XIVe, cadran ajouté au XVe–XVIe.',
      easterEggHints: JSON.stringify(['Agneau pascal sur le cadran']),
    },
    // 3
    {
      name: 'Église Saint-Maclou',
      description:
        'Gothique flamboyant, portes Renaissance réputées.',
      image:
        'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?q=80&w=1600',
      rating: 4.5,
      visitDuration: '45min',
      category: 'religious',
      latitude: 49.4425,
      longitude: 1.0985,
      address: 'Place Barthélémy, 76000 Rouen',
      openingHours: '10h-12h,14h-18h',
      price: 'Gratuit',
      highlights: JSON.stringify(['Portail à 5 porches', 'Portes sculptées']),
      history: 'XVᵉ–XVIᵉ, sommet du flamboyant normand.',
      easterEggHints: JSON.stringify(['Salamandres de François Ier']),
    },
    // 4
    {
      name: 'Abbatiale Saint-Ouen',
      description: 'Gothique rayonnant, orgue Cavaillé-Coll.',
      image:
        'https://images.unsplash.com/photo-1566044966085-eb4eb4c639a5?q=80&w=1600',
      rating: 4.7,
      visitDuration: '1h',
      category: 'religious',
      latitude: 49.4445,
      longitude: 1.0975,
      address: 'Pl. du Général de Gaulle, 76000 Rouen',
      openingHours: '10h-12h,14h-18h (lun fermé)',
      price: 'Gratuit',
      highlights: JSON.stringify(['Tour-lanterne', 'Verrières XIVe']),
      history: 'XIVe–XVe, abbaye fondée au VIIIe.',
      easterEggHints: JSON.stringify(['Labyrinthe gravé']),
    },
    // 5
    {
      name: 'Place du Vieux-Marché',
      description: "Lieu du supplice de Jeanne d'Arc (1431).",
      image:
        'https://images.unsplash.com/photo-1618330834831-2c19e0c26c2f?q=80&w=1600',
      rating: 4.3,
      visitDuration: '45min',
      category: 'historical',
      latitude: 49.4429,
      longitude: 1.0877,
      address: 'Place du Vieux-Marché, 76000 Rouen',
      openingHours: '24/7',
      price: 'Gratuit',
      highlights: JSON.stringify([
        'Église Sainte-Jeanne-d’Arc',
        'Marché traditionnel',
      ]),
      history: 'Ancienne place commerçante médiévale.',
      easterEggHints: JSON.stringify(['Fleurs de lys dans les pavés']),
    },
    // 6
    {
      name: 'Maisons à Colombages',
      description:
        'Architecture civile XVe–XVIe sur la rue du Gros-Horloge.',
      image:
        'https://images.unsplash.com/photo-1571631072485-ee6f9bb8d82f?q=80&w=1600',
      rating: 4.4,
      visitDuration: '30min',
      category: 'architectural',
      latitude: 49.442,
      longitude: 1.089,
      address: 'Rue du Gros-Horloge, 76000 Rouen',
      openingHours: 'Libre accès',
      price: 'Gratuit',
      highlights: JSON.stringify(['Pans de bois', 'Sculptures']),
      history: 'Prospérité marchande de la ville médiévale.',
      easterEggHints: JSON.stringify(['Licorne sculptée']),
    },
    // 7
    {
      name: 'Donjon de Rouen',
      description:
        'Vestige du château de Philippe Auguste, lié au procès de Jeanne d’Arc.',
      image:
        'https://images.unsplash.com/photo-1549641206-fe5a735d6b8f?q=80&w=1600',
      rating: 4.2,
      visitDuration: '40min',
      category: 'historical',
      latitude: 49.4462,
      longitude: 1.0964,
      address: 'Rue Bouvreuil, 76000 Rouen',
      openingHours: '10h-18h',
      price: '5€',
      highlights: JSON.stringify(['Tour maîtresse', 'Escape game']),
      history: 'XIIIe, fortification royale.',
      easterEggHints: JSON.stringify(['Marques de tailleurs']),
    },
    // 8
    {
      name: 'Musée des Beaux-Arts',
      description: 'Collections majeures (Monet, Caravage…).',
      image:
        'https://images.unsplash.com/photo-1520697222862-79e5850b9b9e?q=80&w=1600',
      rating: 4.6,
      visitDuration: '1h30',
      category: 'museum',
      latitude: 49.4449,
      longitude: 1.0959,
      address: 'Esplanade Marcel Duchamp, 76000 Rouen',
      openingHours: '10h-18h (mar-lun)',
      price: 'Gratuit (expos temporaires payantes)',
      highlights: JSON.stringify(['Impressionnisme', 'Caravage']),
      history: 'Fondé en 1801, agrandi au XXe.',
      easterEggHints: JSON.stringify(['Autoportrait caché']),
    },
    // 9
    {
      name: 'Rue Eau-de-Robec',
      description:
        'Rue pittoresque longeant un ancien bras de la Robec, maisons colorées.',
      image:
        'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&w=1600',
      rating: 4.4,
      visitDuration: '30min',
      category: 'architectural',
      latitude: 49.4442,
      longitude: 1.1135,
      address: 'Rue Eau-de-Robec, 76000 Rouen',
      openingHours: 'Libre accès',
      price: 'Gratuit',
      highlights: JSON.stringify(['Maisons colorées', 'Canal']),
      history: 'Ancien quartier des tanneurs.',
      easterEggHints: JSON.stringify(['Symbole de tannerie']),
    },
    // 10
    {
      name: 'Pont Gustave-Flaubert',
      description: 'Pont levant emblématique avec vues sur la Seine.',
      image:
        'https://images.unsplash.com/photo-1514957677981-11220d1fd55e?q=80&w=1600',
      rating: 4.1,
      visitDuration: '20min',
      category: 'modern',
      latitude: 49.4514,
      longitude: 1.0459,
      address: 'Quais de la Seine, 76000 Rouen',
      openingHours: 'Libre accès',
      price: 'Gratuit',
      highlights: JSON.stringify(['Architecture mobile', 'Panorama']),
      history: 'Mis en service en 2008.',
      easterEggHints: JSON.stringify(['Mesurez la levée !']),
    },
    // 11
    {
      name: 'Jardin des Plantes',
      description: 'Grand jardin botanique du XIXe, serres tropicales.',
      image:
        'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?q=80&w=1600',
      rating: 4.5,
      visitDuration: '1h',
      category: 'nature',
      latitude: 49.4209,
      longitude: 1.0932,
      address: 'Av. des Martyrs de la Résistance, 76100 Rouen',
      openingHours: '8h-19h',
      price: 'Gratuit',
      highlights: JSON.stringify(['Serres', 'Roseraie']),
      history: 'Ouvert en 1840.',
      easterEggHints: JSON.stringify(['Plante “mimosa pudica”']),
    },
    // 12
    {
      name: 'Aître Saint-Maclou',
      description: 'Ossuaire renaissance, sculptures macabres.',
      image:
        'https://images.unsplash.com/photo-1598188306155-c1fef38376a1?q=80&w=1600',
      rating: 4.6,
      visitDuration: '35min',
      category: 'historical',
      latitude: 49.4417,
      longitude: 1.1044,
      address: '186 Rue Martainville, 76000 Rouen',
      openingHours: '10h-18h',
      price: 'Gratuit',
      highlights: JSON.stringify(['Ossuaire', 'Décor macabre']),
      history: 'XVIe, suite aux épidémies de peste.',
      easterEggHints: JSON.stringify(['Crâne sculpté discret']),
    },
    // 13
    {
      name: 'Hôtel de Bourgtheroulde',
      description: 'Manoir Renaissance à riches décors sculptés.',
      image:
        'https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=1600',
      rating: 4.3,
      visitDuration: '30min',
      category: 'architectural',
      latitude: 49.4419,
      longitude: 1.0922,
      address: '15 Pl. de la Pucelle, 76000 Rouen',
      openingHours: 'Extérieurs libres',
      price: 'Gratuit',
      highlights: JSON.stringify(['Bas-reliefs', 'Cour intérieure']),
      history: 'Début XVIe, style Renaissance.',
      easterEggHints: JSON.stringify(['Bas-relief “Camp du Drap d’Or”']),
    },
    // 14
    {
      name: 'Église Saint-Patrice',
      description: 'Vitraux remarquables des XVe–XVIe.',
      image:
        'https://images.unsplash.com/photo-1471623432079-b009d30b6729?q=80&w=1600',
      rating: 4.2,
      visitDuration: '30min',
      category: 'religious',
      latitude: 49.4447,
      longitude: 1.0933,
      address: 'Rue Saint-Patrice, 76000 Rouen',
      openingHours: '10h-12h,14h-18h',
      price: 'Gratuit',
      highlights: JSON.stringify(['Vitraux anciens', 'Nef lumineuse']),
      history: 'Bâtie du XVe au XVIe.',
      easterEggHints: JSON.stringify(['Ange minuscule dans un vitrail']),
    },
    // 15
    {
      name: 'Église Sainte-Jeanne-d’Arc',
      description:
        'Église moderne (1979) aux vitraux Renaissance remontés.',
      image:
        'https://images.unsplash.com/photo-1527189712050-303548b74f46?q=80&w=1600',
      rating: 4.0,
      visitDuration: '30min',
      category: 'religious',
      latitude: 49.443,
      longitude: 1.0876,
      address: 'Pl. du Vieux-Marché, 76000 Rouen',
      openingHours: '10h-18h',
      price: 'Gratuit',
      highlights: JSON.stringify(['Vitraux Saint-Vincent']),
      history: 'Architecture de Louis Arretche.',
      easterEggHints: JSON.stringify(['Poisson dans les vitraux']),
    },
    // 16
    {
      name: 'Musée Flaubert & d’Histoire de la Médecine',
      description:
        "Maison natale de Gustave Flaubert, collections médicales XIXe.",
      image:
        'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1600',
      rating: 4.1,
      visitDuration: '50min',
      category: 'museum',
      latitude: 49.4406,
      longitude: 1.0846,
      address: '51 Rue de Lecat, 76000 Rouen',
      openingHours: '14h-18h (mar-dim)',
      price: '5€',
      highlights: JSON.stringify(['Salle d’accouchement', 'Objets médicaux']),
      history: 'Maison de chirurgien-chef, père de Flaubert.',
      easterEggHints: JSON.stringify(['Clin d’œil à “Madame Bovary”']),
    },
    // 17
    {
      name: 'Place Saint-Marc',
      description: 'Grande place et marché animé.',
      image:
        'https://images.unsplash.com/photo-1606925797300-0b35a1f2c0f0?q=80&w=1600',
      rating: 4.0,
      visitDuration: '20min',
      category: 'urban',
      latitude: 49.4428,
      longitude: 1.1062,
      address: 'Pl. Saint-Marc, 76000 Rouen',
      openingHours: 'Libre accès',
      price: 'Gratuit',
      highlights: JSON.stringify(['Marché', 'Vie locale']),
      history: 'Espace urbain majeur depuis le XIXe.',
      easterEggHints: JSON.stringify(['Stalle “meilleur fromage”']),
    },
    // 18
    {
      name: 'Quais de la Seine',
      description: 'Promenade, street-art et vue sur l’Île Lacroix.',
      image:
        'https://images.unsplash.com/photo-1493558103817-58b2924bce98?q=80&w=1600',
      rating: 4.5,
      visitDuration: '45min',
      category: 'nature',
      latitude: 49.441,
      longitude: 1.082,
      address: 'Quais rive droite & gauche',
      openingHours: 'Libre accès',
      price: 'Gratuit',
      highlights: JSON.stringify(['Street-art', 'Vélos']),
      history: 'Aménagements récents pour la balade.',
      easterEggHints: JSON.stringify(['Tag “Rouen Love”']),
    },
    // 19
    {
      name: 'Musée Le Secq des Tournelles',
      description: 'Art du fer du Moyen Âge au XXe.',
      image:
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1600',
      rating: 4.4,
      visitDuration: '45min',
      category: 'museum',
      latitude: 49.4428,
      longitude: 1.0948,
      address: '2 Rue Jacques Villon, 76000 Rouen',
      openingHours: '14h-18h (mar-dim)',
      price: 'Gratuit',
      highlights: JSON.stringify(['Serrures, ferronneries']),
      history: 'Ancienne église, musée unique en son genre.',
      easterEggHints: JSON.stringify(['Clef géante cachée']),
    },
    // 20
    {
      name: 'Église Saint-Ouen de Longueville (réplique locale)',
      description: 'Petit édifice rural typique, étape hors centre.',
      image:
        'https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1600',
      rating: 3.9,
      visitDuration: '20min',
      category: 'religious',
      latitude: 49.5205,
      longitude: 1.016,
      address: 'Longueville, agglo rouennaise',
      openingHours: 'Visites ponctuelles',
      price: 'Gratuit',
      highlights: JSON.stringify(['Atmosphère campagne']),
      history: 'Petite église traditionnelle normande.',
      easterEggHints: JSON.stringify(['Cœur sculpté sur un banc']),
    },
  ];

  for (const m of monumentsData) {
    await prisma.monument.create({ data: m });
  }

  // ---------- ACTIVITÉS (15) – dates futures 2025-10/11 ----------
  const A = (iso: string) => new Date(iso); // raccourci

  const activities = await Promise.all([
    // CULTURE / HISTOIRE
    prisma.activity.create({
      data: {
        title: 'Circuit des Églises Gothiques',
        description:
          'Visite guidée Notre-Dame, Saint-Maclou et Saint-Ouen : lecture d’architecture.',
        type: 'CULTURAL_VISIT',
        difficulty: 'EASY',
        duration: 180,
        maxParticipants: 20,
        startDate: A('2025-10-05T14:00:00Z'),
        meetingPoint: 'Parvis Cathédrale',
        latitude: 49.4431,
        longitude: 1.0993,
        price: 12,
        image:
          'https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=1600',
        category: 'Culture',
        organizerName: 'Marie Dupont',
        organizerAvatar:
          'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
        organizerRating: 4.9,
        equipment: JSON.stringify(['Chaussures confortables']),
        createdBy: 'clerk_user_marie_dupont',
      },
    }),
    prisma.activity.create({
      data: {
        title: "Sur les Pas de Jeanne d'Arc",
        description:
          'Itinéraire commenté : Vieux-Marché → Donjon, récit du procès.',
        type: 'WALKING',
        difficulty: 'EASY',
        duration: 120,
        distance: 2.5,
        maxParticipants: 25,
        startDate: A('2025-10-07T09:30:00Z'),
        meetingPoint: 'Place du Vieux-Marché',
        latitude: 49.4429,
        longitude: 1.0877,
        price: 8,
        image:
          'https://images.unsplash.com/photo-1618330834831-2c19e0c26c2f?q=80&w=1600',
        category: 'Histoire',
        organizerName: 'Pierre Leclerc',
        organizerAvatar:
          'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        organizerRating: 4.7,
        equipment: JSON.stringify(['Parapluie (météo)']),
        createdBy: 'clerk_user_pierre_leclerc',
      },
    }),
    prisma.activity.create({
      data: {
        title: 'Musée des Beaux-Arts – Focus Impressionnisme',
        description:
          'Parcours guidé Monet, Sisley, Pissarro et regards contemporains.',
        type: 'CULTURAL_VISIT',
        difficulty: 'EASY',
        duration: 90,
        maxParticipants: 18,
        startDate: A('2025-10-10T15:00:00Z'),
        meetingPoint: 'Hall du musée',
        latitude: 49.4449,
        longitude: 1.0959,
        price: 10,
        image:
          'https://images.unsplash.com/photo-1520697222862-79e5850b9b9e?q=80&w=1600',
        category: 'Culture',
        organizerName: 'Rouen Art Tours',
        organizerAvatar:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400',
        organizerRating: 4.8,
        equipment: JSON.stringify(['Billet inclus']),
        createdBy: 'clerk_user_art',
      },
    }),
    prisma.activity.create({
      data: {
        title: 'Secrets Médiévaux du Quartier Martainville',
        description:
          'Lecture des façades à pans de bois, métiers, vie quotidienne.',
        type: 'WALKING',
        difficulty: 'EASY',
        duration: 75,
        maxParticipants: 20,
        startDate: A('2025-10-12T16:00:00Z'),
        meetingPoint: "Devant l'Aître Saint-Maclou",
        latitude: 49.4417,
        longitude: 1.1044,
        price: 7,
        image:
          'https://images.unsplash.com/photo-1571631072485-ee6f9bb8d82f?q=80&w=1600',
        category: 'Histoire',
        organizerName: 'Guides de Rouen',
        organizerAvatar:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400',
        organizerRating: 4.6,
        equipment: JSON.stringify([]),
        createdBy: 'clerk_user_guides',
      },
    }),
    prisma.activity.create({
      data: {
        title: 'Atelier Vitrail – Initiation',
        description:
          'Démonstration et pratique : montage au plomb, motifs inspirés des verrières de Saint-Ouen.',
        type: 'CULTURAL_VISIT',
        difficulty: 'MEDIUM',
        duration: 150,
        maxParticipants: 8,
        startDate: A('2025-10-14T13:30:00Z'),
        meetingPoint: 'Atelier près de Saint-Ouen',
        latitude: 49.4445,
        longitude: 1.0975,
        price: 49,
        image:
          'https://images.unsplash.com/photo-1508711043162-15e9b7b1ba1b?q=80&w=1600',
        category: 'Artisanat',
        organizerName: 'Atelier Verrier',
        organizerAvatar:
          'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=400',
        organizerRating: 4.7,
        equipment: JSON.stringify(['Tablier fourni']),
        createdBy: 'clerk_user_vitrail',
      },
    }),

    // SPORT / NATURE
    prisma.activity.create({
      data: {
        title: 'Running Tour Patrimoine (8 km)',
        description:
          'Sortie course à pied avec pauses “histoire rapide” sur les monuments.',
        type: 'WALKING',
        difficulty: 'MEDIUM',
        duration: 75,
        maxParticipants: 15,
        startDate: A('2025-10-16T07:30:00Z'),
        meetingPoint: "Parc de l'Hôtel de Ville",
        latitude: 49.4436,
        longitude: 1.0998,
        price: 12,
        image:
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1600',
        category: 'Sport',
        organizerName: 'Rouen Running Tours',
        organizerAvatar:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400',
        organizerRating: 4.4,
        equipment: JSON.stringify(['Eau', 'Chaussures running']),
        createdBy: 'clerk_user_running',
      },
    }),
    prisma.activity.create({
      data: {
        title: 'Parcours Cycliste “Seine à Vélo” (25 km)',
        description:
          'Balade sécurisée le long de la Seine jusqu’à La Bouille.',
        type: 'WALKING',
        difficulty: 'MEDIUM',
        duration: 180,
        maxParticipants: 20,
        startDate: A('2025-10-18T09:00:00Z'),
        meetingPoint: 'Quais rive droite',
        latitude: 49.4400,
        longitude: 1.0850,
        price: 15,
        image:
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1600',
        category: 'Sport',
        organizerName: 'Club Cycliste',
        organizerAvatar:
          'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=400',
        organizerRating: 4.6,
        equipment: JSON.stringify(['Casque', 'Kit crevaison']),
        createdBy: 'clerk_user_club_cyclo',
      },
    }),
    prisma.activity.create({
      data: {
        title: 'Kayak Nature sur la Seine',
        description:
          'Descente douce avec observation de la faune (hérons, martin-pêcheur).',
        type: 'WALKING',
        difficulty: 'EASY',
        duration: 150,
        maxParticipants: 8,
        startDate: A('2025-10-20T14:00:00Z'),
        meetingPoint: 'Base nautique',
        latitude: 49.441,
        longitude: 1.082,
        price: 35,
        image:
          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1600',
        category: 'Nature',
        organizerName: 'Rouen Kayak Club',
        organizerAvatar:
          'https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?q=80&w=400',
        organizerRating: 4.7,
        equipment: JSON.stringify(['Tenue de rechange']),
        createdBy: 'clerk_user_kayak',
      },
    }),
    prisma.activity.create({
      data: {
        title: 'Marche Nordique – Forêt de Roumare',
        description:
          '10 km à rythme souple, initiation technique, bâtons fournis.',
        type: 'WALKING',
        difficulty: 'EASY',
        duration: 120,
        maxParticipants: 12,
        startDate: A('2025-10-22T10:00:00Z'),
        meetingPoint: 'Maison Forestière',
        latitude: 49.465,
        longitude: 1.02,
        price: 18,
        image:
          'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?q=80&w=1600',
        category: 'Nature',
        organizerName: 'Nature & Forme',
        organizerAvatar:
          'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=400',
        organizerRating: 4.3,
        equipment: JSON.stringify(['Eau', 'Coupe-vent']),
        createdBy: 'clerk_user_marche',
      },
    }),
    prisma.activity.create({
      data: {
        title: 'Yoga au Jardin des Plantes',
        description:
          'Séance bien-être en plein air (tapis fourni sur place).',
        type: 'WALKING',
        difficulty: 'EASY',
        duration: 60,
        maxParticipants: 20,
        startDate: A('2025-10-24T08:30:00Z'),
        meetingPoint: 'Pelouse centrale',
        latitude: 49.4209,
        longitude: 1.0932,
        price: 9,
        image:
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1600',
        category: 'Bien-être',
        organizerName: 'Green Yoga Rouen',
        organizerAvatar:
          'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=400',
        organizerRating: 4.5,
        equipment: JSON.stringify(['Tenue confortable']),
        createdBy: 'clerk_user_yoga',
      },
    }),

    // FAMILLE / LOISIRS
    prisma.activity.create({
      data: {
        title: 'Chasse aux Trésors : Mystères du Gros-Horloge',
        description:
          'Énigmes autour du beffroi & cadran, idéale en famille.',
        type: 'TREASURE_HUNT',
        difficulty: 'MEDIUM',
        duration: 90,
        maxParticipants: 15,
        startDate: A('2025-10-26T15:00:00Z'),
        meetingPoint: "Sous l'arche du Gros-Horloge",
        latitude: 49.4415,
        longitude: 1.0895,
        price: 6,
        image:
          'https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1600',
        category: 'Famille',
        organizerName: 'Thomas Rousseau',
        organizerAvatar:
          'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        organizerRating: 4.6,
        equipment: JSON.stringify(['Smartphone', 'Stylo']),
        createdBy: 'clerk_user_thomas_rousseau',
      },
    }),
    prisma.activity.create({
      data: {
        title: 'Escape Game « Mystères de la Cathédrale »',
        description:
          'Symboles cachés & secrets des bâtisseurs – équipe 2 à 6.',
        type: 'TREASURE_HUNT',
        difficulty: 'MEDIUM',
        duration: 90,
        maxParticipants: 6,
        startDate: A('2025-10-28T16:00:00Z'),
        meetingPoint: 'Parvis Cathédrale',
        latitude: 49.4431,
        longitude: 1.0993,
        price: 25,
        image:
          'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?q=80&w=1600',
        category: 'Famille',
        organizerName: 'Escape Rouen',
        organizerAvatar:
          'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=400',
        organizerRating: 4.5,
        equipment: JSON.stringify(['Esprit d’équipe']),
        createdBy: 'clerk_user_escape',
      },
    }),

    // GOURMAND / ARTISANAT
    prisma.activity.create({
      data: {
        title: 'Dégustation Cidres AOC & Fromages',
        description:
          '5 cidres normands, accords fromages & histoire pomicole.',
        type: 'CULTURAL_VISIT',
        difficulty: 'EASY',
        duration: 105,
        maxParticipants: 15,
        startDate: A('2025-11-02T18:00:00Z'),
        meetingPoint: 'Place du Vieux-Marché',
        latitude: 49.4429,
        longitude: 1.0877,
        price: 28,
        image:
          'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=1600',
        category: 'Gourmand',
        organizerName: 'Normandy Tasting',
        organizerAvatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400',
        organizerRating: 4.6,
        equipment: JSON.stringify(['Interdit -18 ans']),
        createdBy: 'clerk_user_cidre',
      },
    }),
    prisma.activity.create({
      data: {
        title: 'Atelier Faïence Rouennaise',
        description:
          'Décors bleu cobalt XVIIe, création personnelle à emporter.',
        type: 'CULTURAL_VISIT',
        difficulty: 'EASY',
        duration: 120,
        maxParticipants: 10,
        startDate: A('2025-11-04T14:30:00Z'),
        meetingPoint: 'Atelier des Arts (Saint-Maclou)',
        latitude: 49.444,
        longitude: 1.092,
        price: 38,
        image:
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1600',
        category: 'Artisanat',
        organizerName: 'Atelier Rouen Céramique',
        organizerAvatar:
          'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=400',
        organizerRating: 4.2,
        equipment: JSON.stringify(['Tablier fourni']),
        createdBy: 'clerk_user_faience',
      },
    }),

    // CROISIÈRE / PHOTO
    prisma.activity.create({
      data: {
        title: 'Croisière Commentée sur la Seine',
        description:
          'Ponts, port fluvial, patrimoine industriel & paysages.',
        type: 'CULTURAL_VISIT',
        difficulty: 'EASY',
        duration: 75,
        maxParticipants: 120,
        startDate: A('2025-11-06T11:00:00Z'),
        meetingPoint: 'Embarcadère Jeanne d’Arc',
        latitude: 49.44,
        longitude: 1.085,
        price: 16,
        image:
          'https://images.unsplash.com/photo-1566249406826-8169c43b9b5d?q=80&w=1600',
        category: 'Culture',
        organizerName: 'Rouen Cruises',
        organizerAvatar:
          'https://images.unsplash.com/photo-1546421845-6471bdcf3edf?q=80&w=400',
        organizerRating: 4.4,
        equipment: JSON.stringify(['Coupe-vent']),
        createdBy: 'clerk_user_cruise',
      },
    }),
    prisma.activity.create({
      data: {
        title: 'Photo Walk – Rue Eau-de-Robec au Couché du Soleil',
        description:
          'Balade photo guidée (composition, lumière, reflets).',
        type: 'WALKING',
        difficulty: 'EASY',
        duration: 90,
        maxParticipants: 12,
        startDate: A('2025-11-08T16:30:00Z'),
        meetingPoint: 'Début Rue Eau-de-Robec',
        latitude: 49.4442,
        longitude: 1.1135,
        price: 14,
        image:
          'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&w=1600',
        category: 'Photo',
        organizerName: 'Rouen Photo Club',
        organizerAvatar:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400',
        organizerRating: 4.7,
        equipment: JSON.stringify(['Smartphone ou appareil']),
        createdBy: 'clerk_user_photo',
      },
    }),
  ]);

  // ---------- DISCUSSIONS auto ----------
  for (const a of activities) {
    await prisma.discussion.create({
      data: { activityId: a.id, title: `Discussion - ${a.title}` },
    });
  }

  // ---------- activityPlace (liens clés) ----------
  const byTitle = (t: string) => activities.find((a) => a.title === t)!;

  await prisma.activityPlace.createMany({
    data: [
      // Circuit des Églises Gothiques
      {
        activityId: byTitle('Circuit des Églises Gothiques').id,
        placeId: places[0].id,
        order: 1,
        description: 'Cathédrale – lecture de façade',
      },
      {
        activityId: byTitle('Circuit des Églises Gothiques').id,
        placeId: places[1].id,
        order: 2,
        description: 'Saint-Maclou – flamboyant',
      },
      {
        activityId: byTitle('Circuit des Églises Gothiques').id,
        placeId: places[2].id,
        order: 3,
        description: 'Saint-Ouen – vitraux',
      },

      // Sur les Pas de Jeanne d’Arc
      {
        activityId: byTitle("Sur les Pas de Jeanne d'Arc").id,
        placeId: places[4].id,
        order: 1,
        description: 'Vieux-Marché – martyre',
      },
      {
        activityId: byTitle("Sur les Pas de Jeanne d'Arc").id,
        placeId: places[5].id,
        order: 2,
        description: 'Donjon – mémoire du procès',
      },

      // Chasse Gros-Horloge
      {
        activityId: byTitle('Chasse aux Trésors : Mystères du Gros-Horloge')
          .id,
        placeId: places[3].id,
        order: 1,
        description: 'Cadran & beffroi',
      },

      // Musée & Impressionnisme
      {
        activityId: byTitle('Musée des Beaux-Arts – Focus Impressionnisme').id,
        placeId: places[6].id,
        order: 1,
        description: 'Galeries Impressionnistes',
      },

      // Croisière
      {
        activityId: byTitle('Croisière Commentée sur la Seine').id,
        placeId: places[7].id,
        order: 1,
        description: 'Embarcadère',
      },

      // Photo Walk Eau-de-Robec
      {
        activityId:
          byTitle('Photo Walk – Rue Eau-de-Robec au Couché du Soleil').id,
        placeId: places[6 /* musée */].id,
        order: 1,
        description: 'Point de rendez-vous alternatif',
      },
    ],
  });

  // ---------- CHASSES AU TRÉSOR (4) ----------
  const treasureHunts = [
    {
      title: 'Mystères de la Cathédrale',
      description:
        'Déchiffrez les symboles cachés dans la cathédrale Notre-Dame.',
      period: 'Médiéval',
      startDate: new Date('2024-01-15T09:00:00Z'),
      endDate: new Date('2024-12-31T18:00:00Z'),
      difficulty: 'HARD',
      prize: 'Visite guidée privée de la cathédrale',
      prizeValue: 50.0,
      maxParticipants: 20,
      rules: 'Respecter les lieux de culte, photos autorisées sans flash',
    },
    {
      title: 'Trésor des Impressionnistes',
      description:
        '30 points de vue, variations de lumière, palette normande.',
      period: 'XIXe siècle',
      startDate: new Date('2024-03-01T10:00:00Z'),
      endDate: new Date('2024-10-31T17:00:00Z'),
      difficulty: 'MEDIUM',
      prize: 'Kit de peinture impressionniste',
      prizeValue: 35.0,
      maxParticipants: 15,
      rules: 'Matériel de dessin recommandé, respect des propriétés privées',
    },
    {
      title: 'Secrets de la Seine',
      description:
        'Ponts, port fluvial, îles et mémoire du fleuve.',
      period: 'Contemporain',
      startDate: new Date('2024-04-01T08:00:00Z'),
      endDate: new Date('2024-11-30T19:00:00Z'),
      difficulty: 'MEDIUM',
      prize: 'Croisière sur la Seine',
      prizeValue: 25.0,
      maxParticipants: 25,
      rules: 'Chaussures de marche conseillées, attention aux berges',
    },
    {
      title: "Sur les Traces de Jeanne d'Arc",
      description:
        'Parcours historique : prison, procès, martyre, postérité.',
      period: 'Médiéval',
      startDate: new Date('2024-02-01T09:00:00Z'),
      endDate: new Date('2024-11-15T17:00:00Z'),
      difficulty: 'MEDIUM',
      prize: 'Livre historique dédicacé',
      prizeValue: 30.0,
      maxParticipants: 18,
      rules: 'Respect des sites historiques, silence dans les lieux de mémoire',
    },
  ];

  for (const t of treasureHunts) {
    await prisma.treasureHunt.create({ data: t });
  }

  // ---------- Quelques AVIS ----------
  await prisma.review.createMany({
    data: [
      {
        userId: 'clerk_user_tourist_1',
        placeId: places[0].id,
        rating: 5,
        comment:
          "Sublime cathédrale, la lumière change tout au fil de la journée !",
        helpfulCount: 9,
      },
      {
        userId: 'clerk_user_tourist_2',
        placeId: places[3].id,
        rating: 4,
        comment:
          "Le mécanisme du Gros-Horloge est fascinant et la vue superbe.",
        helpfulCount: 6,
      },
      {
        userId: 'clerk_user_tourist_3',
        placeId: places[7].id,
        rating: 5,
        comment: 'Balade apaisante au Jardin des Plantes, top pour respirer.',
        helpfulCount: 5,
      },
    ],
  });

  console.log('✅ Seed XXL terminé !');
  console.log(`📍 Places: ${places.length}`);
  console.log(`🏛️ Monuments: ${monumentsData.length}`);
  console.log(`🎯 Activités: ${activities.length}`);
  console.log(`🗝️ Chasses: ${treasureHunts.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Prisma disconnected');
  });
