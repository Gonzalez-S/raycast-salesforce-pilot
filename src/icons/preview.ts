import type { SalesforceIcon } from "./catalog";
import type { IconCategory } from "./constants";
import { getCachedPreview, setCachedPreview } from "../slds/cache";
import { UTILITY_ICON_FILL } from "../slds/constants";
import type { IconColorMap } from "../slds/icon-colors";

type SvgParts = {
  viewBox: string;
  width: number;
  height: number;
  body: string;
};

type ChromeShape = "circle" | "roundedSquare";

/** SLDS `.slds-icon_container` default radius: `.25rem` on a `2rem` icon. */
export const STANDARD_RADIUS_RATIO = 0.125;

/** SLDS action icons: `padding: .5rem` around a `2rem` glyph → 2/3 scale. */
export const ACTION_GLYPH_SCALE = 2 / 3;

const chromeByCategory: Partial<Record<IconCategory, { shape: ChromeShape; glyphScale: number }>> = {
  action: { shape: "circle", glyphScale: ACTION_GLYPH_SCALE },
  standard: { shape: "roundedSquare", glyphScale: 1 },
  custom: { shape: "roundedSquare", glyphScale: 1 },
};

const parseSvg = (svg: string): SvgParts => {
  const cleaned = svg.replace(/<\?xml[^>]*>/i, "").trim();
  const open = cleaned.match(/<svg\b[^>]*>/i)?.[0];
  if (!open) throw new Error("Invalid SVG");

  const viewBox =
    open.match(/\bviewBox="([^"]+)"/i)?.[1] ??
    (() => {
      const width = Number(open.match(/\bwidth="([\d.]+)"/i)?.[1] ?? 100);
      const height = Number(open.match(/\bheight="([\d.]+)"/i)?.[1] ?? 100);
      return `0 0 ${width} ${height}`;
    })();

  const [, , widthRaw, heightRaw] = viewBox.split(/[\s,]+/);
  const body = cleaned.replace(/^[\s\S]*?<svg\b[^>]*>/i, "").replace(/<\/svg>\s*$/i, "");

  return { viewBox, width: Number(widthRaw), height: Number(heightRaw), body };
};

const toDataUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const chromeElement = (shape: ChromeShape, width: number, height: number, background: string) => {
  if (shape === "circle") {
    return `<circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 2}" fill="${background}"/>`;
  }
  const radius = width * STANDARD_RADIUS_RATIO;
  return `<rect width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="${background}"/>`;
};

const glyphGroup = (body: string, width: number, height: number, scale: number) => {
  if (scale === 1) return `<g fill="#fff">${body}</g>`;
  const cx = width / 2;
  const cy = height / 2;
  return `<g fill="#fff" transform="translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})">${body}</g>`;
};

/** Compose SLDS chrome: brand shape behind a white glyph. */
export const composeChromeIcon = (
  svg: string,
  options: { background: string; shape: ChromeShape; glyphScale?: number },
): string => {
  const { viewBox, width, height, body } = parseSvg(svg);
  const scale = options.glyphScale ?? 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${chromeElement(options.shape, width, height, options.background)}${glyphGroup(body, width, height, scale)}</svg>`;
};

export const recolorSvgFill = (svg: string, fill: string): string => {
  const { viewBox, body } = parseSvg(svg);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><g fill="${fill}">${body.replace(/\bfill="(?!none)[^"]*"/gi, `fill="${fill}"`)}</g></svg>`;
};

export const resolveIconPreview = async (icon: SalesforceIcon, colors: IconColorMap): Promise<string> => {
  const cached = getCachedPreview(icon.apiName);
  if (cached) return cached;

  if (icon.category === "doctype") {
    setCachedPreview(icon.apiName, icon.svgUrl);
    return icon.svgUrl;
  }

  const response = await fetch(icon.svgUrl);
  if (!response.ok) {
    throw new Error(`Couldn’t download icon SVG for ${icon.apiName}`);
  }

  const raw = await response.text();
  const chrome = chromeByCategory[icon.category];
  const background = colors[icon.apiName];

  const preview =
    icon.category === "utility"
      ? toDataUri(recolorSvgFill(raw, UTILITY_ICON_FILL))
      : chrome && background
        ? toDataUri(composeChromeIcon(raw, { background, shape: chrome.shape, glyphScale: chrome.glyphScale }))
        : toDataUri(recolorSvgFill(raw, "#fff"));

  setCachedPreview(icon.apiName, preview);
  return preview;
};

export const resolveIconPreviews = async (
  icons: SalesforceIcon[],
  colors: IconColorMap,
): Promise<Record<string, string>> => {
  const entries = await Promise.all(
    icons.map(async (icon) => [icon.apiName, await resolveIconPreview(icon, colors)] as const),
  );
  return Object.fromEntries(entries);
};
