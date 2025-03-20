"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const db_1 = require("../../clients/db");
const redis_1 = require("../../clients/redis");
const JWTService_1 = __importDefault(require("../../services/JWTService"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const NodeMailerService_1 = __importDefault(require("../../services/NodeMailerService"));
const queries = {
    getCurrentUser: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const id = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!id)
                return null;
            const user = yield db_1.prismaClient.user.findUnique({ where: { id } });
            return user;
        }
        catch (error) {
            return null;
        }
    }),
};
const mutations = {
    sendReq: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { text }, ctx) {
        try {
            return text;
        }
        catch (error) {
            throw new Error(error.message || 'An unexpected error occurred.');
        }
    }),
    signupUser: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { input }, ctx) {
        const { email, username } = input;
        try {
            // Check for existing user by email or username
            const existingUser = yield db_1.prismaClient.user.findFirst({
                where: {
                    OR: [{ email }, { username }],
                },
            });
            if (existingUser) {
                const message = existingUser.username === username
                    ? 'The username is already in use.'
                    : 'The email is already in use.';
                throw new Error(message);
            }
            // Generate and send email verification code if not already generated
            const token = yield redis_1.emailVerificationClient.get(email);
            if (!token) {
                const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                yield redis_1.emailVerificationClient.set(email, verificationCode, 'EX', 3600); // 1-hour expiry
                yield NodeMailerService_1.default.sendVerificationEmail(email, `${verificationCode} (Valid for 1 hour)`);
            }
            return true;
        }
        catch (error) {
            console.error('Error in signupUser:', error);
            throw new Error(error.message || 'An unexpected error occurred.');
        }
    }),
    verifyEmail: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { input }, ctx) {
        const { email, username, fullName, password, token } = input;
        try {
            const existingUser = yield db_1.prismaClient.user.findUnique({
                where: { email }
            });
            if (existingUser) {
                throw new Error('This email is already verified.');
            }
            const cachedToken = yield redis_1.emailVerificationClient.get(email);
            console.log("cachedToken", cachedToken);
            if (!cachedToken) {
                throw new Error('Verification Token has been expired.');
            }
            else {
                if (cachedToken !== token) {
                    throw new Error('sorry, verification token does not match');
                }
            }
            const saltRounds = 10;
            const hashedPassword = yield bcryptjs_1.default.hash(password, saltRounds);
            const user = yield db_1.prismaClient.user.create({
                data: {
                    email,
                    username,
                    fullName,
                    password: hashedPassword
                }
            });
            yield redis_1.emailVerificationClient.del(email);
            const userToken = JWTService_1.default.generateTokenForUser({ id: user.id, username: user.username });
            NodeMailerService_1.default.sendWelcomeEmail(email, (user === null || user === void 0 ? void 0 : user.username) || "");
            return Object.assign(Object.assign({}, user), { authToken: userToken });
        }
        catch (error) {
            console.error('Error in verifyEmail:', error);
            throw new Error(error.message || 'An unexpected error occurred.');
        }
    }),
    loginUser: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { input }, ctx) {
        const { usernameOrEmail, password } = input;
        try {
            const existingUser = yield db_1.prismaClient.user.findFirst({
                where: {
                    OR: [
                        { username: usernameOrEmail },
                        { email: usernameOrEmail },
                    ],
                },
            });
            if (!existingUser) {
                throw new Error('Sorry, user does not exist!');
            }
            const isPasswordCorrect = yield bcryptjs_1.default.compare(password, existingUser.password);
            if (!isPasswordCorrect) {
                throw new Error('Incorrect password!');
            }
            const userToken = JWTService_1.default.generateTokenForUser({ id: existingUser.id, username: existingUser.username });
            return Object.assign(Object.assign({}, existingUser), { authToken: userToken });
        }
        catch (error) {
            console.error('Error in loginUser:', error);
            throw new Error(error.message || 'An unexpected error occurred.');
        }
    }),
    forgotPassword: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { usernameOrEmail }, ctx) {
        try {
            // Check if the user exists by email or username
            const user = yield db_1.prismaClient.user.findFirst({
                where: {
                    OR: [
                        { email: usernameOrEmail },
                        { username: usernameOrEmail }
                    ]
                }
            });
            if (!user) {
                throw new Error("User not found.");
            }
            if (!user.resetPasswordToken || !user.resetPasswordTokenExpiresAt || Date.now() > new Date(user.resetPasswordTokenExpiresAt).getTime()) {
                // Generate reset token
                const resetToken = crypto_1.default.randomBytes(20).toString("hex");
                const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
                // Save the updated user
                yield db_1.prismaClient.user.update({
                    where: { id: user.id }, // Use the user's ID for the update
                    data: { resetPasswordToken: resetToken, resetPasswordTokenExpiresAt: resetTokenExpiresAt },
                });
                // Send reset email
                yield NodeMailerService_1.default.sendPasswordResetEmail(user.email, `http://localhost:3000/reset-password/${resetToken}`);
            }
            // Send response
            return true;
        }
        catch (error) {
            console.error("Error in forgotPassword: ", error);
            throw new Error(error.message);
        }
    }),
    resetPassword: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { input }, ctx) {
        try {
            const { token, newPassword, confirmPassword } = input;
            if (newPassword !== confirmPassword) {
                throw new Error("Passwords do not match");
            }
            const user = yield db_1.prismaClient.user.findUnique({
                where: {
                    resetPasswordToken: token,
                },
            });
            if (!user || !user.resetPasswordTokenExpiresAt || user.resetPasswordTokenExpiresAt <= new Date()) {
                throw new Error("Invalid or expired reset token");
            }
            const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
            yield db_1.prismaClient.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    resetPasswordToken: null,
                    resetPasswordTokenExpiresAt: null,
                },
            });
            NodeMailerService_1.default.sendResetSuccessEmail((user === null || user === void 0 ? void 0 : user.email) || "");
            return true;
        }
        catch (error) {
            throw new Error(error.message);
        }
    }),
};
exports.resolvers = { queries, mutations };
