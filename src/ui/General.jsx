import { arr } from "../utils/array.js"
import { Graph } from "./components/Graph.jsx"
import { useSim } from "./hooks.js"

export function General() {
  const { world } = useSim()

  return (
    <div>
      <Graph
        def={[
          { name: "axis", color: "#777", min: 0, max: 2 },
          { name: "energy", color: "#0000ff", lineWidth: 4, min: 0, max: 2 },
        ]}
        get={() => {
          return [
            1,
            arr.sum(world.organisms, (b) => b.energy) / world.organisms.length,
          ]
        }}
      />
    </div>
  )
}
