type Option = {
  label: string;
  value: string;
};

type FilterGroupProps = {
  title: string;
  options: Option[];
  selected: string;
  onChange: (value: string) => void;
  type?: "chips" | "radio" | "checkbox";
};

export function FilterGroup({
  title,
  options,
  selected,
  onChange,
  type = "chips",
}: FilterGroupProps) {
  return (
    <div className="filter-group">
      <h3 className="filter-group__title">{title}</h3>

      {type === "chips" && (
        <div className="filter-group__chips">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`filter-chip ${selected === opt.value ? "filter-chip--active" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {type === "checkbox" && (
        <div className="filter-group__list">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="filter-option"
              onClick={() => onChange(opt.value)}
            >
              <div
                className={`filter-checkbox ${selected === opt.value ? "filter-checkbox--active" : ""}`}
              >
                {selected === opt.value && (
                  <svg
                    className="filter-checkbox__icon"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`filter-option__label ${selected === opt.value ? "filter-option__label--active" : ""}`}
              >
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      )}

      {type === "radio" && (
        <div className="filter-group__list">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="filter-option"
              onClick={() => onChange(opt.value)}
            >
              <div
                className={`filter-radio ${selected === opt.value ? "filter-radio--active" : ""}`}
              >
                {selected === opt.value && (
                  <div className="filter-radio__dot" />
                )}
              </div>
              <span
                className={`filter-option__label ${selected === opt.value ? "filter-option__label--active" : ""}`}
              >
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
