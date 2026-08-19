import handler from "../api/wgd.js";

const VERSION = "0.1";
const intents = ["why","evidence","compare","challenge","confidence","provenance"];
const fixtures = {
  why:{facts:{dimensionsFit:true,price:428,budget:500},signals:["linen","oak"]},
  evidence:{facts:{observedRange:[141,168],currentPrice:135.75,marketplacesIncluded:false}},
  compare:{options:[{name:"A",price:286},{name:"B",price:244}],criteria:["price","distance"]},
  challenge:{facts:{supportSentiment:"healthy",cancellationRequest:false}},
  confidence:{calibration:{confidence:0.74,basis:"180 historical predictions"}},
  provenance:{origin:"host-recorded-source",inputs:["catalog-record","room-dimensions"],unknowns:["lighting transform"]}
};

function responseMock(){
  return {
    statusCode:200,headers:{},body:null,
    setHeader(k,v){this.headers[k]=v;},
    status(code){this.statusCode=code;return this;},
    json(value){this.body=value;return this;},
    end(){return this;}
  };
}

async function call(method,body){
  const req={method,body};
  const res=responseMock();
  await handler(req,res);
  return res;
}

function assert(condition,message){if(!condition)throw new Error(message);}

const manifest=await call("GET");
assert(manifest.statusCode===200,"GET capability manifest failed");
assert(manifest.body?.wgdVersion===VERSION,"capability version mismatch");
for(const intent of intents)assert(typeof manifest.body?.intents?.[intent]?.supported==="boolean",`missing capability: ${intent}`);

for(const intent of intents){
  const request={version:VERSION,requestId:`smoke-${intent}`,intent,subject:{id:"fixture",type:"claim",label:"Fixture"},context:fixtures[intent],permissions:{allowedSources:["price-history","host-recorded-source"],allowExternalLookup:false}};
  const res=await call("POST",request);
  assert(res.statusCode===200,`${intent}: expected HTTP 200`);
  const out=res.body;
  assert(out.version===VERSION,`${intent}: response version mismatch`);
  assert(out.requestId===request.requestId,`${intent}: requestId mismatch`);
  assert(out.intent===intent,`${intent}: intent mismatch`);
  assert(out.data&&typeof out.data==="object"&&!Array.isArray(out.data),`${intent}: data must be object`);
  if(intent==="evidence")assert(out.data.items?.every(item=>item.source),"evidence: source missing");
  if(intent==="why")assert(["observed","supplied","inferred","unknown"].includes(out.data.basis),"why: basis missing");
  if(intent==="confidence"){assert(out.data.kind==="empirical_calibration","confidence: expected calibrated fixture");assert(out.data.basis,"confidence: calibration basis missing");}
  if(intent==="provenance"){assert(out.data.recorded===true,"provenance: recorded flag missing");assert(out.data.nodes?.every(node=>node.kind&&node.id&&node.label),"provenance: malformed nodes");}
}

const bad=await call("POST",{version:"9.9",requestId:"bad-version",intent:"why",context:{}});
assert(bad.statusCode===400,"unsupported version must be rejected");
assert(bad.body?.data?.error?.code==="UNSUPPORTED_VERSION","unsupported version error code missing");

console.log("WGD Protocol v0.1 smoke test: PASS");
