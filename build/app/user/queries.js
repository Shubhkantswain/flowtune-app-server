"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = void 0;
exports.queries = `#graphql
    getUserProfile(username: String!): getUserProfileResponse 
    getUserTracks(payload: GetUserTracksPayload!):[Track!]!
`;
