export const mutations = `#graphql
    createTrack(payload: createTrackPayload!): Boolean!
    deleteTrack(trackId: String!): Boolean!
    likeTrack(trackId: String!): Boolean!
`

