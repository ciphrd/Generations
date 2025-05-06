import { arr } from "./array"

export function emitter() {
  const listeners = {}
  const queued = []

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
    pipe(to, evt, evtTarget = evt) {
      return this.on(evt, () => to.emit(evtTarget))
    },
    queue(evt) {
      if (queued.includes(evt)) return
      queued.push(evt)
    },
    runQueue() {
      queued.forEach((evt) => this.emit(evt))
      queued.length = 0
    },
  }
}
