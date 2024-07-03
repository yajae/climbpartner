import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const conn = mongoose.createConnection(process.env.Mognodb_URL);

conn.on("connected" , ()=>{
  console.log("MongoDB is connected.");
});



export default conn;
