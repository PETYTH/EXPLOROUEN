// src/services/contact.service.ts
import { Contact, IContact } from '../models/contact.model';

export class ContactService {
    static async createContact(contactData: Partial<IContact>): Promise<IContact> {
        const contact = new Contact(contactData);
        await contact.save();
        return contact;
    }

    static async getContacts(filters: {
        status?: string;
        priority?: string;
        assignedTo?: string;
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const {
            status,
            priority,
            assignedTo,
            page = 1,
            limit = 20,
            search
        } = filters;

        const query: any = {};

        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (assignedTo) query.assignedTo = assignedTo;
        if (search) {
            query.$text = { $search: search };
        }

        const skip = (page - 1) * limit;

        const [contacts, total] = await Promise.all([
            Contact.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Contact.countDocuments(query)
        ]);

        return {
            contacts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    static async getContactById(id: string): Promise<IContact | null> {
        return Contact.findById(id);
    }

    static async updateContact(id: string, updates: Partial<IContact>): Promise<IContact | null> {
        return Contact.findByIdAndUpdate(
            id,
            { ...updates, updatedAt: new Date() },
            { new: true }
        );
    }

    static async updateContactStatus(
        id: string,
        status: string,
        assignedTo?: string,
        note?: string
    ): Promise<IContact | null> {
        const updates: any = { status, updatedAt: new Date() };
        
        if (assignedTo) updates.assignedTo = assignedTo;
        if (note) {
            // Pour l'instant, on ignore les notes car elles ne sont pas dans le modèle
            // TODO: Ajouter support des notes si nécessaire
        }

        return Contact.findByIdAndUpdate(id, updates, { new: true });
    }

    static async deleteContact(id: string): Promise<boolean> {
        const result = await Contact.findByIdAndDelete(id);
        return !!result;
    }

    static async getContactStats() {
        const stats = await Contact.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const priorityStats = await Contact.aggregate([
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            byStatus: stats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {}),
            byPriority: priorityStats.reduce((acc, stat) => {
                acc[stat._id] = stat.count;
                return acc;
            }, {})
        };
    }
}
