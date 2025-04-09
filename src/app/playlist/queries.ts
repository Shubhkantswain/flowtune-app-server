export const queries = `#graphql
    getCurrentUserPlaylists: [Playlist!]!
    getExplorePlaylists(page: Int!): [Playlist!]!
    getPlaylistTracks(playlistId: String!): getPlaylistTracksResponse!
    getSearchPlaylists(input: SearchInput!): [Playlist!]!
`  