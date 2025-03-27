import { Request, Response } from "express"

export interface JWTUser {
    id: string
    username: string
    language: string
}

export interface GraphqlContext {
    user?: JWTUser 
    req: Request
    res: Response
}

export interface SignupUserInput {
    email: string;
    username: string;
}

export interface VerifyEmailInput {
    email: string;
    username: string;
    fullName: string;
    password: string;
    token: string;
}

export interface LoginUserInput {
    usernameOrEmail: string; // Changed to lowercase 'string' for TypeScript compatibility
    password: string;
}

export interface ResetPasswordInput {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

export interface CreateTrackPayload {
    title: string;  
    singer?: string; 
    starCast?: string; 
    duration: string
             
    coverImageUrl?: string; 
    videoUrl?: string
    audioFileUrl: string; 

    language?: string;
    genre: string[];
}