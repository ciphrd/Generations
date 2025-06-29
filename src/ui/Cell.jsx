import { useMemo, useCallback } from "react"
import { Graph } from "./components/Graph.jsx"
import { useSim } from "./hooks"
import { Tabs } from "./components/Tabs.jsx"
import { arr } from "../utils/array"
import { CellCpu } from "./components/CellCpu.jsx"
import { GraphOperations } from "./components/GraphOperations.jsx"
import { Row, Table } from "./components/Table.jsx"

const a4 = arr.new(4)

export function Cell() {
  const { engine, selected } = useSim()

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
      </Table>

      <div className="graphs">
        <Graph
          def={useMemo(
            () => [
              {
                name: "clock",
                color: "#00ff00",
                min: -1,
                max: 1,
              },
              {
                name: "vision",
                color: "#ff00ff",
                min: -1,
                max: 1,
              },
              {
                name: "smell",
                color: "#00ffff",
                min: -1,
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
          on="solver:prepared"
          def={useMemo(
            () => [
              {
                name: "chem0",
                color: "#00ff00",
                min: -1,
                max: 1,
              },
            ],
            []
          )}
          get={useCallback(() => [selected.signal], [selected])}
        />
        <Graph
          def={useMemo(
            () => [
              {
                name: "emit-chem0",
                color: "#00ff00",
                min: -1,
                max: 1,
              },
            ],
            []
          )}
          get={useCallback(() => {
            const fireOp = selected.operations.find((op) => op.name === "fire")
            const chems = [0]
            if (fireOp) chems[0] = fireOp.strength
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
