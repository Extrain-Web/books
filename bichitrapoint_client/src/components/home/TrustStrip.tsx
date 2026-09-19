"use client";

import React from 'react';
import { LuShield, LuTruck, LuRotateCcw } from 'react-icons/lu';

const items = [
    {
        icon: LuShield,
        label: 'Safe Payment',
    },
    {
        icon: LuTruck,
        label: 'Fast Delivery',
    },
    {
        icon: LuRotateCcw,
        label: 'Free Return',
    },
];

const TrustStrip: React.FC = () => {
    return (
        <div className="container mx-auto px-2 sm:px-4 my-2 sm:my-3">
            <div className="bg-[#373c47] text-white rounded-lg shadow-sm overflow-hidden">
                <div className="grid grid-cols-3 divide-x divide-gray-600/70">
                    {items.map(({ icon: Icon, label }) => (
                        <div
                            key={label}
                            className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-2 text-center"
                        >
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-200 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-100 truncate sm:whitespace-nowrap">
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrustStrip;
