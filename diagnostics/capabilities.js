// Strict, independently testable gating. An attractive node name is not an audit.
export function inspectCapabilities(root, config) {
  const node = name => typeof name==='string' && root.getObjectByName(name);
  const hasGeometry = object => {let found=false;object?.traverse(o=>{if(o.isMesh&&o.geometry?.attributes?.position?.count>0)found=true;});return found;};
  const present = names => Array.isArray(names)&&names.length>0&&names.every(name=>hasGeometry(node(name)));
  const parts={},systems={};
  for(const [key,spec] of Object.entries(config.parts||{})) {
    if(spec.verified!==true||!node(spec.node)||!hasGeometry(node(spec.node))||!['x','y','z'].includes(spec.axis)||!Number.isFinite(spec.angle)||!Number.isFinite(spec.closedAngle)||!present(spec.requires)||!spec.label)continue;
    parts[key]={...spec,object:node(spec.node)};
  }
  for(const [key,spec] of Object.entries(config.systems||{})) {
    if(spec.verified!==true||!present(spec.requiredNodes)||!hasGeometry(node(spec.anchor))||!Array.isArray(spec.cameraOffset)||spec.cameraOffset.length!==3||!spec.cameraOffset.every(Number.isFinite)||!spec.cameraOffset.some(v=>v!==0))continue;
    if(spec.openPart&&!parts[spec.openPart])continue;
    systems[key]={...spec,object:node(spec.anchor)};
  }
  return {parts,systems};
}
