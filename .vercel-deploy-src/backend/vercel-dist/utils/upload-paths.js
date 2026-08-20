"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadRootDir = getUploadRootDir;
exports.getFrontendDistDir = getFrontendDistDir;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const env_js_1 = require("../config/env.js");
function getWorkspaceRoot() {
    return (0, node_fs_1.existsSync)(node_path_1.default.resolve(process.cwd(), 'frontend')) ? process.cwd() : node_path_1.default.resolve(process.cwd(), '..');
}
function getBackendRoot() {
    return (0, node_fs_1.existsSync)(node_path_1.default.resolve(process.cwd(), 'src')) ? process.cwd() : node_path_1.default.resolve(getWorkspaceRoot(), 'backend');
}
function getUploadRootDir() {
    if (process.env.VERCEL) {
        return node_path_1.default.join('/tmp', 'milletsnow-uploads');
    }
    return node_path_1.default.resolve(getBackendRoot(), env_js_1.env.UPLOAD_DIR);
}
function getFrontendDistDir() {
    return node_path_1.default.resolve(getWorkspaceRoot(), 'frontend', 'dist');
}
