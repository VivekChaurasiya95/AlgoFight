// apps/api/src/utils/ip.util.ts
import { FastifyRequest } from "fastify";

// Strict IPv4 and IPv6 format matchers to prevent header spoofing / log injection
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i;
const IPV6_COMPACT_REGEX = /^((?:[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4})*)?)::((?:[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4})*)?)$/;

/**
 * Validates whether a candidate string is a strictly safe IPv4 or IPv6 address.
 * Prevents log injection, CRLF injection, and XSS payload smuggling in headers.
 */
export function isValidIp(ip: string): boolean {
    if (!ip || typeof ip !== "string") return false;
    const clean = ip.trim();
    if (clean.length > 45 || clean.length < 3) return false;
    // Check for loopback variants
    if (clean === "::1" || clean === "127.0.0.1" || clean === "localhost") return true;
    if (clean.startsWith("::ffff:")) {
        const v4part = clean.replace(/^::ffff:/, "");
        return IPV4_REGEX.test(v4part);
    }
    return IPV4_REGEX.test(clean) || IPV6_REGEX.test(clean) || IPV6_COMPACT_REGEX.test(clean);
}

/**
 * Extract and sanitize the true client IP address honoring upstream proxy headers.
 * Resolves Cloudflare, Vercel, Nginx, AWS, and Fastly proxy headers with strict sanitization.
 */
export function extractClientIp(request: FastifyRequest): string {
    const headers = request.headers;

    // 1. Cloudflare proxy header (most authoritative on Cloudflare-protected deployments)
    const cfIp = headers["cf-connecting-ip"];
    if (typeof cfIp === "string") {
        const clean = cfIp.trim();
        if (isValidIp(clean)) return normalizeIp(clean);
    }

    // 2. Standard single client IP proxy headers (Nginx, Vercel, Railway, Render)
    const xRealIp = headers["x-real-ip"];
    if (typeof xRealIp === "string") {
        const clean = xRealIp.trim();
        if (isValidIp(clean)) return normalizeIp(clean);
    }

    const trueClientIp = headers["true-client-ip"] || headers["fastly-client-ip"];
    if (typeof trueClientIp === "string") {
        const clean = trueClientIp.trim();
        if (isValidIp(clean)) return normalizeIp(clean);
    }

    // 3. X-Forwarded-For chain: client, proxy1, proxy2
    const forwarded = headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
        const parts = forwarded.split(",").map((p) => p.trim());
        for (const candidate of parts) {
            if (isValidIp(candidate)) {
                return normalizeIp(candidate);
            }
        }
    }

    // 4. Fastify computed IP or socket remote address fallback
    const rawIp = request.ip || request.socket?.remoteAddress;
    if (typeof rawIp === "string") {
        const clean = rawIp.trim();
        if (isValidIp(clean)) return normalizeIp(clean);
    }

    return "127.0.0.1";
}

/**
 * Normalize loopback and mapped IPv6 addresses to standard readable formats
 */
export function normalizeIp(ip: string): string {
    const trimmed = ip.trim();
    if (trimmed === "::1" || trimmed === "localhost") {
        return "127.0.0.1";
    }
    if (trimmed.startsWith("::ffff:")) {
        const v4part = trimmed.replace(/^::ffff:/, "");
        if (IPV4_REGEX.test(v4part)) return v4part;
    }
    return trimmed;
}

/**
 * Validates and normalizes HTTP methods to prevent arbitrary verb injection.
 */
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD", "EVENT", "WS"]);

export function normalizeMethod(method: string | undefined): string {
    if (!method || typeof method !== "string") return "GET";
    const upper = method.trim().toUpperCase();
    return ALLOWED_METHODS.has(upper) ? upper : "UNKNOWN";
}
