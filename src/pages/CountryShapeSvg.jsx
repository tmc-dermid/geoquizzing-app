export default function CountryShapeSvg({ geojson, width = 300, height = 300 }) {
  const coords =
    geojson.type === "MultiPolygon"
      ? geojson.coordinates.flat(2)
      : geojson.coordinates;

  const xs = coords.map((c) => c[0]);
  const ys = coords.map((c) => c[1]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const bboxWidth = maxX - minX;
  const bboxHeight = maxY - minY;

  const padding = 0.10;

  const scaleX = (width * (1 - padding)) / bboxWidth;
  const scaleY = (height * (1 - padding)) / bboxHeight;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (width - bboxWidth * scale) / 2;
  const offsetY = (height - bboxHeight * scale) / 2;

  const polygons =
    geojson.type === "MultiPolygon"
      ? geojson.coordinates
      : [geojson.coordinates];

  const paths = polygons.map((polygon) =>
    polygon.map((ring) =>
      ring
        .map(([x, y]) =>
          `${offsetX + (x - minX) * scale},${height - (offsetY + (y - minY) * scale)}`
        )
        .join(" ")
    )
  );

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <g>
        {paths.map((polygon, i) => (
          <polygon
            key={i}
            points={polygon[0]}
            fill="#4d5599"
            stroke="black"
            strokeWidth={1}
          />
        ))}
      </g>
    </svg>
  );
}
