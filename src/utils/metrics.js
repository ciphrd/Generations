import { arr } from "./array"

export const Metrics = {
  measures: {},
  samples: {},
  collect: (name, value) => {
    if (!this.samples[name]) this.samples[name] = []
    this.samples[name].push(value)
  },
  time(name) {
    this.measures[name] = performance.now()
  },
  timeEnd(name) {
    if (!(name in this.measures)) throw `invalid timer end on "${name}"`
    this.collect(name, performance.now() - this.measures[name])
  },
  export() {
    const samples = Object.entries(this.samples)
    const rows = [samples[0].join(",")]
    for (let i = 0, m = arr.max(samples[1], (a) => a.length); i < m; i++) {
      const cols = []
      for (let j = 0; j < samples[1].length; i++) {
        cols.push(samples[1][j].length > i ? samples[1][j][i].toFixed(6) : "")
      }
      rows.push(cols.join(","))
    }
    downloadAsCsvFile("samples.csv", rows.join("\n"))
  },
}

function downloadAsCsvFile(filename, content) {
  const blob = new Blob([content], { type: "text/csv" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = filename.endsWith(".csv") ? filename : filename + ".csv"
  document.body.appendChild(a)
  a.click()

  // Cleanup
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
