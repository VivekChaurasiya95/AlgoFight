export interface Transition<TState> {
    from: TState;
    to: readonly TState[];
}
