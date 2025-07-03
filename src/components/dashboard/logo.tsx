'use client';

import * as React from 'react';
import Image from 'next/image';

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
  const [logoSrc, setLogoSrc] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const savedLogo = localStorage.getItem('custom-logo');
      if (savedLogo) {
        setLogoSrc(savedLogo);
      }
    } catch (error) {
      console.error("Could not access local storage for logo", error);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    // Render a skeleton placeholder to prevent layout shift while loading from localStorage.
    return (
      <div className="flex items-center gap-2" aria-label="Loading logo...">
        <div className="w-[160px] h-[70px] bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {logoSrc ? (
        <Image 
          src={logoSrc} 
          alt="Custom Clinic Logo" 
          width={160} 
          height={70} 
          className="h-auto w-[160px] object-contain" 
          priority 
        />
      ) : (
        <>
          <ToothIcon className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold font-headline text-primary">Bagmati Dental Clinic</h1>
        </>
      )}
    </div>
  );
}
