import { useEngine, useSim } from "./hooks"

export function Toolbar() {
  const { engine, running, controls } = useSim()

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

      <div>
        <label>
          <input
            type="checkbox"
            checked={controls.autoTracking}
            onChange={() =>
              controls.instance.setTracking(!controls.autoTracking)
            }
          />
          auto tracking
        </label>

        <button onClick={() => controls.instance.tweakScale(-0.1)}>
          {"-"}
        </button>
        <button onClick={() => controls.instance.tweakScale(0.1)}>{"+"}</button>

        <button onClick={() => controls.instance.translate(0.1, 0)}>
          {"↤"}
        </button>
        <button onClick={() => controls.instance.translate(-0.1, 0)}>
          {"↦"}
        </button>

        <button onClick={() => controls.instance.translate(0, -0.1)}>
          {"↥"}
        </button>
        <button onClick={() => controls.instance.translate(0, 0.1)}>
          {"↧"}
        </button>
      </div>
    </div>
  )
}
