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
const analytics_routes_js_1 = require("./routes/analytics-routes.js");
const qr_sticker_template_routes_js_1 = require("./routes/qr-sticker-template-routes.js");
const upload_paths_js_1 = require("./utils/upload-paths.js");
exports.app = (0, express_1.default)();
const workspaceRoot = (0, node_fs_1.existsSync)(node_path_1.default.resolve(process.cwd(), 'frontend')) ? process.cwd() : node_path_1.default.resolve(process.cwd(), '..');
const frontendDistDir = (0, upload_paths_js_1.getFrontendDistDir)();
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
exports.app.use(['/uploads', '/api/uploads'], express_1.default.static((0, upload_paths_js_1.getUploadRootDir)()));
exports.app.use(['/auth', '/api/auth'], auth_routes_js_1.authRoutes);
exports.app.use(['/health', '/api/health'], health_route_js_1.healthRoute);
exports.app.use(['/products', '/api/products', '/qrcodes', '/api/qrcodes', '/analytics', '/api/analytics', '/qr-sticker-templates', '/api/qr-sticker-templates'], auth_js_1.requireAuth);
exports.app.use(['/products', '/api/products'], product_routes_js_1.productRoutes);
exports.app.use(['/qrcodes', '/api/qrcodes'], qrcode_routes_js_1.qrCodeRoutes);
exports.app.use(['/analytics', '/api/analytics'], analytics_routes_js_1.analyticsRoutes);
exports.app.use(['/qr-sticker-templates', '/api/qr-sticker-templates'], qr_sticker_template_routes_js_1.qrStickerTemplateRoutes);
exports.app.use('/api/scan', scan_routes_js_1.scanRoutes);
exports.app.use(['/feedback', '/api/feedback', '/complaint', '/api/complaint', '/compliment', '/api/compliment'], feedback_routes_js_1.feedbackRoutes);
if (hasFrontendBuild) {
    exports.app.use(express_1.default.static(frontendDistDir));
    exports.app.get(/^(?!\/(?:auth|api\/auth|health|api\/health|products|api\/products|qrcodes|api\/qrcodes|analytics|api\/analytics|qr-sticker-templates|api\/qr-sticker-templates|api\/scan|feedback|api\/feedback|complaint|api\/complaint|compliment|api\/compliment|uploads|api\/uploads)\b).*/, (_request, response) => {
        response.sendFile(node_path_1.default.join(frontendDistDir, 'index.html'));
    });
}
exports.app.use(not_found_js_1.notFound);
exports.app.use(error_handler_js_1.errorHandler);
