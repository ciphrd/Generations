import { arr } from "./array"

export const Metrics = {
  measures: {},
  samples: {},
  collect(name, value) {
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
    console.log(samples)
    const rows = [samples.map((s) => s[0]).join(",")]
    // for (
    //   let i = 0,
    //     m = arr.max(
    //       samples.map((s) => s[1]),
    //       (a) => a.length
    //     );
    //   i < m;
    //   i++
    // ) {
    //   const cols = []
    //   for (let j = 0; j < samples.length; j++) {
    //     cols.push(samples[j][1].length > i ? samples[j][1][i].toFixed(6) : "")
    //   }
    //   rows.push(cols.join(","))
    // }
    rows.push(samples.map((s) => arr.avg(s[1])).join(","))
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
