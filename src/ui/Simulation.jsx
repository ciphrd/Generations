import { useRef, useEffect } from "react"
import { useEngine } from "./hooks.js"

export function Simulation() {
  const engine = useEngine()
  const $container = useRef()

  useEffect(() => {
    if (!$container.current) return
    engine.provideRenderingContainer($container.current)
    engine.start()

    return () => {
      // todo release rendering container
      engine.stop()
    }
  }, [])

  return <div className="sim-wrapper fullscreen" ref={$container} />
}
