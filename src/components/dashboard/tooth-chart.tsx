
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { AssignedTreatment } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ToothProps extends React.SVGProps<SVGPathElement> {
  toothNumber: number;
  onClick: (toothNumber: number) => void;
  treatments?: AssignedTreatment[];
}

const Tooth: React.FC<ToothProps> = ({ toothNumber, onClick, treatments, ...props }) => {
  const hasTreatment = treatments && treatments.length > 0;

  const toothContent = (
    <g onClick={() => onClick(toothNumber)} className="cursor-pointer group">
      <path
        {...props}
        className={cn(
          'fill-white stroke-gray-400 stroke-2 transition-colors duration-200 group-hover:fill-blue-200',
          { 'fill-yellow-300': hasTreatment }
        )}
      />
      <text
        x={props.d?.match(/M ([\d.]*)/)?.[1] || 0}
        y={props.d?.match(/M [\d.]*,([\d.]*)/)?.[1] || 0}
        dx="10"
        dy="18"
        fontSize="10"
        fill="black"
        className="pointer-events-none select-none"
      >
        {toothNumber}
      </text>
    </g>
  );

  if (hasTreatment) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{toothContent}</TooltipTrigger>
        <TooltipContent>
          <p className="font-bold">Tooth #{toothNumber}</p>
          <ul>
            {treatments.map((t, i) => (
              <li key={i}>- {t.name} (Rs. {t.amount})</li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    );
  }

  return toothContent;
};

interface ToothChartProps {
  onToothClick: (toothNumber: number) => void;
  assignedTreatments: Map<number, AssignedTreatment[]>;
}

const upperArch = [
  { p: "M10,50 a20,20 0 0,1 40,0", t: 1, n: 18 }, { p: "M50,50 a20,20 0 0,1 40,0", t: 2, n: 17 }, { p: "M90,50 a20,20 0 0,1 40,0", t: 3, n: 16 }, { p: "M130,50 a20,20 0 0,1 40,0", t: 4, n: 15 },
  { p: "M170,50 a20,20 0 0,1 40,0", t: 5, n: 14 }, { p: "M210,50 a20,20 0 0,1 40,0", t: 6, n: 13 }, { p: "M250,50 a20,20 0 0,1 40,0", t: 7, n: 12 }, { p: "M290,50 a20,20 0 0,1 40,0", t: 8, n: 11 },
  { p: "M350,50 a20,20 0 0,1 40,0", t: 9, n: 21 }, { p: "M390,50 a20,20 0 0,1 40,0", t: 10, n: 22 }, { p: "M430,50 a20,20 0 0,1 40,0", t: 11, n: 23 }, { p: "M470,50 a20,20 0 0,1 40,0", t: 12, n: 24 },
  { p: "M510,50 a20,20 0 0,1 40,0", t: 13, n: 25 }, { p: "M550,50 a20,20 0 0,1 40,0", t: 14, n: 26 }, { p: "M590,50 a20,20 0 0,1 40,0", t: 15, n: 27 }, { p: "M630,50 a20,20 0 0,1 40,0", t: 16, n: 28 },
];

const lowerArch = [
  { p: "M10,100 a20,20 0 0,0 40,0", t: 17, n: 48 }, { p: "M50,100 a20,20 0 0,0 40,0", t: 18, n: 47 }, { p: "M90,100 a20,20 0 0,0 40,0", t: 19, n: 46 }, { p: "M130,100 a20,20 0 0,0 40,0", t: 20, n: 45 },
  { p: "M170,100 a20,20 0 0,0 40,0", t: 21, n: 44 }, { p: "M210,100 a20,20 0 0,0 40,0", t: 22, n: 43 }, { p: "M250,100 a20,20 0 0,0 40,0", t: 23, n: 42 }, { p: "M290,100 a20,20 0 0,0 40,0", t: 24, n: 41 },
  { p: "M350,100 a20,20 0 0,0 40,0", t: 25, n: 31 }, { p: "M390,100 a20,20 0 0,0 40,0", t: 26, n: 32 }, { p: "M430,100 a20,20 0 0,0 40,0", t: 27, n: 33 }, { p: "M470,100 a20,20 0 0,0 40,0", t: 28, n: 34 },
  { p: "M510,100 a20,20 0 0,0 40,0", t: 29, n: 35 }, { p: "M550,100 a20,20 0 0,0 40,0", t: 30, n: 36 }, { p: "M590,100 a20,20 0 0,0 40,0", t: 31, n: 37 }, { p: "M630,100 a20,20 0 0,0 40,0", t: 32, n: 38 },
];

export const ToothChart: React.FC<ToothChartProps> = ({ onToothClick, assignedTreatments }) => {
  return (
    <TooltipProvider>
      <div className="flex justify-center">
        <svg viewBox="0 0 680 150" width="100%">
          <g>
            {upperArch.map(({ p, n }) => (
              <Tooth key={n} toothNumber={n} d={p} onClick={onToothClick} treatments={assignedTreatments.get(n)} />
            ))}
          </g>
          <g>
            {lowerArch.map(({ p, n }) => (
              <Tooth key={n} toothNumber={n} d={p} onClick={onToothClick} treatments={assignedTreatments.get(n)} />
            ))}
          </g>
        </svg>
      </div>
    </TooltipProvider>
  );
};
