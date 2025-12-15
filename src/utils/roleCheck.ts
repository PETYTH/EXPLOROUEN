import { clerkClient } from '@clerk/clerk-sdk-node';

/**
 * Vérifie si un utilisateur a le rôle admin via Clerk
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
    try {
        const user = await clerkClient.users.getUser(userId);
        const roles = user.publicMetadata?.roles as string[] | undefined;
        return roles?.includes('admin') || false;
    } catch (error) {
        console.error('Erreur vérification rôle admin:', error);
        return false;
    }
}

/**
 * Vérifie si un utilisateur peut modifier une ressource
 * (soit il est le créateur, soit il est admin)
 */
export async function canUserModifyResource(userId: string, creatorId: string): Promise<boolean> {
    // Si c'est le créateur, il peut modifier
    if (userId === creatorId) {
        return true;
    }
    
    // Sinon, vérifier s'il est admin
    return await isUserAdmin(userId);
}
