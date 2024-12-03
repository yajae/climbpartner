import { UserPathModel, ChatMessage } from '../models/model.js';
import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;
import dotenv from 'dotenv';
dotenv.config();
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import axios from 'axios'
const apiKey = process.env.CWB_API_KEY;

export const getUserPaths = async (req, res) => {
    try {
        const userId = req.params.userId;
        if(!userId){
            return res.status(400).send('Invalid request');
        }
        let userPaths = await UserPathModel.findOne({ userId }).populate('paths.permissions.friends');
        console.log('userPaths',userPaths)
        if (!userPaths) {
           const userPaths = new UserPathModel({
                userId: userId,
                paths: []
            });
            const newpath = await userPaths.save();
            console.log(" in newpath",newpath)
            return res.json(null);
        }
        console.log(" out userPaths.paths", userPaths.paths)
        return res.json(userPaths.paths);
    } catch (error) {
        console.error('Error fetching user paths:', error);
        res.status(500).json({ message: 'Server error' });
    }
};



export const getLatestMarkers = async (req, res) => {
    try {
        const { userId, routeId } = req.params;
        if (!ObjectId.isValid(routeId)) {
            return res.status(400).json({ success: false, message: 'Invalid routeId' });
        }

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
    console.log('更改權限',req.body)
    if (!userId || !routeId || !permissionType || (permissionType === 'friends' && !Array.isArray(friends))) {
        return res.status(400).send('Invalid request');
    }

    try {
        const userPath = await UserPathModel.findOne({ userId });
        if (!userPath) {
            return res.status(404).send('User path not found');
        }

        const path = userPath.paths.find(p => p._id.equals(new ObjectId(routeId)));
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
    console.log('creating new route')
    if (!userId ) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    try {
        const userPath = await UserPathModel.findOne({ userId });

        // if (!userPath) {
        //     const userPath = new UserPathModel({
        //        userId: userId,
        //        paths: []
        //      });
        //    }

        const newRoute = {
            routeName,
         
            markers: {},
            permissions: { type: 'private', friends: [] }
        };
        console.log('creating new route')
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
      const roomMessages = await ChatMessage.findOne({ room });
  
      if (roomMessages) {
        console.log('history message', roomMessages.messages);
        res.json(roomMessages.messages);
      } 
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  export const getWeatherMessage = async (req, res) => {
  
    try {
       
        const response = await axios.get('https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001', {
            params: {
            Authorization:'CWA-257E772C-ABCA-4B7C-BF15-046C053807EB'
            }
        });
  
      res.send(response.data);
    } catch (error) {
             console.error('Error fetching data:', error.message);
        
        // 打印更详细的错误信息
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            // 可以根据需要返回不同的状态码和消息
            return res.status(error.response.status).json({
                message: 'Error fetching weather data',
                error: error.response.data
            });
        } else {
            // 如果没有响应，则返回一般的错误信息
            res.status(500).json({
                message: 'Internal Server Error',
                error: error.message
            });
        }
    }
  };
  export const saveRouteName = async (req, res) => {
    const { routeId, newRouteName } = req.body;

    try {
      const userPath = await UserPathModel.findOne({ "paths._id": new ObjectId(routeId) });
      if (!userPath) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      const route = userPath.paths.find( p => p._id.equals(new ObjectId(routeId)));
      if (!route) {
        return res.status(404).json({ message: 'Route not found' });
      }
     
      route.routeName = newRouteName;
      await userPath.save();
  
      res.json({ success: true, message: 'Route name saved successfully' });
    } catch (error) {
      console.error('Error saving route name:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };