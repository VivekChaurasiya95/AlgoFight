// apps/api/src/controllers/user.controller.ts
import { PrismaUserRepository } from "@algofight/database";

export class UserController {
    constructor(private readonly userRepository: PrismaUserRepository = new PrismaUserRepository()) { }

    async syncUser(payload: { email: string; username?: string; displayName?: string; githubUrl?: string; linkedinUrl?: string, id?: string, uid?: string }) {
        const userId = payload.id || payload.uid;
        const email = payload.email || `${userId}@algofight.local`;
        const username = payload.displayName || payload.username || email.split("@")[0];
        const user = await this.userRepository.upsertUser({
            id: userId,
            email: email,
            username,
            githubUrl: payload.githubUrl,
            linkedinUrl: payload.linkedinUrl,
        });

        return {
            ...user,
            matchesWon: user.wins,
            matchesPlayed: user.wins + user.losses,
            lossCount: user.losses,
            practiceSolvedProblemIds: [],
            practiceSolvedCount: 0,
            practiceSubmissionCount: 0,
        };
    }

    async getUserById(id: string) {
        const user = await this.userRepository.getUserById(id);
        if (!user) return null;

        return {
            ...user,
            matchesWon: user.wins,
            matchesPlayed: user.wins + user.losses,
            lossCount: user.losses,
            practiceSolvedProblemIds: [],
            practiceSolvedCount: 0,
            practiceSubmissionCount: 0,
        };
    }

    async getAvailablePlayers(excludeUserId?: string, limit?: number, search?: string) {
        const users = await this.userRepository.getAvailablePlayers(excludeUserId, limit, search);
        return users.map((u) => {
            const matchesPlayed = u.wins + u.losses;
            const winRate = matchesPlayed > 0 ? Math.round((u.wins / matchesPlayed) * 100) : 0;
            return {
                id: u.id,
                username: u.username,
                email: u.email,
                platformCode: u.platformCode,
                userType: u.userType,
                institutionName: u.institutionName,
                department: u.department,
                rating: u.rating,
                wins: u.wins,
                losses: u.losses,
                matchesWon: u.wins,
                matchesPlayed,
                winRate,
                status: "OFFLINE",
                createdAt: u.createdAt,
            };
        });
    }

    async getLeaderboard() {
        const users = await this.userRepository.getTopUsers(50);
        return users.map((u, index) => ({
            rank: index + 1,
            user: u.username,
            score: u.rating,
            wins: u.wins,
            losses: u.losses,
            trend: "same",
        }));
    }
}
