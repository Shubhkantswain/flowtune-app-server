export const queries = `#graphql
    getFeedTracks:[Track!]
    getExploreTracks(page: Int!): [Track!]
    getLikedTracks:[Track!]
    getTracksByGenreId(genreId: String!): [Track!]!
    getSearchTracks(searchQuery: String!): [Track!]!
    getRecentTracks(recentTracks: [String!]!): [Track!]!
`