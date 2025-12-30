import mongoose from "mongoose";

import { env } from './env';

export const connectDB = async (): Promise<void> => {
    try{
        await mongoose.connect(env.mongoUri);
        console.log('DB Connected successfully');
    }catch(error){
        console.error("❌ MongoDB connection failed", error);
        process.exit(1); // Stop server if DB fails
    }
};



// “If DB is down, I stop the server instead of running half-broken APIs.”