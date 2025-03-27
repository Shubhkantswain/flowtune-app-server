"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = void 0;
const mutations_1 = require("./mutations");
const queries_1 = require("./queries");
const resolvers_1 = require("./resolvers");
const types_1 = require("./types");
exports.Auth = { types: types_1.types, queries: queries_1.queries, mutations: mutations_1.mutations, resolvers: resolvers_1.resolvers };
