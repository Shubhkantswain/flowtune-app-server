export const queries = `#graphql
    getFeedTracks:[Track!]
    getExploreTracks(page: Int!): [Track!]
    getLikedTracks:[Track!]
`