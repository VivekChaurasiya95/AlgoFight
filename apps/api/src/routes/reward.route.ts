import { FastifyInstance } from "fastify";
import { requireAuth } from "../plugins/auth.plugin";
import { prisma } from "@algofight/database";
import {
    PointLedgerService,
    ConsistencyRewardService,
    AchievementRewardService
} from "@algofight/application";

const ledger = new PointLedgerService();
const consistency = new ConsistencyRewardService(ledger);
const achievements = new AchievementRewardService(ledger);

export async function rewardRoutes(app: FastifyInstance) {
    // 1. Get weekly consistency status and milestones
    app.get("/rewards/weekly-status", { preHandler: [requireAuth] }, async (req) => {
        const userId = req.user!.id;
        return consistency.getWeeklyStatus(userId);
    });

    // 2. Claim weekly consistency milestone reward (Server-authoritative)
    app.post("/rewards/claim-weekly", { preHandler: [requireAuth] }, async (req, reply) => {
        const userId = req.user!.id;
        const body = (req.body as any) || {};
        const daysRequired = Number(body.daysRequired);

        if (!daysRequired || isNaN(daysRequired)) {
            return reply.status(400).send({ error: "BAD_REQUEST", message: "daysRequired is required." });
        }

        const result = await consistency.claimWeeklyReward(userId, daysRequired);
        if (!result.success) {
            return reply.status(400).send({ error: "CLAIM_FAILED", message: result.error });
        }

        return result;
    });

    // 3. Get user point transaction history
    app.get("/rewards/history", { preHandler: [requireAuth] }, async (req) => {
        const userId = req.user!.id;
        const query = (req.query as any) || {};
        const limit = Number(query.limit) || 20;
        const offset = Number(query.offset) || 0;

        return ledger.getHistory(userId, limit, offset);
    });

    // 4. Redeem Vault Reward (Avatar, Frame, Theme)
    app.post("/rewards/redeem", { preHandler: [requireAuth] }, async (req, reply) => {
        const userId = req.user!.id;
        const body = (req.body as any) || {};
        const cost = Number(body.cost) || 0;
        const rewardTitle = body.rewardTitle || "Reward Item";
        const itemType = body.itemType; // 'avatar' | 'frame' | 'theme'
        const itemId = body.itemId;
        const isAdmin = req.user?.role === "ADMIN";

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return reply.status(404).send({ error: "NOT_FOUND", message: "User not found." });
        }

        let newBalance = user.arenaPoints;

        // Admins can unlock everything for 0 points; regular users must pay cost if > 0
        if (!isAdmin && cost > 0) {
            // If user's ledger has 0 points, but they have rating/wins, initialize ledger
            const computedPoints = (user.rating || 0) + (user.wins || 0) * 120;
            if (user.arenaPoints < cost && computedPoints >= cost) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { arenaPoints: computedPoints },
                });
            }

            const result = await ledger.deductPoints({
                userId,
                amount: cost,
                type: "REWARD_REDEMPTION",
                source: "VAULT",
                sourceId: `${Date.now()}_${itemId || rewardTitle}`,
                metadata: { rewardTitle, cost, itemType, itemId },
            });

            if (!result.success) {
                return reply.status(400).send({ error: "INSUFFICIENT_FUNDS", message: result.error || "Insufficient Arena Points balance." });
            }
            newBalance = result.newBalance;
        }

        // Persist unlocked item in studentIdentityMetadata
        const currentMeta = (user.studentIdentityMetadata as any) || {};
        const unlockedAvatars = Array.from(new Set([...(currentMeta.unlockedAvatars || []), ...(itemType === "avatar" && itemId ? [itemId] : [])]));
        const unlockedFrames = Array.from(new Set([...(currentMeta.unlockedFrames || []), ...(itemType === "frame" && itemId ? [itemId] : [])]));
        const unlockedThemes = Array.from(new Set([...(currentMeta.unlockedThemes || []), ...(itemType === "theme" && itemId ? [itemId] : [])]));

        const updatedMeta = {
            ...currentMeta,
            unlockedAvatars,
            unlockedFrames,
            unlockedThemes,
        };

        await prisma.user.update({
            where: { id: userId },
            data: { studentIdentityMetadata: updatedMeta },
        });

        return {
            success: true,
            newBalance,
            unlockedAvatars,
            unlockedFrames,
            unlockedThemes,
            message: `Successfully unlocked ${rewardTitle}!`,
        };
    });

    // 5. Get user unlocked achievements
    app.get("/rewards/achievements", { preHandler: [requireAuth] }, async (req) => {
        const userId = req.user!.id;
        return achievements.getUserAchievements(userId);
    });
}
