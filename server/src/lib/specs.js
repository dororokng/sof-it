// specs в БД — JSON-массив пар [label, value]; в форме админки редактируются
// текстом по строке "Название: Значение".

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
