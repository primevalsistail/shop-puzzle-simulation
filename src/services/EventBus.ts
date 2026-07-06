import type { GameEventName } from '../types/index.js'

type Listener = (...args: unknown[]) => void

class EventBusImpl {
  private listeners = new Map<string, Set<Listener>>()

  on(event: GameEventName, listener: Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
  }

  off(event: GameEventName, listener: Listener): void {
    this.listeners.get(event)?.delete(listener)
  }

  emit(event: GameEventName, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach(fn => fn(...args))
  }

  once(event: GameEventName, listener: Listener): void {
    const wrapper: Listener = (...args) => {
      listener(...args)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }

  removeAllListeners(event?: GameEventName): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }
}

export const EventBus = new EventBusImpl()
