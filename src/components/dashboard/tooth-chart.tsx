

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { AssignedTreatment, ToothExamination } from '@/lib/types';
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
  toothExaminations?: ToothExamination[];
  selected?: boolean;
  color?: string;
  isUpper: boolean;
}

// A more realistic tooth SVG path
const realisticToothPath = "M16 3c-1.1 0-2 .9-2 2 0 .9.6 1.6 1.4 1.9C14.5 7.5 13 9.1 13 11v5c0 .6.4 1 1 1s1-.4 1-1v-2h2v2c0 .6.4 1 1 1s1-.4 1-1v-5c0-1.9-1.5-3.5-2.4-4.1.8-.3 1.4-1 1.4-1.9 0-1.1-.9-2-2-2z";


const Tooth: React.FC<ToothProps> = ({
  toothNumber,
  onClick,
  toothExaminations,
  selected,
  color,
  isUpper,
  ...props
}) => {
  const hasExamination = toothExaminations && toothExaminations.length > 0;

  const tooltipContent = hasExamination ? (
    <div key="examinations">
        {toothExaminations.map((exam, i) => (
            <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t' : ''}>
                <p><span className="font-semibold">Exam:</span> {exam.dentalExamination}</p>
                <p><span className="font-semibold">Diagnosis:</span> {exam.diagnosis}</p>
                {exam.investigation && <p><span className="font-semibold">Investigation:</span> {exam.investigation}</p>}
                <p className="text-xs text-muted-foreground">{new Date(exam.date).toLocaleDateString()}</p>
            </div>
        ))}
    </div>
  ) : (
    <div key="no-exam">
      <p>Click to record an examination.</p>
    </div>
  );
  
  let fillColor = '#e5e7eb'; // default gray-200
  if (selected) {
    fillColor = 'hsl(var(--primary))';
  } else if (hasExamination) {
    fillColor = color || '#fde047'; // yellow-200
  }


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
              'transition-all duration-200 group-hover:fill-primary/50 stroke-2',
               'stroke-transparent'
            )}
            style={{
              fill: fillColor,
            }}
          />
          <text
            x="18"
            y={isUpper ? 38 : -8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill={selected ? 'white' : '#374151'} // gray-700
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
  toothExaminationsByTooth?: Map<number | string, ToothExamination[]>;
  selectedTeeth?: string[];
}

// FDI Notation for permanent teeth
const upperRightFDI = Array.from({ length: 8 }, (_, i) => 18 - i); // 18, 17, ... 11
const upperLeftFDI = Array.from({ length: 8 }, (_, i) => i + 21);  // 21, 22, ... 28
const lowerRightFDI = Array.from({ length: 8 }, (_, i) => 48 - i); // 48, 47, ... 41
const lowerLeftFDI = Array.from({ length: 8 }, (_, i) => i + 31);  // 31, 32, ... 38


export const ToothChart: React.FC<ToothChartProps> = ({
  onToothClick,
  toothExaminationsByTooth,
  selectedTeeth = [],
}) => {
  const treatedTeeth = React.useMemo(
    () => Array.from(toothExaminationsByTooth?.keys() || []),
    [toothExaminationsByTooth]
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
              toothExaminations={toothExaminationsByTooth?.get(num)}
              color={getToothColor(num)}
              isUpper={true}
              selected={selectedTeeth.includes(String(num))}
              transform={`translate(${250 - i * 32}, 5)`}
            />
          ))}
          {/* Upper Left Quadrant (Teeth 21-28) */}
          {upperLeftFDI.map((num, i) => (
            <Tooth
              key={`upper-${num}`}
              toothNumber={num}
              onClick={onToothClick}
              toothExaminations={toothExaminationsByTooth?.get(num)}
              color={getToothColor(num)}
              isUpper={true}
              selected={selectedTeeth.includes(String(num))}
              transform={`translate(${305 + i * 32}, 5)`}
            />
          ))}
          
          {/* Lower Right Quadrant (Teeth 41-48) - Reversed to match dental notation from patient's perspective */}
          {lowerRightFDI.map((num, i) => (
            <Tooth
              key={`lower-${num}`}
              toothNumber={num}
              onClick={onToothClick}
              toothExaminations={toothExaminationsByTooth?.get(num)}
              color={getToothColor(num)}
              isUpper={false}
              selected={selectedTeeth.includes(String(num))}
              transform={`translate(${250 - i * 32}, 75)`}
            />
          ))}
          {/* Lower Left Quadrant (Teeth 31-38) - Reversed */}
          {lowerLeftFDI.map((num, i) => (
            <Tooth
              key={`lower-${num}`}
              toothNumber={num}
              onClick={onToothClick}
              toothExaminations={toothExaminationsByTooth?.get(num)}
              color={getToothColor(num)}
              isUpper={false}
              selected={selectedTeeth.includes(String(num))}
              transform={`translate(${305 + i * 32}, 75)`}
            />
          ))}
        </svg>
      </div>
    </TooltipProvider>
  );
};


// Primary Teeth Chart with FDI notation
const primaryUpperRight = ['55', '54', '53', '52', '51'];
const primaryUpperLeft = ['61', '62', '63', '64', '65'];
const primaryLowerLeft = ['71', '72', '73', '74', '75'];
const primaryLowerRight = ['85', '84', '83', '82', '81'];


export const PrimaryToothChart: React.FC<ToothChartProps> = ({
  onToothClick,
  toothExaminationsByTooth,
  selectedTeeth = [],
}) => {
  const treatedTeeth = React.useMemo(
    () => Array.from(toothExaminationsByTooth?.keys() || []),
    [toothExaminationsByTooth]
  );
  
  const getToothColor = (toothNumber: number | string) => {
    const colorIndex = treatedTeeth.indexOf(toothNumber);
    return colorIndex !== -1 ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length] : undefined;
  };

  return (
    <TooltipProvider>
      <div className="flex justify-center overflow-x-auto p-4 bg-muted/30 rounded-lg">
        <svg viewBox="0 0 420 120" width="100%" style={{ minWidth: '400px' }}>
          {/* Upper Right Quadrant */}
          {primaryUpperRight.map((num, i) => (
            <Tooth
              key={`upper-${num}`}
              toothNumber={num}
              onClick={() => onToothClick(num)}
              toothExaminations={toothExaminationsByTooth?.get(num)}
              color={getToothColor(num)}
              isUpper={true}
              selected={selectedTeeth.includes(num)}
              transform={`translate(${180 - i * 32}, 5)`}
            />
          ))}
          {/* Upper Left Quadrant */}
          {primaryUpperLeft.map((num, i) => (
            <Tooth
              key={`upper-${num}`}
              toothNumber={num}
              onClick={() => onToothClick(num)}
              toothExaminations={toothExaminationsByTooth?.get(num)}
              color={getToothColor(num)}
              isUpper={true}
              selected={selectedTeeth.includes(num)}
              transform={`translate(${215 + i * 32}, 5)`}
            />
          ))}
          
          {/* Lower Right Quadrant - Reversed */}
          {primaryLowerRight.map((num, i) => (
            <Tooth
              key={`lower-${num}`}
              toothNumber={num}
              onClick={() => onToothClick(num)}
              toothExaminations={toothExaminationsByTooth?.get(num)}
              color={getToothColor(num)}
              isUpper={false}
              selected={selectedTeeth.includes(num)}
              transform={`translate(${180 - i * 32}, 75)`}
            />
          ))}
          {/* Lower Left Quadrant - Reversed */}
          {primaryLowerLeft.map((num, i) => (
            <Tooth
              key={`lower-${num}`}
              toothNumber={num}
              onClick={() => onToothClick(num)}
              toothExaminations={toothExaminationsByTooth?.get(num)}
              color={getToothColor(num)}
              isUpper={false}
              selected={selectedTeeth.includes(num)}
              transform={`translate(${215 + i * 32}, 75)`}
            />
          ))}
        </svg>
      </div>
    </TooltipProvider>
  );
};
