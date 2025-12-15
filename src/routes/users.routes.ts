import { Router } from "express";
import { UsersController } from "../controllers/users.controller";
import { requireAuth } from "../middleware/clerk.middleware";

const router = Router();
const usersController = new UsersController();

// Route pour récupérer les statistiques utilisateur
router.get("/stats", requireAuth, usersController.getUserStats);

export default router;
