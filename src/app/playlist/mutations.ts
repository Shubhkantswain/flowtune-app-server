export const mutations = `#graphql
    createPlaylist(payload: CreatePlaylistInput!): Boolean!
    deletePlaylist(playlistId: String!): Boolean!
    addSongToPlaylist(payload: AddSongToPlaylistInput!): Boolean!
    removeSongFromPlaylist(payload: RemoveSongFromPlaylistInput!): Boolean!
` 