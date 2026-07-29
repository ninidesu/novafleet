import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// Same monoline icon set as the wireframe (driver-app/design/wireframe.html),
// re-expressed as react-native-svg element trees instead of raw path strings.
const ICONS = {
  home: [
    ['path', { d: 'M4 11.5 12 4l8 7.5' }],
    ['path', { d: 'M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9' }],
  ],
  assignments: [
    ['rect', { x: 7, y: 3, width: 10, height: 4, rx: 1.2 }],
    ['path', { d: 'M7 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1' }],
    ['path', { d: 'M9 12h6M9 16h6' }],
  ],
  fuel: [
    ['path', { d: 'M5 20h8V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14Z' }],
    ['path', { d: 'M13 9h2l2 2v6a1.5 1.5 0 0 1-3 0v-2' }],
    ['path', { d: 'M5 20h8' }],
  ],
  history: [
    ['circle', { cx: 12, cy: 13, r: 8 }],
    ['path', { d: 'M12 9v4l3 2' }],
    ['path', { d: 'M9 3h6' }],
  ],
  profile: [
    ['circle', { cx: 12, cy: 8, r: 4 }],
    ['path', { d: 'M4 20c0-4 4-6 8-6s8 2 8 6' }],
  ],
  bell: [
    ['path', { d: 'M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z' }],
    ['path', { d: 'M10 20a2 2 0 0 0 4 0' }],
  ],
  back: [['path', { d: 'M15 5l-7 7 7 7' }]],
  chevronRight: [['path', { d: 'M9 5l7 7-7 7' }]],
  mapPin: [
    ['path', { d: 'M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z' }],
    ['circle', { cx: 12, cy: 9.5, r: 2.2 }],
  ],
  wifi: [
    ['path', { d: 'M2 8.5a16 16 0 0 1 20 0' }],
    ['path', { d: 'M5.5 12.3a11 11 0 0 1 13 0' }],
    ['path', { d: 'M9 16a6 6 0 0 1 6 0' }],
    ['circle', { cx: 12, cy: 19.4, r: 1, fill: 'currentColor' }],
  ],
  wifiOff: [
    ['path', { d: 'M2 2l20 20' }],
    ['path', { d: 'M8.5 8.7a11 11 0 0 1 10 3' }],
    ['path', { d: 'M5.5 12.3a11 11 0 0 1 2.3-1.8' }],
    ['path', { d: 'M9 16a6 6 0 0 1 6 0' }],
    ['circle', { cx: 12, cy: 19.4, r: 1, fill: 'currentColor' }],
  ],
  battery: [
    ['rect', { x: 2, y: 8, width: 17, height: 8, rx: 2 }],
    ['path', { d: 'M21 11v2' }],
  ],
  signal: [['path', { d: 'M4 19V15M9 19V11M14 19V7M19 19V4' }]],
  gps: [
    ['circle', { cx: 12, cy: 12, r: 7 }],
    ['path', { d: 'M12 2v3M12 19v3M2 12h3M19 12h3' }],
    ['circle', { cx: 12, cy: 12, r: 1.4, fill: 'currentColor' }],
  ],
  camera: [
    ['path', { d: 'M4 8h3l2-2h6l2 2h3v11H4V8Z' }],
    ['circle', { cx: 12, cy: 13.4, r: 3.3 }],
  ],
  checkCircle: [
    ['circle', { cx: 12, cy: 12, r: 9 }],
    ['path', { d: 'M8 12.4l2.6 2.6L16 9.4' }],
  ],
  xCircle: [
    ['circle', { cx: 12, cy: 12, r: 9 }],
    ['path', { d: 'M9 9l6 6M15 9l-6 6' }],
  ],
  alertTriangle: [
    ['path', { d: 'M12 3.5 2 20.5h20L12 3.5Z' }],
    ['path', { d: 'M12 9.5v5' }],
    ['circle', { cx: 12, cy: 17.3, r: 0.55, fill: 'currentColor' }],
  ],
  shield: [['path', { d: 'M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3Z' }]],
  phoneIcon: [
    [
      'path',
      {
        d: 'M5 4h3l1.5 4L8 9.5a12 12 0 0 0 6.5 6.5L16 14.5l4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z',
      },
    ],
  ],
  lock: [
    ['rect', { x: 5, y: 11, width: 14, height: 9, rx: 2 }],
    ['path', { d: 'M8 11V8a4 4 0 0 1 8 0v3' }],
  ],
  truck: [
    ['rect', { x: 2, y: 7.5, width: 12, height: 8.5, rx: 1 }],
    ['path', { d: 'M14 11h4l3 3v2h-7' }],
    ['circle', { cx: 6.5, cy: 18.5, r: 1.6 }],
    ['circle', { cx: 17, cy: 18.5, r: 1.6 }],
  ],
  idCard: [
    ['rect', { x: 3, y: 5, width: 18, height: 14, rx: 2 }],
    ['circle', { cx: 8.5, cy: 11, r: 2 }],
    ['path', { d: 'M6 16c.5-1.8 2-2.6 2.5-2.6S11 14.2 11 16' }],
    ['path', { d: 'M14 9.5h5M14 13h5' }],
  ],
  download: [
    ['path', { d: 'M12 3v12' }],
    ['path', { d: 'M7 10l5 5 5-5' }],
    ['path', { d: 'M5 21h14' }],
  ],
  droplet: [['path', { d: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z' }]],
  refresh: [
    ['path', { d: 'M4 4v5h5' }],
    ['path', { d: 'M20 20v-5h-5' }],
    ['path', { d: 'M5 9a8 8 0 0 1 13.7-3.5L20 8' }],
    ['path', { d: 'M19 15a8 8 0 0 1-13.7 3.5L4 16' }],
  ],
  route: [
    ['circle', { cx: 6, cy: 6, r: 2.2 }],
    ['circle', { cx: 18, cy: 18, r: 2.2 }],
    ['path', { d: 'M6 8.2V13a4 4 0 0 0 4 4h4' }],
  ],
  calendar: [
    ['rect', { x: 3, y: 5, width: 18, height: 16, rx: 2 }],
    ['path', { d: 'M3 10h18M8 3v4M16 3v4' }],
  ],
  logout: [
    ['path', { d: 'M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3' }],
    ['path', { d: 'M15 16l4-4-4-4' }],
    ['path', { d: 'M19 12H9' }],
  ],
  eye: [
    ['path', { d: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z' }],
    ['circle', { cx: 12, cy: 12, r: 3 }],
  ],
  eyeOff: [
    ['path', { d: 'M3 3l18 18' }],
    [
      'path',
      {
        d:
          'M10.6 5.2A10.6 10.6 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.6 4.3M6.5 6.8A16.7 16.7 0 0 0 2 12s4 7 10 7a9.6 9.6 0 0 0 3.3-.6',
      },
    ],
    ['path', { d: 'M9.6 9.7a3 3 0 0 0 4.2 4.2' }],
  ],
  sun: [
    ['circle', { cx: 12, cy: 12, r: 4.2 }],
    ['path', { d: 'M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8 6 18M18 6l1.8-1.8' }],
  ],
  moon: [['path', { d: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z' }]],
};

export default function Icon({ name, size = 18, color = 'currentColor', style }) {
  const shapes = ICONS[name] || [];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {shapes.map(([tag, props], i) => {
        const strokeProps =
          props.fill === 'currentColor'
            ? { fill: color, stroke: 'none' }
            : { stroke: color, fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
        if (tag === 'path') return <Path key={i} d={props.d} {...strokeProps} />;
        if (tag === 'circle') return <Circle key={i} cx={props.cx} cy={props.cy} r={props.r} {...strokeProps} />;
        if (tag === 'rect')
          return (
            <Rect
              key={i}
              x={props.x}
              y={props.y}
              width={props.width}
              height={props.height}
              rx={props.rx || 0}
              {...strokeProps}
            />
          );
        return null;
      })}
    </Svg>
  );
}
