import express from 'express';
import { getUserPaths, saveUserPath, getLatestMarkers, updatePermissions, checkPermission, createNewRoute, getChatMessages } from '../controllers/routeController.js';

const router = express.Router();

router.get('/user-paths/:userId', getUserPaths);
router.post('/user-path', saveUserPath);
router.get('/markers/latest/:userId/:routeId', getLatestMarkers);
router.post('/update-permissions', updatePermissions);
router.get('/check-permission/:userId/:routeId', checkPermission);
router.post('/create-route', createNewRoute); 
router.get('/chat-messages/:room', getChatMessages);

export default router;
