import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import cors from 'cors';
import path from 'path';

import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import initializeSocket from './services/socketService.js';

const app = express();
const server = createServer(app);
const __dirname = dirname(fileURLToPath(import.meta.url));
const io = initializeSocket(server);
const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:5173','https://frontend.yvonnei.com'],
    credentials: true
};

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use('/api', userRoutes);
app.use('/route', routeRoutes);
app.use(express.static(join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public','index.html'));
});

server.listen(3000, () => {
    console.log(`Server is running on http://localhost:3000`);
});
