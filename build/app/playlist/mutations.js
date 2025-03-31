"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutations = void 0;
exports.mutations = `#graphql
    createPlaylist(payload: CreatePlaylistInput!): Playlist!
    deletePlaylist(playlistId: String!): Boolean!
    addSongToPlaylist(payload: AddSongToPlaylistInput!): Playlist
    removeSongFromPlaylist(payload: RemoveSongFromPlaylistInput!): Boolean!
`;
