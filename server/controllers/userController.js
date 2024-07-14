import { UserModel } from '../models/model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET;

export const checkUsername = async (req, res) => {
  const { username } = req.body;
  const existingUser = await UserModel.findOne({ username });
  if(!existingUser){
    res.json({ available: false })
  }
  res.json({ available: existingUser.username });
};

export const register = async (req, res) => {
  const { username, password, email } = req.body;
  const existingUser = await UserModel.findOne({ username });
  if (existingUser) {
    return res.json({ success: false, message: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const lastUser = await UserModel.findOne().sort({ id: -1 });
  const newId = lastUser ? lastUser.id + 1 : 1;
  const newUser = new UserModel({ id: newId, username, password: hashedPassword, email });
    await newUser.save();

  res.json({ success: true, userId: newUser.id });
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  const user = await UserModel.findOne({ username });
  if (user && await bcrypt.compare(password, user.password)) {
    console.log('check',user.username)
    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1day' });
    res.json({ success: true, token, userId: user.id ,userName: user.username});
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
};

export const authenticateToken = (req, res, next) => {
    console.log('it is time to authenticate token')
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied' });
  
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid Token' });
      req.user = user;
      next();
    });
  };
  
export const getUser = async (req, res) => {
  console.log('it is time to auth finished')
    res.json({ success: true, username: req.user.username });
  };
