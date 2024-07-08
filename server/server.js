import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import cors from 'cors';
import path from 'path';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { UserPathModel, ChatMessage } from './models/model.js';
const { ObjectId } = mongoose.Types;
import userRoutes from './routes/userRoutes.js';
import routeRoutes from './routes/routeRoutes.js';

const app = express();
const server = createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
  }));
  
//   app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//     res.setHeader('Access-Control-Allow-Credentials', 'true');
//     next();
//   });
  
  const io = new Server(server, {
  
  });
app.use('/api', userRoutes);
app.use('/route', routeRoutes);

io.on('connection', async (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`Client ${socket.id} joined room ${room}`);
    });

    socket.on('new-marker', async (data) => {
        const { lngLat, userId, routeId, room, placeName, day, time, routeName } = data;
        const { lng, lat } = lngLat;

        const userPath = await UserPathModel.findOne({ userId });
        if (!userPath) {
           const userPath = new UserPathModel({
              userId: userId,
              paths: []
            });
          }
        const path = userPath.paths.find(p => p._id.equals(new ObjectId(routeId)));
        if (path) {
            console.log('routeName',routeName)
            path.routeName= routeName;
            path.markers.day1.push({ lng, lat, placeName, day, time });
            await userPath.save();
        } else {
            console.log('Route ID not found', routeId);
        }
        io.to(room).emit('new-marker', { lngLat });
    });

    socket.on('delete-marker', async (data) => {
        const { room, lngLat } = data;

        try {
            await UserPathModel.updateOne(
                { 'paths.markers.day1.lng': lngLat.lng, 'paths.markers.day1.lat': lngLat.lat },
                { $pull: { 'paths.$.markers.day1': { lng: lngLat.lng, lat: lngLat.lat } } }
            );
            io.to(room).emit('delete-marker', lngLat);
        } catch (error) {
            console.error('Error deleting marker:', error);
        }
    });

    socket.on('sendMessage', async (data) => {
        try {
            const chatMessage = new ChatMessage(data);
            await chatMessage.save();
            io.emit('receiveMessage', data);
        } catch (error) {
            console.error('Error saving chat message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.use(express.static(join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

server.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
});
