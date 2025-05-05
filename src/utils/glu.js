export const glu = {
  replaceVariables(shader, variables) {
    for (const [variable, value] of Object.entries(variables)) {
      console.log({ variable, value })
      shader = shader.replaceAll("$" + variable, value)
    }
    return shader
  },

  compileShader(gl, source, type) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw "could not compile shader:" + gl.getShaderInfoLog(shader)
    }

    return shader
  },

  program(
    gl,
    vertex,
    fragment,
    variables,
    { attributes = [], uniforms = [] } = {}
  ) {
    const program = gl.createProgram()

    vertex = this.replaceVariables(vertex, variables)
    fragment = this.replaceVariables(fragment, variables)

    const vertexShader = this.compileShader(gl, vertex, gl.VERTEX_SHADER)
    const fragmentShader = this.compileShader(gl, fragment, gl.FRAGMENT_SHADER)

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw "program failed to link:" + gl.getProgramInfoLog(program)
    }

    return {
      program,
      attributes: Object.fromEntries(
        attributes.map((attr) => [attr, gl.getAttribLocation(program, attr)])
      ),
      uniforms: Object.fromEntries(
        uniforms.map((unif) => [unif, gl.getUniformLocation(program, unif)])
      ),
    }
  },
}
