import { title } from "process";
import { prismaClient } from "../../clients/db";
import { CreateTrackPayload, GraphqlContext } from "../../interfaces";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv'

dotenv.config()

const queries = {
    getFeedTracks: async (_parent: any, _args: any, _ctx: GraphqlContext) => {
        if (!_ctx.user) {
            throw new Error("User not authenticated");
        }
    
        const userId = _ctx.user.id; // Get the current user's ID
    
        // Fetch 8 random tracks in a single query
        const tracks = await prismaClient.track.findMany({
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
    
        return shuffledTracks.map(track => ({
            ...track,
            hasLiked: track.likes.length > 0, // Efficient check for user like
        }));
    },

    getExploreTracks: async (_parent: any, { page }: { page: number }, _ctx: GraphqlContext) => {
        if (!_ctx.user) {
            throw new Error("User not authenticated");
        }

        const userId = _ctx.user.id; // Get the current user's ID

        const tracks = await prismaClient.track.findMany({
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

        return tracks.map(track => ({
            ...track,
            hasLiked: track.likes.length > 0, // Efficient check for user like
        }));
    },

    getLikedTracks: async (_parent: any, _args: any, _ctx: GraphqlContext) => {
        if (!_ctx.user) {
            throw new Error("User not authenticated");
        }

        const userId = _ctx.user.id; // Get the current user's ID

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

        } catch (error) {
            console.error("Error fetching liked tracks:", error);
            throw new Error("Failed to fetch liked tracks");
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

            const { title, singer, starCast, duration, coverImageUrl, videoUrl, audioFileUrl, language, genre, } = payload;

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