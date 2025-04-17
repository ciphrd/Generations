import React from "react"
import cx from "classnames"
import { arr } from "../../utils/array"

export function Table({ colHeader = false, children }) {
  const cols = children[0].props.children.length
  return (
    <table className={cx({ "col-header": colHeader })}>
      <tbody>{children}</tbody>
    </table>
  )
}

export function Row({ children }) {
  const childrenArray = React.Children.toArray(children)
  return (
    <tr>
      {childrenArray.map((col, idx) => (
        <td key={idx}>{col}</td>
      ))}
    </tr>
  )
}
