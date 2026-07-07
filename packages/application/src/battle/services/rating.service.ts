export class RatingService {

    async updateRating(
        winnerId: string,
        loserId: string,
    ): Promise<void> {
        throw new Error("Not implemented");
    }

    calculateElo(
        winnerRating: number,
        loserRating: number,
    ): {
        winnerRating: number;
        loserRating: number;
    } {
        throw new Error("Not implemented");
    }
}