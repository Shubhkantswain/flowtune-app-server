"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class JWTService {
    static generateTokenForUser(payload) {
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET);
        return token;
    }
    static decodeToken(token) {
        return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
}
exports.default = JWTService;
