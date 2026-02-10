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
                <div className="hidden lg:flex w-1/2 bg-[#F3F6FF] relative items-center justify-center p-12 overflow-hidden">
                    {/* Abstract Dashboard Illustration Container */}
                    <div className="relative w-full max-w-sm aspect-square">

                        {/* Center Card */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-6 z-20">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                    <PieChart className="w-5 h-5" />
                                </div>
                                <div className="text-xs font-bold text-gray-400">Weekly Stats</div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full w-[70%] bg-blue-500 rounded-full"></div>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full w-[45%] bg-indigo-400 rounded-full"></div>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full w-[60%] bg-purple-400 rounded-full"></div>
                                </div>
                            </div>
                            <div className="mt-6 flex gap-4">
                                <div className="flex-1 bg-blue-50 py-3 rounded-xl flex flex-col items-center">
                                    <span className="text-lg font-bold text-blue-600">85%</span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Files</span>
                                </div>
                                <div className="flex-1 bg-purple-50 py-3 rounded-xl flex flex-col items-center">
                                    <span className="text-lg font-bold text-purple-600">12</span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">New</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating Element 1 - Top Right */}
                        <div className="absolute top-0 right-[-20px] bg-white p-4 rounded-2xl shadow-xl z-30 animate-bounce-slow">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-full text-green-600">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 font-semibold">Status</div>
                                    <div className="text-sm font-bold text-gray-800">Secure</div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Element 2 - Bottom Left */}
                        <div className="absolute bottom-10 left-[-30px] bg-blue-600 p-5 rounded-2xl shadow-xl shadow-blue-300 z-30 animate-bounce-delayed">
                            <BarChart2 className="w-8 h-8 text-white/90" />
                        </div>

                        {/* Decor Circle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-blue-200/50 rounded-full -z-10 animate-spin-slow"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-blue-100 rounded-full -z-10"></div>
                    </div>

                    <div className="absolute bottom-10 text-center w-full px-10">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Check Your Project Progress</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Securely manage and track all your privacy documentation in one centralized repository.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
