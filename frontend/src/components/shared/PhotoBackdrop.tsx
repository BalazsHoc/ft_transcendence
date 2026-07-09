import { VIENNA_SKYLINE_IMAGE } from "./backgroundImages";

export function PhotoBackdrop() {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${VIENNA_SKYLINE_IMAGE}')` }}
      />
      <div className="absolute inset-0 bg-[var(--bg)]/40 backdrop-blur-[2px]" />
    </div>
  );
}
