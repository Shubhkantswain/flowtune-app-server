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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = exports.Visibility = void 0;
const db_1 = require("../../clients/db");
const cloudinary_1 = require("cloudinary");
var Visibility;
(function (Visibility) {
    Visibility["PUBLIC"] = "PUBLIC";
    Visibility["PRIVATE"] = "PRIVATE";
})(Visibility || (exports.Visibility = Visibility = {}));
const queries = {
    getCurrentUserPlaylists: (parent_1, _a, context_1) => __awaiter(void 0, [parent_1, _a, context_1], void 0, function* (parent, { input }, context) {
        var _b;
        const userId = (_b = context.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            return { playlists: null };
        }
        const { page, limit } = input;
        try {
            const playlists = yield db_1.prismaClient.playlist.findMany({
                where: { authorId: userId },
                select: {
                    id: true,
                    name: true,
                    coverImageUrl: true,
                    Visibility: true,
                    tracks: true,
                    authorId: true,
                },
                skip: (Math.max(page, 1) - 1) * limit, // Ensure pagination is safe
                take: limit, // Limit to 5 results per page
            });
            return playlists.map((playlist) => ({
                id: playlist.id,
                name: playlist.name.split("-")[0].trim(),
                coverImageUrl: playlist.coverImageUrl,
                Visibility: playlist.Visibility,
                totalTracks: playlist.tracks[0] != "" ? playlist.tracks.length : 0,
                authorId: playlist.authorId
            }));
        }
        catch (error) {
            console.error("Error fetching playlists:", error);
            throw new Error("Failed to fetch user playlists.");
        }
    }),
    getExplorePlaylists: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { page }, ctx) {
        var _b;
        const language = ((_b = ctx.user) === null || _b === void 0 ? void 0 : _b.language) || "Hindi";
        try {
            const playlists = yield db_1.prismaClient.playlist.findMany({
                where: {
                    name: {
                        contains: language,
                    }
                },
                select: {
                    id: true,
                    name: true,
                    coverImageUrl: true,
                    Visibility: true,
                    tracks: true,
                    authorId: true,
                },
                skip: (Math.max(page, 1) - 1) * 24, // Ensure pagination is safe
                take: page == 1 ? 24 : 16, // Limit to 5 results per page
            });
            return playlists.map((playlist) => ({
                id: playlist.id,
                name: playlist.name.split('-')[0].trim(),
                coverImageUrl: playlist.coverImageUrl,
                Visibility: playlist.Visibility,
                totalTracks: playlist.tracks[0] !== "" ? playlist.tracks.length : 0,
                authorId: playlist.authorId
            }));
        }
        catch (error) {
            console.error("Error fetching playlists:", error);
            throw new Error("Failed to fetch user playlists.");
        }
    }),
    getPlaylistTracks: (parent_1, _a, context_1) => __awaiter(void 0, [parent_1, _a, context_1], void 0, function* (parent, { playlistId }, context) {
        var _b;
        const userId = (_b = context.user) === null || _b === void 0 ? void 0 : _b.id;
        try {
            const playlist = yield db_1.prismaClient.playlist.findUnique({
                where: { id: playlistId }
            });
            if (!playlist) {
                throw new Error("Sorry, Playlist Not Found");
            }
            const trackIds = (playlist === null || playlist === void 0 ? void 0 : playlist.tracks) || [];
            const tracks = yield db_1.prismaClient.track.findMany({
                where: {
                    id: {
                        in: trackIds
                    }
                },
                include: {
                    likes: userId ?
                        {
                            where: { userId }, // Check if the specific user has liked the post
                            select: { userId: true },
                        } : undefined
                }
            });
            const trackItems = tracks.map((track) => {
                return {
                    id: track.id,
                    title: track.title,
                    singer: track.singer,
                    starCast: track.starCast,
                    duration: track.duration,
                    coverImageUrl: track.coverImageUrl,
                    videoUrl: track.videoUrl,
                    audioFileUrl: track.audioFileUrl,
                    hasLiked: userId ? track.likes.length > 0 : false,
                    authorId: track.authorId,
                    createdAt: track.createdAt.toISOString() // 👈 Convert Date to String
                };
            });
            return {
                id: playlist.id,
                title: playlist.name.split("-")[0].trim(),
                coverImageUrl: playlist.coverImageUrl,
                tracks: trackItems
            };
        }
        catch (error) {
            console.error("Error fetching playlist tracks:", error);
            throw new Error("Failed to fetch playlist tracks.");
        }
    }),
    getSearchPlaylists: (_parent_1, _a, _ctx_1) => __awaiter(void 0, [_parent_1, _a, _ctx_1], void 0, function* (_parent, { input }, _ctx) {
        var _b;
        const userId = (_b = _ctx === null || _ctx === void 0 ? void 0 : _ctx.user) === null || _b === void 0 ? void 0 : _b.id; // Get the current user's ID
        const { page, query } = input;
        const playlists = yield db_1.prismaClient.playlist.findMany({
            where: {
                name: {
                    contains: query,
                    mode: 'insensitive' // Makes the search case-insensitive
                }
            },
            // type Playlist {
            //     id: ID!
            //     name: String!
            //     coverImageUrl: String!
            //     Visibility: Visibility!
            //     totalTracks: Int!
            //     authorId: String!
            //   }
            select: {
                id: true,
                name: true,
                coverImageUrl: true,
                Visibility: true,
                tracks: true,
                authorId: true,
            },
            skip: (Math.max(page, 1) - 1) * 15, // Ensure pagination is safe
            take: 15, // Limit to 5 results per page
        });
        return playlists.map(playlist => (Object.assign(Object.assign({}, playlist), { name: playlist.name.split("-")[0].trim(), totalTracks: playlist.tracks.length })));
    }),
};
const mutations = {
    createPlaylist: (parent_1, _a, context_1) => __awaiter(void 0, [parent_1, _a, context_1], void 0, function* (parent, { payload }, context) {
        var _b;
        const userId = (_b = context.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            throw new Error("Authentication required.");
        }
        try {
            const { name, coverImageUrl, visibility, trackIds } = payload;
            const uploadResult = yield cloudinary_1.v2.uploader.upload(coverImageUrl, {
                resource_type: "auto",
            });
            const playlist = yield db_1.prismaClient.playlist.create({
                data: {
                    name,
                    coverImageUrl: uploadResult.secure_url,
                    Visibility: visibility,
                    tracks: trackIds,
                    authorId: userId,
                },
            });
            return {
                id: playlist.id,
                name: playlist.name,
                coverImageUrl: playlist.coverImageUrl,
                Visibility: visibility,
                totalTracks: playlist.tracks.length,
                authorId: playlist.authorId
            };
        }
        catch (error) {
            console.error("Error creating playlist:", error);
            throw new Error("Failed to create playlist.");
        }
    }),
    addSongToPlaylist: (parent_1, _a, context_1) => __awaiter(void 0, [parent_1, _a, context_1], void 0, function* (parent, { payload }, context) {
        var _b;
        const userId = (_b = context.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            throw new Error("Authentication required.");
        }
        try {
            const { isNewPlaylist, name, existingPlaylistId, coverImageUrl, visibility, trackIds } = payload;
            if (isNewPlaylist) {
                let uploadResult;
                if (coverImageUrl) {
                    uploadResult = yield cloudinary_1.v2.uploader.upload(coverImageUrl, {
                        resource_type: "auto",
                    });
                }
                const playlist = yield db_1.prismaClient.playlist.create({
                    data: {
                        name: name || "Untitled Playlist",
                        coverImageUrl: (uploadResult === null || uploadResult === void 0 ? void 0 : uploadResult.secure_url) || "",
                        Visibility: visibility,
                        tracks: trackIds,
                        authorId: userId,
                    },
                });
                return {
                    id: playlist.id,
                    name: playlist.name,
                    coverImageUrl: playlist.coverImageUrl,
                    Visibility: visibility,
                    totalTracks: playlist.tracks.length,
                    authorId: playlist.authorId
                };
            }
            else if (existingPlaylistId) {
                // First get the existing playlist
                const existingPlaylist = yield db_1.prismaClient.playlist.findUnique({
                    where: { id: existingPlaylistId },
                    select: { tracks: true }
                });
                if (!existingPlaylist) {
                    throw new Error("Playlist not found.");
                }
                // Check if track is already in the playlist
                if (existingPlaylist.tracks.includes(trackIds[0])) {
                    throw new Error("Track already exists in the playlist.");
                }
                // Update the playlist if track is not present
                yield db_1.prismaClient.playlist.update({
                    where: { id: existingPlaylistId },
                    data: {
                        tracks: { push: trackIds[0] },
                    },
                });
                return null;
            }
            else {
                throw new Error("Playlist ID is required for updating.");
            }
        }
        catch (error) {
            console.error("Error adding song to playlist:", error);
            throw new Error(error);
        }
    }),
    deletePlaylist: (parent_1, _a, context_1) => __awaiter(void 0, [parent_1, _a, context_1], void 0, function* (parent, { playlistId }, context) {
        var _b;
        const userId = (_b = context.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            throw new Error("Authentication required.");
        }
        try {
            yield db_1.prismaClient.playlist.delete({
                where: { id: playlistId }
            });
            return true;
        }
        catch (error) {
            console.error("Error creating playlist:", error);
            throw new Error("Failed to create playlist.");
        }
    }),
    removeSongFromPlaylist: (parent_1, _a, context_1) => __awaiter(void 0, [parent_1, _a, context_1], void 0, function* (parent, { payload }, context) {
        const { playlistId, trackId } = payload;
        try {
            // Check if the playlist exists
            const playlist = yield db_1.prismaClient.playlist.findUnique({
                where: { id: playlistId },
                select: { tracks: true },
            });
            if (!playlist) {
                throw new Error("Playlist not found.");
            }
            // Check if the track exists in the playlist
            if (!playlist.tracks.includes(trackId)) {
                throw new Error("Track not found in the playlist.");
            }
            // Remove the track from the playlist
            yield db_1.prismaClient.playlist.update({
                where: { id: playlistId },
                data: {
                    tracks: {
                        set: playlist.tracks.filter((id) => id !== trackId), // Filter out the trackId
                    },
                },
            });
            return true; // Success
        }
        catch (error) {
            console.error("Error removing song from playlist:", error);
            throw new Error(error instanceof Error ? error.message : "Failed to remove song from playlist.");
        }
    })
};
exports.resolvers = { queries, mutations };
