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
exports.resolvers = exports.genreIds = void 0;
const db_1 = require("../../clients/db");
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.genreIds = {
    "Xpw1ALAB": "Love & Romantic",
    "K9zYb2CD": "Workout",
    "Mnp3QWE4": "Birthday Party",
    "Rst5UIO7": "Chill",
    "Bcd6EFG8": "Travel",
    "Hjk9LMN0": "Happy",
    "Vwx1PQR2": "Sleep",
    "Zas3STU4": "Sad",
    "Yhn5VWX6": "Bath",
    "Tgb7YZA9": "Bollywood",
    "Qwe2RTY1": "Hollywood",
    "Lop8KIU3": "Indian Pop",
    "Juy4HGT5": "Punjabi Pop",
    "Fds6NMB7": "Dance and Electronic",
    "Wer9PLO1": "Rock",
    "Xcv0ZQW2": "Children Music"
};
const queries = {
    getFeedTracks: (_parent, _args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            const userId = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.id;
            // Fetch tracks authored by users the current user follows, directly in one query
            const tracks = yield db_1.prismaClient.track.findMany({
                where: {
                    author: {
                        followers: {
                            some: { followerId: userId }, // Ensure the author is followed by the user
                        },
                    },
                },
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
                    likes: userId ?
                        {
                            where: { userId }, // Check if the specific user has liked the post
                            select: { userId: true },
                        } : undefined
                },
                take: 5, // Optional: Limit to 5 tracks
                orderBy: { createdAt: 'desc' }, // Optional: Order by newest
            });
            return tracks.map(track => (Object.assign(Object.assign({}, track), { hasLiked: userId ? track.likes.length > 0 : false })));
        }
        catch (error) {
            console.error("Error fetching feed tracks:", error);
            throw new Error("Failed to fetch feed tracks.");
        }
    }),
    getExploreTracks: (_parent_1, _a, ctx_1) => __awaiter(void 0, [_parent_1, _a, ctx_1], void 0, function* (_parent, { page }, ctx) {
        var _b, _c;
        const userId = (_b = ctx === null || ctx === void 0 ? void 0 : ctx.user) === null || _b === void 0 ? void 0 : _b.id; // Get the current user's ID
        const language = ((_c = ctx === null || ctx === void 0 ? void 0 : ctx.user) === null || _c === void 0 ? void 0 : _c.language) || "Hindi";
        const tracks = yield db_1.prismaClient.track.findMany({
            where: {
                language
            },
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
                likes: userId ?
                    {
                        where: { userId }, // Check if the specific user has liked the post
                        select: { userId: true },
                    } : undefined
            },
            skip: (Math.max(page, 1) - 1) * 24, // Ensure pagination is safe
            take: page == 1 ? 24 : 18, // Limit to 5 results per page
        });
        // Shuffle the tracks array to ensure randomness
        const shuffledTracks = tracks.sort(() => Math.random() - 0.5);
        return shuffledTracks.map(track => (Object.assign(Object.assign({}, track), { hasLiked: userId ? track.likes.length > 0 : false })));
    }),
    getSearchTracks: (_parent_1, _a, _ctx_1) => __awaiter(void 0, [_parent_1, _a, _ctx_1], void 0, function* (_parent, { input }, _ctx) {
        var _b;
        const userId = (_b = _ctx === null || _ctx === void 0 ? void 0 : _ctx.user) === null || _b === void 0 ? void 0 : _b.id; // Get the current user's ID
        const { page, query } = input;
        const tracks = yield db_1.prismaClient.track.findMany({
            where: {
                title: {
                    contains: query,
                    mode: 'insensitive' // Makes the search case-insensitive
                }
            },
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
                likes: userId ?
                    {
                        where: { userId }, // Check if the specific user has liked the post
                        select: { userId: true },
                    } : undefined
            },
            skip: (Math.max(page, 1) - 1) * 4, // Ensure pagination is safe
            take: 4, // Limit to 5 results per page
        });
        return tracks.map(track => (Object.assign(Object.assign({}, track), { hasLiked: userId ? track.likes.length > 0 : false })));
    }),
    getRecentTracks: (_parent_1, _a, _ctx_1) => __awaiter(void 0, [_parent_1, _a, _ctx_1], void 0, function* (_parent, { recentTracks }, _ctx) {
        if (!_ctx.user) {
            return [];
        }
        const userId = _ctx.user.id; // Get the current user's ID
        try {
            const tracks = yield db_1.prismaClient.track.findMany({
                where: {
                    id: {
                        in: recentTracks, // Check if the track ID exists in recentTracks
                    }
                },
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
                    likes: userId ?
                        {
                            where: { userId }, // Check if the specific user has liked the post
                            select: { userId: true },
                        } : undefined
                },
            });
            return tracks.map(track => (Object.assign(Object.assign({}, track), { hasLiked: userId ? track.likes.length > 0 : false })));
        }
        catch (error) {
            console.error("Error fetching liked tracks:", error);
            throw new Error("Failed to fetch liked tracks");
        }
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
                hasLiked: true,
                authorId: like.track.authorId,
            }));
        }
        catch (error) {
            console.error("Error fetching liked tracks:", error);
            throw new Error("Failed to fetch liked tracks");
        }
    }),
    // First define valid genre types
    getTracksByGenreId: (_parent_1, _a, ctx_1) => __awaiter(void 0, [_parent_1, _a, ctx_1], void 0, function* (_parent, { genreId }, ctx) {
        var _b;
        const userId = (_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id;
        try {
            // Find tracks where the genre array contains the provided tag
            const matchingTracks = yield db_1.prismaClient.track.findMany({
                where: {
                    genre: {
                        has: exports.genreIds[genreId] // Checks if the genre array contains the tag
                    }
                },
                take: 24, // Limit to 5 results
                orderBy: {
                    createdAt: 'desc' // Get newest tracks first
                },
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
                    likes: userId ?
                        {
                            where: { userId }, // Check if the specific user has liked the post
                            select: { userId: true },
                        } : undefined
                }
            });
            return matchingTracks.map(track => (Object.assign(Object.assign({}, track), { hasLiked: userId ? track.likes.length > 0 : false })));
        }
        catch (error) {
            console.error('Error fetching tracks by genre:', error);
            throw new Error('Could not fetch tracks');
        }
    })
};
const mutations = {
    createTrack: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { payload }, ctx) {
        try {
            // Ensure the user is authenticated
            if (!ctx.user)
                throw new Error("Please Login/Signup first!");
            const { title, singer, starCast, duration, coverImageUrl, videoUrl, audioFileUrl, language, genre } = payload;
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
