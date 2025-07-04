'use client';

import * as React from 'react';
import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image 
          src="/logo.png"
          alt="Bagmati Dental Clinic Logo" 
          width={160} 
          height={70}
          className="h-auto w-[160px] object-contain" 
          priority 
        />
    </div>
  );
}
