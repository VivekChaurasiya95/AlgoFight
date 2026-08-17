// apps/api/src/controllers/user.controller.ts
import { PrismaUserRepository } from "@algofight/database";

export class UserController {
    constructor(private readonly userRepository: PrismaUserRepository = new PrismaUserRepository()) { }

    async syncUser(payload: { email: string; username?: string; displayName?: string }) {
        const username = payload.displayName || payload.username || payload.email.split("@")[0];
        const user = await this.userRepository.upsertUser({
            email: payload.email,
            username,
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

    async getAvailablePlayers(excludeUserId?: string, limit?: number) {
        return this.userRepository.getAvailablePlayers(excludeUserId, limit);
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
