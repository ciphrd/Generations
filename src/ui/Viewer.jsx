import { useRef, useEffect } from "react"
import { Tabs } from "./components/Tabs.jsx"
import { useEngine } from "./hooks.js"
import { Toolbar } from "./Toolbar.jsx"

export function Viewer() {
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

  return (
    <Tabs tabs={["Video [UCM...KPA...TODO]"]}>
      <main>
        <div className="sim-wrapper" ref={$container} />
        <Toolbar />
      </main>
    </Tabs>
  )
}
