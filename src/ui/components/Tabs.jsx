import React, { useState } from "react"
import cx from "classnames"

export function Tabs({ children, tabs, defaultTab = 0 }) {
  const [active, setActive] = useState(defaultTab)
  const childrenArray = React.Children.toArray(children)

  return (
    <section className="tabs-wrapper">
      <div className="tabs">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            className={cx("tab", {
              selected: idx === active,
            })}
            onClick={() => setActive(idx)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="tabs-content">{childrenArray[active]}</div>
    </section>
  )
}
