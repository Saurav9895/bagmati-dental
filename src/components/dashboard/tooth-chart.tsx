

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { AssignedTreatment } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const COLOR_PALETTE = [
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#0ea5e9', // sky-500
  '#14b8a6', // teal-500
];

interface ToothProps extends React.SVGProps<SVGGElement> {
  toothNumber: number;
  onClick: (toothNumber: number) => void;
  assignedTreatments?: AssignedTreatment[];
  color?: string;
}

const Tooth: React.FC<ToothProps> = ({ toothNumber, onClick, assignedTreatments, color, ...props }) => {
  const hasAssignedTreatment = assignedTreatments && assignedTreatments.length > 0;
  
  const toothIconPath = "M20.8,15.2c-0.2-1.3-0.5-2.6-1-3.8c-0.5-1.2-1.2-2.2-2-3.1c-0.8-0.9-1.8-1.6-2.9-2.1c-1.1-0.5-2.2-0.8-3.4-0.8 c-1.2,0-2.4,0.3-3.5,0.8c-1.1,0.5-2.1,1.2-2.9,2.1c-0.8,0.9-1.5,1.9-2,3.1c-0.5,1.2-0.8,2.5-1,3.8c-0.2,1.3-0.2,2.6,0,3.9 c0.2,1.3,0.5,2.6,1,3.8c0.5,1.2,1.2,2.2,2,3.1c0.8,0.9,1.8,1.6,2.9,2.1c1.1,0.5,2.2,0.8,3.5,0.8c1.2,0,2.4-0.3,3.5-0.8 c1.1-0.5,2.1-1.2,2.9-2.1c0.8-0.9,1.5-1.9,2-3.1c0.5-1.2,0.8-2.5,1-3.8C21.1,17.8,21.1,16.5,20.8,15.2z M11.5,24.5 c-1.5-0.5-2.8-1.4-3.8-2.6S6,19.1,5.8,17.5c-0.2-1.6,0-3.3,0.5-4.8s1.4-2.8,2.6-3.8s2.6-1.7,4.2-2c1.6-0.2,3.3,0,4.8,0.5 s2.8,1.4,3.8,2.6s1.7,2.6,2,4.2c0.2,1.6,0,3.3-0.5,4.8s-1.4,2.8-2.6,3.8s-2.6,1.7-4.2,2C14.1,25,12.5,25,11.5,24.5z";

  const toothContent = (
    <g onClick={() => onClick(toothNumber)} className="cursor-pointer group" {...props}>
      <path
        d={toothIconPath}
        className={cn(
          'fill-white stroke-gray-400 stroke-[0.5] transition-colors duration-200 group-hover:fill-blue-200'
        )}
        style={{
          fill: color ? color : 'white'
        }}
      />
      <text
        x="11.5"
        y="14"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="8"
        fill={color ? 'white' : 'black'}
        className="pointer-events-none select-none font-sans font-bold"
      >
        {toothNumber}
      </text>
    </g>
  );

  const tooltipContent = [];
  if (hasAssignedTreatment) {
    tooltipContent.push(
      <div key="treatments">
        <p className="font-bold">Assigned:</p>
        <ul>
          {assignedTreatments?.map((t, i) => (
            <li key={i}>- {t.name} (Rs. {(t.amount || 0).toFixed(2)})</li>
          ))}
        </ul>
      </div>
    );
  } else {
      tooltipContent.push(
        <div key="price">
            <p>Click to assign a treatment.</p>
        </div>
      );
  }


  if (tooltipContent.length > 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{toothContent}</TooltipTrigger>
        <TooltipContent>
          <div className='font-bold mb-2'>Tooth #{toothNumber}</div>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    );
  }

  return toothContent;
};

interface ToothChartProps {
  onToothClick: (toothNumber: number) => void;
  assignedTreatmentsByTooth?: Map<number, AssignedTreatment[]>;
  treatmentPrices?: { [toothNumber: number]: number };
}

const upperArchNumbers = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerArchNumbers = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export const ToothChart: React.FC<ToothChartProps> = ({ onToothClick, assignedTreatmentsByTooth, treatmentPrices }) => {
  const treatedTeeth = React.useMemo(() => Array.from(assignedTreatmentsByTooth?.keys() || []), [assignedTreatmentsByTooth]);

  const toothWidth = 30;
  const toothHeight = 30;
  const totalWidth = upperArchNumbers.length * toothWidth;

  return (
    <TooltipProvider>
      <div className="flex justify-center overflow-x-auto">
        <svg viewBox={`0 -5 ${totalWidth} 90`} width="100%" style={{minWidth: '500px'}}>
          <g>
            {upperArchNumbers.map((num, i) => {
              const assignedTreatments = assignedTreatmentsByTooth?.get(num);
              const colorIndex = treatedTeeth.indexOf(num);
              const color = colorIndex !== -1 ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length] : undefined;
              return (
                <Tooth
                  key={`upper-${num}`}
                  toothNumber={num}
                  onClick={onToothClick}
                  assignedTreatments={assignedTreatments}
                  color={color}
                  transform={`translate(${i * toothWidth}, 10) scale(0.9)`}
                />
              )
            })}
          </g>
          <g>
            {lowerArchNumbers.map((num, i) => {
              const assignedTreatments = assignedTreatmentsByTooth?.get(num);
              const colorIndex = treatedTeeth.indexOf(num);
              const color = colorIndex !== -1 ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length] : undefined;
              return (
                <Tooth
                  key={`lower-${num}`}
                  toothNumber={num}
                  onClick={onToothClick}
                  assignedTreatments={assignedTreatments}
                  color={color}
                   transform={`translate(${i * toothWidth}, 60) scale(0.9)`}
                />
              )
            })}
          </g>
        </svg>
      </div>
    </TooltipProvider>
  );
};
