import { UserRepository } from "@algofight/database";

export interface EloResult {
    winnerNewRating: number;
    loserNewRating: number;
    ratingDelta: number;
}

export class RatingService {
    private readonly K_FACTOR = 32;

    constructor(private readonly userRepository: UserRepository) { }

    calculateElo(winnerRating: number, loserRating: number):
        EloResult {
        const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
        const delta = Math.round(this.K_FACTOR * (1 - expectedWinner));

        return {
            winnerNewRating: winnerRating + delta,
            loserNewRating: Math.max(100, loserRating - delta),

            ratingDelta: delta,
        };
    }


    async applyBattleResult(winnerId: string, loserId: string):
        Promise<EloResult> {
        const winner = await this.userRepository.getUserById(winnerId);

        const loser = await this.userRepository.getUserById(loserId);

        if (!winner || !loser) {
            throw new Error("Cannot update the ratings: User not found");
        }

        const elo = this.calculateElo(winner.rating, loser.rating);
        await this.userRepository.updateRating(winnerId, elo.winnerNewRating, true);
        await this.userRepository.updateRating(loserId, elo.loserNewRating, false);

        return elo;
    }
}