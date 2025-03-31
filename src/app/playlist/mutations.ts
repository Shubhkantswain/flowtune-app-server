export const mutations = `#graphql
    createPlaylist(payload: CreatePlaylistInput!): Playlist!
    deletePlaylist(playlistId: String!): Boolean!
    addSongToPlaylist(payload: AddSongToPlaylistInput!): Playlist
    removeSongFromPlaylist(payload: RemoveSongFromPlaylistInput!): Boolean!
` 