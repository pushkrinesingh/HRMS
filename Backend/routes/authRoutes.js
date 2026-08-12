import express from "express";
import { register, login, refresh, logout, me, updateUserRole } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", authMiddleware("admin"), register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.get("/me", authMiddleware(), me);

router.patch("/users/:id/role", authMiddleware("admin"), updateUserRole);

export default router;
