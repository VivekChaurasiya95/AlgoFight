export interface StateMachine<TState> {
    canTransition(current: TState, next: TState): boolean;

    transition(current: TState, next: TState): TState;

    getAvailableTransitions(current: TState): readonly TState[];
    
}