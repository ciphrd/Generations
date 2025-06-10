import { Tabs } from "./components/Tabs.jsx"
import { Toolbar } from "./Toolbar.jsx"
import { Simulation } from "./Simulation.jsx"

export function Viewer() {
  return (
    <Tabs tabs={["Video [UCM...KPA...TODO]"]}>
      <main>
        <Simulation />
        <Toolbar />
      </main>
    </Tabs>
  )
}
