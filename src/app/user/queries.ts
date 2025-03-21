export const queries = `#graphql
    getUserProfile(userId: String!): getUserProfileResponse 
    getUserTracks(payload: GetUserTracksPayload!):[Track!]!
`