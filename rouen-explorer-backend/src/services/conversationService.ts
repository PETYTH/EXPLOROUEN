import { Conversation, IConversation, IMessage } from '../models/mongo';

export class ConversationService {
  // Créer ou récupérer une conversation pour une activité
  async getOrCreateConversation(
    activityId: string, 
    activityTitle: string, 
    userId: string, 
    userName: string
  ): Promise<IConversation> {
    let conversation = await Conversation.findOne({ activityId });
    
    if (!conversation) {
      conversation = await Conversation.create({
        activityId,
        activityTitle,
        participants: [{
          userId,
          userName,
          joinedAt: new Date()
        }],
        messages: [],
        lastMessageAt: new Date()
      });
    } else {
      // Ajouter le participant s'il n'est pas déjà dans la conversation
      const participantExists = conversation.participants.some(p => p.userId === userId);
      if (!participantExists) {
        conversation.participants.push({
          userId,
          userName,
          joinedAt: new Date()
        });
        await conversation.save();
      }
    }
    
    return conversation;
  }

  // Récupérer une conversation par activityId
  async getConversationByActivityId(activityId: string): Promise<IConversation | null> {
    return await Conversation.findOne({ activityId });
  }

  // Récupérer toutes les conversations d'un utilisateur
  async getUserConversations(userId: string): Promise<IConversation[]> {
    return await Conversation.find({
      'participants.userId': userId
    })
    .sort({ lastMessageAt: -1 })
    .limit(50);
  }

  // Ajouter un message à une conversation
  async addMessage(
    activityId: string,
    message: IMessage
  ): Promise<IConversation | null> {
    const conversation = await Conversation.findOneAndUpdate(
      { activityId },
      {
        $push: { messages: message },
        $set: { lastMessageAt: message.timestamp }
      },
      { new: true }
    );
    
    return conversation;
  }

  // Marquer les messages comme lus
  async markMessagesAsRead(
    activityId: string,
    userId: string
  ): Promise<void> {
    await Conversation.updateOne(
      { activityId },
      {
        $set: { 'messages.$[elem].read': true }
      },
      {
        arrayFilters: [{ 'elem.senderId': { $ne: userId }, 'elem.read': false }]
      }
    );
  }

  // Récupérer les messages d'une conversation
  async getMessages(
    activityId: string,
    limit: number = 50,
    before?: Date
  ): Promise<IMessage[]> {
    const conversation = await Conversation.findOne({ activityId });
    
    if (!conversation) return [];
    
    let messages = conversation.messages;
    
    if (before) {
      messages = messages.filter(m => m.timestamp < before);
    }
    
    return messages
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
      .reverse();
  }

  // Supprimer une conversation
  async deleteConversation(activityId: string): Promise<boolean> {
    const result = await Conversation.deleteOne({ activityId });
    return result.deletedCount > 0;
  }

  // Obtenir le nombre de messages non lus pour un utilisateur
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await Conversation.find({
      'participants.userId': userId
    });
    
    let unreadCount = 0;
    for (const conv of conversations) {
      unreadCount += conv.messages.filter(m => 
        m.senderId !== userId && !m.read
      ).length;
    }
    
    return unreadCount;
  }
}

export default new ConversationService();
