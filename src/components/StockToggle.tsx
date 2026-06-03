"use client";

interface StockToggleProps {
  isActive: boolean;
  productName?: string;
  onToggle: (newState: boolean) => void;
  disabled?: boolean;
}

export default function StockToggle({ isActive, productName, onToggle, disabled }: StockToggleProps) {
  return (
    <div className="d-flex align-items-center gap-2">
      <label className="stock-toggle" style={disabled ? { opacity: 0.5, pointerEvents: "none" } : {}}>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => onToggle(e.target.checked)}
          disabled={disabled}
        />
        <span className="toggle-slider" />
        <span className="toggle-label toggle-label-on">ON</span>
        <span className="toggle-label toggle-label-off">OFF</span>
      </label>
      <span
        className="fw-semibold"
        style={{
          fontSize: 12,
          color: isActive ? "#27ae60" : "#95a5a6",
          transition: "color 0.3s ease",
        }}
      >
        {isActive ? "Tersedia" : "Habis"}
      </span>
    </div>
  );
}
