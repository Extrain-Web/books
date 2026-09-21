import React from 'react';

const ProductSkeleton: React.FC = () => {
    return (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden animate-pulse flex flex-col h-full w-full">
            <div className="aspect-[4/5] bg-gray-100 w-full" />
            <div className="p-3 sm:p-4 space-y-2.5 flex-1">
                <div className="h-3.5 bg-gray-200 rounded w-full" />
                <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mt-3" />
            </div>
        </div>
    );
};

export default ProductSkeleton;
