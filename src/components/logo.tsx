import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function Logo({ className = "h-6 w-6", ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      className={className}
      {...props}
    >
      <polygon points="284,160 256,160 168,348 196,348" fill="currentColor" />
      <rect x="276" y="280" width="68" height="68" fill="currentColor" />
    </svg>
  );
}
