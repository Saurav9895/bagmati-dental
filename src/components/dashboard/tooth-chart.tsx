

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
  
  const toothIconPath = "M12.3,3.2c-2.3-0.8-4.7-0.7-7,0.2c-1.8,0.7-3.3,2.1-4,3.9c-0.6,1.8-0.6,3.7,0,5.5c0.5,1.5,1.4,2.8,2.7,3.8 c1.3,1,2.9,1.7,4.6,2c0.4,0.1,0.8,0.1,1.2,0.1c1.2,0,2.4-0.3,3.5-0.8c2.4-1.1,4.1-3.1,4.9-5.5c0.9-2.6,0.5-5.4-0.9-7.7 C16.2,3.6,14.3,2.8,12.3,3.2z M18.5,12.1c-0.6,1.8-1.9,3.3-3.6,4.2c-1.7,0.9-3.7,1.1-5.6,0.6c-1.9-0.5-3.6-1.7-4.7-3.4 c-1.1-1.7-1.5-3.8-1.1-5.7c0.3-1.4,1.2-2.6,2.4-3.4c2-1.2,4.5-1.5,6.8-0.8c2,0.6,3.7,2.1,4.4,4.1C18.9,9.5,18.9,11,18.5,12.1z";

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
        transform="scale(1.2)"
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
