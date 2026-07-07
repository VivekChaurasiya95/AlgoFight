export interface MatchmakingRepository {

    enqueuePlayer(
        playerId: string,
    ): Promise<void>;

    dequeuePlayer(
        playerId: string,
    ): Promise<void>;

    findCompatiblePlayers(
        playerId: string,
    ): Promise<string[]>;
}