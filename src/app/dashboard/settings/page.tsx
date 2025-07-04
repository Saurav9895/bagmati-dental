'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return `${h} ${s}% ${l}%`;
}

function hslToHex(hslStr: string): string {
    if (!hslStr) return '#000000';
    const [h, s, l] = hslStr.replace(/%/g, '').split(' ').map(Number);
    if (isNaN(h) || isNaN(s) || isNaN(l)) return '#000000';
    const sNorm = s / 100;
    const lNorm = l / 100;
    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lNorm - c / 2;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

    const toHex = (c: number) => {
        const hex = Math.round((c + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}


export default function SettingsPage() {
  const [primaryColor, setPrimaryColor] = React.useState('#B62F67');

  React.useEffect(() => {
    const savedColor = localStorage.getItem('theme-primary-color');
    if (savedColor) {
      setPrimaryColor(hslToHex(savedColor));
    } else {
      const rootStyle = getComputedStyle(document.documentElement);
      const primaryHsl = rootStyle.getPropertyValue('--primary').trim();
      if (primaryHsl) {
        setPrimaryColor(hslToHex(primaryHsl));
      }
    }
  }, []);

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newHexColor = event.target.value;
    setPrimaryColor(newHexColor);
    
    const newHslColor = hexToHsl(newHexColor);
    if (newHslColor) {
      document.documentElement.style.setProperty('--primary', newHslColor);
      localStorage.setItem('theme-primary-color', newHslColor);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>Customize the primary color of the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-lg">
            <Label htmlFor="theme-color">Primary Color</Label>
            <div className="flex items-center gap-4">
              <Input
                id="theme-color"
                type="color"
                value={primaryColor}
                onChange={handleColorChange}
                className="p-1 h-10 w-14 cursor-pointer"
              />
              <div className="flex items-center justify-center flex-1 rounded-md border p-2 text-sm bg-primary text-primary-foreground">
                Primary Color Preview
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Changes are saved automatically to your browser.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
