export function renderNodeSelection(ctx, selection) {
  if (selection.hovered) {
    ctx.strokeStyle = `rgba(255,255,0,0.3)`
    ctx.lineWidth = 0.001
    ctx.beginPath()
    ctx.arc(selection.hovered.pos.x, selection.hovered.pos.y, 0.01, 0, TAU)
    ctx.stroke()
  }

  if (selection.selected) {
    ctx.strokeStyle = `rgba(255,255,0,1)`
    ctx.lineWidth = 0.001
    ctx.beginPath()
    ctx.arc(selection.selected.pos.x, selection.selected.pos.y, 0.01, 0, TAU)
    ctx.stroke()
  }
}
