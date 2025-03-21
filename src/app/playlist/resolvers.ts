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
                totalTracks: playlist.tracks.length,
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
                   authorId : track.authorId
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
        } catch (error) {
            console.error("Error adding song to playlist:", error);
            throw new Error("Failed to add song to playlist.");
        }
    },

    removeSongFromPlaylist: async (
        parent: unknown,
        { payload }: { payload: RemoveSongFromPlaylistInput },
        context: GraphqlContext
    ) => {
        try {
            const { playlistId, trackId } = payload;

            // First, get the current playlist's tracks to filter out the track
            const playlist = await prismaClient.playlist.findUnique({
                where: { id: playlistId },
                select: { tracks: true }, // Only select the tracks array
            });

            if (!playlist) {
                throw new Error("Playlist not found");
            }

            // Filter out the trackId from the tracks array
            const updatedTracks = playlist.tracks.filter((id) => id !== trackId);

            // Update the playlist with the new list of tracks
            await prismaClient.playlist.update({
                where: { id: playlistId },
                data: {
                    tracks: updatedTracks, // Set the new list of tracks
                },
            });

            return true; // Or whatever response you want to return
        } catch (error) {
            console.error("Error removing song from playlist:", error);
            throw new Error("Failed to remove song from playlist.");
        }
    }

};

export const resolvers = { queries, mutations }