import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import cors from 'cors';
import { Server } from 'socket.io';
import mongoose from "mongoose";
import cookieParser from 'cookie-parser';
import conn from './connDb.js';

const app = express();
const server = createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(cookieParser());

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

// Define User Schema
const userSchema = new mongoose.Schema({
    id: Number,
    username: String,
    password: String
});

const UserModel = conn.model('User', userSchema);

// Define Marker Schema
const markerSchema = new mongoose.Schema({
    lng: Number,
    lat: Number,
    day: Number
});

// Define Path Schema
const pathSchema = new mongoose.Schema({
    routeId: Number,
    markers: {
        day1: [markerSchema],
        day2: [markerSchema],
        day3: [markerSchema],
        day4: [markerSchema],
        day5: [markerSchema]
    },
    notes: String
});

// Define UserPath Schema
const userPathSchema = new mongoose.Schema({
    userId: Number,
    paths: [pathSchema]
});

const UserPathModel = conn.model('UserPath', userPathSchema);


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await UserModel.findOne({ username });
    if (user && user.password === password) {
        res.cookie('userId', user.id, { httpOnly: true });
        res.json({ success: true, userId: user.id });

    } else {
        res.json({ success: false });
    }
});

// 检查登录状态接口
app.get('/check-login', (req, res) => {
    const userId = req.cookies.userId;
    if (userId) {
      res.json({ success: true, userId });
    } else {
      res.json({ success: false });
    }
  });

io.on('connection', async (socket) => {
    console.log('新客户端已连接:', socket.id);
//     const cookies = socket.handshake.headers.cookie
//     ? Object.fromEntries(socket.handshake.headers.cookie.split('; ').map(cookie => cookie.split('=')))
//     : {};
// const userId = cookies.userId;

    // 讓客戶端加入指定房間
    socket.on('join-room', (room) => {
            socket.join(room);
            console.log(`客户端 ${socket.id} 已加入房間 ${room}`);
        });

    socket.on('new-marker', async (data) => {
        const { lngLat ,userId,routeId,room} = data;
   
        const userPath = await UserPathModel.findOne({ userId });
          
        // 查找該用戶路徑中指定 routeId 的路徑
        const path = userPath.paths.find(p => p.routeId === parseInt(routeId));

         
        if (path) {
            path.markers.day1.push(lngLat);
          
           const result = await userPath.save();  // 保存整個文檔
            console.log('保存成功');
        
        } 

        io.to(room).emit('new-marker', { lngLat });

    });

    socket.on('delete-marker', async (data) => {
     
        const { room, lngLat } = data;
        try {
            console.log(room)
                const result= await UserPathModel.updateOne(
                { 'paths.markers.day1.lng': lngLat.lng, 'paths.markers.day1.lat': lngLat.lat },
                { $pull: { 'paths.$.markers.day1': { lng: lngLat.lng, lat: lngLat.lat } } }
            );
            console.log('delete',result)
            console.log('lngLat',lngLat)
            io.to(room).emit('delete-marker', lngLat);
        } catch (error) {
            console.error('刪除標記數據時發生錯誤:', error);
        }
    });


    socket.on('disconnect', () => {
        console.log('客户端已断开连接:', socket.id);
    });
});

app.post('/user-path', async (req, res) => {
    try {
        const { userId, paths } = req.body;

        // 檢查用戶是否存在，如果不存在則創建一個新用戶
        let user = await UserModel.findOne({ id: userId });
        if (!user) {
            user = new UserModel({ id: userId, username: `user${userId}`, password: '123' });
            await user.save();
        }

        // 儲存或更新用戶的路徑及標記數據
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

        // 查找指定 userId 的用戶路徑
        const userPath = await UserPathModel.findOne({ userId });
        if (!userPath) {
            return res.status(404).json({ error: '用戶路徑未找到' });
        }

        // 查找該用戶路徑中指定 routeId 的路徑
        const path = userPath.paths.find(p => p.routeId === parseInt(routeId));
        if (!path) {
            return res.status(404).json({ error: '路徑未找到' });
        }
        console.log(path)
   

        console.log('獲取到的標記:', path.markers);
        res.json(path.markers.day1);
    } catch (error) {
        console.error('獲取標記數據時發生錯誤:', error);
        res.status(500).json({ error: '獲取標記數據時發生錯誤' });
    }
});


app.use(express.static(join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
server.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
});
