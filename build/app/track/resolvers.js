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
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const queries = {
    getFeedTracks: (_parent, _args, _ctx) => __awaiter(void 0, void 0, void 0, function* () {
        if (!_ctx.user) {
            throw new Error("User not authenticated");
        }
        const userId = _ctx.user.id; // Get the current user's ID
        // Fetch 8 random tracks in a single query
        const tracks = yield db_1.prismaClient.track.findMany({
            take: 24, // Limit to 8 tracks
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
                likes: {
                    where: { userId }, // Filter only the user's likes
                    select: { userId: true }, // Fetch only the necessary field
                }
            }
        });
        // Shuffle the tracks array to ensure randomness
        const shuffledTracks = tracks.sort(() => Math.random() - 0.5);
        return shuffledTracks.map(track => (Object.assign(Object.assign({}, track), { hasLiked: track.likes.length > 0 })));
    }),
    getExploreTracks: (_parent_1, _a, _ctx_1) => __awaiter(void 0, [_parent_1, _a, _ctx_1], void 0, function* (_parent, { page }, _ctx) {
        if (!_ctx.user) {
            throw new Error("User not authenticated");
        }
        const userId = _ctx.user.id; // Get the current user's ID
        const tracks = yield db_1.prismaClient.track.findMany({
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
                likes: {
                    where: { userId }, // Filter only the user's likes
                    select: { userId: true }, // Fetch only the necessary field
                }
            },
            skip: (Math.max(page, 1) - 1) * 24, // Ensure pagination is safe
            take: 24, // Limit to 5 results per page
        });
        return tracks.map(track => (Object.assign(Object.assign({}, track), { hasLiked: track.likes.length > 0 })));
    }),
    getLikedTracks: (_parent, _args, _ctx) => __awaiter(void 0, void 0, void 0, function* () {
        if (!_ctx.user) {
            throw new Error("User not authenticated");
        }
        const userId = _ctx.user.id; // Get the current user's ID
        try {
            const likedTracks = yield db_1.prismaClient.like.findMany({
                where: {
                    userId
                },
                select: {
                    track: {
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
                        }
                    }
                }
            });
            return likedTracks.map(like => ({
                id: like.track.id,
                title: like.track.title,
                singer: like.track.singer,
                starCast: like.track.starCast,
                duration: like.track.duration,
                coverImageUrl: like.track.coverImageUrl,
                videoUrl: like.track.videoUrl,
                audioFileUrl: like.track.audioFileUrl,
                authorId: like.track.authorId,
            }));
        }
        catch (error) {
            console.error("Error fetching liked tracks:", error);
            throw new Error("Failed to fetch liked tracks");
        }
    })
};
const mutations = {
    createTrack: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { payload }, ctx) {
        try {
            // Ensure the user is authenticated
            if (!ctx.user)
                throw new Error("Please Login/Signup first!");
            const { title, singer, starCast, duration, coverImageUrl, videoUrl, audioFileUrl, language, genre, } = payload;
            // Upload audio URL to Cloudinary
            const uploadAudioResult = yield cloudinary_1.v2.uploader.upload(audioFileUrl, {
                resource_type: "auto",
            });
            // Upload cover image URL to Cloudinary (if provided)
            let uploadImageResult = null;
            if (coverImageUrl) {
                uploadImageResult = yield cloudinary_1.v2.uploader.upload(coverImageUrl, {
                    resource_type: "auto",
                });
            }
            let uploadVideoResult = null;
            if (videoUrl) {
                uploadVideoResult = yield cloudinary_1.v2.uploader.upload(videoUrl, {
                    resource_type: "auto",
                });
            }
            // Create track in the database
            const track = yield db_1.prismaClient.track.create({
                data: {
                    title,
                    singer,
                    starCast,
                    duration,
                    coverImageUrl: uploadImageResult === null || uploadImageResult === void 0 ? void 0 : uploadImageResult.secure_url,
                    videoUrl: uploadVideoResult === null || uploadVideoResult === void 0 ? void 0 : uploadVideoResult.secure_url,
                    audioFileUrl: uploadAudioResult.secure_url,
                    language,
                    genre,
                    authorId: ctx.user.id,
                },
            });
            return true;
        }
        catch (error) {
            // Handle errors gracefully
            console.error("Error creating track:", error);
            throw new Error(error.message || "An error occurred while creating the track.");
        }
    }),
    deleteTrack: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { trackId }, ctx) {
        try {
            // Ensure the user is authenticated
            if (!ctx.user)
                throw new Error("Please Login/Signup first!");
            const track = yield db_1.prismaClient.track.findUnique({ where: { id: trackId } });
            if (!track) {
                throw new Error("Post Doest exist!");
            }
            if (track.authorId.toString() != ctx.user.id.toString()) {
                throw new Error("You cant delete someone else post!");
            }
            yield db_1.prismaClient.track.delete({ where: { id: trackId } });
            return true;
        }
        catch (error) {
            // Handle errors gracefully (Cloudinary or Prisma issues)
            console.error("Error toggling like:", error);
            throw new Error(error.message || "An error occurred while toggling the like on the post.");
        }
    }),
    likeTrack: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { trackId }, ctx) {
        var _b;
        try {
            if (!ctx.user)
                throw new Error("Please Login/Signup first");
            // Attempt to delete the like (unlike the track)
            yield db_1.prismaClient.like.delete({
                where: {
                    userId_trackId: {
                        userId: ctx.user.id,
                        trackId,
                    },
                },
            });
            // If successful, return false (indicating the track is now unliked)
            return false;
        }
        catch (error) {
            if (error.code === 'P2025') {
                // Create a like if not found (toggle to liked)
                yield db_1.prismaClient.like.create({
                    data: {
                        userId: ((_b = ctx === null || ctx === void 0 ? void 0 : ctx.user) === null || _b === void 0 ? void 0 : _b.id) || "",
                        trackId,
                    },
                });
                return true; // Indicate the track is now liked
            }
            throw new Error(error.message || "something went wrong");
        }
    }),
};
exports.resolvers = { queries, mutations };
