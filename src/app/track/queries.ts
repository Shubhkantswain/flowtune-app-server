export const queries = `#graphql
    getFeedTracks:[Track!]
    getExploreTracks(page: Int!): [Track!]
    getLikedTracks:[Track!]
    getTracksByGenreId(input: GetTracksByGenreIdInput!): [Track!]!
    getSearchTracks(input: SearchInput!): [Track!]!
    getRecentTracks(recentTracks: [String!]!): [Track!]!
`