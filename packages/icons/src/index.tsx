import { useId, type CSSProperties } from "react";
import definitions from "../icons.json";

export type WgdIconKind = keyof typeof definitions.icons;

export type WgdIconProps = {
  size?: number;
  title?: string;
  className?: string;
  style?: CSSProperties;
};

function WgdIcon({kind,size=24,title,className,style}:{kind:WgdIconKind}&WgdIconProps){
  const labelled = title ? {role:"img","aria-label":title} : {"aria-hidden":true as const};
  const gradientId = `wgd-ai-${kind}-${useId().replace(/:/g, "")}`;
  const spark = definitions.spark;

  return <span {...labelled} className={className} style={{width:size+12,height:size+12,position:"relative",display:"inline-grid",placeItems:"center",...style}}>
    <svg
      viewBox={definitions.viewBox}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={definitions.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{color:definitions.strokeColor}}
    >
      <g dangerouslySetInnerHTML={{__html: definitions.icons[kind]}} />
    </svg>
    <svg aria-hidden="true" viewBox={spark.viewBox} width={spark.size} height={spark.size} style={{position:"absolute",left:spark.left,top:spark.top,overflow:"visible"}}>
      <defs><linearGradient id={gradientId} x1="1" y1="1" x2="13" y2="13" gradientUnits="userSpaceOnUse"><stop stopColor={spark.gradientStart}/><stop offset="1" stopColor={spark.gradientEnd}/></linearGradient></defs>
      <path d={spark.primaryPath} fill={`url(#${gradientId})`}/>
      <path d={spark.secondaryPath} fill={spark.gradientEnd}/>
    </svg>
  </span>;
}

export const WhyIcon=(p:WgdIconProps)=><WgdIcon kind="why" {...p}/>;
export const EvidenceIcon=(p:WgdIconProps)=><WgdIcon kind="evidence" {...p}/>;
export const CompareIcon=(p:WgdIconProps)=><WgdIcon kind="compare" {...p}/>;
export const ChallengeIcon=(p:WgdIconProps)=><WgdIcon kind="challenge" {...p}/>;
export const ConfidenceIcon=(p:WgdIconProps)=><WgdIcon kind="confidence" {...p}/>;
export const ProvenanceIcon=(p:WgdIconProps)=><WgdIcon kind="provenance" {...p}/>;
