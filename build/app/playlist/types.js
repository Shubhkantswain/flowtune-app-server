"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = void 0;
exports.types = `#graphql
# schema/playlist.graphql
# schema/playlist.graphql

type Playlist {
  id: ID!
  name: String!
  coverImageUrl: String!
  Visibility: Visibility!
  totalTracks: Int!
  authorId: String!
}

type getPlaylistTracksResponse {
  id: String!
  title: String!
  coverImageUrl: String!
  visibility: Visibility!
  tracks: [Track!]
  authorId: String!
}

input CreatePlaylistInput {
  name: String!
  coverImageUrl: String!
  visibility: Visibility!
  trackIds: [String!]!
}
    
input AddSongToPlaylistInput {
  isNewPlaylist: Boolean!
  name: String
  existingPlaylistId: String
  coverImageUrl: String
  visibility: Visibility
  trackIds: [String!]!
}

input RemoveSongFromPlaylistInput {
  playlistId: String!
  trackId: String!
}

input getCurrentUserPlaylistsInput {
  page: Int!
  limit: Int!
}

enum Visibility {
  PUBLIC
  PRIVATE
}
`;
