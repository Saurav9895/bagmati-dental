'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { changeUserPassword, createNewUser, updateUserProfile } from '@/app/actions/users';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'],
});

const newUserSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type NewUserFormValues = z.infer<typeof newUserSchema>;

export default function ProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { displayName: '' },
    });

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    });
    
    const newUserForm = useForm<NewUserFormValues>({
        resolver: zodResolver(newUserSchema),
        defaultValues: { email: '', password: '' },
    });

    React.useEffect(() => {
        if (user) {
            profileForm.reset({ displayName: user.displayName || '' });
        }
    }, [user, profileForm]);

    const onProfileSubmit = async (data: ProfileFormValues) => {
        const result = await updateUserProfile(data.displayName);
        if (result.success) {
            toast({ title: 'Profile updated successfully!' });
        } else {
            toast({ variant: 'destructive', title: 'Failed to update profile', description: result.error });
        }
    };

    const onPasswordSubmit = async (data: PasswordFormValues) => {
        const result = await changeUserPassword(data.currentPassword, data.newPassword);
        if (result.success) {
            toast({ title: 'Password updated successfully!' });
            passwordForm.reset();
        } else {
            toast({ variant: 'destructive', title: 'Failed to update password', description: result.error });
        }
    };
    
    const onNewUserSubmit = async (data: NewUserFormValues) => {
        const result = await createNewUser(data.email, data.password);
        if (result.success) {
            toast({ title: 'User created successfully!' });
            newUserForm.reset();
        } else {
            toast({ variant: 'destructive', title: 'Failed to create user', description: result.error });
        }
    };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your display name and view your email address.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-lg">
                    <FormField control={profileForm.control} name="displayName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <div className="space-y-1">
                        <Label>Email Address</Label>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                    <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                        {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </form>
            </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password here. It's recommended to use a strong password.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-lg">
                    <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl><Input type="password" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl><Input type="password" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl><Input type="password" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                        {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                    </Button>
                </form>
            </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>Add a new user to the system. They will be able to log in with the provided credentials.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...newUserForm}>
                <form onSubmit={newUserForm.handleSubmit(onNewUserSubmit)} className="space-y-4 max-w-lg">
                     <FormField control={newUserForm.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input type="email" placeholder="new.user@example.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={newUserForm.control} name="password" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <Button type="submit" disabled={newUserForm.formState.isSubmitting}>
                        {newUserForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create User
                    </Button>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}
