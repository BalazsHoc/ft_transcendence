import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { searchLocations } from "../../api/geoApi";
import { GeoSuggestion } from "../../types/api";
import styles from "./LocationAutocomplete.module.css";

type Props = {
  label: string;
  placeholder?: string;
  initialQuery?: string;
  onSelect: (suggestion: GeoSuggestion) => void;
};

function shortStreetName(value: string) {
  const compact = value.split(",")[0]?.trim() || value.trim();
  return compact;
}

export function LocationAutocomplete({
  label,
  placeholder = "Search an address or place",
  initialQuery = "",
  onSelect,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GeoSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setError("");
      setLoading(false);
      setOpen(false);
      setActiveIndex(0);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const response = await searchLocations(query);
        setResults(response.results || []);
        setActiveIndex(0);
      } catch (err: any) {
        setError(err.message || "Search failed.");
        setResults([]);
        setActiveIndex(0);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const helperText = useMemo(() => {
    if (loading) return "Searching...";
    if (error) return error;
    if (results.length === 0 && query.trim().length >= 3) return "No matches found.";
    return "";
  }, [error, loading, query, results.length]);

  function chooseSuggestion(suggestion: GeoSuggestion) {
    setQuery(shortStreetName(suggestion.label || suggestion.address));
    setResults([]);
    setOpen(false);
    onSelect(suggestion);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + results.length) % results.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      chooseSuggestion(results[activeIndex] || results[0]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  function handleFocus() {
    if (query.trim().length >= 3) setOpen(true);
  }

  function highlightMatch(text: string, needle: string) {
    const queryText = needle.trim();
    if (!queryText) return text;
    const lowerText = text.toLowerCase();
    const lowerNeedle = queryText.toLowerCase();
    const index = lowerText.indexOf(lowerNeedle);
    if (index < 0) return text;
    const before = text.slice(0, index);
    const match = text.slice(index, index + queryText.length);
    const after = text.slice(index + queryText.length);
    return (
      <>
        {before}
        <mark>{match}</mark>
        {after}
      </>
    );
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <label>
        {label}
        <input
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="location-autocomplete-results"
        />
      </label>

      {open && (helperText || results.length > 0) && (
        <div className={styles.panel}>
          {open && helperText && <p className={styles.hint}>{helperText}</p>}

          {open && results.length > 0 && (
            <div
              id="location-autocomplete-results"
              className={styles.results}
              role="listbox"
            >
              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  className={`${styles.result}${
                    results[activeIndex]?.id === result.id
                      ? ` ${styles.resultActive}`
                      : ""
                  }`}
                  role="option"
                  aria-selected={results[activeIndex]?.id === result.id}
                  onMouseEnter={() => setActiveIndex(results.findIndex((item) => item.id === result.id))}
                  onMouseDown={(event: MouseEvent<HTMLButtonElement>) => event.preventDefault()}
                  onClick={() => chooseSuggestion(result)}
                >
                  <strong>{highlightMatch(result.address, query)}</strong>
                  {result.label && result.label !== result.address && (
                    <span>{highlightMatch(result.label, query)}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
