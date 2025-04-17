import { useRef, useMemo, useEffect, useCallback } from "react"
import { clamp01 } from "../utils/math"
import { Graph } from "./components/Graph.jsx"
import { useSelected, useSim } from "./hooks"
import { Tabs } from "./components/Tabs.jsx"
import { arr } from "../utils/array"
import { CellCpu } from "./components/CellCpu.jsx"
import { GraphOperations } from "./components/GraphOperations.jsx"
import { Row, Table } from "./components/Table.jsx"

const a4 = arr.new(4)

export function Cell() {
  const { engine, selected } = useSim()

  const $energy = useRef()
  useEffect(
    () =>
      engine.ticker.emitter.on("tick", () => {
        if (!$energy.current) return
        $energy.current.innerText = selected.energy.toFixed(2)
      }),
    [selected]
  )

  return (
    <div className="panel">
      <Table colHeader>
        <Row>
          <span>ID</span>
          <span>{selected.id}</span>
        </Row>
        <Row>
          <span>Organism ID</span>
          <span>{selected.data.organism}</span>
        </Row>
        <Row>
          <span>Energy</span>
          <span ref={$energy}></span>
        </Row>
      </Table>

      <div className="graphs">
        <Graph
          def={useMemo(
            () => [
              {
                name: "clock",
                color: "#00ff00",
                min: 0,
                max: 1,
              },
              {
                name: "vision",
                color: "#ff00ff",
                min: 0,
                max: 1,
              },
              {
                name: "smell",
                color: "#00ffff",
                min: 0,
                max: 1,
              },
            ],
            []
          )}
          get={useCallback(() => {
            const sensors = selected.sensors
            return [
              sensors.find((sensor) => sensor.name === "clock")?.activation ||
                0,
              sensors.find((sensor) => sensor.name === "vision")?.activation ||
                0,
              sensors.find((sensor) => sensor.name === "smell")?.activation ||
                0,
            ]
          }, [selected])}
        />
        <Graph
          def={useMemo(
            () => [
              {
                name: "chem0",
                color: "#00ff00",
                min: 0,
                max: 1,
              },
              {
                name: "chem1",
                color: "#ff00ff",
                min: 0,
                max: 1,
              },
              {
                name: "chem2",
                color: "#00ffff",
                min: 0,
                max: 1,
              },
              {
                name: "chem3",
                color: "#ff0000",
                min: 0,
                max: 1,
              },
            ],
            []
          )}
          get={useCallback(() => selected.receivedSignals, [selected])}
        />
        <Graph
          def={useMemo(
            () => [
              {
                name: "emit-chem0",
                color: "#00ff00",
                min: 0,
                max: 1,
              },
              {
                name: "emit-chem1",
                color: "#ff00ff",
                min: 0,
                max: 1,
              },
              {
                name: "emit-chem2",
                color: "#00ffff",
                min: 0,
                max: 1,
              },
              {
                name: "emit-chem3",
                color: "#ff0000",
                min: 0,
                max: 1,
              },
            ],
            []
          )}
          get={useCallback(() => {
            const fireOps = selected.operations.filter(
              (op) => op.name === "fire"
            )
            const chems = arr.new(4, 0)
            let found
            for (let i = 0; i < 4; i++) {
              found = fireOps.find((op) => op.values[0] === i)
              if (found) chems[i] = found.chemicalStrength
            }
            return chems
          }, [selected])}
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
