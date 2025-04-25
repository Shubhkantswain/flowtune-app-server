"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initServer = initServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const JWTService_1 = __importDefault(require("../services/JWTService"));
const auth_1 = require("./auth");
const user_1 = require("./user");
const track_1 = require("./track");
const playlist_1 = require("./playlist");
function initServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        // CORS configuration     
        const corsOptions = {
            origin: ['https://flowtune-app.pages.dev', 'http://localhost:5173'], // your frontend URL
            credentials: true, // Ensure cookies are sent with cross-origin requests
        };
        // Use CORS middleware
        app.use((0, cors_1.default)(corsOptions));
        app.use(body_parser_1.default.json({ limit: "80mb" }));
        app.use((0, cookie_parser_1.default)());
        const graphqlServer = new server_1.ApolloServer({
            typeDefs: `
            ${auth_1.Auth.types}
            ${track_1.Track.types}
            ${user_1.User.types}
            ${playlist_1.Playlist.types}

            type Query {
                ${auth_1.Auth.queries}
                ${track_1.Track.queries}
                ${user_1.User.queries}
                ${playlist_1.Playlist.queries}
            }
            
            type Mutation {
                ${auth_1.Auth.mutations}
                ${track_1.Track.mutations}
                ${user_1.User.mutations}
                ${playlist_1.Playlist.mutations}
            }
        `,
            resolvers: {
                Query: Object.assign(Object.assign(Object.assign(Object.assign({}, auth_1.Auth.resolvers.queries), track_1.Track.resolvers.queries), user_1.User.resolvers.queries), playlist_1.Playlist.resolvers.queries),
                Mutation: Object.assign(Object.assign(Object.assign(Object.assign({}, auth_1.Auth.resolvers.mutations), track_1.Track.resolvers.mutations), user_1.User.resolvers.mutations), playlist_1.Playlist.resolvers.mutations)
            },
        });
        yield graphqlServer.start();
        // GraphQL Middleware
        app.use('/graphql', 
        // @ts-ignore
        (0, express4_1.expressMiddleware)(graphqlServer, {
            context: (_a) => __awaiter(this, [_a], void 0, function* ({ req, res }) {
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
                        user = JWTService_1.default.decodeToken(token);
                        console.log("Decoded user:", user);
                    }
                    catch (error) {
                        console.error("Error decoding token:", error);
                    }
                }
                return {
                    user,
                    req,
                    res,
                };
            }),
        }));
        return app;
    });
}
