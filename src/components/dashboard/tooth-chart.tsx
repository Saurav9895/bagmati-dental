

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
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
];

// Single, clean tooth icon SVG path
const toothIconPath = "M16.9,3.2C15.4,1.7,13.3,1,11,1S6.6,1.7,5.1,3.2S2,7.4,2,10.1c0,2.1,0.5,3.8,1.5,5.2c1,1.4,2.5,2.7,4.3,3.8 c0.6,0.4,1.3,0.6,2,0.8l0.1,0c0.1,0,0.2,0,0.2,0c0.2,0,0.3,0,0.5,0c0.1,0,0.1,0,0.2,0l0.1,0c0.7-0.2,1.4-0.4,2-0.8 c1.8-1.1,3.3-2.4,4.3-3.8c1-1.4,1.5-3.1,1.5-5.2C20,7.4,18.4,4.7,16.9,3.2z M15.4,14.6c-0.8,1.1-2,2.2-3.6,3.1 c-0.4,0.2-0.9,0.4-1.3,0.5c-0.1,0-0.2,0-0.2,0c-0.2,0-0.3,0-0.5,0c-0.1,0-0.1,0-0.2,0c-0.5-0.1-0.9-0.3-1.3-0.5 c-1.6-0.9-2.8-2-3.6-3.1C4,13.5,3.5,12,3.5,10.1c0-2.3,1.4-4.6,2.7-6c1.3-1.3,3-2,4.8-2s3.5,0.7,4.8,2c1.3,1.4,2.7,3.7,2.7,6 C18.5,12,16.5,13.5,15.4,14.6z";


interface ToothProps extends React.SVGProps<SVGGElement> {
  toothNumber: number;
  onClick: (toothNumber: number) => void;
  assignedTreatments?: AssignedTreatment[];
  color?: string;
  isUpper: boolean;
}

const Tooth: React.FC<ToothProps> = ({ toothNumber, onClick, assignedTreatments, color, isUpper, ...props }) => {
  const hasAssignedTreatment = assignedTreatments && assignedTreatments.length > 0;

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
        y={isUpper ? 22 : -2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="6"
        fill={'#6b7280'}
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

  return (
      <Tooltip>
        <TooltipTrigger asChild>{toothContent}</TooltipTrigger>
        <TooltipContent>
          <div className='font-bold mb-2'>Tooth #{toothNumber}</div>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    );
};

interface ToothChartProps {
  onToothClick: (toothNumber: number) => void;
  assignedTreatmentsByTooth?: Map<number, AssignedTreatment[]>;
}

// Universal Numbering System
const upperRightNumbers = [1, 2, 3, 4, 5, 6, 7, 8];
const upperLeftNumbers = [9, 10, 11, 12, 13, 14, 15, 16];
const lowerLeftNumbers = [17, 18, 19, 20, 21, 22, 23, 24];
const lowerRightNumbers = [25, 26, 27, 28, 29, 30, 31, 32];


export const ToothChart: React.FC<ToothChartProps> = ({ onToothClick, assignedTreatmentsByTooth }) => {
  const treatedTeeth = React.useMemo(() => Array.from(assignedTreatmentsByTooth?.keys() || []), [assignedTreatmentsByTooth]);

  const toothWidth = 35;
  const quadrantWidth = upperRightNumbers.length * toothWidth;
  const midLineGap = 15;
  const totalWidth = quadrantWidth * 2 + midLineGap;

  return (
    <TooltipProvider>
      <div className="flex justify-center overflow-x-auto p-4 bg-muted/30 rounded-lg">
        <svg viewBox={`-5 0 ${totalWidth + 10} 100`} width="100%" style={{minWidth: '600px'}}>
           {/* Midline */}
          <line x1={totalWidth / 2} y1="5" x2={totalWidth / 2} y2="95" stroke="#cbd5e1" strokeWidth="1" />
          
          {/* Upper Right Quadrant */}
          <g>
            {upperRightNumbers.map((num, i) => {
              const assignedTreatments = assignedTreatmentsByTooth?.get(num);
              const colorIndex = treatedTeeth.indexOf(num);
              const color = colorIndex !== -1 ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length] : undefined;
              return (
                <Tooth
                  key={`upper-right-${num}`}
                  toothNumber={num}
                  onClick={onToothClick}
                  assignedTreatments={assignedTreatments}
                  color={color}
                  isUpper={true}
                  transform={`translate(${(upperRightNumbers.length - 1 - i) * toothWidth}, 10) scale(1)`}
                />
              )
            })}
          </g>

          {/* Upper Left Quadrant */}
           <g transform={`translate(${quadrantWidth + midLineGap}, 0)`}>
            {upperLeftNumbers.map((num, i) => {
              const assignedTreatments = assignedTreatmentsByTooth?.get(num);
              const colorIndex = treatedTeeth.indexOf(num);
              const color = colorIndex !== -1 ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length] : undefined;
              return (
                <Tooth
                  key={`upper-left-${num}`}
                  toothNumber={num}
                  onClick={onToothClick}
                  assignedTreatments={assignedTreatments}
                  color={color}
                  isUpper={true}
                  transform={`translate(${i * toothWidth}, 10) scale(1)`}
                />
              )
            })}
          </g>

          {/* Lower Right Quadrant */}
           <g>
            {lowerRightNumbers.slice().reverse().map((num, i) => {
              const assignedTreatments = assignedTreatmentsByTooth?.get(num);
              const colorIndex = treatedTeeth.indexOf(num);
              const color = colorIndex !== -1 ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length] : undefined;
              return (
                <Tooth
                  key={`lower-right-${num}`}
                  toothNumber={num}
                  onClick={onToothClick}
                  assignedTreatments={assignedTreatments}
                  color={color}
                  isUpper={false}
                  transform={`translate(${i * toothWidth}, 60) scale(1)`}
                />
              )
            })}
          </g>

          {/* Lower Left Quadrant */}
           <g transform={`translate(${quadrantWidth + midLineGap}, 0)`}>
            {lowerLeftNumbers.slice().reverse().map((num, i) => {
              const assignedTreatments = assignedTreatmentsByTooth?.get(num);
              const colorIndex = treatedTeeth.indexOf(num);
              const color = colorIndex !== -1 ? COLOR_PALETTE[colorIndex % COLOR_PALETTE.length] : undefined;
              return (
                <Tooth
                  key={`lower-left-${num}`}
                  toothNumber={num}
                  onClick={onToothClick}
                  assignedTreatments={assignedTreatments}
                  color={color}
                  isUpper={false}
                  transform={`translate(${(lowerLeftNumbers.length - 1 - i) * toothWidth}, 60) scale(1)`}
                />
              )
            })}
          </g>
          
        </svg>
      </div>
    </TooltipProvider>
  );
};
