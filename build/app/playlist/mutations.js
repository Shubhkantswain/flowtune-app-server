"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutations = void 0;
exports.mutations = `#graphql
    createPlaylist(payload: CreatePlaylistInput!): Boolean!
    deletePlaylist(playlistId: String!): Boolean!
    addSongToPlaylist(payload: AddSongToPlaylistInput!): Boolean!
    removeSongFromPlaylist(payload: RemoveSongFromPlaylistInput!): Boolean!
`;
