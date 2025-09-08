// src/utils/helpers.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export class HashHelper {
    static async hash(password: string): Promise<string> {
        return bcrypt.hash(password, config.bcryptRounds);
    }

    static async compare(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}

export class TokenHelper {
    static generateAccessToken(payload: any): string {
        return jwt.sign(payload, config.jwtSecret, {
            expiresIn: config.jwtExpiresIn
        } as jwt.SignOptions);
    }

    static generateRefreshToken(payload: any): string {
        return jwt.sign(payload, config.jwtRefreshSecret, {
            expiresIn: config.jwtRefreshExpiresIn
        } as jwt.SignOptions);
    }

    static verifyAccessToken(token: string): any {
        return jwt.verify(token, config.jwtSecret);
    }

    static verifyRefreshToken(token: string): any {
        return jwt.verify(token, config.jwtRefreshSecret);
    }
}

export class ValidationHelper {
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isStrongPassword(password: string): boolean {
        // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    static sanitizeString(str: string): string {
        return str.trim().replace(/[<>]/g, '');
    }
}

export class DistanceHelper {
    static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Rayon de la Terre en km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    private static deg2rad(deg: number): number {
        return deg * (Math.PI/180);
    }
}

export class DateHelper {
    static addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    static isInFuture(date: Date): boolean {
        return date > new Date();
    }

    static formatForDatabase(date: Date): string {
        return date.toISOString();
    }
}
