import Redis from "ioredis"
import dotenv from 'dotenv'

dotenv.config()

export const emailVerificationClient = new Redis(process.env.EMAIL_REDIS_URL!);