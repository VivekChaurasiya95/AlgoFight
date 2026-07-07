export interface SocketEvent<T> {
    event: string;
    room?: string;
    payload: T;
}