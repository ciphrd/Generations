export function bytecodeToMnemonics(bytes, bytecode) {
  const instructions = bytecode.parser(bytes)
  const words = instructions.map((ins) => bytecode.mnemonics[ins])
  return words.join(" ")
}
