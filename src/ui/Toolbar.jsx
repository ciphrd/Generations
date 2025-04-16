import { useEngine, useSim } from "./hooks"

export function Toolbar() {
  const { engine, running } = useSim()

  console.log({ running })

  return (
    <div className="toolbar">
      <button onClick={() => engine.toggle()}>
        {running ? "Pause" : "Start"}
      </button>

      <button
        disabled={running}
        onClick={() => {
          engine.ticker.tick()
          engine.renderer.render()
        }}
      >
        {">"}
      </button>

      <button
        disabled={running}
        onClick={() => {
          for (let i = 0; i < 100; i++) engine.ticker.tick()
          engine.renderer.render()
        }}
      >
        {">>"}
      </button>

      <button
        disabled={running}
        onClick={() => {
          for (let i = 0; i < 10000; i++) engine.ticker.tick()
          engine.renderer.render()
        }}
      >
        {">>>"}
      </button>
    </div>
  )
}
