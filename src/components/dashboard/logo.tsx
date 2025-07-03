import * as React from 'react';

const ToothIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9.34 2.15 12 4.5l2.66-2.35a2.21 2.21 0 0 1 3.16 0A2.21 2.21 0 0 1 18.5 5.3v1.65l2.81 5.23a2.19 2.19 0 0 1-1.31 3.32h-3.4c-.44 1.34-1.12 2.65-2.1 3.72a3.86 3.86 0 0 1-5.3 0c-.98-1.07-1.66-2.38-2.1-3.72h-3.4a2.19 2.19 0 0 1-1.31-3.32L5.5 6.95V5.3a2.21 2.21 0 0 1 .68-3.15 2.21 2.21 0 0 1 3.16 0Z" />
    <path d="m12 15.5 2-2-4-4-2 2" />
  </svg>
);

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <ToothIcon className="h-6 w-6 text-primary" />
      <h1 className="text-xl font-bold font-headline text-primary">DentalFlow</h1>
    </div>
  );
}
