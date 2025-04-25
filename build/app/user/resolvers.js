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
exports.resolvers = exports.queries = void 0;
const db_1 = require("../../clients/db");
const JWTService_1 = __importDefault(require("../../services/JWTService"));
const cloudinary_1 = require("cloudinary");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.queries = {
    getUserProfile: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { userId }, ctx) {
        var _b;
        try {
            const currentUserId = (_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id;
            if (userId == "cm8r434ge0000cs2a87bpbfdc" && currentUserId != "cm8r434ge0000cs2a87bpbfdc") {
                return null;
            }
            const user = yield db_1.prismaClient.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    fullName: true,
                    profileImageURL: true,
                    bio: true,
                    _count: {
                        select: {
                            tracks: true,
                        },
                    },
                    followers: currentUserId
                        ? {
                            where: {
                                followerId: currentUserId,
                            },
                            select: { id: true }, // Only retrieve necessary fields
                        }
                        : undefined, // Skip this query if currentUserId is not defined
                },
            });
            if (!user) {
                return null; // Return null if user does not exist
            }
            const totalTracks = user._count.tracks;
            const followedByMe = currentUserId ? user.followers.length > 0 : false;
            return {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                profileImageURL: user.profileImageURL || "", // Default to an empty string
                bio: user.bio,
                totalTracks,
                followedByMe,
            };
        }
        catch (error) {
            console.error("Error fetching user profile:", error);
            throw new Error(error.message || "An error occurred while fetching the user profile.");
        }
    }),
    getUserTracks: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { payload }, ctx) {
        var _b;
        try {
            const { userId, page = 1 } = payload; // Ensure page defaults to 1 if undefined
            const tracks = yield db_1.prismaClient.track.findMany({
                where: { authorId: userId },
                orderBy: { createdAt: "desc" }, // Sort by latest first
                select: {
                    id: true,
                    title: true,
                    singer: true,
                    starCast: true,
                    duration: true,
                    coverImageUrl: true,
                    videoUrl: true,
                    audioFileUrl: true,
                    authorId: true,
                    createdAt: true,
                    likes: ((_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id)
                        ? { where: { userId: ctx.user.id }, select: { userId: true } }
                        : undefined, // Skip if not logged in
                },
                skip: (Math.max(page, 1) - 1) * 5, // Ensure pagination is safe
                take: 5, // Limit to 5 results per page
            });
            return tracks.map((track) => {
                var _a;
                return (Object.assign(Object.assign({}, track), { hasLiked: ((_a = ctx.user) === null || _a === void 0 ? void 0 : _a.id) ? track.likes.length > 0 : false, createdAt: track.createdAt.toISOString() // 👈 Convert Date to String
                 }));
            });
        }
        catch (error) {
            console.error("Error fetching user tracks:", error);
            throw new Error(error.message || "Failed to fetch user tracks. Please try again.");
        }
    }),
    getSearchUser: (_parent_1, _a, _ctx_1) => __awaiter(void 0, [_parent_1, _a, _ctx_1], void 0, function* (_parent, { input }, _ctx) {
        var _b;
        const userId = (_b = _ctx === null || _ctx === void 0 ? void 0 : _ctx.user) === null || _b === void 0 ? void 0 : _b.id; // Get the current user's ID
        const { page, query } = input;
        const users = yield db_1.prismaClient.user.findMany({
            where: {
                username: {
                    contains: query,
                    mode: 'insensitive' // Makes the search case-insensitive
                }
            },
            select: {
                id: true,
                username: true,
                profileImageURL: true
            },
            skip: (Math.max(page, 1) - 1) * 15, // Ensure pagination is safe
            take: 15, // Limit to 5 results per page
        });
        return users.map(user => ({
            id: user.id,
            username: user.username,
            profileImageURL: user.profileImageURL
        }));
    }),
};
const mutations = {
    changeMusicPreference: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { language }, ctx) {
        var _b;
        const userId = (_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            throw new Error("Please Login/Signup first");
        }
        const user = yield db_1.prismaClient.user.update({
            where: { id: userId },
            data: {
                language
            }
        });
        const userToken = JWTService_1.default.generateTokenForUser({ id: user.id, username: user.username, language });
        return userToken;
    }),
    followUser: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { userId }, ctx) {
        var _b;
        // Ensure the user is authenticated
        try {
            if (!ctx.user)
                throw new Error("Please Login/Signup first");
            // Attempt to delete the like (unlike the post)
            yield db_1.prismaClient.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId: ctx.user.id,
                        followingId: userId
                    }
                }
            });
            // If successful, return a response indicating the post was unliked
            return false; // unfollowed
        }
        catch (error) {
            // If the like doesn't exist, handle the error and create the like (like the post)
            if (error.code === 'P2025') { // This error code indicates that the record was not found
                // Create a like entry (Prisma will automatically link the user and post)
                yield db_1.prismaClient.follow.create({
                    data: {
                        followerId: ((_b = ctx === null || ctx === void 0 ? void 0 : ctx.user) === null || _b === void 0 ? void 0 : _b.id) || "",
                        followingId: userId
                    }
                });
                return true; // followed
            }
            // Handle any other errors
            console.error("Error toggling like:", error);
            throw new Error(error.message || "An error occurred while toggling the like on the post.");
        }
    }),
    updateUserProfile: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { payload }, ctx) {
        var _b;
        try {
            const userId = (_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id;
            if (!userId)
                throw new Error('Unauthorized: User not authenticated');
            const { imgUrl, username, fullName, oldPassword, newPassword, bio } = payload;
            // 1. Fetch user with proper error handling
            const user = yield db_1.prismaClient.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    password: true,
                    profileImageURL: true,
                    username: true,
                    fullName: true,
                    bio: true
                }
            });
            if (!user)
                throw new Error('User not found');
            // 2. Handle image upload (only if new image provided)
            let uploadImageResult = user.profileImageURL;
            if (imgUrl && imgUrl !== user.profileImageURL) {
                const res = yield cloudinary_1.v2.uploader.upload(imgUrl, {
                    resource_type: 'auto',
                });
                uploadImageResult = res.secure_url;
            }
            // 3. Password change logic
            let passwordToUpdate = user.password;
            if (oldPassword && newPassword) {
                const isMatch = yield bcryptjs_1.default.compare(oldPassword, user.password);
                if (!isMatch)
                    throw new Error('Current password is incorrect');
                if (oldPassword === newPassword) {
                    throw new Error('New password must be different from current password');
                }
                passwordToUpdate = yield bcryptjs_1.default.hash(newPassword, 12); // Increased salt rounds
            }
            // 4. Update user data
            const updatedUser = yield db_1.prismaClient.user.update({
                where: { id: userId },
                data: {
                    profileImageURL: uploadImageResult,
                    username: username || user.username,
                    fullName: fullName || user.fullName,
                    password: passwordToUpdate,
                    bio: bio || user.bio,
                    updatedAt: new Date() // Always update timestamp
                },
                select: { id: true } // Only return what's needed
            });
            return !!updatedUser; // Return boolean success indicator
        }
        catch (error) {
            // Handle any other errors
            console.error("Error toggling like:", error);
            throw new Error(error.message || "An error occurred while toggling the like on the post.");
        }
    })
};
exports.resolvers = { queries: exports.queries, mutations };
