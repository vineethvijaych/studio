
import { Sun, Wind, Waves, Film } from "lucide-react";
import React from "react";

export type Filter = {
  name: string;
  id: 'none' | 'sunset' | 'sepia' | 'grayscale';
  style: React.CSSProperties;
  icon: React.ReactNode;
};

export const filters: Filter[] = [
  { name: 'None', id: 'none', style: { filter: 'none' }, icon: React.createElement(Film, { className: "w-4 h-4 mr-1 sm:mr-2"}) },
  { name: 'Sepia', id: 'sepia', style: { filter: 'sepia(1)' }, icon: React.createElement(Sun, { className: "w-4 h-4 mr-1 sm:mr-2"}) },
  { name: 'B & W', id: 'grayscale', style: { filter: 'grayscale(1)' }, icon: React.createElement(Waves, { className: "w-4 h-4 mr-1 sm:mr-2"}) },
  { name: 'Sunset', id: 'sunset', style: { filter: 'sepia(0.5) hue-rotate(-15deg) contrast(1.1) saturate(1.4)' }, icon: React.createElement(Wind, { className: "w-4 h-4 mr-1 sm:mr-2"}) },
];

export type FilterType = typeof filters[0];

    