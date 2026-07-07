export enum SocketEvent {
    SUBMISSION_QUEUED = "submission.queued",

    SUBMISSION_STARTED = "submission.started",

    SUBMISSION_COMPLETED = "submission.completed",

    SUBMISSION_FAILED = "submission.failed",

    ROOM_CREATED = "room.created",

    PLAYER_JOINED = "room.player.joined",

    PLAYER_LEFT = "room.player.left",

    BATTLE_STARTED = "battle.started",

    BATTLE_FINISHED = "battle.finished",
}