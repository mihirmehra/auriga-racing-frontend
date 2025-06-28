'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authAPI.forgotPassword({ email });
      setSuccess(true);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send reset email');
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a password reset link to {email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Click the link in the email to reset your admin password. 
                    If you don't see it, check your spam folder.
                  </p>
                </div>
                <div className="space-y-2">
                  <Link href="/admin/auth/login">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Admin Login
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      Back to Store
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Password Reset</h1>
          <p className="text-blue-200">Reset your administrator password</p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
            <CardDescription className="text-center">
              Enter your admin email address and we'll send you a secure link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Admin Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Security Notice</span>
                </div>
              </div>
              
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-xs text-amber-800 text-center">
                  For security reasons, password reset links expire after 1 hour. 
                  Only admin email addresses can request password resets.
                </p>
              </div>
            </div>

            <div className="mt-6 text-center space-y-2">
              <Link href="/admin/auth/login" className="text-sm text-blue-600 hover:text-blue-500 block">
                <ArrowLeft className="inline mr-1 h-3 w-3" />
                Back to Admin Login
              </Link>
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 block">
                Back to Store
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}