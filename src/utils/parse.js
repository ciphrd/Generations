export function parseParams(str) {
  const params = []
  let buffer = "",
    depth = 0,
    inString = false,
    stringChar = "",
    escape = false

  for (let i = 0; i < str.length; i++) {
    const char = str[i]

    if (escape) {
      buffer += char
      escape = false
      continue
    }
    if (char === "\\") {
      buffer += char
      escape = true
      continue
    }

    if (inString) {
      buffer += char
      if (char === stringChar) {
        inString = false
        stringChar = ""
      }
      continue
    }

    if (char === "'" || char === '"') {
      inString = true
      stringChar = char
      buffer += char
    } else if (char === "{") {
      depth++
      buffer += char
    } else if (char === "}") {
      depth--
      buffer += char
    } else if (char === "(") {
      depth++
      buffer += char
    } else if (char === ")") {
      depth--
      buffer += char
    } else if (char === "," && depth === 0) {
      params.push(buffer.trim())
      buffer = ""
    } else {
      buffer += char
    }
  }

  if (buffer.trim() !== "") {
    params.push(buffer.trim())
  }

  return params
}
