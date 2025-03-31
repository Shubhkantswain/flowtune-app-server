"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = void 0;
exports.queries = `#graphql
    getCurrentUserPlaylists: [Playlist!]!
    getPlaylistTracks(playlistId: String!): getPlaylistTracksResponse!
`;
