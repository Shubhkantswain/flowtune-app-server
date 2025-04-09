export const types = `#graphql
    type getUserProfileResponse {
        id: ID!
        username: String!
        fullName: String!
        profileImageURL: String
        bio: String
        totalTracks: Int!
        followedByMe: Boolean!
    }

    type SearchUserResponse {
        id: ID!
        username: String!
        profileImageURL: String
    }

    input GetUserTracksPayload {
        userId: String!
        page: Int!
    }

    input UpdateUserProfilePayload {
        imgUrl: String
        username: String
        fullName: String
        oldPassword: String
        newPassword: String
        bio: String
    }
`