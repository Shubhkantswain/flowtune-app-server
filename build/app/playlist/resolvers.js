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
    getCurrentUserPlaylists: (parent, args, context) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = context.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return { playlists: null };
        }
        try {
            const playlists = yield db_1.prismaClient.playlist.findMany({
                where: { authorId: userId },
                select: {
                    id: true,
                    name: true,
                    coverImageUrl: true,
                    author: true,
                    tracks: true
                },
            });
            const playlist = playlists.map((playlist) => {
                var _a;
                return ({
                    id: playlist.id,
                    name: playlist.name,
                    coverImageUrl: playlist.coverImageUrl,
                    totalTracks: playlist.tracks[0] != "" ? playlist.tracks.length : 0,
                    author: (_a = context.user) === null || _a === void 0 ? void 0 : _a.id
                });
            });
            return {
                playlists: playlist
            };
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
                return { id: "", title: "", coverImageUrl: "", tracks: null };
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
                    authorId: track.authorId
                };
            });
            return {
                id: playlist.id,
                title: playlist.name,
                coverImageUrl: playlist.coverImageUrl,
                tracks: trackItems
            };
        }
        catch (error) {
            console.error("Error fetching playlist tracks:", error);
            throw new Error("Failed to fetch playlist tracks.");
        }
    }),
    getFeedPlaylists: (parent_1, _a, context_1) => __awaiter(void 0, [parent_1, _a, context_1], void 0, function* (parent, { playlistId }, context) {
        var _b;
        const userId = (_b = context.user) === null || _b === void 0 ? void 0 : _b.id;
        try {
            const playlists = yield db_1.prismaClient.playlist.findMany({
                where: {
                    author: {
                        followers: {
                            some: { followerId: userId }, // Ensure the author is followed by the user
                        },
                    },
                },
                select: {
                    id: true,
                    name: true,
                    coverImageUrl: true,
                    author: {
                        select: {
                            id: true,
                            profileImageURL: true,
                            username: true
                        }
                    },
                    tracks: true
                },
                take: 5, // Optional: Limit to 5 tracks
                orderBy: { createdAt: 'desc' }, // Optional: Order by newest
            });
            console.log("playlits", playlists);
            if (!playlists) {
                return { id: "", title: "", coverImageUrl: "", tracks: null };
            }
            return {
                playlists: playlists.map((playlist) => {
                    return Object.assign(Object.assign({}, playlist), { totalTracks: playlist.tracks.length });
                })
            };
        }
        catch (error) {
            console.error("Error fetching playlist tracks:", error);
            throw new Error("Failed to fetch playlist tracks.");
        }
    })
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
            yield db_1.prismaClient.playlist.create({
                data: {
                    name,
                    coverImageUrl: uploadResult.secure_url,
                    Visibility: visibility,
                    tracks: trackIds,
                    authorId: userId,
                },
            });
            return true;
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
                yield db_1.prismaClient.playlist.create({
                    data: {
                        name: name || "Untitled Playlist",
                        coverImageUrl: (uploadResult === null || uploadResult === void 0 ? void 0 : uploadResult.secure_url) || "",
                        Visibility: visibility,
                        tracks: trackIds,
                        authorId: userId,
                    },
                });
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
            }
            else {
                throw new Error("Playlist ID is required for updating.");
            }
            return true;
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
