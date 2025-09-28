import React from 'react';

export const RulerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l-2 4h20l-2-4H4zm0-12v4m4-4v4m4-4v4m4-4v4m4-4v4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20" />
    </svg>
);