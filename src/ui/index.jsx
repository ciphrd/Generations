import { createRoot } from "react-dom/client"
import { Root } from "./root.jsx"

export function ui(engine) {
  createRoot(document.body.querySelector("#root")).render(
    <Root engine={engine} />
  )
}
