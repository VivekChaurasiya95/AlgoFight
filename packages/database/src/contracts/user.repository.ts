import { UserEntity } from "../entities/user.entity";

export interface CreateUserInput {
    username: string;
    email: string;
}

export interface UserRepository {
    createUser(input: CreateUserInput): Promise<UserEntity>;
    getUserById(id: string): Promise<UserEntity | null>;
    getUserByUsername(username: string): Promise<UserEntity | null>;
    updateRating(userId: string, newRating: number, isWin: boolean): Promise<UserEntity>;
    getAvailablePlayers(excludeUserId?: string, limit?: number): Promise<UserEntity[]>;
}