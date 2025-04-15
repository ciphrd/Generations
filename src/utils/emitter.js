import { arr } from "./array"

export function emitter() {
  const listeners = {}

  return {
    on(evt, listener) {
      if (!listeners[evt]) listeners[evt] = []
      listeners[evt].push(listener)
      return () => arr.del(listeners[evt], listener)
    },
    emit(evt) {
      if (listeners[evt]) {
        listeners[evt].forEach((cb) => cb())
      }
    },
  }
}
