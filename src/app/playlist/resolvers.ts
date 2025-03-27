import { prismaClient } from "../../clients/db";
import { v2 as cloudinary } from "cloudinary";
import { GraphqlContext } from "../../interfaces";

export enum Visibility {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
}

interface CreatePlaylistPayload {
    name: string;
    coverImageUrl: string;
    visibility: Visibility;
    trackIds: string[];
}

interface AddSongToPlaylistPayload {
    isNewPlaylist: boolean;
    name?: string;
    existingPlaylistId?: string;
    coverImageUrl?: string;
    visibility?: Visibility;
    trackIds: string[];
}

interface RemoveSongFromPlaylistInput {
    playlistId: string;      // ID of the playlist
    trackId: string; // ID of the track to be removed
}


interface SearchPlaylistPayload {
    query: string; // The search query, required
    page: number;  // The page number for pagination, required
}


const queries = {
    getCurrentUserPlaylists: async (parent: unknown, args: unknown, context: GraphqlContext) => {
        const userId = context.user?.id;

        if (!userId) {
            return { playlists: null };
        }

        try {
            const playlists = await prismaClient.playlist.findMany({
                where: { authorId: userId },
                select: {
                    id: true,
                    name: true,
                    coverImageUrl: true,
                    author: true,
                    tracks: true
                },
            });

            const playlist = playlists.map((playlist) => ({
                id: playlist.id,
                name: playlist.name,
                coverImageUrl: playlist.coverImageUrl,
                totalTracks: playlist.tracks[0] != "" ? playlist.tracks.length : 0,
                author: context.user?.id
            }))

            return {
                playlists: playlist
            }
        } catch (error) {
            console.error("Error fetching playlists:", error);
            throw new Error("Failed to fetch user playlists.");
        }
    },

    getPlaylistTracks: async (parent: unknown, { playlistId }: { playlistId: string }, context: GraphqlContext) => {
        const userId = context.user?.id;

        try {
            const playlist = await prismaClient.playlist.findUnique({
                where: { id: playlistId }
            });

            if (!playlist) {
                return { id: "", title: "", coverImageUrl: "", tracks: null }
            }

            const trackIds = playlist?.tracks || [];

            const tracks = await prismaClient.track.findMany({
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
                }
            })

            return {
                id: playlist.id,
                title: playlist.name,
                coverImageUrl: playlist.coverImageUrl,
                tracks: trackItems
            }

        } catch (error) {
            console.error("Error fetching playlist tracks:", error);
            throw new Error("Failed to fetch playlist tracks.");
        }
    },

    getFeedPlaylists: async (parent: unknown, { playlistId }: { playlistId: string }, context: GraphqlContext) => {
        const userId = context.user?.id;

        try {
            const playlists = await prismaClient.playlist.findMany({
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
                return { id: "", title: "", coverImageUrl: "", tracks: null }
            }

            return {
                playlists: playlists.map((playlist) => {
                    return {
                        ...playlist,
                        totalTracks: playlist.tracks.length
                    }
                })
            }

        } catch (error) {
            console.error("Error fetching playlist tracks:", error);
            throw new Error("Failed to fetch playlist tracks.");
        }
    }
};

const mutations = {
    createPlaylist: async (
        parent: unknown,
        { payload }: { payload: CreatePlaylistPayload },
        context: GraphqlContext
    ) => {
        const userId = context.user?.id;

        if (!userId) {
            throw new Error("Authentication required.");
        }

        try {
            const { name, coverImageUrl, visibility, trackIds } = payload;

            const uploadResult = await cloudinary.uploader.upload(coverImageUrl, {
                resource_type: "auto",
            });

            await prismaClient.playlist.create({
                data: {
                    name,
                    coverImageUrl: uploadResult.secure_url,
                    Visibility: visibility,
                    tracks: trackIds,
                    authorId: userId,
                },
            });

            return true;
        } catch (error) {
            console.error("Error creating playlist:", error);
            throw new Error("Failed to create playlist.");
        }
    },

    addSongToPlaylist: async (
        parent: unknown,
        { payload }: { payload: AddSongToPlaylistPayload },
        context: GraphqlContext
    ) => {
        const userId = context.user?.id;

        if (!userId) {
            throw new Error("Authentication required.");
        }

        try {
            const { isNewPlaylist, name, existingPlaylistId, coverImageUrl, visibility, trackIds } =
                payload;

            if (isNewPlaylist) {
                let uploadResult
                if (coverImageUrl) {
                    uploadResult = await cloudinary.uploader.upload(coverImageUrl, {
                        resource_type: "auto",
                    });
                }

                await prismaClient.playlist.create({
                    data: {
                        name: name || "Untitled Playlist",
                        coverImageUrl: uploadResult?.secure_url || "",
                        Visibility: visibility,
                        tracks: trackIds,
                        authorId: userId,
                    },
                });
            } else if (existingPlaylistId) {
                // First get the existing playlist
                const existingPlaylist = await prismaClient.playlist.findUnique({
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
                await prismaClient.playlist.update({
                    where: { id: existingPlaylistId },
                    data: {
                        tracks: { push: trackIds[0] },
                    },
                });
            } else {
                throw new Error("Playlist ID is required for updating.");
            }

            return true;
        } catch (error: any) {
            console.error("Error adding song to playlist:", error);
            throw new Error(error);
        }
    },

    deletePlaylist: async (
        parent: unknown,
        { playlistId }: { playlistId: string },
        context: GraphqlContext
    ) => {
        const userId = context.user?.id;

        if (!userId) {
            throw new Error("Authentication required.");
        }

        try {
            await prismaClient.playlist.delete({
                where: { id: playlistId }
            });

            return true;
        } catch (error) {
            console.error("Error creating playlist:", error);
            throw new Error("Failed to create playlist.");
        }
    },

    removeSongFromPlaylist: async (
        parent: unknown,
        { payload }: { payload: RemoveSongFromPlaylistInput },
        context: GraphqlContext
    ) => {
        const { playlistId, trackId } = payload;

        try {
            // Check if the playlist exists
            const playlist = await prismaClient.playlist.findUnique({
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
            await prismaClient.playlist.update({
                where: { id: playlistId },
                data: {
                    tracks: {
                        set: playlist.tracks.filter((id) => id !== trackId), // Filter out the trackId
                    },
                },
            });

            return true; // Success
        } catch (error) {
            console.error("Error removing song from playlist:", error);
            throw new Error(
                error instanceof Error ? error.message : "Failed to remove song from playlist."
            );
        }
    }

};

export const resolvers = { queries, mutations }