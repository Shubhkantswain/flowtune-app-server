import { title } from "process";
import { prismaClient } from "../../clients/db";
import { CreateTrackPayload, GraphqlContext } from "../../interfaces";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv'

dotenv.config()

export const genreIds = {
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

interface SearchInput {
    page: number
    query: string
}

interface GetTracksByGenreIdInput {
    genreId: string;
    page: number;
}

const queries = {
    getFeedTracks: async (_parent: any, _args: any, ctx: GraphqlContext) => {
        try {
            const userId = ctx.user?.id;

            // Fetch tracks authored by users the current user follows, directly in one query
            const tracks = await prismaClient.track.findMany({
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

            return tracks.map(track => ({
                ...track,
                hasLiked: userId ? track.likes.length > 0 : false, // Check if the likes array has the current user's like
            }));


        } catch (error) {
            console.error("Error fetching feed tracks:", error);
            throw new Error("Failed to fetch feed tracks.");
        }
    },

    getExploreTracks: async (_parent: any, { page }: { page: number }, ctx: GraphqlContext) => {

        const userId = ctx?.user?.id; // Get the current user's ID
        const language = ctx?.user?.language || "Hindi"

        console.log("page", page);

        const tracks = await prismaClient.track.findMany({
            where: {
                AND: [ // Use AND to combine multiple conditions
                    { language: language }, // Assuming 'language' is a variable
                    { authorId: "cm9i26zxh0000l62qizxjnrgd" }
                ]
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
            skip: page === 1 ? 0 : 24 + (page - 2) * 16, // Ensure pagination is safe
            take: page == 1 ? 24 : 16, // Limit to 5 results per page
        });

        // Shuffle the tracks array to ensure randomness
        const shuffledTracks = tracks.sort(() => Math.random() - 0.5);

        return shuffledTracks.map(track => ({
            ...track,
            hasLiked: userId ? track.likes.length > 0 : false, // Efficient check for user like
        }));
    },

    getSearchTracks: async (_parent: any, { input }: { input: SearchInput }, _ctx: GraphqlContext) => {
        const userId = _ctx?.user?.id; // Get the current user's ID
        const { page, query } = input

        const tracks = await prismaClient.track.findMany({
            where: {
                AND: [
                    {
                        title: {
                            contains: query,
                            mode: 'insensitive', // Case-insensitive search
                        },
                    },
                    {
                        authorId: "cm9i26zxh0000l62qizxjnrgd",
                    },
                ],
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
            skip: (Math.max(page, 1) - 1) * 5, // Ensure pagination is safe
            take: 5, // Limit to 5 results per page
        });

        return tracks.map(track => ({
            ...track,
            hasLiked: userId ? track.likes.length > 0 : false, // Efficient check for user like
        }));
    },

    getRecentTracks: async (_parent: any, { recentTracks }: { recentTracks: string[] }, _ctx: GraphqlContext) => {
        if (!_ctx.user) {
            return []
        }

        const userId = _ctx.user.id; // Get the current user's ID

        try {
            const tracks = await prismaClient.track.findMany({
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

            return tracks.map(track => ({
                ...track,
                hasLiked: userId ? track.likes.length > 0 : false, // Efficient check for user like
            }));

        } catch (error) {
            console.error("Error fetching liked tracks:", error);
            throw new Error("Failed to fetch liked tracks");
        }
    },

    getLikedTracks: async (_parent: any, {page}:{page: number}, _ctx: GraphqlContext) => {
        const userId = _ctx?.user?.id; // Get the current user's ID

        try {
            const likedTracks = await prismaClient.like.findMany({
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
                },
                skip: (Math.max(page, 1) - 1) * 20, // Ensure pagination is safe
                take: 20, // Limit to 5 results per page
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

        } catch (error) {
            console.error("Error fetching liked tracks:", error);
            throw new Error("Failed to fetch liked tracks");
        }
    },

    // First define valid genre types

    getTracksByGenreId: async (_parent: any, { input }: { input: GetTracksByGenreIdInput }, ctx: GraphqlContext) => {
        type GenreKey = keyof typeof genreIds;
        const userId = ctx.user?.id
        const { genreId, page } = input
        try {
            // Find tracks where the genre array contains the provided tag
            const matchingTracks = await prismaClient.track.findMany({
                where: {
                    genre: {
                        has: genreIds[genreId as GenreKey] // Checks if the genre array contains the tag
                    }
                },
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
                },
                skip: page === 1 ? 0 : 24 + (page - 2) * 16, // Ensure pagination is safe
                take: page == 1 ? 24 : 16, // Limit to 5 results per page
            });

            // Shuffle the tracks array to ensure randomness
            const shuffledTracks = matchingTracks.sort(() => Math.random() - 0.5);

            console.log("shuffledTracks", shuffledTracks);

            return shuffledTracks.map(track => ({
                ...track,
                hasLiked: userId ? track.likes.length > 0 : false, // Efficient check for user like
            }));

        } catch (error) {
            console.error('Error fetching tracks by genre:', error);
            throw new Error('Could not fetch tracks');
        }
    }
};

const mutations = {
    createTrack: async (
        parent: any,
        { payload }: { payload: CreateTrackPayload },
        ctx: GraphqlContext
    ) => {
        try {
            // Ensure the user is authenticated
            if (!ctx.user) throw new Error("Please Login/Signup first!");

            const { title, singer, starCast, duration, coverImageUrl, videoUrl, audioFileUrl, language, genre } = payload;

            // Upload audio URL to Cloudinary
            const uploadAudioResult = await cloudinary.uploader.upload(audioFileUrl, {
                resource_type: "auto",
            });

            // Upload cover image URL to Cloudinary (if provided)
            let uploadImageResult = null;
            if (coverImageUrl) {
                uploadImageResult = await cloudinary.uploader.upload(coverImageUrl, {
                    resource_type: "auto",
                });
            }

            let uploadVideoResult = null;
            if (videoUrl) {
                uploadVideoResult = await cloudinary.uploader.upload(videoUrl, {
                    resource_type: "auto",
                });
            }

            // Create track in the database
            const track = await prismaClient.track.create({
                data: {
                    title,
                    singer,
                    starCast,
                    duration,
                    coverImageUrl: uploadImageResult?.secure_url,
                    videoUrl: uploadVideoResult?.secure_url,
                    audioFileUrl: uploadAudioResult.secure_url,
                    language,
                    genre,
                    authorId: ctx.user.id,
                },
            });

            return true
        } catch (error: any) {
            // Handle errors gracefully
            console.error("Error creating track:", error);
            throw new Error(error.message || "An error occurred while creating the track.");
        }
    },

    deleteTrack: async (
        parent: any,
        { trackId }: { trackId: string },
        ctx: GraphqlContext
    ) => {
        try {
            // Ensure the user is authenticated
            if (!ctx.user) throw new Error("Please Login/Signup first!");

            const track = await prismaClient.track.findUnique({ where: { id: trackId } })

            if (!track) {
                throw new Error("Post Doest exist!");
            }

            if (track.authorId.toString() != ctx.user.id.toString()) {
                throw new Error("You cant delete someone else post!");
            }

            await prismaClient.track.delete({ where: { id: trackId } })

            return true

        } catch (error: any) {
            // Handle errors gracefully (Cloudinary or Prisma issues)
            console.error("Error toggling like:", error);
            throw new Error(error.message || "An error occurred while toggling the like on the post.");
        }
    },

    likeTrack: async (parent: any, { trackId }: { trackId: string }, ctx: GraphqlContext) => {
        try {

            if (!ctx.user) throw new Error("Please Login/Signup first");

            // Attempt to delete the like (unlike the track)
            await prismaClient.like.delete({
                where: {
                    userId_trackId: {
                        userId: ctx.user.id,
                        trackId,
                    },
                },
            });
            // If successful, return false (indicating the track is now unliked)
            return false;

        } catch (error: any) {
            if (error.code === 'P2025') {
                // Create a like if not found (toggle to liked)
                await prismaClient.like.create({
                    data: {
                        userId: ctx?.user?.id || "",
                        trackId,
                    },
                });
                return true; // Indicate the track is now liked
            }

            throw new Error(error.message || "something went wrong");
        }
    },
}

export const resolvers = { queries, mutations }