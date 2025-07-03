
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createNewUser } from '@/app/actions/users';
import { Label } from '@/components/ui/label';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
});

const newUserSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type NewUserFormValues = z.infer<typeof newUserSchema>;

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
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [isProfileUpdating, setIsProfileUpdating] = React.useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = React.useState(false);
  const [isCreatingUser, setIsCreatingUser] = React.useState(false);
  const [primaryColor, setPrimaryColor] = React.useState('#3b82f6');

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
        name: user?.displayName || '',
        email: user?.email || '',
    }
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const newUserForm = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { email: '', password: '' },
  });
  
  React.useEffect(() => {
    if (user) {
        profileForm.reset({
            name: user.displayName || '',
            email: user.email || '',
        });
    }
  }, [user, profileForm]);

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

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsProfileUpdating(true);
    try {
      await updateProfile(user, { displayName: data.name });
      toast({ title: 'Profile updated successfully!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: error.message });
    } finally {
      setIsProfileUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    if (!user || !user.email) return;

    setIsPasswordUpdating(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, data.newPassword);
      
      toast({ title: 'Password updated successfully!' });
      passwordForm.reset();
    } catch (error: any) {
      let description = 'An unexpected error occurred.';
      if (error.code === 'auth/wrong-password') {
        description = 'The current password you entered is incorrect.';
      } else if (error.code === 'auth/too-many-requests') {
        description = 'Too many attempts. Please try again later.';
      }
      toast({ variant: 'destructive', title: 'Update failed', description });
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  const onNewUserSubmit = async (data: NewUserFormValues) => {
    setIsCreatingUser(true);
    const result = await createNewUser(data.email, data.password);

    if (result.success) {
      toast({ title: 'User created successfully!' });
      newUserForm.reset();
    } else {
      toast({ variant: 'destructive', title: 'User creation failed', description: result.error });
    }
    setIsCreatingUser(false);
  };
  
  if (loading) {
    return <Loader2 className="mx-auto my-12 h-8 w-8 animate-spin" />;
  }

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
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-lg">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input disabled {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isProfileUpdating}>
                {isProfileUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>For security, you must provide your current password.</CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-lg">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPasswordUpdating}>
                {isPasswordUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>Add a new user to the system. The new user will be able to log in with the provided credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...newUserForm}>
            <form onSubmit={newUserForm.handleSubmit(onNewUserSubmit)} className="space-y-4 max-w-lg">
              <FormField
                control={newUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New User's Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="new.user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={newUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isCreatingUser}>
                {isCreatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
