import { strHash } from "./string"

let libs = {}
let quadBuffer = null

const includeRgx = /^#include <([a-zA-Z\-]+)\.glsl>$/

const programMap = {}

export const glu = {
  libs(dict) {
    libs = dict
  },
  quadBuffer(gl) {
    if (quadBuffer) return quadBuffer
    quadBuffer = this.buffer(
      gl,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
    )
    return quadBuffer
  },

  buffer(gl, geometry, usage = gl.STATIC_DRAW) {
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, geometry, usage)
    return buffer
  },

  renderTarget(
    gl,
    width,
    height,
    format = gl.RGBA32F,
    { sampling = gl.LINEAR, wrap = gl.CLAMP_TO_EDGE, depth = false } = {
      sampling: gl.LINEAR,
      wrap: gl.CLAMP_TO_EDGE,
      depth: false,
    }
  ) {
    const { fb, textures } = this.renderTargetN(gl, width, height, 1, format, {
      sampling,
      wrap,
      depth,
    })
    return { texture: textures[0], fb }
  },

  /**
   * @param {WebGLRenderingContext} gl
   */
  renderTargetN(
    gl,
    width,
    height,
    numAttachments = 1,
    format = gl.RGBA32F,
    { sampling = gl.LINEAR, wrap = gl.CLAMP_TO_EDGE, depth = false } = {
      sampling: gl.LINEAR,
      wrap: gl.CLAMP_TO_EDGE,
      depth: false,
    }
  ) {
    const formats = {
      [gl.RGBA32F]: [gl.RGBA, gl.FLOAT],
    }
    const internal = formats[format]
    if (!internal) throw `unsupported format`

    const textures = []
    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)

    for (let i = 0; i < numAttachments; i++) {
      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        format,
        width,
        height,
        0,
        internal[0],
        internal[1],
        null
      )
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampling)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap)

      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0 + i,
        gl.TEXTURE_2D,
        texture,
        0
      )

      textures.push(texture)
    }

    if (depth) {
      console.log("depth !!!")
      const depthBuffer = gl.createRenderbuffer()
      gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer)
      gl.renderbufferStorage(
        gl.RENDERBUFFER,
        gl.DEPTH_COMPONENT16,
        width,
        height
      )
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER,
        depthBuffer
      )
    }

    return { textures, fb }
  },

  bindFB(gl, width, height, framebuffer = null) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.viewport(0, 0, width, height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  },

  blend(gl, fn1, fn2) {
    if (!fn1) {
      gl.disable(gl.BLEND)
      return
    }
    gl.enable(gl.BLEND)
    gl.blendFunc(fn1, fn2)
  },

  dynamicBuffer(gl, geometry, update) {
    const buffer = this.buffer(gl, geometry, gl.DYNAMIC_DRAW)

    return {
      buffer,
      update: () => {
        const geo = update()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        if (geometry.length === geo.length) {
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, geo)
        } else {
          gl.bufferData(gl.ARRAY_BUFFER, geo, gl.DYNAMIC_DRAW)
        }
      },
    }
  },

  replaceVariables(shader, variables) {
    const lines = shader.split("\n")
    for (let i = 0; i < lines.length; i++) {
      const res = includeRgx.exec(lines[i])
      if (res) {
        const lib = res[1]
        if (!libs[lib])
          throw `Error when pre-processing shader: lib "${lib}" is not available`
        lines[i] = libs[lib]
      }
    }
    shader = lines.join("\n")
    for (const [variable, value] of Object.entries(variables)) {
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
    { attributes = [], uniforms = [], variables = {}, debug = false } = {}
  ) {
    vertex = this.replaceVariables(vertex, variables)
    fragment = this.replaceVariables(fragment, variables)

    const hash = `${strHash(vertex)}-${strHash(fragment)}`
    if (programMap[hash]) return programMap[hash]

    const program = gl.createProgram()

    if (debug) {
      console.log(vertex)
      console.log(fragment)
    }
    const vertexShader = this.compileShader(gl, vertex, gl.VERTEX_SHADER)
    const fragmentShader = this.compileShader(gl, fragment, gl.FRAGMENT_SHADER)

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw "program failed to link:" + gl.getProgramInfoLog(program)
    }

    const programObject = {
      program,
      attributes: Object.fromEntries(
        attributes.map((attr) => [attr, gl.getAttribLocation(program, attr)])
      ),
      uniforms: Object.fromEntries(
        uniforms.map((unif) => [unif, gl.getUniformLocation(program, unif)])
      ),
    }

    programMap[hash] = programObject
    return programObject
  },

  uniformTex(gl, location, texture, index = 0) {
    gl.activeTexture(gl.TEXTURE0 + index)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.uniform1i(location, index)
  },
}
