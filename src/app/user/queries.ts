export const queries = `#graphql
    getUserProfile(username: String!): getUserProfileResponse 
    getUserTracks(payload: GetUserTracksPayload!):[Track!]!
`