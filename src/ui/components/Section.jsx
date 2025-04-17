export function Section({ title, children }) {
  return (
    <section>
      <h2>{title}</h2>
      <div className="section-content">{children}</div>
    </section>
  )
}
