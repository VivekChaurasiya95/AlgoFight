// packages/database/src/repositories/prisma-user.repository.ts
import { prisma } from "../client/prisma";
import { CreateUserInput, UserRepository } from "../contracts/user.repository";
import { UserEntity } from "../entities/user.entity";
import { generatePlatformCode } from "../utils/platform-code";

export class PrismaUserRepository implements UserRepository {
    async createUser(input: CreateUserInput): Promise<UserEntity> {
        return prisma.user.create({
            data: {
                id: input.id,
                username: input.username,
                email: input.email,
                userType: (input.userType as any) || "INDIVIDUAL",
                primaryEmail: input.primaryEmail || input.email,
                secondaryEmail: input.secondaryEmail || null,
                institutionName: input.institutionName || null,
                department: input.department || null,
                batchYear: input.batchYear || null,
                platformCode: input.platformCode || generatePlatformCode(input.userType),
                githubUrl: input.githubUrl || null,
                linkedinUrl: input.linkedinUrl || null,
            },
        });
    }

    async upsertUser(input: CreateUserInput): Promise<UserEntity> {
        const existing = await prisma.user.findFirst({
            where: {
                OR: [{ email: input.email }, { username: input.username }, { id: input.id }],
            },
        });

        if (existing) {
            return prisma.user.update({
                where: { id: existing.id },
                data: {
                    username: input.username,
                    email: input.email,
                    institutionName: input.institutionName || existing.institutionName,
                    secondaryEmail: input.secondaryEmail || existing.secondaryEmail,
                    githubUrl: input.githubUrl || existing.githubUrl,
                    linkedinUrl: input.linkedinUrl || existing.linkedinUrl,
                },
            });
        }

        return this.createUser(input);
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
                    { platformCode: identifier },
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

    async getAvailablePlayers(excludeUserId?: string, limit = 50, search?: string): Promise<UserEntity[]> {
        const whereClause: any = {};
        const conditions: any[] = [];

        if (excludeUserId) {
            conditions.push({ id: { not: excludeUserId } });
        }

        if (search && search.trim()) {
            const query = search.trim();
            conditions.push({
                OR: [
                    { username: { contains: query, mode: "insensitive" } },
                    { platformCode: { contains: query, mode: "insensitive" } },
                    { institutionName: { contains: query, mode: "insensitive" } },
                ],
            });
        }

        if (conditions.length > 0) {
            whereClause.AND = conditions;
        }

        return prisma.user.findMany({
            where: whereClause,
            take: limit,
            orderBy: { rating: "desc" },
        });
    }
}
