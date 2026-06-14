import React from "react";
import { TYPE_DETAILS } from "../utils/typeMatrix";
import type { PokemonType } from "../utils/typeMatrix";

interface TypeBadgeProps {
  type: PokemonType;
  size?: "sm" | "md" | "lg";
  clickable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({
  type,
  size = "md",
  clickable = false,
  selected = false,
  onClick,
  style,
}) => {
  const detail = TYPE_DETAILS[type];
  if (!detail) return null;

  const sizeStyles = {
    sm: { padding: "4px 8px", fontSize: "0.75rem", borderRadius: "6px" },
    md: { padding: "6px 14px", fontSize: "0.85rem", borderRadius: "8px" },
    lg: { padding: "8px 20px", fontSize: "1rem", borderRadius: "10px" },
  };

  const currentSize = sizeStyles[size];

  // 発光スタイル
  const badgeStyle: React.CSSProperties = {
    backgroundColor: detail.color,
    color: detail.textColor,
    boxShadow: `0 0 12px ${detail.glowColor}`,
    border: "1px solid rgba(255, 255, 255, 0.15)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    letterSpacing: "0.05em",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: clickable ? "pointer" : "default",
    whiteSpace: "nowrap",
    ...currentSize,
    ...style,
  };

  if (clickable) {
    if (selected) {
      badgeStyle.transform = "scale(1.05)";
      badgeStyle.boxShadow = `0 0 20px ${detail.color}, inset 0 0 8px rgba(255, 255, 255, 0.5)`;
      badgeStyle.borderColor = "#ffffff";
    } else {
      // 非選択状態でクリック可能な場合は、ホバー時に浮かび上がらせる
      badgeStyle.opacity = 0.65;
    }
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickable && !selected) {
      e.currentTarget.style.opacity = "1";
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = `0 4px 15px ${detail.glowColor}`;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickable && !selected) {
      e.currentTarget.style.opacity = "0.65";
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = `0 0 12px ${detail.glowColor}`;
    }
  };

  return (
    <div
      style={badgeStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={`${detail.ja}タイプ`}
    >
      {detail.ja}
    </div>
  );
};
