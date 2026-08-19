const ENDPOINT = "https://wgd-dev-alpha.vercel.app/api/wgd";
const VERSION = "0.1";
const intents = ["why","evidence","compare","challenge","confidence","provenance"];
const statuses = new Set(["ok","partial","insufficient_context","unsupported","unknown","error"]);
const confidenceKinds = new Set(["empirical_calibration","prediction_interval","model_reported","evidence_strength","model_disagreement","qualitative_uncertainty","unknown"]);

const fixtures = {
  why: {facts:{dimensionsFit:true,price:428,budget:500},signals:["linen","oak"]},
  evidence: {facts:{observedRange:[141,168],currentPrice:135.75,marketplacesIncluded:false}},
  compare: {options:[{name:"A",price:286},{name:"B",price:244}],criteria:["price","distance"]},
  challenge: {facts:{supportSentiment:"healthy",cancellationRequest:false}},
  confidence: {calibration:{confidence:0.74,basis:"180 historical predictions"}},
  provenance: {origin:"host-recorded-source",inputs:["catalog-record","room-dimensions"],unknowns:["lighting transform"]}
};

function isObject(v){return v && typeof v === "object" && !Array.isArray(v)}
function validateEnvelope(result,request){
  if(!isObject(result)) return "response is not an object";
  if(result.version!==VERSION) return `version must be ${VERSION}`;
  if(result.requestId!==request.requestId) return "requestId was not preserved";
  if(result.intent!==request.intent) return "intent was not preserved";
  if(!statuses.has(result.status)) return "invalid status";
  if(typeof result.title!=="string" || !result.title) return "title is required";
  if(!isObject(result.data)) return "data must be an object";
  if(result.caveats!=null && !Array.isArray(result.caveats)) return "caveats must be an array";
  return null;
}
async function json(url,init){const response=await fetch(url,init);let body=null;try{body=await response.json()}catch{}return{response,body}}

export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"GET only"});
  const checks=[];
  const pass=(name)=>checks.push({name,pass:true});
  const fail=(name,detail)=>checks.push({name,pass:false,detail});

  try{
    const {response,body}=await json(ENDPOINT);
    if(!response.ok || !isObject(body) || body.wgdVersion!==VERSION || !isObject(body.intents)) fail("Capability manifest",`GET must return wgdVersion ${VERSION} and intents`);
    else{
      pass("Capability manifest");
      for(const intent of intents){
        if(!isObject(body.intents[intent]) || typeof body.intents[intent].supported!=="boolean") fail(`Capability: ${intent}`,"missing supported boolean");
        else pass(`Capability: ${intent}`);
      }
    }
  }catch(error){fail("Capability manifest",error.message)}

  for(const intent of intents){
    const request={version:VERSION,requestId:`conformance-${intent}-${Date.now()}`,intent,subject:{id:"conformance-object",type:"claim",label:"Conformance object"},context:fixtures[intent],permissions:{allowedSources:["price-history","host-recorded-source"],allowExternalLookup:false}};
    try{
      const {response,body}=await json(ENDPOINT,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(request)});
      if(!response.ok){fail(`${intent}: protocol envelope`,`HTTP ${response.status}`);continue}
      const error=validateEnvelope(body,request);if(error){fail(`${intent}: protocol envelope`,error);continue}pass(`${intent}: protocol envelope`);
      if(intent==="why") Array.isArray(body.data.reasons)&&["observed","supplied","inferred","unknown"].includes(body.data.basis)?pass("why: basis declared"):fail("why: basis declared","reasons array and basis required");
      if(intent==="evidence"){
        if(!Array.isArray(body.data.items)||!Array.isArray(body.data.gaps)||!Array.isArray(body.data.contradictions)) fail("evidence: structured evidence","items, gaps, contradictions required");
        else if(body.data.items.some(item=>!item.source)) fail("evidence: source-addressable","evidence must include source identifiers");
        else{pass("evidence: structured evidence");pass("evidence: source-addressable")}
      }
      if(intent==="compare") Array.isArray(body.data.options)&&body.data.options.length>=2&&Array.isArray(body.data.dimensions)?pass("compare: decision space"):fail("compare: decision space","options and dimensions required");
      if(intent==="challenge") typeof body.data.countercase==="string"&&Array.isArray(body.data.arguments)?pass("challenge: countercase"):fail("challenge: countercase","countercase and arguments required");
      if(intent==="confidence"){
        confidenceKinds.has(body.data.kind)?pass("confidence: kind declared"):fail("confidence: kind declared","invalid confidence kind");
        body.data.kind==="empirical_calibration"?pass("confidence: calibration fixture"):fail("confidence: calibration fixture","fixture should remain empirical_calibration");
        body.data.kind==="empirical_calibration"&&body.data.basis?pass("confidence: calibration basis"):fail("confidence: calibration basis","empirical calibration requires basis");
      }
      if(intent==="provenance"){
        typeof body.data.recorded==="boolean"&&Array.isArray(body.data.nodes)&&Array.isArray(body.data.edges)&&Array.isArray(body.data.unknownSegments)?pass("provenance: lineage declaration"):fail("provenance: lineage declaration","recorded, nodes, edges, unknownSegments required");
        body.data.recorded===true?pass("provenance: recorded lineage"):fail("provenance: recorded lineage","host-recorded fixture must remain recorded");
      }
    }catch(error){fail(`${intent}: protocol envelope`,error.message)}
  }

  try{
    const request={version:"9.9",requestId:"bad-version",intent:"why",context:{}};
    const {response,body}=await json(ENDPOINT,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(request)});
    !response.ok&&body?.data?.error?.code==="UNSUPPORTED_VERSION"?pass("Unsupported version rejection"):fail("Unsupported version rejection","resolver must explicitly reject unsupported versions");
  }catch(error){fail("Unsupported version rejection",error.message)}

  const passed=checks.filter(c=>c.pass).length, failed=checks.length-passed;
  res.setHeader("Cache-Control","no-store");
  return res.status(failed?500:200).json({protocol:`WGD Protocol v${VERSION}`,resolver:ENDPOINT,passed,failed,conformant:failed===0,checkedAt:new Date().toISOString(),checks});
}
