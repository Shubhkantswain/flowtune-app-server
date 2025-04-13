export const queries = `#graphql
    getCurrentUserPlaylists(input: getCurrentUserPlaylistsInput!): [Playlist!]!
    getExplorePlaylists(page: Int!): [Playlist!]!
    getPlaylistTracks(playlistId: String!): getPlaylistTracksResponse!
    getSearchPlaylists(input: SearchInput!): [Playlist!]!
`  