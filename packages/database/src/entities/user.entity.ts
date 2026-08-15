export interface UserEntity {
    id: string;
    username: string;
    email: string;
    rating: number;
    wins: number;
    losses: number;
    createdAt: Date;
    updatedAt: Date;
}