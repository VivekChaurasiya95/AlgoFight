// apps/api/src/routes/auth.route.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AuthController } from "../controllers/auth.controller";
import { requireAuth } from "../plugins/auth.plugin";
import { logger } from "@algofight/logger";

const authController = new AuthController();

export async function authRoutes(app: FastifyInstance) {
    // 1. Google OAuth2 / GIS Login
    app.post("/auth/google", async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as any;
        const idToken = body.idToken || body.credential || body.token;
        if (!idToken) {
            return reply.status(400).send({ error: "BAD_REQUEST", message: "Google credential ID token required." });
        }
        try {
            const result = await authController.loginWithGoogle({
                idToken,
                ip: req.ip,
                userAgent: req.headers["user-agent"] as string,
            });
            return reply.send(result);
        } catch (err: any) {
            logger.error({ err: err?.message || err, stack: err?.stack }, "Google auth endpoint error");
            const status = err.statusCode || 500;
            return reply.status(status).send({ error: "AUTH_FAILED", message: err.message || "Google authentication failed." });
        }
    });

    // 2. Manual Email / Password Login
    app.post("/auth/login", async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as any;
        if (!body.email || !body.password) {
            return reply.status(400).send({ error: "BAD_REQUEST", message: "Email and password are required." });
        }
        try {
            const result = await authController.loginManual({
                email: body.email,
                password: body.password,
                ip: req.ip,
                userAgent: req.headers["user-agent"] as string,
            });
            return reply.send(result);
        } catch (err: any) {
            const status = err.statusCode || 401;
            return reply.status(status).send({ error: "AUTH_FAILED", message: err.message || "Login failed." });
        }
    });

    // 3. Manual Signup
    app.post("/auth/signup", async (req: FastifyRequest, reply: FastifyReply) => {
        const body = req.body as any;
        if (!body.email || !body.password) {
            return reply.status(400).send({ error: "BAD_REQUEST", message: "Email and password are required." });
        }
        try {
            const result = await authController.signupManual({
                email: body.email,
                password: body.password,
                username: body.username,
                displayName: body.displayName,
                userType: body.userType,
                institutionName: body.institutionName,
                school: body.school,
                department: body.department,
                designation: body.designation,
                ip: req.ip,
                userAgent: req.headers["user-agent"] as string,
            });
            return reply.send(result);
        } catch (err: any) {
            const status = err.statusCode || 400;
            return reply.status(status).send({ error: "SIGNUP_FAILED", message: err.message || "Signup failed." });
        }
    });

    // 4. Logout
    app.post("/auth/logout", { preHandler: [requireAuth] }, async (req: FastifyRequest, reply: FastifyReply) => {
        const sessionId = req.trustContext?.sessionId || req.headers["authorization"]?.replace("Bearer ", "");
        if (sessionId) {
            await authController.logout(sessionId);
        }
        return reply.send({ success: true, message: "Logged out successfully." });
    });

    // 5. Get current authenticated user
    app.get("/auth/me", { preHandler: [requireAuth] }, async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const { prisma } = await import("@algofight/database");
            const fullUser = await prisma.user.findUnique({
                where: { id: req.user!.id },
            });
            if (!fullUser) {
                return reply.send({ user: req.user, trustContext: req.trustContext });
            }
            const userMeta = (fullUser.studentIdentityMetadata as any) || {};
            const originalPhoto = userMeta.originalPhotoURL ||
                (userMeta.photoURL?.startsWith('http') && !userMeta.photoURL.includes('/avatars/') ? userMeta.photoURL : null) ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullUser.username || fullUser.email)}`;

            return reply.send({
                user: {
                    id: fullUser.id,
                    uid: fullUser.id,
                    email: fullUser.email,
                    username: fullUser.username,
                    displayName: fullUser.username,
                    role: fullUser.role || req.user?.role || "USER",
                    userType: fullUser.userType || "INDIVIDUAL",
                    platformCode: fullUser.platformCode,
                    institutionName: fullUser.institutionName,
                    department: fullUser.department,
                    enrollmentNumber: fullUser.enrollmentNumber,
                    school: fullUser.school || userMeta.school || null,
                    designation: fullUser.designation || userMeta.designation || (fullUser.userType === "FACULTY" ? "Faculty Educator" : null),
                    rating: fullUser.rating || 0,
                    highestRating: fullUser.highestRating || fullUser.rating || 0,
                    highestRank: fullUser.highestRank || "ROOKIE",
                    arenaPoints: fullUser.arenaPoints ?? 0,
                    wins: fullUser.wins || 0,
                    losses: fullUser.losses || 0,
                    matchesWon: fullUser.wins || 0,
                    matchesPlayed: (fullUser.wins || 0) + (fullUser.losses || 0),
                    photoURL: userMeta.photoURL || null,
                    originalPhotoURL: originalPhoto,
                    avatarFrame: userMeta.avatarFrame || null,
                    unlockedAvatars: Array.isArray(userMeta.unlockedAvatars) ? userMeta.unlockedAvatars : [],
                    unlockedFrames: Array.isArray(userMeta.unlockedFrames) ? userMeta.unlockedFrames : [],
                    unlockedThemes: Array.isArray(userMeta.unlockedThemes) ? userMeta.unlockedThemes : [],
                },
                trustContext: req.trustContext,
            });
        } catch {
            return reply.send({ user: req.user, trustContext: req.trustContext });
        }
    });
}
