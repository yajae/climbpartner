import { Server } from 'socket.io';
import { UserPathModel, ChatMessage } from '../models/model.js';


  const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
          origin: ['http://localhost:3000', 'http://localhost:5173', 'https://frontend.yvonnei.com'],
          methods: ['GET', 'POST'],
          credentials: true
        }
      });
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
                console.log('no user path')
               const userPath = new UserPathModel({
                  userId: userId,
                  paths: []
                });
              }
    
              // 查找該用戶路徑中指定 routeId 的路徑
              const path = userPath.paths.find(p => p.routeId === parseInt(routeId));
      
               
              if (path) {
                  path.markers.day1.push(lngLat);
                
                 const result = await userPath.save();  // 保存整個文檔
       
              } 
      
              io.to(room).emit('new-marker', lngLat );
      
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
                const { room, user, message, timestamp } = data;
                
                let roomMessages = await ChatMessage.findOne({ room });
        
                if (!roomMessages) {
                    roomMessages = new ChatMessage({
                        room,
                        messages: []
                    });
                }
                roomMessages.messages.push({ user, message, timestamp });
                await roomMessages.save();
                io.to(room).emit('receiveMessage', data);
            } catch (error) {
                console.error('Error saving chat message:', error);
            }
        });
    
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
  }

export default initializeSocket;