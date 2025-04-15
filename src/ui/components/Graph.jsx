import { useRef, useEffect } from "react"
import { Graph as _Graph } from "../graph"
import { useTicker } from "../hooks"
import { StackGraph } from "../stacks"

const typemap = {
  lines: _Graph,
  stack: StackGraph,
}

export function Graph({ type = "lines", def, get }) {
  const ticker = useTicker()
  const $wrapper = useRef()

  useEffect(() => {
    if (!$wrapper.current) return
    const graph = new typemap[type]($wrapper.current, ticker, { def, get })
    return () => graph.release()
  }, [def, type])

  return <div ref={$wrapper} className="graph-wrapper"></div>
}
