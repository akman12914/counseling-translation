import React from 'react';

interface SpottedCatProps {
  expression?: 'neutral' | 'happy' | 'concerned' | 'thinking';
  size?: number;
}

export function SpottedCat({ expression = 'neutral', size = 120 }: SpottedCatProps) {
  const getEyeExpression = () => {
    switch (expression) {
      case 'happy':
        return { 
          leftPupil: { cx: 12, cy: 15, size: 2.2 },
          rightPupil: { cx: 28, cy: 15, size: 2.2 },
          leftHighlight: { cx: 13, cy: 14 },
          rightHighlight: { cx: 29, cy: 14 },
          leftLid: 'M9,13 Q12,10 15,13',
          rightLid: 'M25,13 Q28,10 31,13'
        };
      case 'concerned':
        return { 
          leftPupil: { cx: 12, cy: 16, size: 2.5 },
          rightPupil: { cx: 28, cy: 16, size: 2.5 },
          leftHighlight: { cx: 13, cy: 15 },
          rightHighlight: { cx: 29, cy: 15 },
          leftLid: 'M9,14 Q12,17 15,14',
          rightLid: 'M25,14 Q28,17 31,14'
        };
      case 'thinking':
        return { 
          leftPupil: { cx: 11, cy: 15, size: 1.8 },
          rightPupil: { cx: 29, cy: 15, size: 1.8 },
          leftHighlight: { cx: 12, cy: 14.5 },
          rightHighlight: { cx: 30, cy: 14.5 },
          leftLid: 'M9,14 L15,14',
          rightLid: 'M25,14 L31,14'
        };
      default:
        return { 
          leftPupil: { cx: 12, cy: 15, size: 2.3 },
          rightPupil: { cx: 28, cy: 15, size: 2.3 },
          leftHighlight: { cx: 13, cy: 14.5 },
          rightHighlight: { cx: 29, cy: 14.5 },
          leftLid: '',
          rightLid: ''
        };
    }
  };

  const getMouthExpression = () => {
    switch (expression) {
      case 'happy':
        return 'M17,23 Q20,26 23,23';
      case 'concerned':
        return 'M18,24 Q20,22 22,24';
      case 'thinking':
        return 'M19.5,23.5 L20.5,23.5';
      default:
        return 'M18.5,23.5 Q20,24.5 21.5,23.5';
    }
  };

  const eyeData = getEyeExpression();
  const mouth = getMouthExpression();

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      className="transition-all duration-300"
    >
      {/* Cat body/head */}
      <ellipse cx="20" cy="22" rx="15" ry="13" fill="#f8f8f8" stroke="#e0e0e0" strokeWidth="1"/>
      
      {/* Ears */}
      <path d="M8,12 L12,4 L16,12 Z" fill="#f8f8f8" stroke="#e0e0e0" strokeWidth="1"/>
      <path d="M24,12 L28,4 L32,12 Z" fill="#f8f8f8" stroke="#e0e0e0" strokeWidth="1"/>
      
      {/* Inner ears */}
      <path d="M10,10 L12,7 L14,10 Z" fill="#ffb3ba"/>
      <path d="M26,10 L28,7 L30,10 Z" fill="#ffb3ba"/>
      
      {/* Eye bases (white) */}
      <ellipse cx="12" cy="15" rx="4" ry="3.5" fill="white" stroke="#e0e0e0" strokeWidth="0.5"/>
      <ellipse cx="28" cy="15" rx="4" ry="3.5" fill="white" stroke="#e0e0e0" strokeWidth="0.5"/>
      
      {/* Eye iris */}
      <ellipse cx="12" cy="15" rx="3" ry="2.8" fill="#4fc3f7"/>
      <ellipse cx="28" cy="15" rx="3" ry="2.8" fill="#4fc3f7"/>
      
      {/* Eye pupils */}
      <ellipse cx={eyeData.leftPupil.cx} cy={eyeData.leftPupil.cy} rx={eyeData.leftPupil.size} ry={eyeData.leftPupil.size} fill="#1a1a1a"/>
      <ellipse cx={eyeData.rightPupil.cx} cy={eyeData.rightPupil.cy} rx={eyeData.rightPupil.size} ry={eyeData.rightPupil.size} fill="#1a1a1a"/>
      
      {/* Eye highlights */}
      <ellipse cx={eyeData.leftHighlight.cx} cy={eyeData.leftHighlight.cy} rx="1" ry="0.8" fill="white" opacity="0.9"/>
      <ellipse cx={eyeData.rightHighlight.cx} cy={eyeData.rightHighlight.cy} rx="1" ry="0.8" fill="white" opacity="0.9"/>
      
      {/* Eye lids for expressions */}
      {eyeData.leftLid && <path d={eyeData.leftLid} stroke="#ccc" strokeWidth="1.5" fill="none" strokeLinecap="round"/>}
      {eyeData.rightLid && <path d={eyeData.rightLid} stroke="#ccc" strokeWidth="1.5" fill="none" strokeLinecap="round"/>}
      
      {/* Simple nose */}
      <path d="M19,19 L20,17.5 L21,19 Z" fill="#ff8a95"/>
      
      {/* Mouth */}
      <path d={mouth} stroke="#666" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      
      {/* Simple whiskers */}
      <line x1="6" y1="17" x2="10" y2="18" stroke="#888" strokeWidth="1"/>
      <line x1="6" y1="20" x2="10" y2="20" stroke="#888" strokeWidth="1"/>
      <line x1="6" y1="23" x2="10" y2="22" stroke="#888" strokeWidth="1"/>
      <line x1="34" y1="17" x2="30" y2="18" stroke="#888" strokeWidth="1"/>
      <line x1="34" y1="20" x2="30" y2="20" stroke="#888" strokeWidth="1"/>
      <line x1="34" y1="23" x2="30" y2="22" stroke="#888" strokeWidth="1"/>
    </svg>
  );
}