import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import JWTService from "../../services/JWTService";

interface GetUserTracksPayload {
    userId: string;
    page: number;
}

export const queries = {
    getUserProfile: async (
        parent: any,
        { userId }: { userId: string },
        ctx: GraphqlContext
    ) => {
        try {
            const currentUserId = ctx.user?.id;

            const user = await prismaClient.user.findUnique({
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
        } catch (error: any) {
            console.error("Error fetching user profile:", error);
            throw new Error(
                error.message || "An error occurred while fetching the user profile."
            );
        }
    },

    getUserTracks: async (
        parent: any,
        { payload }: { payload: GetUserTracksPayload },
        ctx: GraphqlContext
    ) => {
        try {
            const { userId, page = 1 } = payload; // Ensure page defaults to 1 if undefined

            const tracks = await prismaClient.track.findMany({
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
                    likes: ctx.user?.id
                        ? { where: { userId: ctx.user.id }, select: { userId: true } }
                        : undefined, // Skip if not logged in
                },
                skip: (Math.max(page, 1) - 1) * 5, // Ensure pagination is safe
                take: 5, // Limit to 5 results per page
            });

            return tracks.map((track) => ({
                ...track,
                hasLiked: ctx.user?.id ? track.likes.length > 0 : false, // Efficient check for user like
            }));
        } catch (error: any) {
            console.error("Error fetching user tracks:", error);
            throw new Error(error.message || "Failed to fetch user tracks. Please try again.");
        }
    },


};

const mutations = {
    changeMusicPreference: async (
        parent: any,
        { language }: { language: string },
        ctx: GraphqlContext
    ) => {
        const userId = ctx.user?.id
        const user = await prismaClient.user.update({
            where: { id: userId },
            data: {
                language
            }
        })

        const userToken = JWTService.generateTokenForUser({ id: user.id, username: user.username, language });
        return userToken
    },

    followUser: async (parent: any, { userId }: { userId: string }, ctx: GraphqlContext) => {
        // Ensure the user is authenticated
        try {
          if (!ctx.user) throw new Error("Please Login/Signup first");
          
          // Attempt to delete the like (unlike the post)
          await prismaClient.follow.delete({
            where: {
              followerId_followingId: {
                followerId: ctx.user.id,
                followingId: userId
              }
            } 
          });
    
          // If successful, return a response indicating the post was unliked
          return false; // unfollowed
    
        } catch (error: any) {
          // If the like doesn't exist, handle the error and create the like (like the post)
          if (error.code === 'P2025') { // This error code indicates that the record was not found
            // Create a like entry (Prisma will automatically link the user and post)
            await prismaClient.follow.create({
              data: {
                followerId: ctx?.user?.id || "",
                followingId: userId
              }
            });
            return true; // followed
          }
    
          // Handle any other errors
          console.error("Error toggling like:", error);
          throw new Error(error.message || "An error occurred while toggling the like on the post.");
        }
      }
}

export const resolvers = { queries, mutations }