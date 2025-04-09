import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import JWTService from "../../services/JWTService";
import { v2 as cloudinary } from 'cloudinary';
import bcrypt from 'bcryptjs'

interface SearchInput {
    page: number
    query: string
}

interface GetUserTracksPayload {
    userId: string;
    page: number;
}

interface UpdateUserProfilePayload {
    imgUrl?: string;
    username?: string;
    fullName?: string;
    oldPassword?: string;
    newPassword?: string;
    bio?: string;
}

export const queries = {
    getUserProfile: async (
        parent: any,
        { userId }: { userId: string },
        ctx: GraphqlContext
    ) => {
        try {
            const currentUserId = ctx.user?.id;
            if (userId == "cm8r434ge0000cs2a87bpbfdc" && currentUserId != "cm8r434ge0000cs2a87bpbfdc") {
                return null
            }

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

    getSearchUser: async (_parent: any, { input }: { input: SearchInput }, _ctx: GraphqlContext) => {
        const userId = _ctx?.user?.id; // Get the current user's ID
        const { page, query } = input

        const users = await prismaClient.user.findMany({
            where: {
                username: {
                    contains: query,
                    mode: 'insensitive' // Makes the search case-insensitive
                }
            },
            select: {
               id: true,
               username: true,
               profileImageURL: true
            },
            skip: (Math.max(page, 1) - 1) * 15, // Ensure pagination is safe
            take: 15, // Limit to 5 results per page
        });

        return users.map(user => ({
           id: user.id,
           username: user.username,
           profileImageURL: user.profileImageURL
        }));
    },

};

const mutations = {
    changeMusicPreference: async (
        parent: any,
        { language }: { language: string },
        ctx: GraphqlContext
    ) => {
        const userId = ctx.user?.id
        if (!userId) {
            throw new Error("Please Login/Signup first");
        }
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
    },

    updateUserProfile: async (
        parent: any,
        { payload }: { payload: UpdateUserProfilePayload },
        ctx: GraphqlContext
    ) => {
        try {
            const userId = ctx.user?.id;
            if (!userId) throw new Error('Unauthorized: User not authenticated');

            const { imgUrl, username, fullName, oldPassword, newPassword, bio } = payload;

            // 1. Fetch user with proper error handling
            const user = await prismaClient.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    password: true,
                    profileImageURL: true,
                    username: true,
                    fullName: true,
                    bio: true
                }
            });

            if (!user) throw new Error('User not found');

            // 2. Handle image upload (only if new image provided)
            let uploadImageResult = user.profileImageURL;
            if (imgUrl && imgUrl !== user.profileImageURL) {
                const res = await cloudinary.uploader.upload(imgUrl, {
                    resource_type: 'auto',
                });
                uploadImageResult = res.secure_url;
            }

            // 3. Password change logic
            let passwordToUpdate = user.password;
            if (oldPassword && newPassword) {
                const isMatch = await bcrypt.compare(oldPassword, user.password);
                if (!isMatch) throw new Error('Current password is incorrect');

                if (oldPassword === newPassword) {
                    throw new Error('New password must be different from current password');
                }

                passwordToUpdate = await bcrypt.hash(newPassword, 12); // Increased salt rounds
            }

            // 4. Update user data
            const updatedUser = await prismaClient.user.update({
                where: { id: userId },
                data: {
                    profileImageURL: uploadImageResult,
                    username: username || user.username,
                    fullName: fullName || user.fullName,
                    password: passwordToUpdate,
                    bio: bio || user.bio,
                    updatedAt: new Date() // Always update timestamp
                },
                select: { id: true } // Only return what's needed
            });

            return !!updatedUser; // Return boolean success indicator

        } catch (error: any) {
            // Handle any other errors
            console.error("Error toggling like:", error);
            throw new Error(error.message || "An error occurred while toggling the like on the post.");
        }
    }
}

export const resolvers = { queries, mutations }