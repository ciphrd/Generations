export function emitter() {
  const listeners = {}

  return {
    on(evt, listener) {
      if (!listeners[evt]) listeners[evt] = []
      listeners[evt].push(listener)
    },
    emit(evt) {
      if (listeners[evt]) {
        listeners[evt].forEach((cb) => cb())
      }
    },
  }
}
