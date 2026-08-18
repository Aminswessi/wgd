import { useId, type CSSProperties, type ReactNode } from "react";

export type WgdIconProps = {
  size?: number;
  title?: string;
  className?: string;
  style?: CSSProperties;
};

const paths = {
  why: <><path d="M8 7.5a4 4 0 0 1 8 0c0 2.7-4 2.8-4 5"/><circle cx="12" cy="17.5" r="1.2" fill="currentColor" stroke="none"/></>,
  evidence: <><rect x="5.25" y="4.75" width="13.5" height="14.5" rx="2"/><path d="m8 10 1.5 1.5L12.5 8.5M14.5 9h2.25M14.5 12.5h2.25M8 15.75h8.75"/></>,
  compare: <path d="M5 8h13m-3-3 3 3-3 3M19 16H6m3-3-3 3 3 3"/>,
  challenge: <path d="M5 8h14M8 8l-3 6h6L8 8zm8 0-3 6h6l-3-6zM12 4v16"/>,
  confidence: <><path d="M5 17a7 7 0 0 1 14 0M12 12l4-3"/><circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none"/></>,
  provenance: <><circle cx="7" cy="12" r="2"/><circle cx="17" cy="7" r="2"/><circle cx="17" cy="17" r="2"/><path d="m9 11 6-3m-6 5 6 3"/></>,
} satisfies Record<string, ReactNode>;

function WgdIcon({kind,size=24,title,className,style}:{kind:keyof typeof paths}&WgdIconProps){
  const labelled = title ? {role:"img","aria-label":title} : {"aria-hidden":true as const};
  const gradientId = `wgd-ai-${kind}-${useId().replace(/:/g, "")}`;
  return <span {...labelled} className={className} style={{width:size+12,height:size+12,position:"relative",display:"inline-grid",placeItems:"center",...style}}>
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{color:"#4f5459"}}>{paths[kind]}</svg>
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" style={{position:"absolute",left:-1,top:-1,overflow:"visible"}}>
      <defs><linearGradient id={gradientId} x1="1" y1="1" x2="13" y2="13" gradientUnits="userSpaceOnUse"><stop stopColor="#4285F4"/><stop offset="1" stopColor="#8B5CF6"/></linearGradient></defs>
      <path d="M5.2.8c.34 2.55 1.42 3.63 3.97 3.97C6.62 5.11 5.54 6.19 5.2 8.74 4.86 6.19 3.78 5.11 1.23 4.77 3.78 4.43 4.86 3.35 5.2.8Z" fill={`url(#${gradientId})`}/>
      <path d="M12.05.95c.17 1.3.72 1.85 2.02 2.02-1.3.17-1.85.72-2.02 2.02-.17-1.3-.72-1.85-2.02-2.02 1.3-.17 1.85-.72 2.02-2.02Z" fill="#8B5CF6"/>
    </svg>
  </span>;
}

export const WhyIcon=(p:WgdIconProps)=><WgdIcon kind="why" {...p}/>;
export const EvidenceIcon=(p:WgdIconProps)=><WgdIcon kind="evidence" {...p}/>;
export const CompareIcon=(p:WgdIconProps)=><WgdIcon kind="compare" {...p}/>;
export const ChallengeIcon=(p:WgdIconProps)=><WgdIcon kind="challenge" {...p}/>;
export const ConfidenceIcon=(p:WgdIconProps)=><WgdIcon kind="confidence" {...p}/>;
export const ProvenanceIcon=(p:WgdIconProps)=><WgdIcon kind="provenance" {...p}/>;
