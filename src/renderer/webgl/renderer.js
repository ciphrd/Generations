import { glu } from "../../utils/glu"
import { vec2 } from "../../utils/vec"
import { Renderer } from "../renderer"
import mathGL from "./shaders/lib/math.glsl"
import colorGL from "./shaders/lib/color.glsl"
import noiseGL from "./shaders/lib/noise.glsl"
import cellGL from "./shaders/lib/cell.glsl"
import cellShadingGL from "./shaders/lib/cell-shading.glsl"
import viewGL from "./shaders/lib/view.glsl"
import fullVS from "./shaders/full.vert.glsl"
import textureFS from "./shaders/texture.frag.glsl"
import quadVS from "./shaders/quad.vert.glsl"
import cellFS from "./shaders/cell.frag.glsl"
import liaisonVS from "./shaders/liaison.vert.glsl"
import liaisonFS from "./shaders/liaison.frag.glsl"
import liaisonTempFS from "./shaders/liaison-temp.frag.glsl"
import pointsVS from "./shaders/points.vert.glsl"
import bacteriasFS from "./shaders/bacterias.frag.glsl"
import fieldLiaisonFS from "./shaders/field-liaison.frag.glsl"
import fieldCellFS from "./shaders/field-cell.frag.glsl"
import fieldPointFS from "./shaders/field-point.frag.glsl"
import foodFS from "./shaders/food.frag.glsl"
import membraneFS from "./shaders/membrane.frag.glsl"
import sedimentsFS from "./shaders/absorption/sediments.frag.glsl"
import { PointsRenderer } from "./points"
import { LiaisonsRenderer } from "./liaisons"
import { Spring, SpringFlags } from "../../physics/constraints/spring"
import { settings } from "../../settings"
import { GaussianPass } from "./gaussian"
import { MembranePass } from "./membrane"
import { OuterShell } from "./outer-shell"
import { Sediments } from "./sediments"
import { viewUniform } from "./view"
import { CompositionPass } from "./composition"
import { BodyFlags } from "../../physics/body"

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
 *
 * ( ) TODO
 *     Find a way to handle the view coordinates elegantly without rendering
 *     more that what's needed.
 *     Define what is rendered in full screen to preserve dimensions (membrane,)
 *     and what is rendered in view space for quality (cells)
 *
 *     Write an elegant pipeline to support these 2 coordinate systems and
 *     the different cases
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
      color: colorGL,
      math: mathGL,
      noise: noiseGL,
      cell: cellGL,
      "cell-shading": cellShadingGL,
      view: viewGL,
    })

    this.vaos = {}
    this.prepare()
  }

  providerRenderingContainer($container) {
    super.providerRenderingContainer($container)
    $container.appendChild(this.cvs)
  }

  prepare() {
    let loc
    const { gl, world } = this
    const { organisms, liaisons, bodies } = world

    const nb = organisms.length
    this.cells = {
      geo: new Float32Array(nb * 6),
      colors: new Float32Array(nb * 3),
    }
    for (let i = 0; i < nb; i++) {
      this.cells.colors[i * 3 + 0] = organisms[i].color.r / 255
      this.cells.colors[i * 3 + 1] = organisms[i].color.g / 255
      this.cells.colors[i * 3 + 2] = organisms[i].color.b / 255
    }

    const nbLiaisons = liaisons.length
    this.liaisons = {
      geos: new Float32Array(nbLiaisons * 8),
      col: new Float32Array(nbLiaisons * 3),
    }
    let liaison
    for (let i = 0; i < nbLiaisons; i++) {
      liaison = liaisons[i]
      this.liaisons.col[i * 3 + 0] = liaison.color.r / 255
      this.liaisons.col[i * 3 + 1] = liaison.color.g / 255
      this.liaisons.col[i * 3 + 2] = liaison.color.b / 255
    }

    this.buffers = {
      cells: {
        geo: glu.dynamicBuffer(gl, this.cells.geo, () => {
          for (let i = 0; i < nb; i++) {
            this.cells.geo[i * 6 + 0] = organisms[i].pos.x
            this.cells.geo[i * 6 + 1] = organisms[i].pos.y
            this.cells.geo[i * 6 + 2] = organisms[i].radius
            this.cells.geo[i * 6 + 3] = organisms[i].forwards.x
            this.cells.geo[i * 6 + 4] = organisms[i].forwards.y
            this.cells.geo[i * 6 + 5] = organisms[i].id
          }
          return this.cells.geo
        }),
        col: glu.buffer(gl, this.cells.colors),
      },
      liaisons: {
        geos: glu.dynamicBuffer(gl, this.liaisons.geos, () => {
          let bodyA, bodyB
          for (let i = 0; i < nbLiaisons; i++) {
            bodyA = liaisons[i].bodyA
            bodyB = liaisons[i].bodyB
            this.liaisons.geos[i * 8 + 0] = bodyA.pos.x
            this.liaisons.geos[i * 8 + 1] = bodyA.pos.y
            this.liaisons.geos[i * 8 + 2] = bodyA.radius
            this.liaisons.geos[i * 8 + 3] = bodyA.id
            this.liaisons.geos[i * 8 + 4] = bodyB.pos.x
            this.liaisons.geos[i * 8 + 5] = bodyB.pos.y
            this.liaisons.geos[i * 8 + 6] = bodyB.radius
            this.liaisons.geos[i * 8 + 7] = bodyB.id
          }
          return this.liaisons.geos
        }),
        col: glu.buffer(gl, this.liaisons.col),
      },
    }

    this.programs = {
      fieldCell: glu.program(gl, quadVS, fieldCellFS, {
        attributes: ["a_position", "a_geometry", "a_color"],
        uniforms: ["u_view"],
        variables: {
          CELL_SCALE: settings.rendering.cell.scale,
        },
        vao: (prg) => (u) => {
          u.attrib(prg.attributes.a_position, glu.quad(gl), 2, gl.FLOAT)
          u.matAttrib(
            prg.attributes.a_geometry,
            this.buffers.cells.geo.buffer,
            2,
            3,
            gl.FLOAT,
            true
          )
          u.attrib(
            prg.attributes.a_color,
            this.buffers.cells.col,
            3,
            gl.FLOAT,
            true
          )
        },
      }),
      fieldLiaison: glu.program(gl, liaisonVS, fieldLiaisonFS, {
        attributes: ["a_position", "a_endpoints", "a_geometries", "a_color"],
        uniforms: ["u_view"],
        variables: {
          CELL_SCALE: settings.rendering.cell.scale,
        },
        vao: (prg) => (u) => {
          u.attrib(prg.attributes.a_position, glu.quad(gl), 2, gl.FLOAT)
          u.matAttrib(
            prg.attributes.a_geometries,
            this.buffers.liaisons.geos.buffer,
            2,
            4,
            gl.FLOAT,
            true
          )
          u.attrib(
            prg.attributes.a_color,
            this.buffers.liaisons.col,
            3,
            gl.FLOAT,
            true
          )
        },
      }),
      membrane: glu.program(gl, fullVS, membraneFS, {
        attributes: ["a_position"],
        uniforms: ["u_membrane", "u_color_field"],
      }),
      cells: glu.program(gl, quadVS, cellFS, {
        attributes: ["a_position", "a_geometry", "a_color"],
        uniforms: ["u_view", "u_blurred_membrane", "u_color_field"],
        variables: {
          CELL_SCALE: settings.rendering.cell.scale,
        },
        vao: (prg) => (u) => {
          u.attrib(prg.attributes.a_position, glu.quad(gl), 2, gl.FLOAT)
          u.matAttrib(
            prg.attributes.a_geometry,
            this.buffers.cells.geo.buffer,
            2,
            3,
            gl.FLOAT,
            true
          )
          u.attrib(
            prg.attributes.a_color,
            this.buffers.cells.col,
            3,
            gl.FLOAT,
            true
          )
        },
      }),
      liaisons: glu.program(gl, liaisonVS, liaisonFS, {
        attributes: ["a_position", "a_endpoints", "a_geometries", "a_color"],
        uniforms: ["u_view", "u_points", "u_blurred_membrane", "u_color_field"],
        variables: {
          CELL_SCALE: settings.rendering.cell.scale,
        },
        vao: (prg) => (u) => {
          u.attrib(prg.attributes.a_position, glu.quad(gl), 2, gl.FLOAT)
          u.matAttrib(
            prg.attributes.a_geometries,
            this.buffers.liaisons.geos.buffer,
            2,
            4,
            gl.FLOAT,
            true
          )
          u.attrib(
            prg.attributes.a_color,
            this.buffers.liaisons.col,
            3,
            gl.FLOAT,
            true
          )
        },
      }),
      sediments: glu.program(gl, fullVS, sedimentsFS, {
        attributes: ["a_position"],
        uniforms: ["u_view", "u_sediments", "u_cells", "u_membrane"],
        vao: (prog) => (u) => {
          u.attrib(prog.attributes.a_position, glu.quad(gl), 2)
        },
      }),
      tex: glu.program(gl, fullVS, textureFS, {
        attributes: ["a_position"],
        uniforms: ["u_texture"],
      }),
    }

    const quadBuffer = glu.quadBuffer(gl)

    this.vaos.membrane = gl.createVertexArray()
    loc = this.programs.membrane.attributes.a_position
    gl.bindVertexArray(this.vaos.membrane)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    this.bacterias = new PointsRenderer(gl, bacteriasFS, () => world.bacterias)
    this.food = new PointsRenderer(gl, foodFS, () => world.food)
    this.bindLiaisons = new LiaisonsRenderer(gl, world, liaisonTempFS, () =>
      world.constraints.pre.filter(
        (cons) => cons instanceof Spring && cons.hasFlag(SpringFlags.BIND)
      )
    )

    this.otherBodiesPass = new PointsRenderer(gl, fieldPointFS, () =>
      bodies.filter((b) => b.hasFlag(BodyFlags.FOOD))
    )

    this.absorbRT = glu.renderTarget(gl, tW, tH, gl.RGBA32F, { depth: true })
    this.fieldRT = glu.renderTarget(gl, tW, tH, gl.RGBA32F, { depth: true })
    this.fieldRT2 = glu.renderTargetN(2, gl, tW, tH, gl.RGBA32F, {
      depth: true,
    })
    this.membraneRT = glu.renderTarget(gl, tW, tH, gl.RGBA32F)

    this.blurColorFieldPass = new GaussianPass(
      gl,
      vec2(tW, tH).div(2),
      this.fieldRT2.textures[1],
      5
    )

    this.membranePass = new MembranePass(gl, vec2(tW, tH), this.fieldRT2)

    this.outerShell = new OuterShell(
      gl,
      vec2(W, H),
      this.membranePass.rt.tex,
      this.membranePass.blurFieldPass.output
    )

    this.vaos.tex = gl.createVertexArray()
    gl.bindVertexArray(this.vaos.tex)
    loc = this.programs.tex.attributes.a_position
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    this.sediments = new Sediments(gl, vec2(tW, tH), this.fieldRT.tex)

    this.compositionPass = new CompositionPass(
      gl,
      vec2(tW, tH),
      this.absorbRT.tex
    )

    world.emitter.on("bodies:updated", () => {
      this.bacterias.update()
      this.food.update()
      this.bindLiaisons.update()
    })
    world.emitter.on("constraints:updated", () => {
      this.bindLiaisons.update()
    })
  }

  render(t, dt) {
    const { gl, world, programs } = this
    const { organisms, liaisons } = world
    const nb = organisms.length

    this.buffers.cells.geo.update()
    this.buffers.liaisons.geos.update()

    //
    // Render field, merging the cells / liaisons in a smooth way
    //
    glu.bindFB(gl, tW, tH, this.fieldRT.fb)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LESS)
    glu.blend(gl, null)
    gl.drawBuffers([gl.COLOR_ATTACHMENT0])

    programs.fieldCell.use()
    viewUniform(gl, programs.fieldCell, true)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, nb)

    programs.fieldLiaison.use()
    viewUniform(gl, programs.fieldLiaison, true)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, liaisons.length)

    this.otherBodiesPass.render(true)

    //
    glu.bindFB(gl, tW, tH, this.fieldRT2.fb)
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1])

    programs.fieldCell.use()
    viewUniform(gl, programs.fieldCell)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, nb)

    programs.fieldLiaison.use()
    viewUniform(gl, programs.fieldLiaison)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, liaisons.length)

    gl.disable(gl.DEPTH_TEST)
    //

    this.blurColorFieldPass.render()

    //
    // Compute edges on the field to create the shell of the membrane
    //
    this.membranePass.render()
    this.outerShell.render()

    //
    // Sediments
    //
    this.sediments.render(t)

    //
    // Render the light absorption layer, composed of the different bodies
    // which absorb light
    //

    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LESS)
    glu.blend(gl, null)

    glu.bindFB(gl, tW, tH, this.absorbRT.fb)

    programs.cells.use()
    viewUniform(gl, programs.cells)
    glu.uniformTex(
      gl,
      programs.cells.uniforms.u_blurred_membrane,
      this.outerShell.output,
      0
    )
    glu.uniformTex(
      gl,
      programs.cells.uniforms.u_color_field,
      this.blurColorFieldPass.output,
      1
    )
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, nb)

    programs.liaisons.use()
    viewUniform(gl, programs.liaisons)
    glu.uniformTex(
      gl,
      programs.liaisons.uniforms.u_blurred_membrane,
      this.outerShell.output,
      0
    )
    glu.uniformTex(
      gl,
      programs.liaisons.uniforms.u_color_field,
      this.blurColorFieldPass.output,
      1
    )
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, liaisons.length)

    gl.disable(gl.DEPTH_TEST)

    glu.blend(gl, gl.ONE, gl.ONE)
    gl.useProgram(programs.membrane.program)
    gl.bindVertexArray(this.vaos.membrane)
    glu.uniformTex(
      gl,
      programs.membrane.uniforms.u_membrane,
      this.membranePass.output,
      0
    )
    glu.uniformTex(
      gl,
      programs.membrane.uniforms.u_color_field,
      this.blurColorFieldPass.output,
      1
    )
    glu.draw.quad(gl)

    programs.sediments.use()
    viewUniform(gl, programs.sediments)
    glu.uniformTex(
      gl,
      programs.sediments.uniforms.u_sediments,
      this.sediments.output,
      0
    )
    glu.uniformTex(
      gl,
      programs.sediments.uniforms.u_cells,
      this.fieldRT2.textures[0],
      1
    )
    glu.uniformTex(
      gl,
      programs.sediments.uniforms.u_membrane,
      this.membranePass.output,
      2
    )
    glu.draw.quad(gl)

    // this.bacterias.render()
    this.food.render()
    // this.bindLiaisons.render()

    //
    // FINAL COMP
    //
    this.compositionPass.render()

    // gl.useProgram(programs.tex.program)
    // gl.bindVertexArray(this.vaos.tex)
    // glu.uniformTex(gl, programs.tex.uniforms.u_texture, this.fieldRT.tex)
    // glu.draw.quad(gl)
  }
}
