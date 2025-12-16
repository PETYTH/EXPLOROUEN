// Ce service d'authentification est désactivé car l'application utilise Clerk
// pour l'authentification. Toutes les fonctionnalités d'auth sont gérées par Clerk.

export class AuthService {
  static async register(data: any) { return {}; }
  static async login(data: any) { return {}; }
  static async refreshToken(token: string) { return {}; }
  static async logout(token: string) { return {}; }
  static async forgotPassword(email: string) { return {}; }
  static async verifyResetCode(email: string, code: string) { return {}; }
  static async resetPassword(email: string, code: string, password: string) { return {}; }
}

export default AuthService;

/*
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    user: any;
}

export class AuthService {
    // Toutes les méthodes d'authentification sont gérées par Clerk
    // Ce service n'est plus utilisé
}
*/
