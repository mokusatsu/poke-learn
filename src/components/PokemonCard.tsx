import React from "react";
import type { PokemonData } from "../data/localPokemons";
import { TypeBadge } from "./TypeBadge";
import { TYPE_DETAILS } from "../utils/typeMatrix";

interface PokemonCardProps {
  pokemon: PokemonData;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
  clickable?: boolean;
  badgeSize?: "sm" | "md";
  showSprite?: boolean;
  customOverlay?: React.ReactNode;
}

export const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  size = "md",
  selected = false,
  onClick,
  clickable = false,
  badgeSize = "sm",
  showSprite = true,
  customOverlay,
}) => {
  const [isShortScreen, setIsShortScreen] = React.useState<boolean>(window.innerHeight < 800 || window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsShortScreen(window.innerHeight < 800 || window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const primaryType = pokemon.types[0];
  const typeDetail = TYPE_DETAILS[primaryType];

  const cardStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: size === "sm"
      ? (isShortScreen ? "4px 2px" : "6px 4px")
      : size === "md"
        ? (isShortScreen ? "10px 8px" : "20px")
        : "32px",
    borderRadius: size === "sm" ? "12px" : "16px",
    backgroundColor: "rgba(18, 20, 32, 0.5)",
    border: `1px solid rgba(255, 255, 255, 0.08)`,
    boxShadow: `0 8px 24px rgba(0, 0, 0, 0.2)`,
    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
    cursor: clickable ? "pointer" : "default",
    width: size === "sm"
      ? "96px"
      : size === "md"
        ? (isShortScreen ? "130px" : "160px")
        : "220px",
    flexShrink: 0,
  };

  if (selected) {
    cardStyle.borderColor = typeDetail?.color || "var(--accent-cyan)";
    cardStyle.boxShadow = `0 0 25px ${typeDetail?.glowColor || "var(--accent-cyan-glow)"}`;
    cardStyle.backgroundColor = "rgba(255, 255, 255, 0.03)";
    cardStyle.transform = "scale(1.03) translateY(-4px)";
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickable && !selected) {
      e.currentTarget.style.transform = "translateY(-6px)";
      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
      e.currentTarget.style.boxShadow = `0 12px 30px rgba(0, 0, 0, 0.4), 0 0 15px ${typeDetail?.glowColor || "rgba(255,255,255,0.05)"}`;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickable && !selected) {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
      e.currentTarget.style.boxShadow = `0 8px 24px rgba(0, 0, 0, 0.2)`;
    }
  };

  // スプライトコンテナー
  const spriteSize = size === "sm"
    ? (isShortScreen ? 32 : 44)
    : size === "md"
      ? (isShortScreen ? 56 : 85)
      : 130;

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="pokemon-card glass-panel"
    >
      {/* ポケモンID */}
      <span
        style={{
          fontSize: size === "sm" ? "0.65rem" : "0.75rem",
          color: "var(--text-muted)",
          fontWeight: 700,
          position: "absolute",
          top: isShortScreen && size === "sm" ? "4px" : "8px",
          right: "12px",
        }}
      >
        #{String(pokemon.id).padStart(3, "0")}
      </span>

      {/* スプライト画像 */}
      {showSprite && (
        <div
          style={{
            width: spriteSize,
            height: spriteSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: size === "sm" ? "2px" : "12px",
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
            transition: "transform 0.3s ease",
          }}
          className="sprite-container"
        >
          <img
            src={pokemon.sprite}
            alt={pokemon.nameJa}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
            loading="lazy"
            onError={(e) => {
              // 読み込み失敗時は汎用のシルエット、またはタイプアイコンで代用
              e.currentTarget.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png";
            }}
          />
        </div>
      )}

      {/* ポケモン名 */}
      <h3
        style={{
          fontSize: size === "sm" ? "0.75rem" : size === "md" ? "1rem" : "1.25rem",
          fontWeight: 700,
          marginBottom: size === "sm" ? "2px" : "10px",
          color: "var(--text-primary)",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
        }}
      >
        {pokemon.nameJa}
      </h3>

      {/* タイプバッジ一覧 */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: "auto",
        }}
      >
        {pokemon.types.map((type) => (
          <TypeBadge key={type} type={type} size={badgeSize} />
        ))}
      </div>

      {/* カスタムオーバーレイ（正誤判定のオーバーレイなど） */}
      {customOverlay}
    </div>
  );
};
