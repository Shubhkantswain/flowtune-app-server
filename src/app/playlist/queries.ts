export const queries = `#graphql
    getCurrentUserPlaylists: [Playlist!]!
    getPlaylistTracks(playlistId: String!): getPlaylistTracksResponse!
`  