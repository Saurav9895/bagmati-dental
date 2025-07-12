
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { AssignedTreatment } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const COLOR_PALETTE = [
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#0ea5e9', // sky-500
  '#14b8a6', // teal-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
];

interface ToothProps extends React.SVGProps<SVGGElement> {
  toothNumber: number;
  onClick: (toothNumber: number) => void;
  assignedTreatments?: AssignedTreatment[];
  color?: string;
  isUpper: boolean;
}

// A more realistic tooth SVG path
const realisticToothPath = "M 81,14 L80,15 L74,15 L73,16 L70,16 L69,17 L66,17 L65,18 L63,18 L62,19 L61,19 L60,20 L58,20 L57,21 L56,21 L55,22 L54,22 L52,24 L51,24 L50,25 L49,25 L46,28 L45,28 L35,38 L35,39 L33,41 L33,42 L31,44 L31,45 L29,47 L29,48 L28,49 L28,50 L27,51 L27,52 L26,53 L26,54 L25,55 L25,56 L24,57 L24,59 L23,60 L23,62 L22,63 L22,65 L21,66 L21,70 L20,71 L20,94 L21,95 L21,102 L22,103 L22,108 L23,109 L23,114 L24,115 L24,118 L25,119 L25,122 L26,123 L26,125 L27,126 L27,128 L28,129 L28,132 L29,133 L29,134 L30,135 L30,137 L31,138 L31,139 L32,140 L32,141 L33,142 L33,143 L34,144 L34,145 L35,146 L35,147 L36,148 L36,149 L38,151 L38,152 L40,154 L40,155 L42,157 L42,158 L44,160 L45,160 L46,161 L47,161 L48,162 L49,162 L50,163 L51,163 L52,164 L56,164 L57,163 L58,163 L59,162 L60,162 L61,161 L62,161 L63,160 L64,160 L65,159 L65,158 L66,158 L67,157 L67,156 L68,156 L69,155 L69,154 L70,154 L70,153 L71,153 L71,152 L72,152 L72,151 L73,151 L73,150 L74,150 L74,149 L75,149 L75,148 L76,148 L76,147 L77,147 L77,146 L78,146 L78,145 L79,145 L79,144 L80,144 L80,143 L81,143 L81,142 L82,142 L82,141 L83,141 L83,140 L84,140 L84,139 L85,139 L85,138 L86,138 L86,137 L87,137 L87,136 L88,136 L88,135 L89,135 L89,134 L90,134 L90,133 L91,133 L91,132 L92,132 L92,131 L93,131 L93,130 L94,130 L94,129 L95,129 L95,128 L96,128 L96,127 L97,127 L97,126 L98,126 L98,125 L99,125 L99,124 L100,124 L100,123 L101,123 L101,122 L102,122 L102,121 L103,121 L103,120 L104,120 L104,119 L105,119 L105,118 L106,118 L106,117 L107,117 L107,116 L108,116 L108,115 L109,115 L109,114 L110,114 L110,113 L111,113 L111,112 L112,112 L112,111 L113,111 L113,110 L114,110 L114,109 L115,109 L115,108 L116,108 L116,107 L117,107 L117,106 L118,106 L118,105 L119,105 L119,104 L120,104 L120,103 L121,103 L121,102 L122,102 L122,101 L123,101 L123,100 L124,100 L124,99 L125,99 L125,98 L126,98 L126,97 L127,97 L127,96 L128,96 L128,95 L129,95 L129,94 L130,94 L130,93 L131,93 L131,92 L132,92 L132,91 L133,91 L133,90 L134,90 L134,89 L135,89 L135,88 L136,88 L136,87 L137,87 L137,86 L138,86 L138,85 L139,85 L139,84 L140,84 L140,83 L141,83 L141,82 L142,82 L142,81 L143,81 L143,80 L144,80 L144,79 L145,79 L145,78 L146,78 L146,77 L147,77 L147,76 L148,76 L148,75 L149,75 L149,74 L150,74 L150,73 L151,73 L151,72 L152,72 L152,71 L153,71 L153,70 L154,70 L154,69 L155,69 L155,68 L156,68 L156,67 L157,67 L157,66 L158,66 L158,65 L159,65 L159,64 L160,64 L160,63 L161,63 L161,62 L162,62 L162,61 L163,61 L163,60 L164,60 L164,59 L165,59 L165,58 L166,58 L166,57 L167,57 L167,56 L168,56 L168,55 L169,55 L169,54 L170,54 L170,53 L171,53 L171,52 L172,52 L172,51 L173,51 L173,50 L174,50 L174,49 L175,49 L175,48 L176,48 L176,47 L177,47 L177,46 L178,46 L178,45 L179,45 L179,44 L180,44 L180,43 L181,43 L181,42 L182,42 L182,41 L183,41 L183,40 L184,40 L184,39 L185,39 L185,38 L186,38 L186,37 L187,37 L187,36 L188,36 L188,35 L189,35 L189,34 L190,34 L190,33 L191,33 L191,32 L192,32 L192,31 L193,31 L193,30 L194,30 L194,29 L195,29 L195,28 L196,28 L196,27 L197,27 L197,26 L198,26 L198,25 L199,25 L199,24 L200,24 L200,23 L201,23 L201,22 L202,22 L202,21 L203,21 L203,20 L204,20 L204,19 L205,19 L205,18 L206,18 L206,17 L207,17 L207,16 L208,16 L208,15 L209,15 L209,14 Z";

const Tooth: React.FC<ToothProps> = ({
  toothNumber,
  onClick,
  assignedTreatments,
  color,
  isUpper,
  ...props
}) => {
  const hasAssignedTreatment = assignedTreatments && assignedTreatments.length > 0;

  const tooltipContent = hasAssignedTreatment ? (
    <div key="treatments">
      <p className="font-bold">Assigned:</p>
      <ul>
        {assignedTreatments.map((t, i) => (
          <li key={i}>- {t.name} (Rs. {(t.amount || 0).toFixed(2)})</li>
        ))}
      </ul>
    </div>
  ) : (
    <div key="price">
      <p>Click to assign a treatment.</p>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <g
          onClick={() => onClick(toothNumber)}
          className="cursor-pointer group"
          {...props}
        >
          <path
            d={realisticToothPath}
            transform="scale(1.2)"
            className={cn(
              'transition-all duration-200 group-hover:fill-blue-200',
              hasAssignedTreatment ? '' : 'fill-gray-200'
            )}
            style={{
              fill: color || (hasAssignedTreatment ? '#fde047' : '#e5e7eb'), // yellow-200 or gray-200
            }}
          />
          <text
            x="18"
            y={isUpper ? 38 : -8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="#374151" // gray-700
            className="pointer-events-none select-none font-sans font-semibold"
          >
            {toothNumber}
          </text>
        </g>
      </TooltipTrigger>
      <TooltipContent>
        <div className="font-bold mb-2">Tooth #{toothNumber}</div>
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
};

interface ToothChartProps {
  onToothClick: (toothNumber: number) => void;
  assignedTreatmentsByTooth?: Map<number, AssignedTreatment[]>;
}

const upperRight = Array.from({ length: 8 }, (_, i) => 8 - i);
const upperLeft = Array.from({ length: 8 }, (_, i) => i + 9);
const lowerRight = Array.from({ length: 8 }, (_, i) => i + 25).reverse();
const lowerLeft = Array.from({ length: 8 }, (_, i) => 24 - i).reverse();

export const ToothChart: React.FC<ToothChartProps> = ({
  onToothClick,
  assignedTreatmentsByTooth,
}) => {
  const treatedTeeth = React.useMemo(
    () => Array.from(assignedTreatmentsByTooth?.keys() || []),
    [assignedTreatmentsByTooth]
  );
  
  const getToothColor = (toothNumber: number) => {
    const colorIndex = treatedTeeth.indexOf(toothNumber);
    return colorIndex !== -1 ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length] : undefined;
  };

  return (
    <TooltipProvider>
      <div className="flex justify-center overflow-x-auto p-4 bg-muted/30 rounded-lg">
        <svg viewBox="0 0 580 120" width="100%" style={{ minWidth: '560px' }}>
          {/* Upper Right Quadrant (Teeth 1-8) */}
          {upperRight.map((num, i) => (
            <Tooth
              key={`upper-${num}`}
              toothNumber={num}
              onClick={onToothClick}
              assignedTreatments={assignedTreatmentsByTooth?.get(num)}
              color={getToothColor(num)}
              isUpper={true}
              transform={`translate(${250 - i * 32}, 5)`}
            />
          ))}
          {/* Upper Left Quadrant (Teeth 9-16) */}
          {upperLeft.map((num, i) => (
            <Tooth
              key={`upper-${num}`}
              toothNumber={num}
              onClick={onToothClick}
              assignedTreatments={assignedTreatmentsByTooth?.get(num)}
              color={getToothColor(num)}
              isUpper={true}
              transform={`translate(${305 + i * 32}, 5)`}
            />
          ))}
          
          {/* Lower Right Quadrant (Teeth 25-32) - Reversed to match dental notation from patient's perspective */}
          {lowerRight.map((num, i) => (
            <Tooth
              key={`lower-${num}`}
              toothNumber={num}
              onClick={onToothClick}
              assignedTreatments={assignedTreatmentsByTooth?.get(num)}
              color={getToothColor(num)}
              isUpper={false}
              transform={`translate(${250 - i * 32}, 75)`}
            />
          ))}
          {/* Lower Left Quadrant (Teeth 17-24) - Reversed */}
          {lowerLeft.map((num, i) => (
            <Tooth
              key={`lower-${num}`}
              toothNumber={num}
              onClick={onToothClick}
              assignedTreatments={assignedTreatmentsByTooth?.get(num)}
              color={getToothColor(num)}
              isUpper={false}
              transform={`translate(${305 + i * 32}, 75)`}
            />
          ))}
        </svg>
      </div>
    </TooltipProvider>
  );
};
