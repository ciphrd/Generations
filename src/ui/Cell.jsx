import { useRef, useMemo, useEffect } from "react"
import { clamp01 } from "../utils/math"
import { Graph } from "./components/Graph.jsx"
import { useSelected, useSim } from "./hooks"
import { Tabs } from "./components/Tabs.jsx"
import { arr } from "../utils/array"
import { CellCpu } from "./components/CellCpu.jsx"
import { GraphOperations } from "./components/GraphOperations.jsx"

const a4 = arr.new(4)

export function Cell() {
  const { ticker, selected } = useSim()

  const $energy = useRef()
  useEffect(
    () =>
      ticker.emitter.on("tick", () => {
        if (!$energy.current) return
        $energy.current.innerText = selected.energy.toFixed(2)
      }),
    [selected]
  )

  return (
    <div className="panel">
      <div className="details">
        <span>ID</span>
        <span>{selected.id}</span>
        <span>Organism ID</span>
        <span>{selected.data.organism}</span>
        <span>Energy</span>
        <span ref={$energy}></span>
      </div>

      <div className="graphs">
        <Graph
          def={useMemo(
            () => [
              {
                name: "token-chem0",
                color: "#00ff00",
                min: 0,
                max: 1,
              },
              {
                name: "token-chem1",
                color: "#ff00ff",
                min: 0,
                max: 1,
              },
              {
                name: "token-chem2",
                color: "#00ffff",
                min: 0,
                max: 1,
              },
              {
                name: "token-chem3",
                color: "#ff0000",
                min: 0,
                max: 1,
              },
            ],
            []
          )}
          get={() => selected.signals}
        />
        <Graph
          def={useMemo(
            () => [
              {
                name: "friction",
                color: "#ff0000",
                min: 0,
                max: 1,
              },
            ],
            []
          )}
          get={() => [selected.friction]}
        />
        <GraphOperations operations={() => selected.operations} />
      </div>

      <div>
        <Tabs tabs={["Act.1", "Act.2", "Act.3", "Act.4"]}>
          {a4.map((i) => (
            <CellCpu cpu={selected.cpus[i]} />
          ))}
        </Tabs>
      </div>
    </div>
  )
}
