import type { DomainEvent } from "../contracts/domain-event";

type EventListener<TEvent extends DomainEvent = DomainEvent> =
    (event: TEvent) => Promise<void>;

export class EventBus {
    private readonly listeners = new Map<
        string,
        EventListener[]
    >();

    subscribe(
        eventName: string,
        listener: EventListener,
    ): void {
        const existing = 
            this.listeners.get(eventName) ?? [];
        
        existing.push(listener);

        this.listeners.set(
            eventName,
            existing, 
        );

    }

    async publish(
        event: DomainEvent,
    ): Promise<void> {
        const listeners =
            this.listeners.get(
                event.eventName,
            ) ?? [];
            
        await Promise.all(
            listeners.map((listener) =>
            listener(event),
            ),
        );
    }       
}