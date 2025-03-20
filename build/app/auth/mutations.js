"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutations = void 0;
exports.mutations = `#graphql
    signupUser(input: SignupUserInput!): Boolean!
    verifyEmail(input: VerifyEmailInput!): AuthResponse
    loginUser(input: LoginUserInput!): AuthResponse
    forgotPassword(usernameOrEmail: String!): Boolean!
    resetPassword(input: ResetPasswordInput!): Boolean!
    sendReq(text: String!): String!
`;
// jjjjjj
