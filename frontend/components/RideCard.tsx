// src/components/RideCard.tsx
import React from 'react';

interface RideCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  eta: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function RideCard({
  id,
  title,
  description,
  price,
  eta,
  isSelected,
  onSelect,
}: RideCardProps) {
  return (
    <div
      onClick={() => onSelect(id)}
      className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
        isSelected
          ? 'border-blue-600 bg-blue-50 shadow-md transform scale-[1.02]'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Placeholder for Car Icon/Image */}
        <div className="w-16 h-12 bg-gray-200 rounded-md flex items-center justify-center text-2xl">
          🚗
        </div>
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{description} • {eta}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg text-gray-900">${price.toFixed(2)}</p>
      </div>
    </div>
  );
}