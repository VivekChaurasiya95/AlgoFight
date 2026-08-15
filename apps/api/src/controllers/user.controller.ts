import { PrismaUserRepository, UserRepository } from "@algofight/database";

export class UserController {
    private readonly userRepository: UserRepository;

    constructor(userRepository?: UserRepository) {
        this.userRepository = userRepository ?? new PrismaUserRepository();
    }

    async createUser(username: string, email: string) {
        return this.userRepository.createUser({
            username,
            email
        });
    }

    async getUserById(id: string) {
        const user = await this.userRepository.getUserById(id);

        if (!user) throw new Error(`User with ID ${id} not found`);

        return user;
    }

    async getAvailablePlayers(excludeUserId?: string, limit?: number) {
        return this.userRepository.getAvailablePlayers(excludeUserId, limit);
    }

}