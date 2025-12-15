import { PrismaClient } from '@prisma/client';
import { connectMongoDB } from '../config/mongodb';
import { Review, ContactMessage, Conversation } from '../models/mongo';
import reviewService from '../services/reviewService';
import contactService from '../services/contactService';
import conversationService from '../services/conversationService';

const prisma = new PrismaClient();

async function migrateReviews() {
  console.log('📦 Migration des avis (Reviews)...');
  
  try {
    const prismaReviews = await prisma.review.findMany({
      include: {
        user: true,
        place: true
      }
    });
    
    console.log(`   Trouvé ${prismaReviews.length} avis dans PostgreSQL`);
    
    for (const review of prismaReviews) {
      await reviewService.createReview({
        placeId: review.placeId,
        placeName: review.place.name,
        userId: review.userId,
        userName: review.user.name || review.user.email,
        userEmail: review.user.email,
        rating: review.rating,
        comment: review.comment || '',
        images: review.images ? JSON.parse(review.images as string) : [],
        helpful: 0,
        verified: true,
        status: 'approved'
      });
    }
    
    console.log(`✅ ${prismaReviews.length} avis migrés vers MongoDB`);
  } catch (error) {
    console.error('❌ Erreur migration avis:', error);
  }
}

async function migrateContactMessages() {
  console.log('📦 Migration des messages de contact...');
  
  try {
    // Si vous avez une table de contact dans Prisma, adaptez cette partie
    // Sinon, cette étape peut être ignorée
    console.log('⚠️ Pas de table contact dans Prisma, migration ignorée');
  } catch (error) {
    console.error('❌ Erreur migration messages contact:', error);
  }
}

async function migrateConversations() {
  console.log('📦 Migration des conversations...');
  
  try {
    const activities = await prisma.activity.findMany({
      include: {
        registrations: {
          include: {
            user: true
          }
        }
      }
    });
    
    console.log(`   Trouvé ${activities.length} activités avec des participants`);
    
    let conversationsCreated = 0;
    
    for (const activity of activities) {
      if (activity.registrations.length > 0) {
        // Créer une conversation pour chaque activité avec des participants
        const participants = activity.registrations.map(reg => ({
          userId: reg.userId,
          userName: reg.user.name || reg.user.email,
          joinedAt: reg.createdAt
        }));
        
        await Conversation.create({
          activityId: activity.id,
          activityTitle: activity.title,
          participants,
          messages: [],
          lastMessageAt: new Date()
        });
        
        conversationsCreated++;
      }
    }
    
    console.log(`✅ ${conversationsCreated} conversations créées dans MongoDB`);
  } catch (error) {
    console.error('❌ Erreur migration conversations:', error);
  }
}

async function migrate() {
  console.log('🚀 Début de la migration PostgreSQL → MongoDB\n');
  
  try {
    // Connexion aux bases de données
    await connectMongoDB();
    console.log('✅ Connecté à MongoDB\n');
    
    // Migrations
    await migrateReviews();
    console.log('');
    await migrateContactMessages();
    console.log('');
    await migrateConversations();
    console.log('');
    
    console.log('✅ Migration terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur durant la migration:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Exécuter la migration
migrate();
