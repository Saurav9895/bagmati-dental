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
            d="M17.5,2C15.2,2,13.3,3.9,13.3,6.2v4.6c0,1.2-0.6,2.3-1.6,2.9c-0.6,0.4-1.3,0.6-2,0.6c-0.7,0-1.4-0.2-2-0.6 C7,13.1,6.4,12,6.4,10.8V6.2C6.4,3.9,4.5,2,2.2,2S-2.1,3.9-2.1,6.2v4.6c0,2.4,1.2,4.6,3.2,5.8c1.3,0.7,2.8,1.1,4.3,1.1 c1.5,0,3-0.4,4.3-1.1c2-1.2,3.2-3.4,3.2-5.8V6.2C12.8,3.9,15.2,2,17.5,2z"
            transform="scale(1.2) translate(0, 4)"
            className={cn(
                'transition-colors duration-200 group-hover:fill-blue-400 stroke-gray-400 stroke-[0.5]',
                hasAssignedTreatment ? 'fill-yellow-300' : 'fill-gray-200'
            )}
            style={{
                fill: color || (hasAssignedTreatment ? '#fde047' : '#e5e7eb'),
            }}
          />
          <text
            x="7.5"
            y={isUpper ? 28 : -8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fill="#6b7280"
            className="pointer-events-none select-none font-sans"
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

const upperRightNumbers = [1, 2, 3, 4, 5, 6, 7, 8];
const upperLeftNumbers = [9, 10, 11, 12, 13, 14, 15, 16];
const lowerLeftNumbers = [17, 18, 19, 20, 21, 22, 23, 24];
const lowerRightNumbers = [25, 26, 27, 28, 29, 30, 31, 32];

export const ToothChart: React.FC<ToothChartProps> = ({
  onToothClick,
  assignedTreatmentsByTooth,
}) => {
  const treatedTeeth = React.useMemo(
    () => Array.from(assignedTreatmentsByTooth?.keys() || []),
    [assignedTreatmentsByTooth]
  );

  const toothWidth = 35;
  const quadrantWidth = upperRightNumbers.length * toothWidth;
  const midLineGap = 15;
  const totalWidth = quadrantWidth * 2 + midLineGap;

  return (
    <TooltipProvider>
      <div className="flex justify-center overflow-x-auto p-4 bg-muted/30 rounded-lg">
        <svg
          viewBox={`-5 -15 ${totalWidth + 10} 120`}
          width="100%"
          style={{ minWidth: '600px' }}
        >
          {/* Midline */}
          <line
            x1={totalWidth / 2}
            y1="5"
            x2={totalWidth / 2}
            y2="95"
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          {/* Upper Right Quadrant */}
          <g>
            {upperRightNumbers.map((num, i) => {
              const assignedTreatments = assignedTreatmentsByTooth?.get(num);
              const colorIndex = treatedTeeth.indexOf(num);
              const color =
                colorIndex !== -1
                  ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]
                  : undefined;
              return (
                <Tooth
                  key={`upper-right-${num}`}
                  toothNumber={num}
                  onClick={onToothClick}
                  assignedTreatments={assignedTreatments}
                  color={color}
                  isUpper={true}
                  transform={`translate(${
                    (upperRightNumbers.length - 1 - i) * toothWidth + 10
                  }, 10) scale(1)`}
                />
              );
            })}
          </g>

          {/* Upper Left Quadrant */}
          <g transform={`translate(${quadrantWidth + midLineGap}, 0)`}>
            {upperLeftNumbers.map((num, i) => {
              const assignedTreatments = assignedTreatmentsByTooth?.get(num);
              const colorIndex = treatedTeeth.indexOf(num);
              const color =
                colorIndex !== -1
                  ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]
                  : undefined;
              return (
                <Tooth
                  key={`upper-left-${num}`}
                  toothNumber={num}
                  onClick={onToothClick}
                  assignedTreatments={assignedTreatments}
                  color={color}
                  isUpper={true}
                  transform={`translate(${i * toothWidth + 10}, 10) scale(1)`}
                />
              );
            })}
          </g>

          {/* Lower Right Quadrant */}
          <g>
            {lowerRightNumbers
              .slice()
              .reverse()
              .map((num, i) => {
                const assignedTreatments = assignedTreatmentsByTooth?.get(num);
                const colorIndex = treatedTeeth.indexOf(num);
                const color =
                  colorIndex !== -1
                    ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]
                    : undefined;
                return (
                  <Tooth
                    key={`lower-right-${num}`}
                    toothNumber={num}
                    onClick={onToothClick}
                    assignedTreatments={assignedTreatments}
                    color={color}
                    isUpper={false}
                    transform={`translate(${i * toothWidth + 10}, 60) scale(1)`}
                  />
                );
              })}
          </g>

          {/* Lower Left Quadrant */}
          <g transform={`translate(${quadrantWidth + midLineGap}, 0)`}>
            {lowerLeftNumbers
              .slice()
              .reverse()
              .map((num, i) => {
                const assignedTreatments = assignedTreatmentsByTooth?.get(num);
                const colorIndex = treatedTeeth.indexOf(num);
                const color =
                  colorIndex !== -1
                    ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]
                    : undefined;
                return (
                  <Tooth
                    key={`lower-left-${num}`}
                    toothNumber={num}
                    onClick={onToothClick}
                    assignedTreatments={assignedTreatments}
                    color={color}
                    isUpper={false}
                    transform={`translate(${
                      (lowerLeftNumbers.length - 1 - i) * toothWidth + 10
                    }, 60) scale(1)`}
                  />
                );
              })}
          </g>
        </svg>
      </div>
    </TooltipProvider>
  );
};
