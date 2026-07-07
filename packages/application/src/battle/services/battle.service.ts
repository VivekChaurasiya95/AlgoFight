export class BattleService {
    async createBattle(
        roomId: string,
    ): Promise<void> {
        throw new Error("Not implemented")
    }

    async startBattle(
        roomId: string,
    ): Promise<void> {
        throw new Error("Not implemented");
    }

    async finishBattle(
        battleId: string,
    ): Promise<void> {
        throw new Error("Not implemented");
    }
}