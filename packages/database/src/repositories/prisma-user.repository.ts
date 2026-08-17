// packages/database/src/repositories/prisma-user.repository.ts
import { prisma } from "../client/prisma";
import { CreateUserInput, UserRepository } from "../contracts/user.repository";
import { UserEntity } from "../entities/user.entity";

export class PrismaUserRepository implements UserRepository {
    async createUser(input: CreateUserInput): Promise<UserEntity> {
        return prisma.user.create({
            data: {
                username: input.username,
                email: input.email,
            },
        });
    }

    async upsertUser(input: { username: string; email: string }): Promise<UserEntity> {
        const existing = await prisma.user.findFirst({
            where: {
                OR: [{ email: input.email }, { username: input.username }],
            },
        });

        if (existing) {
            return prisma.user.update({
                where: { id: existing.id },
                data: {
                    username: input.username,
                    email: input.email,
                },
            });
        }

        return prisma.user.create({
            data: {
                username: input.username,
                email: input.email,
            },
        });
    }

    async getTopUsers(limit: number = 20): Promise<UserEntity[]> {
        return prisma.user.findMany({
            take: limit,
            orderBy: { rating: "desc" },
        });
    }

    async getUserById(identifier: string): Promise<UserEntity | null> {
        if (!identifier) return null;
        return prisma.user.findFirst({
            where: {
                OR: [
                    { id: identifier },
                    { email: identifier },
                    { username: identifier },
                ],
            },
        });
    }

    async getUserByUsername(username: string): Promise<UserEntity | null> {
        return prisma.user.findUnique({
            where: { username },
        });
    }

    async updateRating(userId: string, newRating: number, isWin: boolean): Promise<UserEntity> {
        return prisma.user.update({
            where: { id: userId },
            data: {
                rating: newRating,
                wins: isWin ? { increment: 1 } : undefined,
                losses: !isWin ? { increment: 1 } : undefined,
            },
        });
    }

    async getAvailablePlayers(excludeUserId?: string, limit = 20): Promise<UserEntity[]> {
        return prisma.user.findMany({
            where: excludeUserId ? { id: { not: excludeUserId } } : undefined,
            take: limit,
            orderBy: { rating: "desc" },
        });
    }
}
