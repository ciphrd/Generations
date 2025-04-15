import { createContext, useState, useEffect } from "react"
import { Cell } from "./Cell.jsx"
import { Tabs } from "./components/Tabs.jsx"
import { General } from "./General.jsx"

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

export function Root({ engine: { world, selection, ticker } }) {
  const [state, setState] = useState({
    world,
    ticker,
    selected: selection.selected,
  })

  useEffect(() => {
    const off = selection.emitter.on("change", () => {
      setState((state) => ({
        ...state,
        selected: selection.selected,
      }))
    })
    return () => off()
  }, [])

  return (
    <Sim.Provider value={state}>
      <main>
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
      </main>
    </Sim.Provider>
  )
}
