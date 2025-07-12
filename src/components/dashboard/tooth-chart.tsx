
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
const realisticToothPath = "M15,3C12.7,3,11,4.4,10.2,6.5C8.4,5.4,6.2,5.1,4,5.9C4.5,7.9,5.5,9.6,7,10.9C6.9,11.2,6.9,11.5,6.9,11.8C6.9,14.7,9.3,17.1,12.2,17.1C12.5,17.1,12.8,17.1,13.1,17C13.1,18.9,14.6,20.5,16.5,20.5C18.4,20.5,19.9,18.9,19.9,17C20.2,17.1,20.5,17.1,20.8,17.1C23.7,17.1,26.1,14.7,26.1,11.8C26.1,11.5,26.1,11.2,26,10.9C27.5,9.6,28.5,7.9,29,5.9C26.8,5.1,24.6,5.4,22.8,6.5C22,4.4,20.3,3,18,3C17.4,3,16.8,3.1,16.2,3.3C15.8,3.1,15.4,3,15,3Z";

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
