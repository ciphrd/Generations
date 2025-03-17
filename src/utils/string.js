import { arr } from "./array"

export const str = {
  letters: (s) => arr.dedup(s.match(/[a-z]/g)),
}
