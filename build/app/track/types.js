"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = void 0;
exports.types = `#graphql
    input createTrackPayload {
        title: String!
        singer: String
        starCast: String
        duration: String!

        coverImageUrl: String
        videoUrl: String
        audioFileUrl: String! 
             
        language: String
        genre: [String!]!
    }

    input SearchInput {
        page: Int!
        query: String!
    }

    input GetTracksByGenreIdInput {
        genreId: String!
        page: Int!
    }

    type Track {
        id: ID!    

        title: String!            
        singer: String          
        starCast: String
        duration: String!             

        coverImageUrl: String      
        videoUrl: String
        audioFileUrl: String!  
            
        hasLiked: Boolean!
        authorId: String!

        createdAt: String
    }
`;
