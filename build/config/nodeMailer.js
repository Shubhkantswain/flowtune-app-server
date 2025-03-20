"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Create a transporter using Ethereal email service
const config = {
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_SENDEREMAIL, // Use environment variables
        pass: process.env.NODEMAILER_PASSWORD
    }
};
exports.transporter = nodemailer_1.default.createTransport(config);
