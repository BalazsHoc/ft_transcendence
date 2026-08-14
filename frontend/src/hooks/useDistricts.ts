import { useEffect, useState } from "react";

import { getDistricts } from "../api/metaApi";
import type { DistrictOption } from "../types/api";

export function useDistricts() {
  const [districts, setDistricts] = useState<DistrictOption[]>([]);

  useEffect(() => {
    let active = true;
    getDistricts()
      .then((data) => {
        if (active) setDistricts(data);
      })
      .catch(() => {
        if (active) setDistricts([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return districts;
}
