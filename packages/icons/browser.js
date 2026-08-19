const definitions = await fetch(new URL('./icons.json', import.meta.url)).then((response) => {
  if (!response.ok) throw new Error(`Unable to load WGD icon definitions: ${response.status}`);
  return response.json();
});

let iconSequence = 0;

function escapeAttribute(value) {
  return String(value).replace(/[&<>\"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;'
  }[char]));
}

export const WGD_ICON_KINDS = Object.freeze(Object.keys(definitions.icons));
export const WGD_ICON_DEFINITIONS = Object.freeze(definitions);

export function wgdIcon(kind, options = {}) {
  const size = Number(options.size ?? 24);
  const title = options.title ? String(options.title) : '';
  const markup = definitions.icons[kind];
  if (!markup) throw new Error(`Unknown WGD icon kind: ${kind}`);

  const gradientId = `wgd-ai-${kind}-${++iconSequence}`;
  const label = title
    ? `role=\"img\" aria-label=\"${escapeAttribute(title)}\"`
    : 'aria-hidden=\"true\"';
  const spark = definitions.spark;

  return `<span class=\"wgd-icon\" ${label} style=\"width:${size + 12}px;height:${size + 12}px;position:relative;display:inline-grid;place-items:center\">`
    + `<svg viewBox=\"${definitions.viewBox}\" width=\"${size}\" height=\"${size}\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"${definitions.strokeWidth}\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"color:${definitions.strokeColor}\">${markup}</svg>`
    + `<svg aria-hidden=\"true\" viewBox=\"${spark.viewBox}\" width=\"${spark.size}\" height=\"${spark.size}\" style=\"position:absolute;left:${spark.left}px;top:${spark.top}px;overflow:visible\">`
    + `<defs><linearGradient id=\"${gradientId}\" x1=\"1\" y1=\"1\" x2=\"13\" y2=\"13\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"${spark.gradientStart}\"/><stop offset=\"1\" stop-color=\"${spark.gradientEnd}\"/></linearGradient></defs>`
    + `<path d=\"${spark.primaryPath}\" fill=\"url(#${gradientId})\"/>`
    + `<path d=\"${spark.secondaryPath}\" fill=\"${spark.gradientEnd}\"/>`
    + `</svg></span>`;
}
