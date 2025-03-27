import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser'
import JWTService from '../services/JWTService';
import { Auth } from './auth';
import { User } from './user';
import { Track } from './track';
import { Playlist } from './playlist';
import { GraphqlContext } from '../interfaces';

export async function initServer() {
    const app = express();

    // CORS configuration     
    const corsOptions = {
        origin: ['https://flowtune-app.pages.dev', 'http://localhost:5173'], // your frontend URL
        credentials: true, // Ensure cookies are sent with cross-origin requests
    };

    // Use CORS middleware
    app.use(cors(corsOptions));
    app.use(bodyParser.json({ limit: "80mb" }))
    app.use(cookieParser())

    const graphqlServer = new ApolloServer({
        typeDefs: `
            ${Auth.types}
            ${Track.types}
            ${User.types}
            ${Playlist.types}

            type Query {
                ${Auth.queries}
                ${Track.queries}
                ${User.queries}
                ${Playlist.queries}
            }
            
            type Mutation {
                ${Auth.mutations}
                ${Track.mutations}
                ${User.mutations}
                ${Playlist.mutations}
            }
        `,
        resolvers: {
            Query: {
                ...Auth.resolvers.queries,
                ...Track.resolvers.queries,
                ...User.resolvers.queries,
                ...Playlist.resolvers.queries
            },

            Mutation: {
                ...Auth.resolvers.mutations,
                ...Track.resolvers.mutations,
                ...User.resolvers.mutations,
                ...Playlist.resolvers.mutations
            }
        },
    });

    await graphqlServer.start();

    // GraphQL Middleware
    app.use(
        '/graphql',
        // @ts-ignore
        expressMiddleware(graphqlServer, {
            context: async ({ req, res }: { req: Request; res: Response }): Promise<GraphqlContext> => {
                // Retrieve token from cookies
                let token = req.cookies["__FlowTune_Token"];

                console.log("token", token);
                
                // Fallback to Authorization header if cookie is not set
                if (!token && req.headers.authorization) {
                    token = req.headers.authorization.split("Bearer ")[1];
                }

                let user;
                if (token) {
                    try {
                        // Decode the token to retrieve user information
                        user = JWTService.decodeToken(token);
                        console.log("Decoded user:", user);
                    } catch (error) {
                        console.error("Error decoding token:", error);
                    }
                }

                return {
                    user,
                    req,
                    res,
                };
            },
        })
    );


    return app;
}