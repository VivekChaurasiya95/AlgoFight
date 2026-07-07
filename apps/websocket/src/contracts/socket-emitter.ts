export interface SocketEmitter {
    emit<T>(
        event:string;
        payload:T;
    ); Promise<void>
}