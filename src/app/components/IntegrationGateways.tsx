'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Search, Settings } from 'lucide-react';

// --- Types & Mock Data (Included for portability) ---
const CATEGORIES = ['Payment', 'Social', 'Cloud', 'Analytics', 'Security'];
const MOCK_GATEWAYS = Array.from({ length: 40 }).map((_, i) => {
    const catIndex = i % CATEGORIES.length;
    return {
        id: `g-${i}`,
        name: `${CATEGORIES[catIndex]} Gateway ${i + 1}`,
        logo: ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-red-500'][catIndex],
        category: CATEGORIES[catIndex],
    };
});

export default function IntegrationGateways() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Scroll Interaction Logic
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (!isHovered || isExpanded) return;
            // Trigger expand on significant downward scroll
            if (e.deltaY > 10) {
                e.preventDefault();
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
    }, [isHovered, isExpanded]);

    // Grouping
    const groupedGateways = CATEGORIES.reduce((acc, cat) => {
        acc[cat] = MOCK_GATEWAYS.filter(g => g.category === cat);
        return acc;
    }, {} as Record<string, typeof MOCK_GATEWAYS>);

    return (
        <div className="mb-10 w-full">
            {/* Header */}
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                Integration Gateways
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">New</span>
            </h2>

            {/* Compact View Trigger */}
            <div
                ref={containerRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`
                    relative transition-all duration-500 ease-out border-2 border-dashed border-gray-200 rounded-[2rem] p-6 bg-white
                    ${isHovered && !isExpanded ? 'border-blue-400 bg-blue-50/10 scale-[1.01] shadow-lg cursor-ns-resize z-10' : ''}
                `}
            >
                {/* Hover Hint */}
                <div className={`
                    absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] z-20 rounded-[2rem] transition-opacity duration-300 pointer-events-none
                    ${isHovered && !isExpanded ? 'opacity-100' : 'opacity-0'}
                `}>
                    <div className="bg-gray-900/90 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-xl animate-bounce flex items-center gap-2">
                        <span>Scroll to Expand</span>
                        <div className="w-1 h-3 rounded-full bg-white/50 animate-pulse"></div>
                    </div>
                </div>

                {/* Preview Grid */}
                <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-8 gap-4 opacity-70 mask-image-b-fade">
                    {MOCK_GATEWAYS.slice(0, 16).map(gateway => (
                        <div key={gateway.id} className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-50 bg-gray-50/50">
                            <div className={`w-8 h-8 rounded-full mb-2 ${gateway.logo} opacity-80`}></div>
                            <span className="text-[10px] font-medium text-gray-400 text-center truncate w-full">{gateway.name}</span>
                        </div>
                    ))}
                </div>

                {/* Gradient Fade */}
                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none rounded-b-[2rem]"></div>
            </div>

            {/* Expanded Overlay (Portal-like behavior via fixed) */}
            <div className={`
                fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 transition-all duration-500
                ${isExpanded ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}
            `}>
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity duration-500"
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
                            <p className="text-gray-400 text-sm mt-1">Select from {MOCK_GATEWAYS.length} integration partners</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
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

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-10 pb-20 scrollbar-hide">
                        <div className="space-y-12">
                            {CATEGORIES.map(category => (
                                <div key={category}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <h3 className="text-lg font-bold text-gray-900 whitespace-nowrap">{category}</h3>
                                        <div className="h-px bg-gray-100 w-full"></div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                        {groupedGateways[category]?.map((gateway) => (
                                            <div
                                                key={gateway.id}
                                                className="group flex flex-col items-center p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer hover:-translate-y-1"
                                            >
                                                <div className={`w-12 h-12 rounded-xl mb-4 ${gateway.logo} shadow-sm group-hover:scale-110 transition-transform`}></div>
                                                <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 truncate w-full text-center">{gateway.name}</span>
                                                <span className="text-xs text-gray-400 mt-1">Connect</span>
                                            </div>
                                        ))}
                                        {/* Add New Placeholder */}
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
                    {/* Gradient Fade Footer */}
                    <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10"></div>
                </div>
            </div>
        </div>
    );
}
