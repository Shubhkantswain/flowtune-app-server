"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = void 0;
exports.queries = `#graphql
    getCurrentUserPlaylists: [Playlist!]!
    getExplorePlaylists(page: Int!): [Playlist!]!
    getPlaylistTracks(playlistId: String!): getPlaylistTracksResponse!
`;
