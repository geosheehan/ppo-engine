import { useId } from 'react';
import type { ReactNode } from 'react';

type RinkProps = {
   className?: string;
   children?: ReactNode;
};

// NHL rink, 1 unit = 1 ft, origin at centre ice (same axes as the NHL API's x/y).
// x: -100 (left boards) to 100 (right boards); y: -42.5 to 42.5. Corner radius 28 ft.
// Team colors: set the CSS custom properties --left-end-color / --right-end-color on the
// rink or any parent. They fill the corners outside the boards and that end's crease.
const RED = '#c8102e';
const BLUE = '#0072ce';
const LEFT_END = `var(--left-end-color, ${RED})`;
const RIGHT_END = `var(--right-end-color, ${BLUE})`;

// Rule-book width (2 in) for the thin markings.
const MARKING = 2 / 12;

// End-zone faceoff circle, centred on its faceoff spot.
function FaceoffCircle({ x, y }: { x: number; y: number }) {
   return (
      <g transform={`translate(${x} ${y})`} fill="none" stroke={RED} strokeWidth={MARKING}>
         <circle r={15} />
         {/* Hash marks: 2 ft long, 5 ft 7 in apart */}
         <line x1={-2.875} y1={-14.72} x2={-2.875} y2={-16.72} />
         <line x1={2.875} y1={-14.72} x2={2.875} y2={-16.72} />
         <line x1={-2.875} y1={14.72} x2={-2.875} y2={16.72} />
         <line x1={2.875} y1={14.72} x2={2.875} y2={16.72} />
         {/* L-shaped marks around the spot */}
         <polyline points="-2,-3.75 -2,-0.75 -6,-0.75" />
         <polyline points="2,-3.75 2,-0.75 6,-0.75" />
         <polyline points="-2,3.75 -2,0.75 -6,0.75" />
         <polyline points="2,3.75 2,0.75 6,0.75" />
         <circle r={1} fill={RED} stroke="none" />
      </g>
   );
};

function Crease({ fill }: { fill: string }) {
   return (
      <g stroke={RED} strokeWidth={MARKING}>
         <path d="M0,-4 H4.472 A6,6 0 0 1 4.472,4 H0" style={{ fill }} />
         <line x1={4} y1={-4} x2={4} y2={-3.583} />
         <line x1={4} y1={4} x2={4} y2={3.583} />
      </g>
   );
};

function Net() {
   return <path d="M0,-3 H-2.33 A1,1 0 0 0 -3.33,-2 V2 A1,1 0 0 0 -2.33,3 H0" fill="#ffffff" stroke={RED} strokeWidth={1 / 3} />;
};

function Rink({ className, children }: RinkProps) {
   const iceId = useId();

   return (
      <svg className={className} viewBox="-101 -43.5 202 87" width={808} height={348} role="img" aria-label="Rink">
         <defs>
            <clipPath id={iceId}>
               <rect x={-100} y={-42.5} width={200} height={85} rx={28} ry={28} />
            </clipPath>
         </defs>

         {/* Team-color halves behind the rink; only the corners outside the boards show */}
         <rect x={-101} y={-43.5} width={101} height={87} style={{ fill: LEFT_END }} />
         <rect x={0} y={-43.5} width={101} height={87} style={{ fill: RIGHT_END }} />

         {/* Boards */}
         <rect x={-101} y={-43.5} width={202} height={87} rx={29} ry={29} fill="#1a1a1a" />
         {/* Ice */}
         <rect x={-100} y={-42.5} width={200} height={85} rx={28} ry={28} fill="#ffffff" />

         <g clipPath={`url(#${iceId})`}>
            {/* Centre red line (12 in) */}
            <rect x={-0.5} y={-42.5} width={1} height={85} fill={RED} />

            {/* Blue lines (12 in), 75 ft from each end; 50 ft neutral zone */}
            <rect x={-25} y={-42.5} width={1} height={85} fill={BLUE} />
            <rect x={24} y={-42.5} width={1} height={85} fill={BLUE} />

            {/* Goal creases (under the goal lines), colored to match their end */}
            <g transform="translate(-89 0)"><Crease fill={LEFT_END} /></g>
            <g transform="translate(89 0) scale(-1 1)"><Crease fill={RIGHT_END} /></g>

            <g fill="none" stroke={RED} strokeWidth={MARKING}>
               {/* Goal lines, 11 ft from the end boards */}
               <line x1={-89} y1={-42.5} x2={-89} y2={42.5} />
               <line x1={89} y1={-42.5} x2={89} y2={42.5} />

               {/* Trapezoids: 22 ft wide at the goal line, 28 ft at the end boards */}
               <line x1={-89} y1={-11} x2={-100} y2={-14} />
               <line x1={-89} y1={11} x2={-100} y2={14} />
               <line x1={89} y1={-11} x2={100} y2={-14} />
               <line x1={89} y1={11} x2={100} y2={14} />

               {/* Referee's crease, 10 ft radius */}
               <path d="M-10,42.5 A10,10 0 0 1 10,42.5" />
            </g>

            {/* Centre circle (15 ft radius) and centre spot (12 in) */}
            <circle r={15} fill="none" stroke={BLUE} strokeWidth={MARKING} />
            <circle r={0.5} fill={BLUE} />

            {/* Neutral-zone faceoff spots (2 ft), 5 ft from the blue lines, 44 ft apart */}
            <g fill={RED}>
               <circle cx={-19} cy={-22} r={1} />
               <circle cx={-19} cy={22} r={1} />
               <circle cx={19} cy={-22} r={1} />
               <circle cx={19} cy={22} r={1} />
            </g>

            {/* End-zone faceoff circles: spots 20 ft from the goal line, 44 ft apart */}
            <FaceoffCircle x={-69} y={-22} />
            <FaceoffCircle x={-69} y={22} />
            <FaceoffCircle x={69} y={-22} />
            <FaceoffCircle x={69} y={22} />

            {/* Goal nets */}
            <g transform="translate(-89 0)"><Net /></g>
            <g transform="translate(89 0) scale(-1 1)"><Net /></g>
         </g>

         {children}
      </svg>
   );
};

export default Rink;
