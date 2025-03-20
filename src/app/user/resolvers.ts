import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";

interface GetUserTracksPayload {
  authorId: string;
  page: number;
}

export const queries = {
  getUserProfile: async (
    parent: any,
    { username }: { username: string },
    ctx: GraphqlContext
  ) => {
    try {
      const currentUserId = ctx.user?.id;

      const user = await prismaClient.user.findUnique({
        where: { username },
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
      const { authorId, page = 1 } = payload; // Ensure page defaults to 1 if undefined

      const tracks = await prismaClient.track.findMany({
        where: { authorId },
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

export const resolvers = { queries }