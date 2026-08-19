import {type CSSProperties,type ReactNode,useEffect,useRef,useState} from "react";
import {WGD_PROTOCOL_VERSION,resolveWgd,type WgdConfig,type WgdContext,type WgdIntent,type WgdPermissions,type WgdResponse} from "@wgd-ai/core";
import {WhyIcon,EvidenceIcon,CompareIcon,ChallengeIcon,ConfidenceIcon,ProvenanceIcon} from "@wgd-ai/icons";

const ICONS={why:WhyIcon,evidence:EvidenceIcon,compare:CompareIcon,challenge:ChallengeIcon,confidence:ConfidenceIcon,provenance:ProvenanceIcon};

function displayValue(value:unknown):string{
  if(value==null)return "—";
  if(typeof value==="string"||typeof value==="number"||typeof value==="boolean")return String(value);
  try{return JSON.stringify(value,null,2)}catch{return String(value)}
}

export type WgdProps={intent:WgdIntent;context:WgdContext;children?:ReactNode;label?:string;id?:string;subjectType?:string;permissions?:WgdPermissions;config?:WgdConfig;className?:string;style?:CSSProperties;onResolved?:(response:WgdResponse)=>void;onError?:(error:Error)=>void};

export function Wgd({intent,context,children,label,id,subjectType,permissions,config={},className,style,onResolved,onError}:WgdProps){
  const Icon=ICONS[intent],triggerRef=useRef<HTMLButtonElement>(null);
  const [response,setResponse]=useState<WgdResponse|null>(null),[open,setOpen]=useState(false),[busy,setBusy]=useState(false);
  const [position,setPosition]=useState({left:12,top:12});

  useEffect(()=>{if(!open||!triggerRef.current)return;const place=()=>{const r=triggerRef.current!.getBoundingClientRect(),w=Math.min(420,window.innerWidth-24);setPosition({left:Math.max(12,Math.min(r.right-w,window.innerWidth-w-12)),top:Math.max(12,Math.min(window.innerHeight-240,r.bottom+8))})};const esc=(e:KeyboardEvent)=>{if(e.key==="Escape"){setOpen(false);triggerRef.current?.focus()}};const scroll=()=>setOpen(false);place();window.addEventListener("resize",place);window.addEventListener("scroll",scroll,{passive:true});document.addEventListener("keydown",esc);return()=>{window.removeEventListener("resize",place);window.removeEventListener("scroll",scroll);document.removeEventListener("keydown",esc)}},[open]);

  async function activate(){
    const requestId=globalThis.crypto?.randomUUID?.()??`wgd-${Date.now()}`;
    setBusy(true);setOpen(true);setResponse(null);
    try{
      const result=await resolveWgd({version:WGD_PROTOCOL_VERSION,requestId,intent,subject:{id,type:subjectType,label},context,permissions},config);
      setResponse(result);onResolved?.(result);
    }catch(error){
      const e=error instanceof Error?error:new Error("WGD request failed");onError?.(e);
      setResponse({version:WGD_PROTOCOL_VERSION,requestId,intent,status:"error",title:label??intent,summary:e.message,data:{error:{code:"CLIENT_ERROR",message:e.message}}});
    }finally{setBusy(false)}
  }

  const rows=response?Object.entries(response.data):[];
  return <span className={className} style={{display:"inline-flex",alignItems:"center",...style}}>{children}<button ref={triggerRef} type="button" className="wgd-trigger" aria-label={label??`WGD ${intent}`} aria-expanded={open} aria-haspopup="dialog" onClick={activate}><Icon/></button>{open&&<div className="wgd-popover" role="dialog" aria-modal="false" style={{left:position.left,top:position.top}}><button type="button" aria-label="Close" onClick={()=>{setOpen(false);triggerRef.current?.focus()}}>×</button><h3>{response?.title??label??intent}</h3>{busy&&!response?<p>Reasoning…</p>:<>{response?.summary&&<p>{response.summary}</p>}{rows.map(([key,value])=><div key={key}><strong>{key}</strong><pre style={{whiteSpace:"pre-wrap",font:"inherit",margin:0}}>{displayValue(value)}</pre></div>)}{response?.caveats?.map((caveat,index)=><p key={`c-${index}`}><strong>Caveat:</strong> {caveat}</p>)}</>}</div>}</span>;
}

export {WhyIcon,EvidenceIcon,CompareIcon,ChallengeIcon,ConfidenceIcon,ProvenanceIcon};
export type {WgdIntent,WgdContext,WgdPermissions,WgdResponse,WgdConfig} from "@wgd-ai/core";
