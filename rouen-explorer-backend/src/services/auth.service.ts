// Ce service d'authentification est désactivé car l'application utilise Clerk
// pour l'authentification. Toutes les fonctionnalités d'auth sont gérées par Clerk.

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
