export class RoomNotFoundError extends Error {
    constructor(roomId: string) {
        super(`Room '${roomId}' not found`);

        this.name = "RoomFoundError";
    }
}

export class RoomFullError extends Error {
    constructor(roomId: string) {
        super(`Room '${roomId}' not found`);

        this.name = "RoomNotFoundError";
    }
}

export class PlayersAlreadyJoinedError extends Error {
    constructor() {
        super("Player has already joined this room");

        this.name = "PlayerAlreadyJoinedError";
    }
}

export class PlayerNotFoundError extends Error {
    constructor(userId: string) {
        super(`Player '${userId}' not found`);

        this.name = "PlayerNotFoundError";
    }
}

export class BattleAleadyStartedError extends Error {
    constructor() {
        super("Battle has already started");

        this.name = "BattleAlreadyStartedError";
    }
}