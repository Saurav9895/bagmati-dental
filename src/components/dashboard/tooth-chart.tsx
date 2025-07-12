

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
  
  const toothIconPath = "M12.4,22.6c-2.3-0.8-3.9-2-4.9-3.8c-1-1.8-1.5-3.8-1.5-5.6V12c0-2.1,0.6-4.4,1.8-6.6c0.6-1.1,1.4-2.1,2.3-2.9 c0.9-0.8,1.9-1.4,3-1.8C14.2,0.3,15.3,0,16.5,0s2.3,0.3,3.4,0.7c1.1,0.4,2.1,1,3,1.8c0.9,0.8,1.7,1.8,2.3,2.9 c1.2,2.2,1.8,4.5,1.8,6.6v1.2c0,1.8-0.5,3.8-1.5,5.6c-1,1.8-2.6,3-4.9,3.8L16.5,24L12.4,22.6z";

  const toothContent = (
    <g onClick={() => onClick(toothNumber)} className="cursor-pointer group" {...props}>
      <path
        d={toothIconPath}
        className={cn(
          'fill-white stroke-gray-400 stroke-1 transition-colors duration-200 group-hover:fill-blue-200'
        )}
        style={{
          fill: color ? color : 'white'
        }}
      />
      <text
        x="16.5"
        y="14"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill={color ? 'white' : 'black'}
        className="pointer-events-none select-none font-sans"
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

  const toothWidth = 33;
  const toothHeight = 24;
  const totalWidth = upperArchNumbers.length * toothWidth;

  return (
    <TooltipProvider>
      <div className="flex justify-center overflow-x-auto">
        <svg viewBox={`0 0 ${totalWidth} 100`} width="100%" style={{minWidth: '600px'}}>
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
                  transform={`translate(${i * toothWidth}, 10)`}
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
                   transform={`translate(${i * toothWidth}, 60) scale(1, -1) translate(0, -${toothHeight})`}
                />
              )
            })}
          </g>
        </svg>
      </div>
    </TooltipProvider>
  );
};
