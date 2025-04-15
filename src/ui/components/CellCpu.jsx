import { useEffect, useMemo, useRef } from "react"
import { useTicker } from "../hooks"
import { GraphOperations } from "./GraphOperations.jsx"
import { Graph } from "./Graph.jsx"

export function CellCpu({ cpu }) {
  const ticker = useTicker()

  const $stack = useRef()
  useEffect(
    () =>
      ticker.emitter.on("tick", () => {
        if (!$stack.current) return
        $stack.current.innerText = cpu.stack.values
          .map((v) => v.toFixed(1))
          .join(" ")
      }),
    []
  )

  return (
    <div>
      <div>
        <div>Stack</div>
        <div ref={$stack} className="stack"></div>
      </div>
      <div>
        <div>Bytecode</div>
        <div className="bytecode">
          {cpu.instructions.map((ins, idx) => (
            <span key={idx}>{ins.toString(16).padStart(2, "0")}</span>
          ))}
        </div>
        <div className="words">
          {cpu.instructions.map((ins, idx) => (
            <span key={idx}>{cpu.bytecode.mnemonics[ins]}</span>
          ))}
        </div>
      </div>

      <div>
        <div>Measures</div>
        <GraphOperations operations={() => cpu.operations} />

        <Graph
          type="stack"
          def={useMemo(
            () => [
              {
                name: "Instrucions executed",
                color: "#ff0000",
                min: 0,
                max: 128,
              },
            ],
            []
          )}
          get={() => [cpu.executed]}
        />
      </div>
    </div>
  )
}
