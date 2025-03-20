"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutations = void 0;
exports.mutations = `#graphql
    createTrack(payload: createTrackPayload!): Boolean!
    deleteTrack(trackId: String!): Boolean!
    likeTrack(trackId: String!): Boolean!
`;
