// src/jobs/cleanup.job.ts
import cron from 'node-cron';
import { EphemeralChatService } from '../services/ephemeral-chat.service';

export class CleanupJob {
    private static isRunning = false;

    // Démarrer la tâche de nettoyage automatique
    static start() {
        // Exécuter toutes les heures
        cron.schedule('0 * * * *', async () => {
            if (this.isRunning) {
                console.log('Tâche de nettoyage déjà en cours, passage ignoré');
                return;
            }

            this.isRunning = true;
            
            try {
                console.log('Démarrage de la tâche de nettoyage des messages éphémères');
                const result = await EphemeralChatService.runCleanupTask();
                console.log('Tâche de nettoyage terminée avec succès:', result);
            } catch (error) {
                console.error('Erreur lors de la tâche de nettoyage:', error);
            } finally {
                this.isRunning = false;
            }
        });

        console.log('✅ Tâche de nettoyage automatique des messages éphémères démarrée');
    }

    // Arrêter toutes les tâches cron
    static stop() {
        cron.getTasks().forEach(task => task.stop());
        console.log('✅ Tâches de nettoyage arrêtées');
    }

    // Exécuter manuellement la tâche de nettoyage
    static async runManual() {
        if (this.isRunning) {
            throw new Error('Tâche de nettoyage déjà en cours');
        }

        this.isRunning = true;
        
        try {
            console.log('Exécution manuelle de la tâche de nettoyage');
            const result = await EphemeralChatService.runCleanupTask();
            console.log('Nettoyage manuel terminé:', result);
            return result;
        } finally {
            this.isRunning = false;
        }
    }
}
