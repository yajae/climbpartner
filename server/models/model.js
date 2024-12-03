
import mongoose from 'mongoose';
import conn from './connDb.js';
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Types;

const userSchema = new mongoose.Schema({
    id: Number,
    username: String,
    password: String
});

const UserModel = conn.model('User', userSchema);

const markerSchema = new mongoose.Schema({
    lng: Number,
    lat: Number,
    day: Number,
    time: String,
    placeName: String
});

const pathSchema = new Schema({
    routeId: Number,
    routeName: String,
    startTime: String,
    endTime: String,
    markers: {
        day1: [markerSchema],
        day2: [markerSchema],
        day3: [markerSchema],
        day4: [markerSchema],
        day5: [markerSchema]
    },
    permissions: {
        type: { type: String, enum: ['private', 'friends', 'public'], required: true, default: 'private' },
        friends: [{ type: ObjectId, ref: 'User' }]
    },
    notes: String
});

const userPathSchema = new mongoose.Schema({
    userId: Number,
    paths: [pathSchema]
});

const UserPathModel = conn.model('UserPath', userPathSchema);

const chatMessageSchema = new mongoose.Schema({
    room: { type: String, required: true },
    messages: [{
        user: { type: String, required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, required: true }
    }]
});

const ChatMessage = conn.model('ChatMessage', chatMessageSchema);

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, // 确保 title 为必填字段
        unique: true, // 确保 title 唯一
        trim: true // 去除前后空格
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        required: true, 
        trim: true 
    },
    published_date: {
        type: Date,
        default: Date.now 
    },
    tags: {
        type: [String],
        default: [] 
    }
});

// 创建模型
const Article = mongoose.model('Article', articleSchema);

export { UserModel, UserPathModel, ChatMessage, Article };
