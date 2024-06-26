import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import cors from 'cors';
import path from 'path';
import { Server } from 'socket.io';
import mongoose from "mongoose";
import cookieParser from 'cookie-parser';
import conn from './connDb.js';
const Schema = mongoose.Schema;
const app = express();
const server = createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(cookieParser());
const { ObjectId } = mongoose.Types;
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true
};
app.use(cors(corsOptions));

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const userSchema = new mongoose.Schema({
    id: Number,
    username: String,
    password: String
});

const UserModel = conn.model('User', userSchema);

const markerSchema = new mongoose.Schema({
    lng: Number,
    lat: Number,
    day: Number
});

const pathSchema = new Schema({
    routeId: Number,
    markers: {
        day1: [markerSchema],
        day2: [markerSchema],
        day3: [markerSchema],
        day4: [markerSchema],
        day5: [markerSchema]
    },
    permissions: {
        type: { type: String, enum: ['private', 'friends', 'public'], required: true, default: 'private' },
        friends: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    },
    notes: String
});

const userPathSchema = new mongoose.Schema({
    userId: Number,
    paths: [pathSchema]
});

const UserPathModel = conn.model('UserPath', userPathSchema);

const chatMessageSchema = new mongoose.Schema({
    user: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
    room: String,
  });
  
  const ChatMessage = conn.model('ChatMessage', chatMessageSchema);

app.get('/api/user-paths/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const userPaths = await UserPathModel.findOne({ userId }).populate('paths.permissions.friends');
        
        if (!userPaths) {
            return res.status(404).json({ message: 'No paths found for this user' });
        }
        
        res.json(userPaths.paths);
    } catch (error) {
        console.error('Error fetching user paths:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.post('/update-permissions', async (req, res) => {
    const { userId, routeId, permissionType, friends } = req.body;
    console.log('Received request:', userId, routeId, permissionType, friends);

    if (!userId || !routeId || !permissionType || (permissionType === 'friends' && !Array.isArray(friends))) {
        console.log('Invalid request parameters:', { userId, routeId, permissionType, friends });
        return res.status(400).send('Invalid request');
    }

    try {
        const userPath = await UserPathModel.findOne({ userId });

        if (!userPath) {
            console.log('User path not found for userId:', userId);
            return res.status(404).send('User path not found');
        }

        const path = userPath.paths.find(p => p.routeId === routeId);

        if (!path) {
            console.log('Route not found for routeId:', routeId);
            return res.status(404).send('Route not found');
        }

        path.permissions.type = permissionType;
        if (permissionType === 'friends') {
            const validFriends = friends.filter(friend => ObjectId.isValid(friend)).map(friend => new ObjectId(friend)); // 过滤并转换有效的ObjectId
            console.log('Valid friends:', validFriends);
            path.permissions.friends = validFriends;
        } else {
            path.permissions.friends = [];
        }

        await userPath.save();
        res.status(200).send('Permissions updated successfully');
    } catch (error) {
        console.error('Error updating permissions:', error); // Log the error for debugging
        res.status(500).send('Internal server error');
    }
});

app.get('/check-permission/:userId/:routeId', async (req, res) => {
  const { routeId,userId } = req.params;
    console.log('routeId',routeId)
  try {
    const userPath = await UserPathModel.findOne({ 'paths._id': new ObjectId(routeId) });
    console.log(1)

    if (!userPath) {
      return res.status(404).json({ hasPermission: false });
    }

    const path = userPath.paths.find(p => p._id.equals(new ObjectId(routeId)));
    console.log(2)
    if (!path) {
      return res.status(404).json({ hasPermission: false });
    }
    console.log('path.permissions.type',path.permissions.type)
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
    console.log('err',error)
    res.status(500).json({ hasPermission: false });
  }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await UserModel.findOne({ username });
    if (user && user.password === password) {
        res.json({ success: true, userId: user.id });
    } else {
        res.json({ success: false });
    }
});


app.post('/update-permissions', async (req, res) => {
  const { mapId, permissionType, friends } = req.body;

  if (!mapId || !permissionType || (permissionType === 'friends' && !friends)) {
    return res.status(400).send('Invalid request');
  }

  try {
    const map = await MapModel.findById(mapId);

    if (!map) {
      return res.status(404).send('Map not found');
    }

    map.permissions.type = permissionType;
    if (permissionType === 'friends') {
      map.permissions.friends = friends;
    } else {
      map.permissions.friends = [];
    }

    await map.save();
    res.status(200).send('Permissions updated successfully');
  } catch (error) {
    res.status(500).send('Internal server error');
  }
});

io.on('connection', async (socket) => {
    console.log('新客户端已连接:', socket.id);

    socket.on('join-room', (room) => {
            socket.join(room);
            console.log(`客户端 ${socket.id} 已加入房間 ${room}`);
        });

    socket.on('new-marker', async (data) => {
        const { lngLat ,userId,routeId,room} = data;
        const userPath = await UserPathModel.findOne({ userId });
        const path = userPath.paths.find(p => p.routeId === parseInt(routeId));
        if (path) {
            path.markers.day1.push(lngLat);
           const result = await userPath.save();  
        }
        io.to(room).emit('new-marker', { lngLat });
    });

    socket.on('delete-marker', async (data) => {
        const { room, lngLat } = data;
        try {
                const result= await UserPathModel.updateOne(
                { 'paths.markers.day1.lng': lngLat.lng, 'paths.markers.day1.lat': lngLat.lat },
                { $pull: { 'paths.$.markers.day1': { lng: lngLat.lng, lat: lngLat.lat } } }
            );
            console.log('delete',result)
            console.log('lngLat',lngLat)
            io.emit('delete-marker', lngLat);
            io.to(room).emit('delete-marker', lngLat);
        } catch (error) {
            console.error('刪除標記數據時發生錯誤:', error);
        }
    });
     
    socket.on('sendMessage', async (data) => {
        try {
        
            const chatMessage = new ChatMessage(data);
            await chatMessage.save();
            io.emit('receiveMessage', data);
        } catch (error) {
            console.error('保存聊天消息时发生错误:', error);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('客户端已断开连接:', socket.id);
    });
});

app.post('/user-path', async (req, res) => {
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
        console.error('儲存用戶路徑及標記數據時發生錯誤:', error);
        res.status(500).json({ error: '儲存數據時發生錯誤' });
    }
});

app.get('/markers/latest/:userId/:routeId', async (req, res) => {
    try {
        const { userId, routeId } = req.params;
        console.log(`開始獲取用戶 ${userId} 的路徑 ${routeId} 的最新標記`);


        const userPath = await UserPathModel.findOne({ 'paths._id': new ObjectId(routeId) });
        if (!userPath) {
            return res.status(404).json({ error: '用戶路徑未找到' });
        }
        const path = userPath.paths.find(p => p._id.equals(new ObjectId(routeId)));
        if (!path) {
            return res.status(404).json({ error: '路徑未找到' });
        }
        console.log('獲取到的標記:', path.markers);
        res.json(path.markers.day1);
    } catch (error) {
        console.error('獲取標記數據時發生錯誤:', error);
        res.status(500).json({ error: '獲取標記數據時發生錯誤' });
    }
});



app.get('/chat-messages/:room', async (req, res) => {
    try {
      const { room } = req.params;
      const messages = await ChatMessage.find({ room }).sort({ timestamp: 1 });
      res.json(messages);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
app.use(express.static(join(__dirname, 'public')));

// 如果放在最上面，index.html不會顯示其他api提供的資料
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
server.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
});
