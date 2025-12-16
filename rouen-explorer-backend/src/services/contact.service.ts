// src/services/contact.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ContactData {
    name: string;
    email: string;
    subject?: string;
    message: string;
    userId?: string;
}

export class ContactService {
    static async createContact(contactData: ContactData) {
        const contact = await prisma.contact.create({
            data: contactData
        });
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
            page = 1,
            limit = 20,
            search
        } = filters;

        const skip = (page - 1) * limit;

        const where: any = {};
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { message: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [contacts, total] = await Promise.all([
            prisma.contact.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.contact.count({ where })
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

    static async getContactById(id: string) {
        return prisma.contact.findUnique({
            where: { id }
        });
    }

    static async updateContact(id: string, updates: Partial<ContactData>) {
        return prisma.contact.update({
            where: { id },
            data: updates
        });
    }

    static async updateContactStatus(
        id: string,
        _status: string,
        _assignedTo?: string,
        _note?: string
    ) {
        // Simplified for now - can be extended later
        return prisma.contact.update({
            where: { id },
            data: { updatedAt: new Date() }
        });
    }

    static async deleteContact(id: string): Promise<boolean> {
        try {
            await prisma.contact.delete({
                where: { id }
            });
            return true;
        } catch {
            return false;
        }
    }

    static async getContactStats() {
        const total = await prisma.contact.count();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayCount = await prisma.contact.count({
            where: {
                createdAt: {
                    gte: today
                }
            }
        });

        return {
            total,
            today: todayCount
        };
    }
}
