

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
  toothNumber: number | string;
  onClick: (toothNumber: number | string) => void;
  assignedTreatments?: AssignedTreatment[];
  color?: string;
  isUpper: boolean;
}

// A more realistic tooth SVG path
const realisticToothPath = "M16 3c-1.1 0-2 .9-2 2 0 .9.6 1.6 1.4 1.9C14.5 7.5 13 9.1 13 11v5c0 .6.4 1 1 1s1-.4 1-1v-2h2v2c0 .6.4 1 1 1s1-.4 1-1v-5c0-1.9-1.5-3.5-2.4-4.1.8-.3 1.4-1 1.4-1.9 0-1.1-.9-2-2-2z";
const primaryToothPath = "M16 4c-1.1 0-2 1-2 2.2 0 1 .6 1.8 1.4 2.1-1 .7-1.4 2.1-1.4 3.4v2.3c0 .6.4 1 1 1s1-.4 1-1v-1h2v1c0 .6.4 1 1 1s1-.4 1-1v-2.3c0-1.3-.4-2.7-1.4-3.4.8-.3 1.4-1.1 1.4-2.1C18 5 17.1 4 16 4z";


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
  
  const isPrimary = typeof toothNumber === 'string';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <g
          onClick={() => onClick(toothNumber)}
          className="cursor-pointer group"
          {...props}
        >
          <path
            d={isPrimary ? primaryToothPath : realisticToothPath}
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
  onToothClick: (toothNumber: number | string) => void;
  assignedTreatmentsByTooth?: Map<number | string, AssignedTreatment[]>;
}

// FDI Notation for permanent teeth
const upperRightFDI = Array.from({ length: 8 }, (_, i) => 18 - i); // 18, 17, ... 11
const upperLeftFDI = Array.from({ length: 8 }, (_, i) => i + 21);  // 21, 22, ... 28
const lowerRightFDI = Array.from({ length: 8 }, (_, i) => 48 - i); // 48, 47, ... 41
const lowerLeftFDI = Array.from({ length: 8 }, (_, i) => i + 31);  // 31, 32, ... 38


export const ToothChart: React.FC<ToothChartProps> = ({
  onToothClick,
  assignedTreatmentsByTooth,
}) => {
  const treatedTeeth = React.useMemo(
    () => Array.from(assignedTreatmentsByTooth?.keys() || []),
    [assignedTreatmentsByTooth]
  );
  
  const getToothColor = (toothNumber: number | string) => {
    const colorIndex = treatedTeeth.indexOf(toothNumber);
    return colorIndex !== -1 ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length] : undefined;
  };

  return (
    <TooltipProvider>
      <div className="flex justify-center overflow-x-auto p-4 bg-muted/30 rounded-lg">
        <svg viewBox="0 0 580 120" width="100%" style={{ minWidth: '560px' }}>
          {/* Upper Right Quadrant (Teeth 11-18) */}
          {upperRightFDI.map((num, i) => (
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
          {/* Upper Left Quadrant (Teeth 21-28) */}
          {upperLeftFDI.map((num, i) => (
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
          
          {/* Lower Right Quadrant (Teeth 41-48) - Reversed to match dental notation from patient's perspective */}
          {lowerRightFDI.map((num, i) => (
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
          {/* Lower Left Quadrant (Teeth 31-38) - Reversed */}
          {lowerLeftFDI.map((num, i) => (
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


// Primary Teeth Chart (A-T)
const primaryUpperRight = ['A', 'B', 'C', 'D', 'E'];
const primaryUpperLeft = ['F', 'G', 'H', 'I', 'J'];
const primaryLowerLeft = ['K', 'L', 'M', 'N', 'O'];
const primaryLowerRight = ['P', 'Q', 'R', 'S', 'T'];

export const PrimaryToothChart: React.FC<ToothChartProps> = ({
  onToothClick,
  assignedTreatmentsByTooth,
}) => {
  const treatedTeeth = React.useMemo(
    () => Array.from(assignedTreatmentsByTooth?.keys() || []),
    [assignedTreatmentsByTooth]
  );
  
  const getToothColor = (toothNumber: number | string) => {
    const colorIndex = treatedTeeth.indexOf(toothNumber);
    return colorIndex !== -1 ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length] : undefined;
  };

  return (
    <TooltipProvider>
      <div className="flex justify-center overflow-x-auto p-4 bg-muted/30 rounded-lg">
        <svg viewBox="0 0 420 120" width="100%" style={{ minWidth: '400px' }}>
          {/* Upper Right Quadrant (Teeth A-E) */}
          {primaryUpperRight.map((letter, i) => (
            <Tooth
              key={`upper-${letter}`}
              toothNumber={letter}
              onClick={onToothClick}
              assignedTreatments={assignedTreatmentsByTooth?.get(letter)}
              color={getToothColor(letter)}
              isUpper={true}
              transform={`translate(${180 - i * 32}, 5)`}
            />
          ))}
          {/* Upper Left Quadrant (Teeth F-J) */}
          {primaryUpperLeft.map((letter, i) => (
            <Tooth
              key={`upper-${letter}`}
              toothNumber={letter}
              onClick={onToothClick}
              assignedTreatments={assignedTreatmentsByTooth?.get(letter)}
              color={getToothColor(letter)}
              isUpper={true}
              transform={`translate(${215 + i * 32}, 5)`}
            />
          ))}
          
          {/* Lower Right Quadrant (Teeth P-T) - Reversed */}
          {primaryLowerRight.slice().reverse().map((letter, i) => (
            <Tooth
              key={`lower-${letter}`}
              toothNumber={letter}
              onClick={onToothClick}
              assignedTreatments={assignedTreatmentsByTooth?.get(letter)}
              color={getToothColor(letter)}
              isUpper={false}
              transform={`translate(${180 - i * 32}, 75)`}
            />
          ))}
          {/* Lower Left Quadrant (Teeth K-O) - Reversed */}
          {primaryLowerLeft.slice().reverse().map((letter, i) => (
            <Tooth
              key={`lower-${letter}`}
              toothNumber={letter}
              onClick={onToothClick}
              assignedTreatments={assignedTreatmentsByTooth?.get(letter)}
              color={getToothColor(letter)}
              isUpper={false}
              transform={`translate(${215 + i * 32}, 75)`}
            />
          ))}
        </svg>
      </div>
    </TooltipProvider>
  );
};
