import { useEffect, useMemo, useRef } from "react"
import { useTicker } from "../hooks"
import { GraphOperations } from "./GraphOperations.jsx"
import { Graph } from "./Graph.jsx"
import { arr } from "../../utils/array"

const a10 = arr.new(10)

export function CellCpu({ cpu }) {
  const ticker = useTicker()

  const $stack = useRef()
  useEffect(
    () =>
      ticker.emitter.on("tick", () => {
        if (!$stack.current) return
        for (let i = 0, c = $stack.current.childNodes; i < 10; i++) {
          c[i].innerText = cpu.stack.values[i].toFixed(2)
        }
      }),
    []
  )

  return (
    <div>
      <div>
        <div>Stack</div>
        <table className="stack">
          <tbody>
            <tr ref={$stack}>
              {a10.map((i) => (
                <td key={i} />
              ))}
            </tr>
          </tbody>
        </table>
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

      <div className="graphs">
        <div>Measures</div>
        <GraphOperations operations={() => cpu.operations} />

        <Graph
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

function CpuMeasures() {
  // return (
  // )
}

function CpuBytecode() {}
