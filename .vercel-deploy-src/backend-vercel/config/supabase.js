"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pezmxujnnwarhbgvutal.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_qf_9nzMYMH4IN10b0IA0kA_1uyI4O13';
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
