import { useMemo } from "react"
import { Graph } from "./Graph.jsx"

export function GraphOperations({ operations }) {
  return (
    <Graph
      type="stack"
      def={useMemo(
        () => [
          {
            name: "actuator",
            color: `rgba(255,0,0,0.7)`,
            min: 0,
            max: 1,
          },
          {
            name: "grab",
            color: `rgba(0,255,0,0.7)`,
            min: 0,
            max: 1,
          },
          {
            name: "forward",
            color: `rgba(255,255,0,0.7)`,
            min: 0,
            max: 1,
          },
          {
            name: "backward",
            color: `rgba(0,255,255,0.7)`,
            min: 0,
            max: 1,
          },
        ],
        []
      )}
      get={() => {
        const ops = operations()
        return [
          ops.find((op) => op.name === "actuate")?.strength || 0,
          ops.find((op) => op.name === "grab")?.strength || 0,
          ops.find((op) => op.name === "forward")?.strength || 0,
          ops.find((op) => op.name === "backward")?.strength || 0,
        ]
      }}
    />
  )
}
