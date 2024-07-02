import { UserPathModel, ChatMessage } from '../models/model.js';
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

export const getUserPaths = async (req, res) => {
    try {
        const userId = req.params.userId;
        const userPaths = await UserPathModel.findOne({ userId }).populate('paths.permissions.friends');
        console.log('userID')
        if (!userPaths) {
            return res.status(404).json({ message: 'No paths found for this user' });
        }
        
        res.json(userPaths.paths);
    } catch (error) {
        console.error('Error fetching user paths:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const saveUserPath = async (req, res) => {
    try {
        const { userId, paths } = req.body;
        let user = await UserModel.findOne({ id: userId });
        if (!user) {
            user = new UserModel({ id: userId, username: `user${userId}`, password: '123' });
            await user.save();
        }
        const existingUserPath = await UserPathModel.findOne({ userId });
        if (existingUserPath) {
            paths.forEach((path) => {
                const existingPath = existingUserPath.paths.find(p => p.routeId === path.routeId);
                if (existingPath) {
                    existingPath.markers = path.markers;
                    existingPath.notes = path.notes;
                } else {
                    existingUserPath.paths.push(path);
                }
            });
            await existingUserPath.save();
        } else {
            const newUserPath = new UserPathModel({ userId, paths });
            await newUserPath.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving user path:', error);
        res.status(500).json({ error: 'Error saving data' });
    }
};

export const getLatestMarkers = async (req, res) => {
    try {
        const { userId, routeId } = req.params;
        const userPath = await UserPathModel.findOne({ 'paths._id': new ObjectId(routeId) });
        if (!userPath) {
            return res.status(404).json({ error: 'User path not found' });
        }
        const path = userPath.paths.find(p => p._id.equals(new ObjectId(routeId)));
        if (!path) {
            return res.status(404).json({ error: 'Path not found' });
        }
        res.json(path);
    } catch (error) {
        console.error('Error fetching markers:', error);
        res.status(500).json({ error: 'Error fetching markers' });
    }
};

export const updatePermissions = async (req, res) => {
    const { userId, routeId, permissionType, friends } = req.body;
    if (!userId || !routeId || !permissionType || (permissionType === 'friends' && !Array.isArray(friends))) {
        return res.status(400).send('Invalid request');
    }

    try {
        const userPath = await UserPathModel.findOne({ userId });
        if (!userPath) {
            return res.status(404).send('User path not found');
        }

        const path = userPath.paths.find(p => p.routeId === _id);
        if (!path) {
            return res.status(404).send('Route not found');
        }

        path.permissions.type = permissionType;
        if (permissionType === 'friends') {
            const validFriends = friends.filter(friend => ObjectId.isValid(friend)).map(friend => new ObjectId(friend));
            path.permissions.friends = validFriends;
        } else {
            path.permissions.friends = [];
        }

        await userPath.save();
        res.status(200).send('Permissions updated successfully');
    } catch (error) {
        console.error('Error updating permissions:', error);
        res.status(500).send('Internal server error');
    }
};

export const checkPermission = async (req, res) => {
    const { routeId, userId } = req.params;
    if ( !ObjectId.isValid(routeId)) {
        return res.status(400).json({ message: 'Invalid userId or routeId' });
    }
    try {
        const userPath = await UserPathModel.findOne({ 'paths._id': new ObjectId(routeId) });
        if (!userPath) {
            return res.status(404).json({ hasPermission: false });
        }

        const path = userPath.paths.find(p => p._id.equals(new ObjectId(routeId)));
        if (!path) {
            console.log('path is not existed')
            return res.status(404).json({ hasPermission: false });
        }
        if (path.permissions.type === 'private' && userPath.userId !== Number(userId)) {
            console.log('private false',typeof(userPath.userId),typeof(userId))
             return res.status(403).json({ hasPermission: false });
        }

        if (path.permissions.type === 'friends' && !path.permissions.friends.includes(new ObjectId(userId))) {
            console.log('friends false')
            return res.status(403).json({ hasPermission: false });
        }

        res.status(200).json({ hasPermission: true });
    } catch (error) {
        console.error('Error checking permission:', error);
        res.status(500).json({ hasPermission: false });
    }
};

export const createNewRoute = async (req, res) => {
    const { userId, routeName } = req.body;

    if (!userId ) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    try {
        let userPath = await UserPathModel.findOne({ userId });

        if (!userPath) {
            return res.status(400).json({ message: 'Please signup' });
        }

        const newRoute = {
            routeName,
         
            markers: {},
            permissions: { type: 'private', friends: [] }
        };

        userPath.paths.push(newRoute);
        const result = await userPath.save();
        const _id = result.paths[result.paths.length-1]._id;
        console.log('result',result.paths[result.paths.length-1]._id)
        res.status(201).json({ routeId: _id }); 
    } catch (error) {
        console.error('Error creating new route:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getChatMessages = async (req, res) => {
    const { room } = req.params;
    try {
      const messages = await ChatMessage.find({ room }).sort({ timestamp: 1 });
      res.json(messages);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };