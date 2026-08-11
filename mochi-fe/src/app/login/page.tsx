'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check hash for Google ID token redirect
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      if (idToken) {
        handleGoogleLoginBackend(idToken);
      }
    }
  }, []);

  const handleGoogleLoginBackend = async (idToken: string) => {
    setLoading(true);
    setError('');
    try {
      const response: any = await api.post('/api/auth/google', { idToken });
      
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          email: response.data.email,
          displayName: response.data.displayName,
          role: response.data.role,
        }));
        // Dọn dẹp Hash URL
        window.location.hash = '';
        router.push('/');
      } else {
        setError(response.message || 'Xác thực Google thất bại.');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể đăng nhập bằng tài khoản Google này.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInClick = () => {
    // Client ID của Google Console đọc từ env hoặc placeholder mặc định
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1055562707253-placeholder.apps.googleusercontent.com';
    
    if (clientId.includes('placeholder')) {
      alert('⚠️ Bạn chưa cấu hình Google Client ID chính xác!\n\nHướng dẫn thiết lập:\n1. Mở file .env.local ở thư mục frontend (mochi-fe)\n2. Điền NEXT_PUBLIC_GOOGLE_CLIENT_ID = <Client ID của bạn>\n3. Khởi động lại Server Frontend để áp dụng.');
      return;
    }

    const redirectUri = 'http://localhost:3000/login';
    const scope = 'openid email profile';
    const responseType = 'id_token';
    const nonce = Math.random().toString(36).substring(2);
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=${responseType}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `nonce=${nonce}`;
    
    window.location.href = googleAuthUrl;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response: any = await api.post('/api/auth/login', { email, password });
      
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          email: response.data.email,
          displayName: response.data.displayName,
          role: response.data.role,
        }));
        
        router.push('/');
      } else {
        setError(response.message || 'Đăng nhập thất bại.');
      }
    } catch (err: any) {
      setError(err.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-500/5 blur-3xl" />

      <Card className="w-full max-w-md border-border bg-card text-foreground shadow-lg relative z-10">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            Mochi Flashcard
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs font-sans">
            Học thông minh hơn mỗi ngày với Spaced Repetition
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-gray-400 focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-border text-foreground placeholder:text-gray-400 focus-visible:ring-primary"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/95 text-white font-medium shadow-sm font-sans"
            >
              {loading ? 'Đang kết nối...' : 'Đăng nhập'}
            </Button>
            
            {/* Hoặc đăng nhập bằng Google */}
            <div className="relative flex items-center justify-center w-full my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <span className="relative bg-card px-3 text-xs text-muted-foreground uppercase">Hoặc</span>
            </div>

            <Button
              type="button"
              onClick={handleGoogleSignInClick}
              disabled={loading}
              variant="outline"
              className="w-full border-border hover:bg-muted font-sans font-semibold flex items-center justify-center space-x-2 text-xs py-5 rounded-xl transition"
            >
              <svg className="h-4.5 w-4.5 mr-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48C21.68,11.76 21.56,11.4 21.35,11.1z" fill="#4285F4" />
                <path d="M12,20.72c2.43,0 4.47,-0.81 5.96,-2.19l-3.3,-2.58c-0.9,0.6 -2.07,0.97 -3.3,0.97c-2.37,0 -4.38,-1.6 -5.1,-3.75H2.84v2.66C4.33,18.8 8,20.72 12,20.72z" fill="#34A853" />
                <path d="M6.9,13.17c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7c0,-0.59 0.1,-1.16 0.28,-1.7V7.12H2.84c-0.62,1.24 -0.97,2.65 -0.97,4.35s0.35,3.11 0.97,4.35L6.9,13.17z" fill="#FBBC05" />
                <path d="M12,6.08c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,3.35 14.42,2.54 12,2.54c-4,0 -7.67,1.92 -9.16,4.58L6.9,9.78c0.72,-2.15 2.73,-3.7 5.1,-3.7z" fill="#EA4335" />
              </svg>
              <span>Đăng nhập với Google</span>
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-primary hover:underline transition">
                Đăng ký ngay
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
