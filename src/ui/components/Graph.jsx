import { useRef, useEffect } from "react"
import { Graph as _Graph } from "../graph"
import { useEngine } from "../hooks"
import { StackGraph } from "../stacks"

const typemap = {
  lines: _Graph,
  stack: StackGraph,
}

export function Graph({ type = "lines", def, get }) {
  const engine = useEngine()
  const $wrapper = useRef()

  useEffect(() => {
    if (!$wrapper.current) return
    const graph = new typemap[type]($wrapper.current, engine, { def, get })
    return () => graph.release()
  }, [def, type, get])

  return <div ref={$wrapper} className="graph-wrapper"></div>
}
