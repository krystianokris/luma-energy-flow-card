export type Point = [number, number];
/** Round orthogonal cable bends without changing the route's endpoints. */
export function cable(points: Point[], radius = 1.6): string {
  if (points.length < 2) return '';
  let path = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [a,b,c] = [points[i-1],points[i],points[i+1]];
    const incoming = Math.hypot(a[0]-b[0],a[1]-b[1]);
    const outgoing = Math.hypot(c[0]-b[0],c[1]-b[1]);
    if (!incoming || !outgoing) continue;
    const r = Math.min(radius,incoming/2,outgoing/2);
    const before = [b[0]+(a[0]-b[0])*r/incoming,b[1]+(a[1]-b[1])*r/incoming];
    const after = [b[0]+(c[0]-b[0])*r/outgoing,b[1]+(c[1]-b[1])*r/outgoing];
    path += ` L${before[0]} ${before[1]} Q${b[0]} ${b[1]} ${after[0]} ${after[1]}`;
  }
  const end = points[points.length-1];
  return `${path} L${end[0]} ${end[1]}`;
}
export function houseCables(p: Record<string, Point>): Record<string,string> {
  const [gx,gy]=p.grid,[sx,sy]=p.solar,[hx,hy]=p.home,[bx,by]=p.battery,[ex,ey]=p.ev;
  return {
    grid:cable([[gx,gy],[2,gy],[2,94],[62,94]]),
    solar:cable([[sx,sy],[sx,Math.min(3,sy-4)],[98,Math.min(3,sy-4)],[98,94],[62,94]]),
    home:cable([[hx,hy],[94,hy],[94,90],[62,90],[62,94]]),
    battery:cable([[bx,by],[bx,94],[62,94]]),
    ev:cable([[ex,ey],[ex,98],[90,98],[90,hy],[hx,hy]]),
  };
}
export const phoneCables:Record<string,string>={
  grid:cable([[25,17],[5,17],[5,39],[50,39],[50,50]]),
  solar:cable([[75,17],[95,17],[95,39],[50,39],[50,50]]),
  home:cable([[25,50],[50,50]]),
  battery:cable([[75,50],[50,50]]),
  ev:cable([[25,83],[5,83],[5,50],[25,50]]),
};
