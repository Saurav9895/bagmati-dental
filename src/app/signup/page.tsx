'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function SignupPage() {
  useEffect(() => {
    redirect('/login');
  }, []);
  
  return null;
}
