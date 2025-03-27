"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = void 0;
exports.queries = `#graphql
    getFeedTracks:[Track!]
    getExploreTracks(page: Int!): [Track!]
    getLikedTracks:[Track!]
    getTracksByGenreId(genreId: String!): [Track!]!
    getSearchTracks(searchQuery: String!): [Track!]!
    getRecentTracks(recentTracks: [String!]!): [Track!]!
`;
