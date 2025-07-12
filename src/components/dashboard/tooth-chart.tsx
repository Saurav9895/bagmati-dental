
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
            d="M 5,15 A 10,10 0 0 1 25,15"
            strokeWidth="2"
            fill="none"
            className={cn(
              'transition-colors duration-200 group-hover:stroke-blue-400',
              hasAssignedTreatment ? '' : 'stroke-gray-400'
            )}
            style={{
              stroke: color || (hasAssignedTreatment ? '#fde047' : '#9ca3af'),
            }}
          />
          <text
            x="15"
            y={isUpper ? 25 : -5}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
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

const upperJawNumbers = Array.from({ length: 16 }, (_, i) => i + 1);
const lowerJawNumbers = Array.from({ length: 16 }, (_, i) => i + 17);

export const ToothChart: React.FC<ToothChartProps> = ({
  onToothClick,
  assignedTreatmentsByTooth,
}) => {
  const treatedTeeth = React.useMemo(
    () => Array.from(assignedTreatmentsByTooth?.keys() || []),
    [assignedTreatmentsByTooth]
  );
  
  return (
    <TooltipProvider>
      <div className="flex justify-center overflow-x-auto p-4 bg-muted/30 rounded-lg">
        <svg viewBox="0 0 520 100" width="100%" style={{ minWidth: '500px' }}>
          {/* Upper Jaw */}
          {upperJawNumbers.map((num, i) => {
            const assignedTreatments = assignedTreatmentsByTooth?.get(num);
            const colorIndex = treatedTeeth.indexOf(num);
            const color =
              colorIndex !== -1
                ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]
                : undefined;
            return (
              <Tooth
                key={`upper-${num}`}
                toothNumber={num}
                onClick={onToothClick}
                assignedTreatments={assignedTreatments}
                color={color}
                isUpper={true}
                transform={`translate(${i * 32}, 0)`}
              />
            );
          })}
          {/* Lower Jaw */}
          {lowerJawNumbers.map((num, i) => {
            const assignedTreatments = assignedTreatmentsByTooth?.get(num);
            const colorIndex = treatedTeeth.indexOf(num);
            const color =
              colorIndex !== -1
                ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]
                : undefined;
            return (
              <Tooth
                key={`lower-${num}`}
                toothNumber={num}
                onClick={onToothClick}
                assignedTreatments={assignedTreatments}
                color={color}
                isUpper={false}
                transform={`translate(${i * 32}, 50) scale(1, -1) translate(0, -50)`}
              />
            );
          })}
        </svg>
      </div>
    </TooltipProvider>
  );
};
