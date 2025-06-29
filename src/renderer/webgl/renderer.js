import { glu } from "../../utils/glu"
import { Renderer } from "../renderer"
import mathGL from "./shaders/lib/math.glsl"
import colorGL from "./shaders/lib/color.glsl"
import noiseGL from "./shaders/lib/noise.glsl"
import convolveGL from "./shaders/lib/convolve.glsl"
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
import bacteriasFS from "./shaders/bacterias.frag.glsl"
import fieldLiaisonFS from "./shaders/field-liaison.frag.glsl"
import fieldCellFS from "./shaders/field-cell.frag.glsl"
import fieldPointFS from "./shaders/field-point.frag.glsl"
import foodFS from "./shaders/food.frag.glsl"
import sedimentsFS from "./shaders/absorption/sediments.frag.glsl"
import { PointsRenderer } from "./points"
import { LiaisonsRenderer } from "./liaisons"
import { Spring, SpringFlags } from "../../physics/constraints/spring"
import { settings } from "../../settings"
import { GaussianPass } from "./gaussian"
import { Sediments } from "./sediments"
import { ViewPass, viewUniform } from "./view"
import { CompositionPass } from "./composition"
import { BodyFlags } from "../../physics/body"
import { MembraneOuter } from "./membrane-outer"
import { Params } from "../../parametric-space"
import { Mouse } from "../../interactions/mouse"
import { Globals } from "../../globals"
import { Controls } from "../../controls"

//
// - Rendering resolution
//   - css pixels
//   - device pixels
// - Environment res (always the same)
//

export class WebGLRenderer extends Renderer {
  constructor(world, selection) {
    super(world, selection)
    this.prepared = false
  }

  updateRes() {
    const prevX = Globals.res.x
    const prevY = Globals.res.y
    const rect = this.$container.getBoundingClientRect()

    if (rect.width !== prevX || rect.height !== prevY) {
      Globals.res.x = rect.width
      Globals.res.y = rect.height
      Globals.deviceRes.x = floor(Globals.res.x * window.devicePixelRatio)
      Globals.deviceRes.y = floor(Globals.res.y * window.devicePixelRatio)
      Controls.updateTxArray()

      if (this.prepared) this.#onResize()
    }
  }

  #onResize() {
    const { res, deviceRes } = Globals
    this.cvs.width = deviceRes.x
    this.cvs.height = deviceRes.y
    this.cvs.style.width = res.x + "px"
    this.cvs.style.height = res.y + "px"

    this.#allocateRenderTargets()
    this.cellsFieldView.onResize()
    this.blurColorFieldPass.onResize()
    this.membraneOuter.onResize()
    this.sediments.onResize()
    this.compositionPass.onResize()
  }

  #attachEvents() {
    new ResizeObserver(() => this.updateRes()).observe(this.$container)
  }

  providerRenderingContainer($container) {
    super.providerRenderingContainer($container)

    this.updateRes()
    const { res, deviceRes } = Globals

    this.cvs = document.createElement("canvas")
    this.cvs.width = deviceRes.x
    this.cvs.height = deviceRes.y
    this.cvs.style.width = res.x + "px"
    this.cvs.style.height = res.y + "px"

    this.gl = this.cvs.getContext("webgl2")
    this.texel = res.clone().inv()

    this.gl.getExtension("EXT_color_buffer_float")
    this.gl.getExtension("EXT_float_blend")
    this.gl.getExtension("OES_texture_float_linear")

    glu.libs({
      color: colorGL,
      math: mathGL,
      noise: noiseGL,
      convolve: convolveGL,
      cell: cellGL,
      "cell-shading": cellShadingGL,
      view: viewGL,
    })

    glu.vars({
      NOISE_SEED: `vec3(${Params.snoiseSeed
        .map((c) => c.toFixed(4))
        .join(",")})`,
    })

    this.prepare()
    this.#attachEvents()

    $container.appendChild(this.cvs)
    Mouse.init(this.cvs)
  }

  prepare() {
    let loc
    const { gl, world } = this
    const { res, deviceRes, envRes } = Globals
    const { organisms, liaisons, bodies } = world

    const nb = organisms.length
    this.cells = {
      geo: new Float32Array(nb * 6),
      colors: new Float32Array(nb * 3),
      signals: new Float32Array(nb * 4),
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
        signals: glu.dynamicBuffer(gl, this.cells.signals, () => {
          for (let i = 0; i < nb; i++) {
            this.cells.signals[i * 4 + 0] = organisms[i].emittedSignal
          }
          return this.cells.signals
        }),
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
          CELL_SCALE: settings.rendering.cell.scale.toFixed(4),
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
          CELL_SCALE: settings.rendering.cell.scale.toFixed(4),
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
      cells: glu.program(gl, quadVS, cellFS, {
        attributes: ["a_position", "a_geometry", "a_color", "a_signals"],
        uniforms: ["u_view", "u_blurred_membrane", "u_color_field", "u_time"],
        variables: {
          CELL_SCALE: settings.rendering.cell.scale.toFixed(4),
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
          u.attrib(
            prg.attributes.a_signals,
            this.buffers.cells.signals.buffer,
            4,
            gl.FLOAT,
            true
          )
        },
      }),
      liaisons: glu.program(gl, liaisonVS, liaisonFS, {
        attributes: ["a_position", "a_endpoints", "a_geometries", "a_color"],
        uniforms: ["u_view", "u_points", "u_blurred_membrane", "u_color_field"],
        variables: {
          CELL_SCALE: settings.rendering.cell.scale.toFixed(4),
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
        uniforms: [
          "u_view",
          "u_sediments",
          "u_rd",
          "u_cells",
          "u_cell_colors",
          "u_hues",
          "u_sharpness",
          "u_thickness",
        ],
        variables: {
          CELL_COLOR_SPREAD: Params.cellsColorSpread,
        },
        vao: (prog) => (u) => {
          u.attrib(prog.attributes.a_position, glu.quad(gl), 2)
        },
      }),
      tex: glu.program(gl, fullVS, textureFS, {
        attributes: ["a_position"],
        uniforms: ["u_texture"],
        vao: (prg) => (u) => {
          u.quad(prg)
        },
      }),
    }

    this.#allocateRenderTargets()

    this.bacterias = new PointsRenderer(gl, bacteriasFS, () => world.bacterias)
    this.food = new PointsRenderer(gl, foodFS, () => world.food)
    this.bindLiaisons = new LiaisonsRenderer(
      gl,
      world,
      liaisonTempFS,
      () =>
        world.constraints.pre.filter(
          (cons) => cons instanceof Spring && cons.hasFlag(SpringFlags.BIND)
        ),
      {
        fixedWidth: 0.001,
      }
    )

    this.otherBodiesPass = new PointsRenderer(gl, fieldPointFS, () =>
      bodies.filter((b) => b.hasFlag(BodyFlags.FOOD))
    )

    this.cellsFieldView = new ViewPass(gl, () => ({
      res: deviceRes,
      tex: this.rts.cellFieldWorld.tex,
    }))

    this.blurColorFieldPass = new GaussianPass(
      gl,
      () => ({
        res: deviceRes.clone().div(4),
        tex: this.cellsFieldView.output,
      }),
      5
    )

    this.membraneOuter = new MembraneOuter(gl, () => ({
      res: deviceRes.clone().div(2),
      colorField: this.rts.cellFieldWorld.tex,
    }))

    this.sediments = new Sediments(gl, () => ({
      res: envRes,
      cellField: this.rts.cellFieldWorld.tex,
      otherField: this.rts.otherFieldWorld.tex,
      membraneOuter: this.membraneOuter.output,
    }))

    this.compositionPass = new CompositionPass(gl, () => ({
      res: deviceRes,
      absorb: this.rts.absorb.tex,
    }))

    this.prepared = true

    world.emitter.on("bodies:updated", () => {
      this.bacterias.update()
      this.food.update()
      this.bindLiaisons.update()
    })
    world.emitter.on("constraints:updated", () => {
      this.bindLiaisons.update()
    })
  }

  #allocateRenderTargets() {
    const gl = this.gl
    const { deviceRes, envRes } = Globals

    if (this.rts) {
      glu.free(gl, this.rts.absorb)
    }

    this.rts = {
      absorb: glu.renderTarget(gl, deviceRes.x, deviceRes.y, gl.RGBA32F, {
        // todo: not needed atm, but keeping in case we use cell shaders at some
        // point (should avoid if possible!)
        depth: true,
      }),
      cellFieldWorld:
        this.rts?.cellFieldWorld ||
        glu.renderTarget(gl, envRes.x, envRes.y, gl.RGBA32F, {
          depth: true,
        }),
      otherFieldWorld:
        this.rts?.otherFieldWorld ||
        glu.renderTarget(gl, envRes.x, envRes.y, gl.RGBA32F),
    }
  }

  render(t, dt) {
    let program

    const { gl, world, programs } = this
    const { organisms, liaisons } = world
    const { res, deviceRes, envRes } = Globals
    const nb = organisms.length

    this.buffers.cells.geo.update()
    this.buffers.cells.signals.update()
    this.buffers.liaisons.geos.update()

    //
    // Render field, merging the cells / liaisons in a smooth way
    //
    glu.bindFB(gl, envRes.x, envRes.y, this.rts.cellFieldWorld.fb)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LESS)
    glu.blend(gl, null)

    programs.fieldCell.use()
    viewUniform(gl, programs.fieldCell, true)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, nb)

    programs.fieldLiaison.use()
    viewUniform(gl, programs.fieldLiaison, true)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, liaisons.length)

    gl.disable(gl.DEPTH_TEST)

    glu.blend(gl, gl.ONE, gl.ONE)
    glu.bindFB(gl, envRes.x, envRes.y, this.rts.otherFieldWorld.fb)
    this.otherBodiesPass.render(true)

    this.cellsFieldView.render()
    this.blurColorFieldPass.render()

    //
    // Compute edges on the field to create the shell of the membrane
    //
    this.membraneOuter.render()

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

    glu.bindFB(gl, deviceRes.x, deviceRes.y, this.rts.absorb.fb)

    // program = programs.cells
    // program.use()
    // viewUniform(gl, program)
    // gl.uniform1f(program.uniforms.u_time, t * 0.001)
    // glu.uniformTex(
    //   gl,
    //   program.uniforms.u_blurred_membrane,
    //   this.outerShell.output,
    //   0
    // )
    // glu.uniformTex(
    //   gl,
    //   program.uniforms.u_color_field,
    //   this.blurColorFieldPass.output,
    //   1
    // )
    // gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, nb)

    // programs.liaisons.use()
    // viewUniform(gl, programs.liaisons)
    // glu.uniformTex(
    //   gl,
    //   programs.liaisons.uniforms.u_blurred_membrane,
    //   this.outerShell.output,
    //   0
    // )
    // glu.uniformTex(
    //   gl,
    //   programs.liaisons.uniforms.u_color_field,
    //   this.blurColorFieldPass.output,
    //   1
    // )
    // gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, liaisons.length)

    gl.disable(gl.DEPTH_TEST)
    glu.blend(gl, gl.ONE, gl.ONE)

    programs.sediments.use()
    viewUniform(gl, programs.sediments)
    glu.uniformTex(
      gl,
      programs.sediments.uniforms.u_sediments,
      this.sediments.outputs.post,
      0
    )
    glu.uniformTex(
      gl,
      programs.sediments.uniforms.u_rd,
      this.sediments.outputs.pre,
      1
    )
    glu.uniformTex(
      gl,
      programs.sediments.uniforms.u_cells,
      this.cellsFieldView.output,
      2
    )
    glu.uniformTex(
      gl,
      programs.sediments.uniforms.u_cell_colors,
      this.blurColorFieldPass.output,
      3
    )
    gl.uniform2f(
      programs.sediments.uniforms.u_hues,
      Params.sedimentHues[0],
      Params.sedimentHues[1]
    )
    gl.uniform1f(
      programs.sediments.uniforms.u_sharpness,
      Params.sedimentSharpness
    )
    gl.uniform2f(
      programs.sediments.uniforms.u_thickness,
      Params.sedimentBgThickness,
      Params.sedimentFgThickness
    )
    glu.draw.quad(gl)

    // this.bacterias.render()
    this.food.render()
    this.bindLiaisons.render()

    //
    // FINAL COMP
    //
    this.compositionPass.render()

    // programs.tex.use()
    // glu.uniformTex(gl, programs.tex.uniforms.u_texture, this.cellsFieldView.output)
    // glu.draw.quad(gl)
  }
}
