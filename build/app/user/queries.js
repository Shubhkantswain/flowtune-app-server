"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = void 0;
exports.queries = `#graphql
    getUserProfile(userId: String!): getUserProfileResponse 
    getUserTracks(payload: GetUserTracksPayload!):[Track!]!
    getSearchUser(input: SearchInput!): [SearchUserResponse!]!
`;
