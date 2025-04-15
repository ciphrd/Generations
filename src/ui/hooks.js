import { useContext } from "react"
import { Sim } from "./root.jsx"

export function useSim() {
  return useContext(Sim)
}

export function useSelected() {
  return useSim().selected
}

export function useWorld() {
  return useSim().world
}

export function useTicker() {
  return useSim().ticker
}
