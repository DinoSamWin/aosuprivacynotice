'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Search, Settings, ChevronRight } from 'lucide-react';

// --- Types ---
type Gateway = {
    id: string;
    name: string;
    logo: string; // Using colors/initials for demo
    category: string;
};

// --- Mock Data ---
const CATEGORIES = ['Payment', 'Social', 'Cloud', 'Analytics', 'Security'];
const MOCK_GATEWAYS: Gateway[] = Array.from({ length: 40 }).map((_, i) => {
    const catIndex = i % CATEGORIES.length;
    return {
        id: `g-${i}`,
        name: `${CATEGORIES[catIndex]} Gateway ${i + 1}`,
        logo: ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-red-500'][catIndex],
        category: CATEGORIES[catIndex],
    };
});

export default function GatewayDemoPage() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [hovered, setHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Interaction Logic: Scroll to Expand ---
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (!hovered || isExpanded) return;

            // If user scrolls down significantly while hovering the container
            if (e.deltaY > 10) {
                e.preventDefault(); // Prevent page scroll
                setIsExpanded(true);
            }
        };

        const element = containerRef.current;
        if (element) {
            element.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            if (element) {
                element.removeEventListener('wheel', handleWheel);
            }
        };
    }, [hovered, isExpanded]);

    // Group data for the expanded view
    const groupedGateways = CATEGORIES.reduce((acc, cat) => {
        acc[cat] = MOCK_GATEWAYS.filter(g => g.category === cat);
        return acc;
    }, {} as Record<string, Gateway[]>);


    return (
        <div className="min-h-screen bg-gray-100 p-10 flex flex-col items-center justify-center">

            <div className="max-w-4xl w-full text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Interactive Gateway UI Demo</h1>
                <p className="text-gray-500">
                    Hover over the Gateway area below and <span className="font-bold text-blue-600">Scroll Down</span> (or swipe up) to reveal all options.
                </p>
            </div>

            {/* --- COMPONENT START --- */}
            <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-xl p-8 border border-gray-100/50">

                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-400" />
                    Integration Gateways
                </h2>

                {/* 1. COMPACT VIEW (The Trigger Area) */}
                <div
                    ref={containerRef}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    className={`
                        relative transition-all duration-500 ease-out border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50/50
                        ${hovered && !isExpanded ? 'border-blue-400 bg-blue-50/30 scale-[1.01] shadow-lg cursor-ns-resize' : ''}
                    `}
                >
                    {/* Hint Overlay */}
                    <div className={`
                        absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] z-10 rounded-2xl transition-opacity duration-300 pointer-events-none
                        ${hovered && !isExpanded ? 'opacity-100' : 'opacity-0'}
                    `}>
                        <div className="bg-gray-900/80 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-bounce">
                            Scroll to Expand
                        </div>
                    </div>

                    {/* Preview Content (Limited to 2 rows roughly) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-hidden h-[140px] opacity-80">
                        {MOCK_GATEWAYS.slice(0, 12).map(gateway => (
                            <div key={gateway.id} className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <div className={`w-8 h-8 rounded-full mb-2 ${gateway.logo} opacity-80`}></div>
                                <span className="text-[10px] font-medium text-gray-500 text-center truncate w-full">{gateway.name}</span>
                            </div>
                        ))}
                    </div>
                    {/* Gradient Mask for "More" */}
                    <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent pointer-events-none"></div>
                </div>


                {/* 2. EXPANDED OVERLAY (The "Big Popup") */}
                {/* We use a fixed overlay to ensure it breaks out of any layout constraints, matching the 'Modal' feel requested */}
                <div className={`
                    fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 transition-all duration-500
                    ${isExpanded ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
                `}>
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-gray-900/20 backdrop-blur-md transition-opacity duration-500"
                        onClick={() => setIsExpanded(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className={`
                        relative w-full max-w-6xl h-[85vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col transform transition-all duration-500
                        ${isExpanded ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}
                    `}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-10 py-8 border-b border-gray-100 bg-white/80 backdrop-blur-sm z-20">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">All Gateways</h2>
                                <p className="text-gray-400 text-sm mt-1">Select integration partners</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search gateways..."
                                        className="pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none w-64"
                                    />
                                </div>
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-10 pb-20 scrollbar-hide">
                            <div className="space-y-12">
                                {CATEGORIES.map(category => (
                                    <div key={category}>
                                        <div className="flex items-center gap-4 mb-6">
                                            <h3 className="text-lg font-bold text-gray-900 whitespace-nowrap">{category}</h3>
                                            <div className="h-px bg-gray-100 w-full"></div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                            {groupedGateways[category].map(gateway => (
                                                <div
                                                    key={gateway.id}
                                                    className="group flex flex-col items-center p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer hover:-translate-y-1"
                                                >
                                                    <div className={`w-12 h-12 rounded-xl mb-4 ${gateway.logo} shadow-sm group-hover:scale-110 transition-transform`}></div>
                                                    <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 truncate w-full text-center">{gateway.name}</span>
                                                    <span className="text-xs text-gray-400 mt-1">Connect</span>
                                                </div>
                                            ))}

                                            {/* "Add New" Placeholder for each category? Or just generic */}
                                            <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-gray-200 text-gray-300 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer group">
                                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-blue-50 transition-colors">
                                                    <span className="text-xl font-light">+</span>
                                                </div>
                                                <span className="text-xs font-medium">Add {category}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer (Gradient fade) */}
                        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10"></div>
                    </div>
                </div>

            </div>
            {/* --- COMPONENT END --- */}
        </div>
    );
}
