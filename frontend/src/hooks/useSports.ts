import { useEffect, useState } from "react";

import { getSports } from "../api/metaApi";
import type { SportOption } from "../types/api";

export function useSports() {
  const [sports, setSports] = useState<SportOption[]>([]);

  useEffect(() => {
    let active = true;
    getSports()
      .then((data) => {
        if (active) setSports(data);
      })
      .catch(() => {
        if (active) setSports([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return sports;
}
