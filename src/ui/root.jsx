import { createContext, useState, useEffect } from "react"
import { Cell } from "./Cell.jsx"
import { Tabs } from "./components/Tabs.jsx"
import { General } from "./General.jsx"
import { Viewer } from "./Viewer.jsx"

export const Sim = createContext({})

/**
 * todo.
 *  - Think about how the UI should be constructed a bit more
 *  - UI components
 *    - Global body info
 *      - details
 *      - signals received
 *      - energy
 *      - friction
 *      - operations generated
 *      - growth DNA?
 *    - Inspect each CPU
 *      - activity (nb of instructions executed, up to 128 (max defined))
 *      - bytecode within
 *      - real time stack
 *      - operations emitted by CPU
 *      - maybe each operation is inspected individually
 * - Potentially make graphs interactive
 *   - Hovering should display units and values measured
 *     (potentially use a canvas layered on top for this)
 * - Improve graphs aesthetics
 *   - add grid ?
 */

/**
 * Rendering
 * - Nodes
 * - Food
 * - Activations
 *   - Signals
 *   -
 */

export function Root({ engine }) {
  const [state, setState] = useState({
    engine,
    selected: selection.selected,
    running: engine.ticker.running,
    controls: engine.controls.get(),
  })

  useEffect(() => {
    setState((state) => ({
      ...state,
      running: engine.ticker.running,
    }))
    const offs = [
      engine.selection.emitter.on("change", () =>
        setState((state) => ({
          ...state,
          selected: selection.selected,
        }))
      ),
      engine.ticker.emitter.on("start/stop", () =>
        setState((state) => ({
          ...state,
          running: engine.ticker.running,
        }))
      ),
      engine.controls.emitter.on("updated", () => {
        setState((state) => ({
          ...state,
          controls: engine.controls.get(),
        }))
      }),
    ]
    return () => offs.forEach((off) => off())
  }, [])

  return (
    <Sim.Provider value={state}>
      <Viewer />
      <aside>
        {state.selected ? (
          <>
            <Tabs tabs={["General", "Cell"]} defaultTab={1}>
              <>
                <General />
              </>
              <>
                <Cell />
              </>
            </Tabs>
          </>
        ) : (
          <div>no selection</div>
        )}
      </aside>
    </Sim.Provider>
  )
}
