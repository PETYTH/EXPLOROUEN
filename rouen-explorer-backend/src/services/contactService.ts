import { ContactMessage, IContactMessage } from '../models/mongo';

export class ContactService {
  // Créer un nouveau message de contact
  async createContactMessage(messageData: Partial<IContactMessage>): Promise<IContactMessage> {
    const message = await ContactMessage.create({
      ...messageData,
      status: 'new',
      priority: messageData.priority || 'normal'
    });
    return message;
  }

  // Récupérer tous les messages
  async getAllMessages(
    filters?: {
      status?: string;
      priority?: string;
      assignedTo?: string;
    },
    limit: number = 50
  ): Promise<IContactMessage[]> {
    const query: any = {};
    
    if (filters?.status) query.status = filters.status;
    if (filters?.priority) query.priority = filters.priority;
    if (filters?.assignedTo) query.assignedTo = filters.assignedTo;
    
    return await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // Récupérer un message par ID
  async getMessageById(messageId: string): Promise<IContactMessage | null> {
    return await ContactMessage.findById(messageId);
  }

  // Récupérer les messages d'un utilisateur
  async getUserMessages(userId: string): Promise<IContactMessage[]> {
    return await ContactMessage.find({ userId })
      .sort({ createdAt: -1 });
  }

  // Récupérer les messages par email
  async getMessagesByEmail(email: string): Promise<IContactMessage[]> {
    return await ContactMessage.find({ email })
      .sort({ createdAt: -1 });
  }

  // Mettre à jour le statut d'un message
  async updateStatus(
    messageId: string,
    status: 'new' | 'read' | 'replied' | 'closed'
  ): Promise<IContactMessage | null> {
    return await ContactMessage.findByIdAndUpdate(
      messageId,
      { $set: { status } },
      { new: true }
    );
  }

  // Assigner un message à un admin
  async assignMessage(
    messageId: string,
    assignedTo: string
  ): Promise<IContactMessage | null> {
    return await ContactMessage.findByIdAndUpdate(
      messageId,
      { $set: { assignedTo } },
      { new: true }
    );
  }

  // Ajouter une réponse
  async addReply(
    messageId: string,
    replyContent: string,
    sentBy: string
  ): Promise<IContactMessage | null> {
    return await ContactMessage.findByIdAndUpdate(
      messageId,
      {
        $set: {
          reply: {
            content: replyContent,
            sentBy,
            sentAt: new Date()
          },
          status: 'replied'
        }
      },
      { new: true }
    );
  }

  // Définir la priorité
  async setPriority(
    messageId: string,
    priority: 'low' | 'normal' | 'high' | 'urgent'
  ): Promise<IContactMessage | null> {
    return await ContactMessage.findByIdAndUpdate(
      messageId,
      { $set: { priority } },
      { new: true }
    );
  }

  // Ajouter des tags
  async addTags(
    messageId: string,
    tags: string[]
  ): Promise<IContactMessage | null> {
    return await ContactMessage.findByIdAndUpdate(
      messageId,
      { $addToSet: { tags: { $each: tags } } },
      { new: true }
    );
  }

  // Supprimer un message
  async deleteMessage(messageId: string): Promise<boolean> {
    const result = await ContactMessage.deleteOne({ _id: messageId });
    return result.deletedCount > 0;
  }

  // Statistiques des messages
  async getStats(): Promise<{
    total: number;
    new: number;
    read: number;
    replied: number;
    closed: number;
    byPriority: { [key: string]: number };
  }> {
    const [total, newCount, readCount, repliedCount, closedCount] = await Promise.all([
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ status: 'new' }),
      ContactMessage.countDocuments({ status: 'read' }),
      ContactMessage.countDocuments({ status: 'replied' }),
      ContactMessage.countDocuments({ status: 'closed' })
    ]);
    
    const byPriority = {
      low: await ContactMessage.countDocuments({ priority: 'low' }),
      normal: await ContactMessage.countDocuments({ priority: 'normal' }),
      high: await ContactMessage.countDocuments({ priority: 'high' }),
      urgent: await ContactMessage.countDocuments({ priority: 'urgent' })
    };
    
    return {
      total,
      new: newCount,
      read: readCount,
      replied: repliedCount,
      closed: closedCount,
      byPriority
    };
  }

  // Récupérer les messages non traités
  async getUnhandledMessages(): Promise<IContactMessage[]> {
    return await ContactMessage.find({
      status: { $in: ['new', 'read'] }
    })
    .sort({ priority: -1, createdAt: -1 });
  }
}

export default new ContactService();
