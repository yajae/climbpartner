import express from 'express';
import { checkUsername, register, login, authenticateToken, getUser } from '../controllers/userController.js';
const router = express.Router();

router.post('/check-username', checkUsername);
router.post('/register', register);
router.post('/login', login);
router.get('/user', authenticateToken, getUser);

export default router;
