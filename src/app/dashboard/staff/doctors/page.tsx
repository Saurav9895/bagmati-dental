'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function DoctorsPage() {
  useEffect(() => {
    redirect('/dashboard');
  }, []);
  
  return null;
}
