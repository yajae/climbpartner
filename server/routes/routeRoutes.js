import express from 'express';
import { getUserPaths, getLatestMarkers, updatePermissions, checkPermission, createNewRoute, getChatMessages, getWeatherMessage, saveRouteName } from '../controllers/routeController.js';

const router = express.Router();

router.get('/user-paths/:userId', getUserPaths);
router.get('/markers/latest/:userId/:routeId', getLatestMarkers);
router.post('/update-permissions', updatePermissions);
router.get('/check-permission/:userId/:routeId', checkPermission);
router.post('/create-route', createNewRoute); 
router.get('/chat-messages/:room', getChatMessages);
router.get('/weather', getWeatherMessage);
router.post('/save-routeName', saveRouteName);

export default router;
