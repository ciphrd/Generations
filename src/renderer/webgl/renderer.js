import { glu } from "../../utils/glu"
import { vec2 } from "../../utils/vec"
import { Renderer } from "../renderer"
import mathGL from "./shaders/lib/math.glsl"
import noiseGL from "./shaders/lib/noise.glsl"
import cellGL from "./shaders/lib/cell.glsl"
import fullVS from "./shaders/full.vert.glsl"
import textureFS from "./shaders/texture.frag.glsl"
import quadVS from "./shaders/quad.vert.glsl"
import cellFS from "./shaders/cell.frag.glsl"
import liaisonVS from "./shaders/liaison.vert.glsl"
import liaisonFS from "./shaders/liaison.frag.glsl"
import liaisonTempFS from "./shaders/liaison-temp.frag.glsl"
import bacteriasFS from "./shaders/bacterias.frag.glsl"
import fieldLiaisonFS from "./shaders/field-liaison.frag.glsl"
import fieldCellFS from "./shaders/field-cell.frag.glsl"
import foodFS from "./shaders/food.frag.glsl"
import compFS from "./shaders/composition.frag.glsl"
import membraneFS from "./shaders/membrane.frag.glsl"
import { PointsRenderer } from "./points"
import { LiaisonsRenderer } from "./liaisons"
import { Spring, SpringFlags } from "../../physics/constraints/spring"
import { settings } from "../../settings"
import { EdgePass } from "./edge"
import { GaussianPass } from "./gaussian"
import { MembranePass } from "./membrane"
import { OuterShell } from "./outer-shell"

const W = 800
const H = 800
const tW = W * devicePixelRatio
const tH = H * devicePixelRatio

/**
 * todo.
 *
 * ( ) modulate the shape of the cells / membrane on all the fragment shaders
 *     where these are rendered for consistency
 *     (include the liaison deformation)
 *
 *
 * (x) initial webgl setup
 * ( ) render cells & springs
 *   ( ) optimized pipeline for instancing
 *   ( ) instanced rendering of cells
 *   ( ) instanced rendering of springs
 * ( ) Have a single buffer with all the body positions
 *   ( ) Pass the buffer as a uniform, use sections of this buffer to render
 *       different bodies with different shaders ?
 * ( ) render other bodies
 * ( ) optimized updates (new springs, bodies, etc...)
 * ( ) shading of cells/springs
 * ( ) add details to environment
 *   ( ) agent-based simulation for dust-noise pattern, influenced by the
 *       the motion of bodies in the space
 *   ( ) various patterns to add texture, controllable via parameters
 *
 * ( ) 3d lighting using the field map as a depth layer. can be used to add
 *     subtle depth which can be observed through the microscope sometimes
 * ( ) subtle reaction diffusion trail
 * ( ) apply (edge2)->[blur]->[sharpness] to remove the 1px artifact on the
 *     edges due to the 2 passes of [edge] on the field
 * ( ) looking at touch, there's a limit node between the 2 edge passes, which
 *     allows getting much better edges. to test
 * ( ) to try
 *     potentially render every cell with a different color, such that
 *     there is a visual border which can be used to compute the edges
 *
 * ( ) IMPORTANT !
 *     Do not render the cells/liaisons on the full quads, or it creates
 *     artifacts on the edges.
 */

export class WebGLRenderer extends Renderer {
  constructor(world, selection) {
    super(world, selection)

    this.cvs = document.createElement("canvas")
    this.cvs.width = tW
    this.cvs.height = tH
    this.cvs.style.width = W + "px"
    this.cvs.style.height = H + "px"

    this.gl = this.cvs.getContext("webgl2")
    this.texel = vec2(1 / this.cvs.width, 1 / this.cvs.height)

    this.gl.getExtension("EXT_color_buffer_float")
    this.gl.getExtension("EXT_float_blend")
    this.gl.getExtension("OES_texture_float_linear")

    glu.libs({
      math: mathGL,
      noise: noiseGL,
      cell: cellGL,
    })

    this.vaos = {}
    this.prepare()
  }

  providerRenderingContainer($container) {
    super.providerRenderingContainer($container)
    $container.appendChild(this.cvs)
  }

  render() {
    const { gl, world } = this
    const { organisms, liaisons } = world
    const nb = organisms.length

    for (let i = 0; i < nb; i++) {
      this.cells.geo1[i * 4 + 0] = organisms[i].pos.x
      this.cells.geo1[i * 4 + 1] = organisms[i].pos.y
      this.cells.geo1[i * 4 + 2] = organisms[i].radius
      this.cells.geo1[i * 4 + 3] = organisms[i].id

      this.cells.geo2[i * 4 + 0] = organisms[i].forwards.x
      this.cells.geo2[i * 4 + 1] = organisms[i].forwards.y
    }

    //
    // Render field, merging the cells / liaisons in a smooth way
    //
    glu.bindFB(gl, tW, tH, this.fieldRT.fb)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LESS)
    glu.blend(gl, null)
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1])

    gl.useProgram(this.programs.fieldCell.program)
    gl.bindVertexArray(this.vaos.fieldCell)
    gl.uniform4fv(this.programs.fieldCell.uniforms.u_points, this.cells.geo1)
    gl.uniform4fv(this.programs.fieldCell.uniforms.u_points2, this.cells.geo2)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, nb)

    gl.useProgram(this.programs.fieldLiaison.program)
    gl.bindVertexArray(this.vaos.fieldLiaison)
    gl.uniform4fv(this.programs.fieldLiaison.uniforms.u_points, this.cells.geo1)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, liaisons.length)

    gl.disable(gl.DEPTH_TEST)

    //
    // Compute edges on the field to create the shell of the membrane
    //
    this.membranePass.render()
    this.outerShell.render()

    //
    // Render the light absorption layer, composed of the different bodies
    // which absorb light
    //

    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LESS)
    glu.blend(gl, null)

    glu.bindFB(gl, tW, tH, this.absorbRT.fb)

    gl.useProgram(this.programs.cells.program)
    gl.bindVertexArray(this.vaos.cells)
    gl.uniform4fv(this.programs.cells.uniforms.u_points, this.cells.geo1)
    gl.uniform4fv(this.programs.cells.uniforms.u_points2, this.cells.geo2)
    glu.uniformTex(
      gl,
      this.programs.cells.uniforms.u_blurred_membrane,
      this.outerShell.output
    )
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, nb)

    gl.useProgram(this.programs.liaisons.program)
    gl.bindVertexArray(this.vaos.liaisons)
    gl.uniform4fv(this.programs.liaisons.uniforms.u_points, this.cells.geo1)
    glu.uniformTex(
      gl,
      this.programs.liaisons.uniforms.u_blurred_membrane,
      this.outerShell.output
    )
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, liaisons.length)

    gl.disable(gl.DEPTH_TEST)

    glu.blend(gl, gl.ONE, gl.ONE)
    gl.useProgram(this.programs.membrane.program)
    gl.bindVertexArray(this.vaos.membrane)
    glu.uniformTex(
      gl,
      this.programs.membrane.uniforms.u_texture,
      this.membranePass.output
    )
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    // this.bacterias.render()
    // this.food.render()
    // this.bindLiaisons.render()

    glu.bindFB(gl, tW, tH, null)
    glu.blend(gl, null)

    gl.useProgram(this.programs.comp.program)
    gl.bindVertexArray(this.compVao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.absorbRT.texture)
    gl.uniform1i(this.programs.comp.uniforms.u_texture, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    // gl.useProgram(this.programs.tex.program)
    // gl.bindVertexArray(this.vaos.tex)
    // gl.activeTexture(gl.TEXTURE0)
    // gl.bindTexture(gl.TEXTURE_2D, this.membranePass.output)
    // gl.uniform1i(this.programs.tex.uniforms.u_texture, 0)
    // gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  prepare() {
    let loc
    const { gl, world } = this
    const { organisms, liaisons } = world

    const nb = organisms.length
    this.cells = {
      geo1: new Float32Array(nb * 4),
      geo2: new Float32Array(nb * 4),
    }

    const nbLiaisons = liaisons.length
    const liaisonIndices = new Uint16Array(nbLiaisons * 2)
    for (let i = 0; i < nbLiaisons; i++) {
      liaisonIndices[i * 2 + 0] = organisms.indexOf(liaisons[i].bodyA)
      liaisonIndices[i * 2 + 1] = organisms.indexOf(liaisons[i].bodyB)
    }

    this.programs = {
      fieldCell: glu.program(gl, quadVS, fieldCellFS, {
        attributes: ["a_position"],
        uniforms: ["u_points", "u_points2"],
        variables: {
          NUM_POINTS: nb,
          CELL_SCALE: settings.rendering.cell.scale,
        },
      }),
      fieldLiaison: glu.program(gl, liaisonVS, fieldLiaisonFS, {
        attributes: ["a_position", "a_endpoints"],
        uniforms: ["u_points"],
        variables: {
          NUM_POINTS: nb,
          CELL_SCALE: settings.rendering.cell.scale,
        },
      }),
      membrane: glu.program(gl, fullVS, membraneFS, {
        attributes: ["a_position"],
        uniforms: ["u_texture"],
      }),
      cells: glu.program(gl, quadVS, cellFS, {
        attributes: ["a_position"],
        uniforms: ["u_points", "u_points2", "u_blurred_membrane"],
        variables: {
          NUM_POINTS: nb,
          CELL_SCALE: settings.rendering.cell.scale,
        },
      }),
      liaisons: glu.program(gl, liaisonVS, liaisonFS, {
        attributes: ["a_position", "a_endpoints"],
        uniforms: ["u_points", "u_blurred_membrane"],
        variables: {
          NUM_POINTS: nb,
          CELL_SCALE: settings.rendering.cell.scale,
        },
      }),
      comp: glu.program(gl, fullVS, compFS, {
        attributes: ["a_position"],
        uniforms: ["u_texture"],
      }),
      tex: glu.program(gl, fullVS, textureFS, {
        attributes: ["a_position"],
        uniforms: ["u_texture"],
      }),
    }

    const quadBuffer = glu.quadBuffer(gl)

    this.vaos.fieldCell = gl.createVertexArray()
    loc = this.programs.fieldCell.attributes.a_position
    gl.bindVertexArray(this.vaos.fieldCell)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    this.vaos.cells = gl.createVertexArray()
    loc = this.programs.cells.attributes.a_position
    gl.bindVertexArray(this.vaos.cells)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    this.vaos.membrane = gl.createVertexArray()
    loc = this.programs.membrane.attributes.a_position
    gl.bindVertexArray(this.vaos.membrane)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const liaisonBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, liaisonBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, liaisonIndices, gl.STATIC_DRAW)

    this.vaos.liaisons = gl.createVertexArray()
    loc = this.programs.liaisons.attributes.a_endpoints
    gl.bindVertexArray(this.vaos.liaisons)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribIPointer(loc, 2, gl.UNSIGNED_SHORT, false, 0, 0)
    gl.vertexAttribDivisor(loc, 1)
    loc = this.programs.liaisons.attributes.a_position
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    this.vaos.fieldLiaison = gl.createVertexArray()
    loc = this.programs.fieldLiaison.attributes.a_endpoints
    gl.bindVertexArray(this.vaos.fieldLiaison)
    gl.enableVertexAttribArray(loc)
    gl.bindBuffer(gl.ARRAY_BUFFER, liaisonBuffer)
    gl.vertexAttribIPointer(loc, 2, gl.UNSIGNED_SHORT, false, 0, 0)
    gl.vertexAttribDivisor(loc, 1)
    loc = this.programs.fieldLiaison.attributes.a_position
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    this.bacterias = new PointsRenderer(gl, bacteriasFS, () => world.bacterias)
    this.food = new PointsRenderer(gl, foodFS, () => world.food)
    this.bindLiaisons = new LiaisonsRenderer(gl, world, liaisonTempFS, () =>
      world.constraints.pre.filter(
        (cons) => cons instanceof Spring && cons.hasFlag(SpringFlags.BIND)
      )
    )

    this.absorbRT = glu.renderTarget(gl, tW, tH, gl.RGBA32F, { depth: true })
    this.fieldRT = glu.renderTargetN(gl, tW, tH, 2, gl.RGBA32F, { depth: true })
    this.membraneRT = glu.renderTarget(gl, tW, tH, gl.RGBA32F)

    this.membranePass = new MembranePass(
      gl,
      vec2(tW, tH),
      this.fieldRT.textures[0],
      this.fieldRT.textures[1]
    )

    this.outerShell = new OuterShell(
      gl,
      vec2(W, H),
      this.fieldRT.textures[0],
      this.fieldRT.textures[1]
    )

    this.compVao = gl.createVertexArray()
    gl.bindVertexArray(this.compVao)
    loc = this.programs.comp.attributes.a_position
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    this.vaos.tex = gl.createVertexArray()
    gl.bindVertexArray(this.vaos.tex)
    loc = this.programs.comp.attributes.a_position
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    world.emitter.on("bodies:updated", () => {
      this.bacterias.update()
      this.food.update()
      this.bindLiaisons.update()
    })
    world.emitter.on("constraints:updated", () => {
      this.bindLiaisons.update()
    })
  }
}
