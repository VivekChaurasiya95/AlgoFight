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

    async applyMultiplayerBattleResult(rankedUserIds: string[]): Promise<Record<string, EloResult>> {
        const users = await Promise.all(rankedUserIds.map(id => this.userRepository.getUserById(id)));
        const validUsers = users.filter(u => u !== null);
        
        if (validUsers.length < 2) {
            return {};
        }

        const deltas = new Map<string, number>();

        for (const user of validUsers) {
            deltas.set(user!.id, 0);
        }

        // Pairwise Elo calculation
        for (let i = 0; i < validUsers.length; i++) {
            for (let j = i + 1; j < validUsers.length; j++) {
                const winner = validUsers[i]!;
                const loser = validUsers[j]!;

                const elo = this.calculateElo(winner.rating, loser.rating);
                
                const winnerGain = elo.winnerNewRating - winner.rating;
                const loserLoss = loser.rating - elo.loserNewRating;

                deltas.set(winner.id, deltas.get(winner.id)! + winnerGain);
                deltas.set(loser.id, deltas.get(loser.id)! - loserLoss);
            }
        }

        const results: Record<string, EloResult> = {};
        const midPoint = validUsers.length / 2;
        
        for (let i = 0; i < validUsers.length; i++) {
            const user = validUsers[i]!;
            const newRating = Math.max(100, user.rating + deltas.get(user.id)!);
            const isWin = i < midPoint; // Top half gets a win, bottom half gets a loss
            
            await this.userRepository.updateRating(user.id, newRating, isWin);
            
            results[user.id] = {
                winnerNewRating: newRating,
                loserNewRating: newRating, // Not strictly applicable in multiplayer, but matches interface
                ratingDelta: deltas.get(user.id)!,
            };
        }

        return results;
    }
}