"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = void 0;
exports.queries = `#graphql
    getCurrentUserPlaylists(input: getCurrentUserPlaylistsInput!): [Playlist!]!
    getExplorePlaylists(page: Int!): [Playlist!]!
    getPlaylistTracks(playlistId: String!): getPlaylistTracksResponse!
    getSearchPlaylists(input: SearchInput!): [Playlist!]!
`;
