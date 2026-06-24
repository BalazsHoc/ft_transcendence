import { useState } from "react";

export function Button() {
  const [active, setActive] = useState(false);

  return (
    <button
      className={`button ${active ? "active" : ""}`}
      onClick={() => setActive(!active)}
    >
    </button>
  );
}

export function ButtonSecondary() {
  const [active, setActive] = useState(false);

  return (
    <button
      className={`button secondary ${active ? "active" : ""}`}
      onClick={() => setActive(!active)}
    >
    </button>
  );
}