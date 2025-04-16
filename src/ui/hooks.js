import { useContext } from "react"
import { Sim } from "./root.jsx"

export function useSim() {
  return useContext(Sim)
}

export function useEngine() {
  return useSim().engine
}

export function useRunning() {
  return useSim().running
}

export function useSelected() {
  return useSim().selected
}

export function useWorld() {
  return useEngine().world
}

export function useTicker() {
  return useEngine().ticker
}
