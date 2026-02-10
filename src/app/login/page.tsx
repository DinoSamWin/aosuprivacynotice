'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PieChart, BarChart2, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.refresh();
                router.push('/');
            } else {
                setError('Invalid access code');
                setIsLoading(false);
            }
        } catch (err) {
            setError('An error occurred');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8] p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-[40vh] bg-blue-600 rounded-b-[4rem] shadow-lg z-0"></div>

            {/* Main Card */}
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl flex overflow-hidden z-10 relative">

                {/* Left Side: Form */}
                <div className="w-full lg:w-1/2 p-12 md:p-16 flex flex-col justify-center bg-white">
                    <div className="max-w-md mx-auto w-full">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-10">
                            <div className="relative w-10 h-10">
                                <Image
                                    src="/logo.png"
                                    alt="aosu Logo"
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                            <span className="text-xl font-bold text-gray-800">aosu Privacy</span>
                        </div>

                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                            <p className="text-gray-500">Please enter your details to access the repository.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Access Code</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                                        placeholder="••••••••"
                                        autoFocus
                                        disabled={isLoading}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>



                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center justify-center ${isLoading ? 'opacity-80' : ''}`}
                            >
                                {isLoading ? 'Verifying...' : 'Login'}
                            </button>
                        </form>


                    </div>
                </div>

                {/* Right Side: Illustration */}
                <div className="hidden lg:flex w-1/2 bg-gray-900 relative items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 w-full h-full">
                        <Image
                            src="/login_visual_material.jpg"
                            alt="Security Illustration"
                            fill
                            className="object-cover object-top"
                            priority
                            unoptimized
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
