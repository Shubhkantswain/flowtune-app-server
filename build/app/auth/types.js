"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = void 0;
exports.types = `#graphql
    type User {
        id: String!
        email: String!
        username: String!
        fullName: String!
        bio: String
        profileImageURL: String
    }
    
    type AuthResponse {
        id: String!
        email: String!
        username: String!
        fullName: String!
        bio: String
        profileImageURL: String
        authToken: String!
    }

    input SignupUserInput {
        email: String!
        username: String!
    }

    input VerifyEmailInput {
        email: String!
        username: String!
        fullName: String!
        password: String!
        token : String!
    }

    input LoginUserInput {
        usernameOrEmail: String!
        password: String!
    }

    input ResetPasswordInput {
        token: String!
        newPassword: String!
        confirmPassword: String!
    }

`;
