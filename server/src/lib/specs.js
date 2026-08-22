// Характеристики товара хранятся в БД как JSON-массив пар [label, value]
// (см. server/prisma/schema.prisma). В форме админки это редактируется как
// обычный текст — по одной паре "Название: Значение" на строку, чтобы не
// городить динамические JS-поля для простой формы.

export function formatSpecsText(specs) {
  if (!Array.isArray(specs)) return "";
  return specs.map(([label, value]) => `${label}: ${value}`).join("\n");
}

export function parseSpecsText(text) {
  return (text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return [line, ""];
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    });
}
