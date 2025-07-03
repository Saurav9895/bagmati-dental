
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

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
  const [primaryColor, setPrimaryColor] = React.useState('#3b82f6');
  const [logoSrc, setLogoSrc] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const savedColor = localStorage.getItem('theme-primary-color');
    if (savedColor) {
      setPrimaryColor(hslToHex(savedColor));
    } else {
      const initialColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      if (initialColor) {
        setPrimaryColor(hslToHex(initialColor));
      }
    }
    
    const savedLogo = localStorage.getItem('custom-logo');
    if (savedLogo) {
      setLogoSrc(savedLogo);
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

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // Limit file size to 1MB
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload an image smaller than 1MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLogoSrc(dataUrl);
        localStorage.setItem('custom-logo', dataUrl);
        toast({ title: 'Logo updated successfully! Refreshing...' });
        // Force a reload to see the change everywhere.
        setTimeout(() => window.location.reload(), 1000);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveLogo = () => {
    setLogoSrc(null);
    localStorage.removeItem('custom-logo');
    toast({ title: 'Logo removed. Refreshing...' });
    setTimeout(() => window.location.reload(), 1000);
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
      
      <Card>
          <CardHeader>
            <CardTitle>Logo Settings</CardTitle>
            <CardDescription>Upload a custom logo for your clinic. It will appear in the sidebar and login page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-lg">
                <Label htmlFor="logo-upload">Upload Logo (PNG, JPG, SVG)</Label>
                <Input id="logo-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoChange} />
                <p className="text-sm text-muted-foreground">Recommended size: 128x32 pixels. Max size: 1MB.</p>
            </div>
            {logoSrc && (
                <div>
                    <Label>Current Logo Preview</Label>
                    <div className="mt-2 p-4 border rounded-lg flex items-center justify-between">
                        <Image src={logoSrc} alt="Custom Logo Preview" width={128} height={32} className="object-contain" />
                        <Button variant="destructive" size="sm" onClick={handleRemoveLogo}>Remove Logo</Button>
                    </div>
                </div>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
