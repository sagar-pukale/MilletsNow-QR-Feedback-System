"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
function getDatasourceUrl() {
    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl)
        return undefined;
    try {
        const url = new URL(rawUrl);
        if (!url.hostname.includes('pooler.supabase.com'))
            return rawUrl;
        if (!url.searchParams.has('pgbouncer')) {
            url.searchParams.set('pgbouncer', 'true');
        }
        if (!url.searchParams.has('connection_limit')) {
            url.searchParams.set('connection_limit', '1');
        }
        if (!url.searchParams.has('sslmode')) {
            url.searchParams.set('sslmode', 'require');
        }
        return url.toString();
    }
    catch {
        return rawUrl;
    }
}
exports.prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: getDatasourceUrl(),
        },
    },
});
