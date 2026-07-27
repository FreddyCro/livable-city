declare module 'polylabel' {
  /**
   * Pole of inaccessibility — the interior point of a polygon that is farthest
   * from any edge. Guaranteed to lie inside the polygon (unlike a bbox/area
   * centre for concave shapes). `polygon` is a GeoJSON-style ring array
   * (`[outerRing, ...holes]`, each ring an array of `[x, y]`); `precision` is in
   * the same units as the coordinates (degrees here). Returns `[x, y]` with an
   * extra `distance` property (distance to the nearest edge).
   */
  export default function polylabel(
    polygon: number[][][],
    precision?: number,
    debug?: boolean,
  ): [number, number] & { distance: number };
}
