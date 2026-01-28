'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 animate-gradient-xy"></div>
                {/* Decorative Blobs */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/30 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/30 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            {/* Glassmorphism Card */}
            <div className="relative z-10 w-full max-w-sm mx-4">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 md:p-10 text-center">

                    {/* Logo Section */}
                    <div className="mb-8 flex flex-col items-center">
                        <div className="relative w-20 h-20 mb-4 drop-shadow-lg transition-transform hover:scale-105 duration-300">
                            {/* Note: Using a white-bg container for logo if it's not transparent, or just the image if it is. 
                                 Assuming logo.png is transparent. If not, we might need a rounded container. */}
                            <Image
                                src="/logo.png"
                                alt="aosu Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-wide">aosu Privacy</h1>
                        <p className="text-blue-100/80 text-sm mt-2 font-medium">Secure Document Repository</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-semibold text-blue-100 uppercase tracking-wider ml-1">Access Code</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all backdrop-blur-sm"
                                    placeholder="Enter your security code"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/20 text-red-100 text-sm font-medium animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20 transform transition-all duration-200 active:scale-95 flex items-center justify-center ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                "Access Repository"
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-xs text-blue-200/50">
                        &copy; {new Date().getFullYear()} aosu. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
