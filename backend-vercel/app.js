"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const env_js_1 = require("./config/env.js");
const error_handler_js_1 = require("./middleware/error-handler.js");
const not_found_js_1 = require("./middleware/not-found.js");
const product_routes_js_1 = require("./routes/product-routes.js");
const qrcode_routes_js_1 = require("./routes/qrcode-routes.js");
const scan_routes_js_1 = require("./routes/scan-routes.js");
const auth_routes_js_1 = require("./routes/auth-routes.js");
const auth_js_1 = require("./middleware/auth.js");
const health_route_js_1 = require("./routes/health-route.js");
const feedback_routes_js_1 = require("./routes/feedback-routes.js");
exports.app = (0, express_1.default)();
const workspaceRoot = (0, node_fs_1.existsSync)(node_path_1.default.resolve(process.cwd(), 'frontend')) ? process.cwd() : node_path_1.default.resolve(process.cwd(), '..');
const backendRoot = (0, node_fs_1.existsSync)(node_path_1.default.resolve(process.cwd(), 'src')) ? process.cwd() : node_path_1.default.resolve(workspaceRoot, 'backend');
const frontendDistDir = node_path_1.default.resolve(workspaceRoot, 'frontend', 'dist');
const hasFrontendBuild = (0, node_fs_1.existsSync)(frontendDistDir);
exports.app.disable('x-powered-by');
exports.app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (origin === env_js_1.env.CORS_ORIGIN ||
            origin.endsWith('.vercel.app') ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
}));
exports.app.use((0, compression_1.default)());
exports.app.use((0, cookie_parser_1.default)());
exports.app.use(express_1.default.json({ limit: '1mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
exports.app.use((0, morgan_1.default)(env_js_1.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
exports.app.use(['/uploads', '/api/uploads'], express_1.default.static(node_path_1.default.resolve(backendRoot, env_js_1.env.UPLOAD_DIR)));
exports.app.use(['/auth', '/api/auth'], auth_routes_js_1.authRoutes);
exports.app.use(['/health', '/api/health'], health_route_js_1.healthRoute);
exports.app.use(['/products', '/api/products', '/qrcodes', '/api/qrcodes'], auth_js_1.requireAuth);
exports.app.use(['/products', '/api/products'], product_routes_js_1.productRoutes);
exports.app.use(['/qrcodes', '/api/qrcodes'], qrcode_routes_js_1.qrCodeRoutes);
exports.app.use(['/scan', '/api/scan'], scan_routes_js_1.scanRoutes);
exports.app.use(['/feedback', '/api/feedback'], feedback_routes_js_1.feedbackRoutes);
if (hasFrontendBuild) {
    exports.app.use(express_1.default.static(frontendDistDir));
    exports.app.get(/^(?!\/(?:auth|api\/auth|health|api\/health|products|api\/products|qrcodes|api\/qrcodes|scan|api\/scan|feedback|api\/feedback|uploads|api\/uploads)\b).*/, (_request, response) => {
        response.sendFile(node_path_1.default.join(frontendDistDir, 'index.html'));
    });
}
exports.app.use(not_found_js_1.notFound);
exports.app.use(error_handler_js_1.errorHandler);
