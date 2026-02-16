import React, { useMemo } from 'react';
import { useResumeStore } from '../../store/resume';
import { calculateCompleteness } from '../../lib/completeness';

const SIZE = 80;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getColor(score: number): string {
    if (score < 40) return '#ef4444'; // red-500
    if (score <= 70) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
}

export const CompletenessScore: React.FC = () => {
    const resume = useResumeStore((s) => s.resume);
    const { score, hints } = useMemo(() => calculateCompleteness(resume), [resume]);

    const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
    const color = getColor(score);

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-4">
                <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
                    <svg width={SIZE} height={SIZE} className="-rotate-90">
                        <circle
                            cx={SIZE / 2}
                            cy={SIZE / 2}
                            r={RADIUS}
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth={STROKE}
                        />
                        <circle
                            cx={SIZE / 2}
                            cy={SIZE / 2}
                            r={RADIUS}
                            fill="none"
                            stroke={color}
                            strokeWidth={STROKE}
                            strokeLinecap="round"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={offset}
                            className="transition-all duration-500"
                        />
                    </svg>
                    <span
                        className="absolute inset-0 flex items-center justify-center text-sm font-bold"
                        style={{ color }}
                    >
                        {score}%
                    </span>
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">Profile Strength</p>
                    {hints.length > 0 ? (
                        <ul className="mt-1 space-y-0.5">
                            {hints.map((hint) => (
                                <li key={hint} className="text-xs text-gray-500 truncate">
                                    &bull; {hint}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-1 text-xs text-green-600">Your profile looks great!</p>
                    )}
                </div>
            </div>
        </div>
    );
};
