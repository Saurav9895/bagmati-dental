

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

const toothPaths: { [key: string]: string } = {
    'molar3-upper': "M11.9,8.5c-0.8-0.3-1.6,0.1-2.2,0.6c-0.6,0.5-0.9,1.3-0.8,2.1l0.2,1.3c0.1,0.6,0.5,1,1,1.1l0.5,0.1 c1.5,0.2,2.9-0.5,3.7-1.7l0.1-0.2c0.4-0.8,0.5-1.7,0.1-2.5C14,8.8,13,8.4,11.9,8.5z M4.9,2.1c-0.2,0-0.5,0-0.7,0.1 c-2.3,0.5-4,2.5-4,4.9c0,2.8,2.3,5.1,5.1,5.1c0.2,0,0.5,0,0.7-0.1c2.3-0.5,4-2.5,4-4.9C10.1,4.4,7.8,2.1,4.9,2.1z M5.1,10.1 c-1.7,0-3.1-1.4-3.1-3.1c0-1.4,0.9-2.6,2.2-2.9C4.5,4,4.7,4,4.9,4c1.7,0,3.1,1.4,3.1,3.1C8,8.5,6.8,9.8,5.1,10.1z",
    'molar2-upper': "M18.8,4.1c-2.4-1.9-5.8-2.5-8.8-1.5c-3,1-5.1,3.6-5.1,6.8c0,3.8,3.1,7,7,7c3.1,0,5.9-2.1,6.7-5 c0.3-1.1,0.2-2.2-0.2-3.3C18,6.8,18.2,5.4,18.8,4.1z M12.1,13.4c-2.2,0-4-1.8-4-4s1.8-4,4-4s4,1.8,4,4S14.3,13.4,12.1,13.4z",
    'molar1-upper': "M18.8,4.1c-2.4-1.9-5.8-2.5-8.8-1.5c-3,1-5.1,3.6-5.1,6.8c0,3.8,3.1,7,7,7c3.1,0,5.9-2.1,6.7-5 c0.3-1.1,0.2-2.2-0.2-3.3C18,6.8,18.2,5.4,18.8,4.1z M12.1,13.4c-2.2,0-4-1.8-4-4s1.8-4,4-4s4,1.8,4,4S14.3,13.4,12.1,13.4z",
    'premolar2-upper': "M15.5,3.6c-2.6-1.5-5.9-1.2-8.2,0.8c-2.3,2-3.2,5.2-2.2,7.9c1,2.7,3.6,4.5,6.5,4.5c1.7,0,3.4-0.6,4.7-1.8 C17.7,14,18.2,12.3,18,10.6c-0.2-1.7-1-3.3-2.3-4.5C15.6,6.1,15.5,4.2,15.5,3.6z M12.4,12.7c-1.3,0-2.3-1-2.3-2.3 s1-2.3,2.3-2.3s2.3,1,2.3,2.3S13.7,12.7,12.4,12.7z",
    'premolar1-upper': "M15.5,3.6c-2.6-1.5-5.9-1.2-8.2,0.8c-2.3,2-3.2,5.2-2.2,7.9c1,2.7,3.6,4.5,6.5,4.5c1.7,0,3.4-0.6,4.7-1.8 C17.7,14,18.2,12.3,18,10.6c-0.2-1.7-1-3.3-2.3-4.5C15.6,6.1,15.5,4.2,15.5,3.6z M12.4,12.7c-1.3,0-2.3-1-2.3-2.3 s1-2.3,2.3-2.3s2.3,1,2.3,2.3S13.7,12.7,12.4,12.7z",
    'canine-upper': "M13.2,1.3C12.1,1.5,11,2,10,2.7c-2.8,2-4.2,5.7-3.5,9.2C7,14.6,9,16.8,11.5,17.6c2.7,0.9,5.7,0,7.7-2.1 c2-2.1,2.6-5.2,1.7-7.9c-0.9-2.7-3.2-4.7-6-5.5C14.4,2,13.8,1.5,13.2,1.3z",
    'incisor-lateral-upper': "M10,1.5C8.7,1.8,7.5,2.4,6.5,3.4C4,5.9,3.5,9.7,5.2,12.8c1.3,2.5,3.8,4.1,6.5,4.1c1.3,0,2.6-0.4,3.7-1.1 c2.9-1.9,4.2-5.4,3.1-8.6C17.5,4,14.2,1,10,1.5z",
    'incisor-central-upper': "M10,1.5C8.7,1.8,7.5,2.4,6.5,3.4C4,5.9,3.5,9.7,5.2,12.8c1.3,2.5,3.8,4.1,6.5,4.1c1.3,0,2.6-0.4,3.7-1.1 c2.9-1.9,4.2-5.4,3.1-8.6C17.5,4,14.2,1,10,1.5z",

    'molar3-lower': "M5.2,17.4c-0.2,0-0.5,0-0.7-0.1C2.2,16.8,0.2,14.8,0.2,12.2c0-2.8,2.3-5.1,5.1-5.1c0.2,0,0.5,0,0.7,0.1 c2.3,0.5,4,2.5,4,4.9C10.1,15,7.8,17.4,5.2,17.4z M5.1,8.9C3.4,8.9,2,10.3,2,12c0,1.4,0.9,2.6,2.2,2.9C4.5,15,4.7,15,4.9,15 c1.7,0,3.1-1.4,3.1-3.1C8,10.5,6.8,9.2,5.1,8.9z M12.3,11c-0.8-0.3-1.6,0.1-2.2,0.6c-0.6,0.5-0.9,1.3-0.8,2.1l0.2,1.3 c0.1,0.6,0.5,1,1,1.1l0.5,0.1c1.5,0.2,2.9-0.5,3.7-1.7l0.1-0.2c0.4-0.8,0.5-1.7,0.1-2.5C14.4,11.3,13.4,10.9,12.3,11z",
    'molar2-lower': "M19.1,15.6c-2.4,1.9-5.8,2.5-8.8,1.5c-3-1-5.1-3.6-5.1-6.8c0-3.8,3.1-7,7-7c3.1,0,5.9,2.1,6.7,5 c0.3,1.1,0.2,2.2-0.2,3.3C18.2,12.9,18.5,14.3,19.1,15.6z M12.4,6.3c-2.2,0-4,1.8-4,4s1.8,4,4,4s4-1.8,4-4S14.6,6.3,12.4,6.3z",
    'molar1-lower': "M19.1,15.6c-2.4,1.9-5.8,2.5-8.8,1.5c-3-1-5.1-3.6-5.1-6.8c0-3.8,3.1-7,7-7c3.1,0,5.9,2.1,6.7,5 c0.3,1.1,0.2,2.2-0.2,3.3C18.2,12.9,18.5,14.3,19.1,15.6z M12.4,6.3c-2.2,0-4,1.8-4,4s1.8,4,4,4s4-1.8,4-4S14.6,6.3,12.4,6.3z",
    'premolar2-lower': "M15.8,16.1c-2.6,1.5-5.9,1.2-8.2-0.8c-2.3-2-3.2-5.2-2.2-7.9c1-2.7,3.6-4.5,6.5-4.5c1.7,0,3.4,0.6,4.7,1.8 c1.4,1.1,1.9,2.8,1.6,4.5c-0.2,1.7-1,3.3-2.3,4.5C15.8,13.6,15.8,15.5,15.8,16.1z M12.7,7c-1.3,0-2.3,1-2.3,2.3 s1,2.3,2.3,2.3s2.3-1,2.3-2.3S14,7,12.7,7z",
    'premolar1-lower': "M15.8,16.1c-2.6,1.5-5.9,1.2-8.2-0.8c-2.3-2-3.2-5.2-2.2-7.9c1-2.7,3.6-4.5,6.5-4.5c1.7,0,3.4,0.6,4.7,1.8 c1.4,1.1,1.9,2.8,1.6,4.5c-0.2,1.7-1,3.3-2.3,4.5C15.8,13.6,15.8,15.5,15.8,16.1z M12.7,7c-1.3,0-2.3,1-2.3,2.3 s1,2.3,2.3,2.3s2.3-1,2.3-2.3S14,7,12.7,7z",
    'canine-lower': "M13.2,18.4c-1.1-0.2-2.1-0.7-3.2-1.4c-2.8-2-4.2-5.7-3.5-9.2c0.5-2.7,2.5-4.9,5-5.7c2.7-0.9,5.7,0,7.7,2.1 c2,2.1,2.6,5.2,1.7,7.9c-0.9,2.7-3.2,4.7-6,5.5C14.4,17.7,13.8,18.2,13.2,18.4z",
    'incisor-lateral-lower': "M10,18.2c-1.3-0.3-2.5-0.9-3.5-1.9C4,13.8,3.5,10,5.2,6.9c1.3-2.5,3.8-4.1,6.5-4.1c1.3,0,2.6,0.4,3.7,1.1 c2.9,1.9,4.2,5.4,3.1,8.6C17.5,15.7,14.2,18.7,10,18.2z",
    'incisor-central-lower': "M10,18.2c-1.3-0.3-2.5-0.9-3.5-1.9C4,13.8,3.5,10,5.2,6.9c1.3-2.5,3.8-4.1,6.5-4.1c1.3,0,2.6,0.4,3.7,1.1 c2.9,1.9,4.2,5.4,3.1,8.6C17.5,15.7,14.2,18.7,10,18.2z",
};

const toothTypes: { [key: number]: string } = {
  // Upper Right
  1: 'molar3-upper', 2: 'molar2-upper', 3: 'molar1-upper',
  4: 'premolar2-upper', 5: 'premolar1-upper', 6: 'canine-upper',
  7: 'incisor-lateral-upper', 8: 'incisor-central-upper',
  // Upper Left
  9: 'incisor-central-upper', 10: 'incisor-lateral-upper', 11: 'canine-upper',
  12: 'premolar1-upper', 13: 'premolar2-upper', 14: 'molar1-upper',
  15: 'molar2-upper', 16: 'molar3-upper',
  // Lower Left
  17: 'molar3-lower', 18: 'molar2-lower', 19: 'molar1-lower',
  20: 'premolar2-lower', 21: 'premolar1-lower', 22: 'canine-lower',
  23: 'incisor-lateral-lower', 24: 'incisor-central-lower',
  // Lower Right
  25: 'incisor-central-lower', 26: 'incisor-lateral-lower', 27: 'canine-lower',
  28: 'premolar1-lower', 29: 'premolar2-lower', 30: 'molar1-lower',
  31: 'molar2-lower', 32: 'molar3-lower',
};

interface ToothProps extends React.SVGProps<SVGGElement> {
  toothNumber: number;
  onClick: (toothNumber: number) => void;
  assignedTreatments?: AssignedTreatment[];
  color?: string;
  isUpper: boolean;
}

const Tooth: React.FC<ToothProps> = ({ toothNumber, onClick, assignedTreatments, color, isUpper, ...props }) => {
  const hasAssignedTreatment = assignedTreatments && assignedTreatments.length > 0;
  const toothIconPath = toothPaths[toothTypes[toothNumber]];

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
