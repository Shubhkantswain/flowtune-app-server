import { prismaClient } from "../../clients/db";
import { v2 as cloudinary } from "cloudinary";
import { GraphqlContext } from "../../interfaces";

export enum Visibility {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
}

interface SearchInput {
    page: number
    query: string
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

interface GetCurrentUserPlaylistsInput {
    page: number;
    limit: number;
}


const queries = {
    getCurrentUserPlaylists: async (parent: unknown, { input }: { input: GetCurrentUserPlaylistsInput }, context: GraphqlContext) => {
        const userId = context.user?.id;

        if (!userId) {
            return { playlists: null };
        }
        const { page, limit } = input
        try {
            const playlists = await prismaClient.playlist.findMany({
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
            }))
        } catch (error) {
            console.error("Error fetching playlists:", error);
            throw new Error("Failed to fetch user playlists.");
        }
    },

    getExplorePlaylists: async (parent: unknown, { page }: { page: number }, ctx: GraphqlContext) => {
        const language = ctx.user?.language || "Hindi"

        try {
            const playlists = await prismaClient.playlist.findMany({
                where: {
                    AND: [
                        {
                            name: {
                                contains: language,
                            },
                        },
                        {
                            authorId: "cm9i26zxh0000l62qizxjnrgd",
                        },
                        {
                            Visibility: "PUBLIC"
                        }
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    coverImageUrl: true,
                    Visibility: true,
                    tracks: true,
                    authorId: true,
                },
                skip: page === 1 ? 0 : 24 + (page - 2) * 16, // Ensure pagination is safe
                take: page == 1 ? 24 : 16, // Limit to 5 results per page
            });

            return playlists.map((playlist) => ({
                id: playlist.id,
                name: playlist.name.split('-')[0].trim(),
                coverImageUrl: playlist.coverImageUrl,
                Visibility: playlist.Visibility,
                totalTracks: playlist.tracks[0] !== "" ? playlist.tracks.length : 0,
                authorId: playlist.authorId
            }))
        } catch (error) {
            console.error("Error fetching playlists:", error);
            throw new Error("Failed to fetch user playlists.");
        }
    },

    getPlaylistTracks: async (parent: unknown, { playlistId }: { playlistId: string }, context: GraphqlContext) => {
        const userId = context.user?.id;

        try {
            const playlist = await prismaClient.playlist.findUnique({
                where: { 
                    id: playlistId
                 }
            });

            if (!playlist) {
                throw new Error("Sorry, Playlist Not Found")
            }

            if(playlist.Visibility == "PRIVATE" && userId !== playlist.authorId){
                throw new Error("Sorry, Playlist Is Private")
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
                    authorId: track.authorId,
                    createdAt: track.createdAt.toISOString() // 👈 Convert Date to String
                }
            })

            return {
                id: playlist.id,
                title: playlist.name.split("-")[0].trim(),
                coverImageUrl: playlist.coverImageUrl,
                visibility: playlist.Visibility,
                tracks: trackItems,
                authorId: playlist.authorId
            }

        } catch (error) {
            console.error("Error fetching playlist tracks:", error);
            throw new Error("Failed to fetch playlist tracks.");
        }
    },

    getSearchPlaylists: async (_parent: any, { input }: { input: SearchInput }, _ctx: GraphqlContext) => {
        const userId = _ctx?.user?.id; // Get the current user's ID
        const { page, query } = input

        const playlists = await prismaClient.playlist.findMany({
            where: {
                AND: [
                    {
                        name: {
                            contains: query,
                            mode: 'insensitive', // Case-insensitive search
                        },
                    },
                    {
                        authorId: "cm9i26zxh0000l62qizxjnrgd",
                    },
                    {
                        Visibility: "PUBLIC"
                    }
                ],
            },
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

        return playlists.map(playlist => ({
            ...playlist,
            name: playlist.name.split("-")[0].trim(),
            totalTracks: playlist.tracks.length, // Efficient check for user like
        }));
    },
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

            // const uploadResult = await cloudinary.uploader.upload(coverImageUrl, {
            //     resource_type: "auto",
            // });

            const playlist = await prismaClient.playlist.create({
                data: {
                    name,
                    coverImageUrl: "uploadResult.secure_url",
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
            }
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

                const playlist = await prismaClient.playlist.create({
                    data: {
                        name: name || "Untitled Playlist",
                        coverImageUrl: uploadResult?.secure_url || "",
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
                }

            } else if (existingPlaylistId) {
                // First get the existing playlist
                const existingPlaylist = await prismaClient.playlist.findUnique({
                    where: { id: existingPlaylistId },
                    select: { tracks: true }
                });

                if (!existingPlaylist) {
                    throw new Error("Playlist not found.");
                }

                if (existingPlaylist.tracks.length >= 20) {
                    throw new Error("Sorry, you have reach your limit");
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

                return null
            } else {
                throw new Error("Playlist ID is required for updating.");
            }
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