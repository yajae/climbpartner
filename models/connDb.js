import mongoose from 'mongoose';


const conn = mongoose.createConnection("mongodb://0.0.0.0:27017/");

conn.on("connected" , ()=>{
  console.log("MongoDB is connected.");
});



export default conn;
