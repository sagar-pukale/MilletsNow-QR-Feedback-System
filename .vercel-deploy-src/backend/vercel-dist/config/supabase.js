"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.supabaseStorageBucket = void 0;
exports.getSupabaseStoragePublicUrl = getSupabaseStoragePublicUrl;
const supabase_js_1 = require("@supabase/supabase-js");
const env_js_1 = require("./env.js");
const supabaseUrl = env_js_1.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    'https://pezmxujnnwarhbgvutal.supabase.co';
const supabaseKey = env_js_1.env.SUPABASE_SERVICE_ROLE_KEY ??
    env_js_1.env.SUPABASE_PUBLISHABLE_KEY ??
    env_js_1.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseKey) {
    throw new Error('Supabase key is not configured for backend storage uploads.');
}
exports.supabaseStorageBucket = env_js_1.env.SUPABASE_STORAGE_BUCKET;
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
function getSupabaseStoragePublicUrl(path) {
    const { data } = exports.supabase.storage.from(exports.supabaseStorageBucket).getPublicUrl(path);
    return data.publicUrl;
}
