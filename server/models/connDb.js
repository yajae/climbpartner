import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });


const conn = mongoose.createConnection(process.env.Mognodb_URL);
console.log('process',process.env.Mognodb_URL)
conn.on("connected" , ()=>{
  console.log("MongoDB is connected.");
});



export default conn;
