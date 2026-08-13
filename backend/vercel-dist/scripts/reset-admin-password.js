"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const readline_1 = __importDefault(require("readline"));
const stream_1 = require("stream");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_js_1 = require("../config/prisma.js");
const TARGET_ADMIN_EMAIL = 'admin@milletsnow.example';
async function getPassword() {
    // Only check explicitly provided NEW_ADMIN_PASSWORD from process.env
    // Do NOT fall back to ADMIN_PASSWORD from .env
    const envPassword = process.env.NEW_ADMIN_PASSWORD;
    if (envPassword && envPassword.trim().length >= 12) {
        return envPassword.trim();
    }
    // Muted writable stream to prevent echoing typed password to screen
    const mutableStdout = new stream_1.Writable({
        write(chunk, encoding, callback) {
            if (!this.muted) {
                process.stdout.write(chunk, encoding);
            }
            callback();
        },
    });
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: mutableStdout,
        terminal: true,
    });
    return new Promise((resolve, reject) => {
        process.stdout.write('Enter new admin password: ');
        mutableStdout.muted = true;
        rl.question('', (answer) => {
            mutableStdout.muted = false;
            process.stdout.write('\n');
            rl.close();
            const trimmed = answer.trim();
            if (trimmed.length < 12) {
                reject(new Error('Password must be at least 12 characters long.'));
            }
            else {
                resolve(trimmed);
            }
        });
    });
}
async function main() {
    try {
        const newPassword = await getPassword();
        const email = TARGET_ADMIN_EMAIL.toLowerCase().trim();
        const existingUser = await prisma_js_1.prisma.user.findUnique({
            where: { email },
        });
        if (!existingUser) {
            console.error(`ERROR: Admin user with email "${TARGET_ADMIN_EMAIL}" was not found in the database. Reset aborted.`);
            process.exit(1);
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma_js_1.prisma.user.update({
            where: { id: existingUser.id },
            data: {
                passwordHash,
                status: 'active',
            },
        });
        console.log(`SUCCESS: Password for admin user "${TARGET_ADMIN_EMAIL}" has been updated successfully.`);
    }
    catch (error) {
        console.error('ERROR during password reset:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    finally {
        await prisma_js_1.prisma.$disconnect();
    }
}
main();
