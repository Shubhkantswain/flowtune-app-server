export const types = `#graphql
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
    }
`