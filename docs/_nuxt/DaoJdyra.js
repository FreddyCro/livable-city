import{Y,Z as ui,ax as q,aN as Q,aM as ee,aA as J,X as K,ag as Ee,y as Qe,$ as di,aI as be,aH as Ae,d as Z,aK as Ge,aL as fi,az as kt,aw as We}from"./BprBWzJ8.js";import{H as gi}from"./W3Z-0pgo.js";class pi extends Y{constructor(e={}){const{id:t=ui("cube-geometry"),indices:i=!0}=e;super(i?{...e,id:t,topology:"triangle-list",indices:{size:1,value:hi},attributes:{...Ci,...e.attributes}}:{...e,id:t,topology:"triangle-list",indices:void 0,attributes:{...Li,...e.attributes}})}}const hi=new Uint16Array([0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23]),vi=new Float32Array([-1,-1,1,1,-1,1,1,1,1,-1,1,1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1,-1,-1,1,-1,-1,1,1,1,1,1,1,1,-1,-1,-1,-1,1,-1,-1,1,-1,1,-1,-1,1,1,-1,-1,1,1,-1,1,1,1,1,-1,1,-1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1]),xi=new Float32Array([0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0]),yi=new Float32Array([0,0,1,0,1,1,0,1,1,0,1,1,0,1,0,0,0,1,0,0,1,0,1,1,1,1,0,1,0,0,1,0,1,0,1,1,0,1,0,0,0,0,1,0,1,1,0,1]),mi=new Float32Array([1,-1,1,-1,-1,1,-1,-1,-1,1,-1,-1,1,-1,1,-1,-1,-1,1,1,1,1,-1,1,1,-1,-1,1,1,-1,1,1,1,1,-1,-1,-1,1,1,1,1,1,1,1,-1,-1,1,-1,-1,1,1,1,1,-1,-1,-1,1,-1,1,1,-1,1,-1,-1,-1,-1,-1,-1,1,-1,1,-1,1,1,1,-1,1,1,-1,-1,1,-1,-1,1,1,-1,1,1,1,1,1,-1,-1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1,-1,-1,1,-1]),Pi=new Float32Array([1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,0,0,1,0,1,1,1,1,0,1,0,0,1,0,1,1,0,0]),_i=new Float32Array([1,0,1,1,0,0,1,1,0,0,0,1,1,0,0,1,1,0,1,1,0,0,0,1,1,1,1,1,1,0,1,1,1,0,0,1,1,1,0,1,1,1,1,1,1,0,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,0,1,0,0,1,1,0,1,1,1,0,1,0,1,0,0,0,1,0,0,1,1,0,1,0,1,1,1,1,1,0,1,1,1,0,0,1,1,0,0,1,1,1,0,1,1,1,1,1,1,1,0,0,1,0,0,0,1,0,1,0,1,1,1,0,1,1,0,0,1,0,1,0,1]),Ci={POSITION:{size:3,value:vi},NORMAL:{size:3,value:xi},TEXCOORD_0:{size:2,value:yi}},Li={POSITION:{size:3,value:mi},TEXCOORD_0:{size:2,value:Pi},COLOR_0:{size:3,value:_i}},et=`layout(std140) uniform arcUniforms {
  bool greatCircle;
  bool useShortestPath;
  float numSegments;
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  highp int widthUnits;
} arc;
`,Si={name:"arc",vs:et,fs:et,uniformTypes:{greatCircle:"f32",useShortestPath:"f32",numSegments:"f32",widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",widthUnits:"i32"}},wi=`#version 300 es
#define SHADER_NAME arc-layer-vertex-shader
in vec4 instanceSourceColors;
in vec4 instanceTargetColors;
in vec3 instanceSourcePositions;
in vec3 instanceSourcePositions64Low;
in vec3 instanceTargetPositions;
in vec3 instanceTargetPositions64Low;
in vec3 instancePickingColors;
in float instanceWidths;
in float instanceHeights;
in float instanceTilts;
out vec4 vColor;
out vec2 uv;
out float isValid;
float paraboloid(float distance, float sourceZ, float targetZ, float ratio) {
float deltaZ = targetZ - sourceZ;
float dh = distance * instanceHeights;
if (dh == 0.0) {
return sourceZ + deltaZ * ratio;
}
float unitZ = deltaZ / dh;
float p2 = unitZ * unitZ + 1.0;
float dir = step(deltaZ, 0.0);
float z0 = mix(sourceZ, targetZ, dir);
float r = mix(ratio, 1.0 - ratio, dir);
return sqrt(r * (p2 - r)) * dh + z0;
}
vec2 getExtrusionOffset(vec2 line_clipspace, float offset_direction, float width) {
vec2 dir_screenspace = normalize(line_clipspace * project.viewportSize);
dir_screenspace = vec2(-dir_screenspace.y, dir_screenspace.x);
return dir_screenspace * offset_direction * width / 2.0;
}
float getSegmentRatio(float index) {
return smoothstep(0.0, 1.0, index / (arc.numSegments - 1.0));
}
vec3 interpolateFlat(vec3 source, vec3 target, float segmentRatio) {
float distance = length(source.xy - target.xy);
float z = paraboloid(distance, source.z, target.z, segmentRatio);
float tiltAngle = radians(instanceTilts);
vec2 tiltDirection = normalize(target.xy - source.xy);
vec2 tilt = vec2(-tiltDirection.y, tiltDirection.x) * z * sin(tiltAngle);
return vec3(
mix(source.xy, target.xy, segmentRatio) + tilt,
z * cos(tiltAngle)
);
}
float getAngularDist (vec2 source, vec2 target) {
vec2 sourceRadians = radians(source);
vec2 targetRadians = radians(target);
vec2 sin_half_delta = sin((sourceRadians - targetRadians) / 2.0);
vec2 shd_sq = sin_half_delta * sin_half_delta;
float a = shd_sq.y + cos(sourceRadians.y) * cos(targetRadians.y) * shd_sq.x;
return 2.0 * asin(sqrt(a));
}
vec3 interpolateGreatCircle(vec3 source, vec3 target, vec3 source3D, vec3 target3D, float angularDist, float t) {
vec2 lngLat;
if(abs(angularDist - PI) < 0.001) {
lngLat = (1.0 - t) * source.xy + t * target.xy;
} else {
float a = sin((1.0 - t) * angularDist);
float b = sin(t * angularDist);
vec3 p = source3D.yxz * a + target3D.yxz * b;
lngLat = degrees(vec2(atan(p.y, -p.x), atan(p.z, length(p.xy))));
}
float z = paraboloid(angularDist * EARTH_RADIUS, source.z, target.z, t);
return vec3(lngLat, z);
}
void main(void) {
geometry.worldPosition = instanceSourcePositions;
geometry.worldPositionAlt = instanceTargetPositions;
float segmentIndex = float(gl_VertexID / 2);
float segmentSide = mod(float(gl_VertexID), 2.) == 0. ? -1. : 1.;
float segmentRatio = getSegmentRatio(segmentIndex);
float prevSegmentRatio = getSegmentRatio(max(0.0, segmentIndex - 1.0));
float nextSegmentRatio = getSegmentRatio(min(arc.numSegments - 1.0, segmentIndex + 1.0));
float indexDir = mix(-1.0, 1.0, step(segmentIndex, 0.0));
isValid = 1.0;
uv = vec2(segmentRatio, segmentSide);
geometry.uv = uv;
geometry.pickingColor = instancePickingColors;
vec4 curr;
vec4 next;
vec3 source;
vec3 target;
if ((arc.greatCircle || project.projectionMode == PROJECTION_MODE_GLOBE) && project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
source = project_globe_(vec3(instanceSourcePositions.xy, 0.0));
target = project_globe_(vec3(instanceTargetPositions.xy, 0.0));
float angularDist = getAngularDist(instanceSourcePositions.xy, instanceTargetPositions.xy);
vec3 prevPos = interpolateGreatCircle(instanceSourcePositions, instanceTargetPositions, source, target, angularDist, prevSegmentRatio);
vec3 currPos = interpolateGreatCircle(instanceSourcePositions, instanceTargetPositions, source, target, angularDist, segmentRatio);
vec3 nextPos = interpolateGreatCircle(instanceSourcePositions, instanceTargetPositions, source, target, angularDist, nextSegmentRatio);
if (abs(currPos.x - prevPos.x) > 180.0) {
indexDir = -1.0;
isValid = 0.0;
} else if (abs(currPos.x - nextPos.x) > 180.0) {
indexDir = 1.0;
isValid = 0.0;
}
nextPos = indexDir < 0.0 ? prevPos : nextPos;
nextSegmentRatio = indexDir < 0.0 ? prevSegmentRatio : nextSegmentRatio;
if (isValid == 0.0) {
nextPos.x += nextPos.x > 0.0 ? -360.0 : 360.0;
float t = ((currPos.x > 0.0 ? 180.0 : -180.0) - currPos.x) / (nextPos.x - currPos.x);
currPos = mix(currPos, nextPos, t);
segmentRatio = mix(segmentRatio, nextSegmentRatio, t);
}
vec3 currPos64Low = mix(instanceSourcePositions64Low, instanceTargetPositions64Low, segmentRatio);
vec3 nextPos64Low = mix(instanceSourcePositions64Low, instanceTargetPositions64Low, nextSegmentRatio);
curr = project_position_to_clipspace(currPos, currPos64Low, vec3(0.0), geometry.position);
next = project_position_to_clipspace(nextPos, nextPos64Low, vec3(0.0));
} else {
vec3 source_world = instanceSourcePositions;
vec3 target_world = instanceTargetPositions;
if (arc.useShortestPath) {
source_world.x = mod(source_world.x + 180., 360.0) - 180.;
target_world.x = mod(target_world.x + 180., 360.0) - 180.;
float deltaLng = target_world.x - source_world.x;
if (deltaLng > 180.) target_world.x -= 360.;
if (deltaLng < -180.) source_world.x -= 360.;
}
source = project_position(source_world, instanceSourcePositions64Low);
target = project_position(target_world, instanceTargetPositions64Low);
float antiMeridianX = 0.0;
if (arc.useShortestPath) {
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
antiMeridianX = -(project.coordinateOrigin.x + 180.) / 360. * TILE_SIZE;
}
float thresholdRatio = (antiMeridianX - source.x) / (target.x - source.x);
if (prevSegmentRatio <= thresholdRatio && nextSegmentRatio > thresholdRatio) {
isValid = 0.0;
indexDir = sign(segmentRatio - thresholdRatio);
segmentRatio = thresholdRatio;
}
}
nextSegmentRatio = indexDir < 0.0 ? prevSegmentRatio : nextSegmentRatio;
vec3 currPos = interpolateFlat(source, target, segmentRatio);
vec3 nextPos = interpolateFlat(source, target, nextSegmentRatio);
if (arc.useShortestPath) {
if (nextPos.x < antiMeridianX) {
currPos.x += TILE_SIZE;
nextPos.x += TILE_SIZE;
}
}
curr = project_common_position_to_clipspace(vec4(currPos, 1.0));
next = project_common_position_to_clipspace(vec4(nextPos, 1.0));
geometry.position = vec4(currPos, 1.0);
}
float widthPixels = clamp(
project_size_to_pixel(instanceWidths * arc.widthScale, arc.widthUnits),
arc.widthMinPixels, arc.widthMaxPixels
);
vec3 offset = vec3(
getExtrusionOffset((next.xy - curr.xy) * indexDir, segmentSide, widthPixels),
0.0);
DECKGL_FILTER_SIZE(offset, geometry);
DECKGL_FILTER_GL_POSITION(curr, geometry);
gl_Position = curr + vec4(project_pixel_size_to_clipspace(offset.xy), 0.0, 0.0);
vec4 color = mix(instanceSourceColors, instanceTargetColors, segmentRatio);
vColor = vec4(color.rgb, color.a * layer.opacity);
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,bi=`#version 300 es
#define SHADER_NAME arc-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 uv;
in float isValid;
out vec4 fragColor;
void main(void) {
if (isValid == 0.0) {
discard;
}
fragColor = vColor;
geometry.uv = uv;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,Ce=[0,0,0,255],Ai={getSourcePosition:{type:"accessor",value:o=>o.sourcePosition},getTargetPosition:{type:"accessor",value:o=>o.targetPosition},getSourceColor:{type:"accessor",value:Ce},getTargetColor:{type:"accessor",value:Ce},getWidth:{type:"accessor",value:1},getHeight:{type:"accessor",value:1},getTilt:{type:"accessor",value:0},greatCircle:!1,numSegments:{type:"number",value:50,min:1},widthUnits:"pixels",widthScale:{type:"number",value:1,min:0},widthMinPixels:{type:"number",value:0,min:0},widthMaxPixels:{type:"number",value:Number.MAX_SAFE_INTEGER,min:0}};class Dt extends q{getBounds(){return this.getAttributeManager()?.getBounds(["instanceSourcePositions","instanceTargetPositions"])}getShaders(){return super.getShaders({vs:wi,fs:bi,modules:[Q,ee,Si]})}get wrapLongitude(){return!1}initializeState(){this.getAttributeManager().addInstanced({instanceSourcePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getSourcePosition"},instanceTargetPositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getTargetPosition"},instanceSourceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getSourceColor",defaultValue:Ce},instanceTargetColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getTargetColor",defaultValue:Ce},instanceWidths:{size:1,transition:!0,accessor:"getWidth",defaultValue:1},instanceHeights:{size:1,transition:!0,accessor:"getHeight",defaultValue:1},instanceTilts:{size:1,transition:!0,accessor:"getTilt",defaultValue:0}})}updateState(e){super.updateState(e),e.changeFlags.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){const{widthUnits:t,widthScale:i,widthMinPixels:n,widthMaxPixels:s,greatCircle:r,wrapLongitude:a,numSegments:l}=this.props,c={numSegments:l,widthUnits:J[t],widthScale:i,widthMinPixels:n,widthMaxPixels:s,greatCircle:r,useShortestPath:a},d=this.state.model;d.shaderInputs.setProps({arc:c}),d.setVertexCount(l*2),d.draw(this.context.renderPass)}_getModel(){return new K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),topology:"triangle-strip",isInstanced:!0})}}Dt.layerName="ArcLayer";Dt.defaultProps=Ai;const Ii=new Uint32Array([0,2,1,0,3,2]),Mi=new Float32Array([0,1,0,0,1,0,1,1]);function Ti(o,e){if(!e)return Ei(o);const t=Math.max(Math.abs(o[0][0]-o[3][0]),Math.abs(o[1][0]-o[2][0])),i=Math.max(Math.abs(o[1][1]-o[0][1]),Math.abs(o[2][1]-o[3][1])),n=Math.ceil(t/e)+1,s=Math.ceil(i/e)+1,r=(n-1)*(s-1)*6,a=new Uint32Array(r),l=new Float32Array(n*s*2),c=new Float64Array(n*s*3);let d=0,p=0;for(let h=0;h<n;h++){const v=h/(n-1);for(let _=0;_<s;_++){const C=_/(s-1),L=Oi(o,v,C);c[d*3+0]=L[0],c[d*3+1]=L[1],c[d*3+2]=L[2]||0,l[d*2+0]=v,l[d*2+1]=1-C,h>0&&_>0&&(a[p++]=d-s,a[p++]=d-s-1,a[p++]=d-1,a[p++]=d-s,a[p++]=d-1,a[p++]=d),d++}}return{vertexCount:r,positions:c,indices:a,texCoords:l}}function Ei(o){const e=new Float64Array(12);for(let t=0;t<o.length;t++)e[t*3+0]=o[t][0],e[t*3+1]=o[t][1],e[t*3+2]=o[t][2]||0;return{vertexCount:6,positions:e,indices:Ii,texCoords:Mi}}function Oi(o,e,t){return Ee(Ee(o[0],o[1],t),Ee(o[3],o[2],t),e)}const tt=`layout(std140) uniform bitmapUniforms {
  vec4 bounds;
  float coordinateConversion;
  float desaturate;
  vec3 tintColor;
  vec4 transparentColor;
} bitmap;
`,zi={name:"bitmap",vs:tt,fs:tt,uniformTypes:{bounds:"vec4<f32>",coordinateConversion:"f32",desaturate:"f32",tintColor:"vec3<f32>",transparentColor:"vec4<f32>"}},Ri=`#version 300 es
#define SHADER_NAME bitmap-layer-vertex-shader

in vec2 texCoords;
in vec3 positions;
in vec3 positions64Low;

out vec2 vTexCoord;
out vec2 vTexPos;

const vec3 pickingColor = vec3(1.0, 0.0, 0.0);

void main(void) {
  geometry.worldPosition = positions;
  geometry.uv = texCoords;
  geometry.pickingColor = pickingColor;

  gl_Position = project_position_to_clipspace(positions, positions64Low, vec3(0.0), geometry.position);
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);

  vTexCoord = texCoords;

  if (bitmap.coordinateConversion < -0.5) {
    vTexPos = geometry.position.xy + project.commonOrigin.xy;
  } else if (bitmap.coordinateConversion > 0.5) {
    vTexPos = geometry.worldPosition.xy;
  }

  vec4 color = vec4(0.0);
  DECKGL_FILTER_COLOR(color, geometry);
}
`,Fi=`
vec3 packUVsIntoRGB(vec2 uv) {
  // Extract the top 8 bits. We want values to be truncated down so we can add a fraction
  vec2 uv8bit = floor(uv * 256.);

  // Calculate the normalized remainders of u and v parts that do not fit into 8 bits
  // Scale and clamp to 0-1 range
  vec2 uvFraction = fract(uv * 256.);
  vec2 uvFraction4bit = floor(uvFraction * 16.);

  // Remainder can be encoded in blue channel, encode as 4 bits for pixel coordinates
  float fractions = uvFraction4bit.x + uvFraction4bit.y * 16.;

  return vec3(uv8bit, fractions) / 255.;
}
`,ki=`#version 300 es
#define SHADER_NAME bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D bitmapTexture;

in vec2 vTexCoord;
in vec2 vTexPos;

out vec4 fragColor;

/* projection utils */
const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / PI / 2.0;

// from degrees to Web Mercator
vec2 lnglat_to_mercator(vec2 lnglat) {
  float x = lnglat.x;
  float y = clamp(lnglat.y, -89.9, 89.9);
  return vec2(
    radians(x) + PI,
    PI + log(tan(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// from Web Mercator to degrees
vec2 mercator_to_lnglat(vec2 xy) {
  xy /= WORLD_SCALE;
  return degrees(vec2(
    xy.x - PI,
    atan(exp(xy.y - PI)) * 2.0 - PI * 0.5
  ));
}
/* End projection utils */

// apply desaturation
vec3 color_desaturate(vec3 color) {
  float luminance = (color.r + color.g + color.b) * 0.333333333;
  return mix(color, vec3(luminance), bitmap.desaturate);
}

// apply tint
vec3 color_tint(vec3 color) {
  return color * bitmap.tintColor;
}

// blend with background color
vec4 apply_opacity(vec3 color, float alpha) {
  if (bitmap.transparentColor.a == 0.0) {
    return vec4(color, alpha);
  }
  float blendedAlpha = alpha + bitmap.transparentColor.a * (1.0 - alpha);
  float highLightRatio = alpha / blendedAlpha;
  vec3 blendedRGB = mix(bitmap.transparentColor.rgb, color, highLightRatio);
  return vec4(blendedRGB, blendedAlpha);
}

vec2 getUV(vec2 pos) {
  return vec2(
    (pos.x - bitmap.bounds[0]) / (bitmap.bounds[2] - bitmap.bounds[0]),
    (pos.y - bitmap.bounds[3]) / (bitmap.bounds[1] - bitmap.bounds[3])
  );
}

${Fi}

void main(void) {
  vec2 uv = vTexCoord;
  if (bitmap.coordinateConversion < -0.5) {
    vec2 lnglat = mercator_to_lnglat(vTexPos);
    uv = getUV(lnglat);
  } else if (bitmap.coordinateConversion > 0.5) {
    vec2 commonPos = lnglat_to_mercator(vTexPos);
    uv = getUV(commonPos);
  }
  vec4 bitmapColor = texture(bitmapTexture, uv);

  fragColor = apply_opacity(color_tint(color_desaturate(bitmapColor.rgb)), bitmapColor.a * layer.opacity);

  geometry.uv = uv;
  DECKGL_FILTER_COLOR(fragColor, geometry);

  if (bool(picking.isActive) && !bool(picking.isAttribute)) {
    // Since instance information is not used, we can use picking color for pixel index
    fragColor.rgb = packUVsIntoRGB(uv);
  }
}
`,Di={image:{type:"image",value:null,async:!0},bounds:{type:"array",value:[1,0,0,1],compare:!0},_imageCoordinateSystem:"default",desaturate:{type:"number",min:0,max:1,value:0},transparentColor:{type:"color",value:[0,0,0,0]},tintColor:{type:"color",value:[255,255,255]},textureParameters:{type:"object",ignore:!0,value:null}};class Bt extends q{getShaders(){return super.getShaders({vs:Ri,fs:ki,modules:[Q,ee,zi]})}initializeState(){const e=this.getAttributeManager();e.remove(["instancePickingColors"]);const t=!0;e.add({indices:{size:1,isIndexed:!0,update:i=>i.value=this.state.mesh.indices,noAlloc:t},positions:{size:3,type:"float64",fp64:this.use64bitPositions(),update:i=>i.value=this.state.mesh.positions,noAlloc:t},texCoords:{size:2,update:i=>i.value=this.state.mesh.texCoords,noAlloc:t}})}updateState({props:e,oldProps:t,changeFlags:i}){const n=this.getAttributeManager();if(i.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),n.invalidateAll()),e.bounds!==t.bounds){const s=this.state.mesh,r=this._createMesh();this.state.model.setVertexCount(r.vertexCount);for(const a in r)s&&s[a]!==r[a]&&n.invalidate(a);this.setState({mesh:r,...this._getCoordinateUniforms()})}else e._imageCoordinateSystem!==t._imageCoordinateSystem&&this.setState(this._getCoordinateUniforms())}getPickingInfo(e){const{image:t}=this.props,i=e.info;if(!i.color||!t)return i.bitmap=null,i;const{width:n,height:s}=t;i.index=0;const r=Bi(i.color);return i.bitmap={size:{width:n,height:s},uv:r,pixel:[Math.floor(r[0]*n),Math.floor(r[1]*s)]},i}disablePickingIndex(){this.setState({disablePicking:!0})}restorePickingColors(){this.setState({disablePicking:!1})}_updateAutoHighlight(e){super._updateAutoHighlight({...e,color:this.encodePickingColor(0)})}_createMesh(){const{bounds:e}=this.props;let t=e;return it(e)&&(t=[[e[0],e[1]],[e[0],e[3]],[e[2],e[3]],[e[2],e[1]]]),Ti(t,this.context.viewport.resolution)}_getModel(){return new K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),topology:"triangle-list",isInstanced:!1})}draw(e){const{shaderModuleProps:t}=e,{model:i,coordinateConversion:n,bounds:s,disablePicking:r}=this.state,{image:a,desaturate:l,transparentColor:c,tintColor:d}=this.props;if(!(t.picking.isActive&&r)&&a&&i){const p={bitmapTexture:a,bounds:s,coordinateConversion:n,desaturate:l,tintColor:d.slice(0,3).map(h=>h/255),transparentColor:c.map(h=>h/255)};i.shaderInputs.setProps({bitmap:p}),i.draw(this.context.renderPass)}}_getCoordinateUniforms(){let{_imageCoordinateSystem:e}=this.props;if(e!=="default"){const{bounds:t}=this.props;if(!it(t))throw new Error("_imageCoordinateSystem only supports rectangular bounds");const i=this.context.viewport.resolution?"lnglat":"cartesian";if(e=e==="lnglat"?"lnglat":"cartesian",e==="lnglat"&&i==="cartesian")return{coordinateConversion:-1,bounds:t};if(e==="cartesian"&&i==="lnglat"){const n=Qe([t[0],t[1]]),s=Qe([t[2],t[3]]);return{coordinateConversion:1,bounds:[n[0],n[1],s[0],s[1]]}}}return{coordinateConversion:0,bounds:[0,0,0,0]}}}Bt.layerName="BitmapLayer";Bt.defaultProps=Di;function Bi(o){const[e,t,i]=o,n=(i&240)/256,s=(i&15)/16;return[(e+s)/256,(t+n)/256]}function it(o){return Number.isFinite(o[0])}const ot=`layout(std140) uniform iconUniforms {
  float sizeScale;
  vec2 iconsTextureDim;
  float sizeBasis;
  float sizeMinPixels;
  float sizeMaxPixels;
  bool billboard;
  highp int sizeUnits;
  float alphaCutoff;
} icon;
`,Ni={name:"icon",vs:ot,fs:ot,uniformTypes:{sizeScale:"f32",iconsTextureDim:"vec2<f32>",sizeBasis:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",billboard:"f32",sizeUnits:"i32",alphaCutoff:"f32"}},Ui=`#version 300 es
#define SHADER_NAME icon-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceSizes;
in float instanceAngles;
in vec4 instanceColors;
in vec3 instancePickingColors;
in vec4 instanceIconFrames;
in float instanceColorModes;
in vec2 instanceOffsets;
in vec2 instancePixelOffset;
out float vColorMode;
out vec4 vColor;
out vec2 vTextureCoords;
out vec2 uv;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = angle * PI / 180.0;
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
geometry.pickingColor = instancePickingColors;
uv = positions;
vec2 iconSize = instanceIconFrames.zw;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * icon.sizeScale, icon.sizeUnits),
icon.sizeMinPixels, icon.sizeMaxPixels
);
float iconConstraint = icon.sizeBasis == 0.0 ? iconSize.x : iconSize.y;
float instanceScale = iconConstraint == 0.0 ? 0.0 : sizePixels / iconConstraint;
vec2 pixelOffset = positions / 2.0 * iconSize + instanceOffsets;
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles) * instanceScale;
pixelOffset += instancePixelOffset;
pixelOffset.y *= -1.0;
if (icon.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
DECKGL_FILTER_SIZE(offset_common, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vTextureCoords = mix(
instanceIconFrames.xy,
instanceIconFrames.xy + iconSize,
(positions.xy + 1.0) / 2.0
) / icon.iconsTextureDim;
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
vColorMode = instanceColorModes;
}
`,Gi=`#version 300 es
#define SHADER_NAME icon-layer-fragment-shader
precision highp float;
uniform sampler2D iconsTexture;
in float vColorMode;
in vec4 vColor;
in vec2 vTextureCoords;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
vec4 texColor = texture(iconsTexture, vTextureCoords);
vec3 color = mix(texColor.rgb, vColor.rgb, vColorMode);
float a = texColor.a * layer.opacity * vColor.a;
if (a < icon.alphaCutoff) {
discard;
}
fragColor = vec4(color, a);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,Wi=`struct IconUniforms {
  sizeScale: f32,
  iconsTextureDim: vec2<f32>,
  sizeBasis: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  billboard: i32,
  sizeUnits: i32,
  alphaCutoff: f32
};

@group(0) @binding(auto) var<uniform> icon: IconUniforms;
@group(0) @binding(auto) var iconsTexture : texture_2d<f32>;
@group(0) @binding(auto) var iconsTextureSampler : sampler;

fn rotate_by_angle(vertex: vec2<f32>, angle_deg: f32) -> vec2<f32> {
  let angle_radian = angle_deg * PI / 180.0;
  let c = cos(angle_radian);
  let s = sin(angle_radian);
  let rotation = mat2x2<f32>(vec2<f32>(c, s), vec2<f32>(-s, c));
  return rotation * vertex;
}

struct Attributes {
  @location(0) positions: vec2<f32>,

  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceSizes: f32,
  @location(4) instanceAngles: f32,
  @location(5) instanceColors: vec4<f32>,
  @location(6) instancePickingColors: vec3<f32>,
  @location(7) instanceIconFrames: vec4<f32>,
  @location(8) instanceColorModes: f32,
  @location(9) instanceOffsets: vec2<f32>,
  @location(10) instancePixelOffset: vec2<f32>,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,

  @location(0) vColorMode: f32,
  @location(1) vColor: vec4<f32>,
  @location(2) vTextureCoords: vec2<f32>,
  @location(3) uv: vec2<f32>,
  @location(4) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(inp: Attributes) -> Varyings {
  // write geometry fields used by filters + FS
  geometry.worldPosition = inp.instancePositions;
  geometry.uv = inp.positions;
  geometry.pickingColor = inp.instancePickingColors;

  var outp: Varyings;
  outp.uv = inp.positions;

  let iconSize = inp.instanceIconFrames.zw;

  // convert size in meters to pixels, then clamp
  let sizePixels = clamp(
    project_unit_size_to_pixel(inp.instanceSizes * icon.sizeScale, icon.sizeUnits),
    icon.sizeMinPixels, icon.sizeMaxPixels
  );

  // scale icon height to match instanceSize
  let iconConstraint = select(iconSize.y, iconSize.x, icon.sizeBasis == 0.0);
  let instanceScale = select(sizePixels / iconConstraint, 0.0, iconConstraint == 0.0);

  // scale and rotate vertex in "pixel" units; then add per-instance pixel offset
  var pixelOffset = inp.positions / 2.0 * iconSize + inp.instanceOffsets;
  pixelOffset = rotate_by_angle(pixelOffset, inp.instanceAngles) * instanceScale;
  pixelOffset = pixelOffset + inp.instancePixelOffset;
  pixelOffset.y = pixelOffset.y * -1.0;

  if (icon.billboard != 0) {
    var pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, vec3<f32>(0.0)); // TODO, &geometry.position);
    // DECKGL_FILTER_GL_POSITION(pos, geometry);

    var offset = vec3<f32>(pixelOffset, 0.0);
    // DECKGL_FILTER_SIZE(offset, geometry);
    let clipOffset = project_pixel_size_to_clipspace(offset.xy);
    pos = vec4<f32>(pos.x + clipOffset.x, pos.y + clipOffset.y, pos.z, pos.w);
    outp.position = pos;
  } else {
    var offset_common = vec3<f32>(project_pixel_size_vec2(pixelOffset), 0.0);
    // DECKGL_FILTER_SIZE(offset_common, geometry);
    var pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, offset_common); // TODO, &geometry.position);
    // DECKGL_FILTER_GL_POSITION(pos, geometry);
    outp.position = pos;
  }

  let uvMix = (inp.positions.xy + vec2<f32>(1.0, 1.0)) * 0.5;
  outp.vTextureCoords = mix(inp.instanceIconFrames.xy, inp.instanceIconFrames.xy + iconSize, uvMix) / icon.iconsTextureDim;

  outp.vColor = inp.instanceColors;
  // DECKGL_FILTER_COLOR(outp.vColor, geometry);

  outp.vColorMode = inp.instanceColorModes;
  outp.pickingColor = inp.instancePickingColors;

  return outp;
}

@fragment
fn fragmentMain(inp: Varyings) -> @location(0) vec4<f32> {
  // expose to deck.gl filter hooks
  geometry.uv = inp.uv;

  let texColor = textureSample(iconsTexture, iconsTextureSampler, inp.vTextureCoords);

  // if colorMode == 0, use pixel color from the texture
  // if colorMode == 1 (or picking), use texture as transparency mask
  let rgb = mix(texColor.rgb, inp.vColor.rgb, inp.vColorMode);
  let a = texColor.a * layer.opacity * inp.vColor.a;

  if (a < icon.alphaCutoff) {
    discard;
  }

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inp.pickingColor)) {
      discard;
    }
    return vec4<f32>(inp.pickingColor, 1.0);
  }

  var fragColor = deckgl_premultiplied_alpha(vec4<f32>(rgb, a));

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(inp.pickingColor - highlightedObjectColor))) {
      let highLightAlpha = picking.highlightColor.a;
      let blendedAlpha = highLightAlpha + fragColor.a * (1.0 - highLightAlpha);
      if (blendedAlpha > 0.0) {
        let highLightRatio = highLightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highLightRatio),
          blendedAlpha
        );
      } else {
        fragColor = vec4<f32>(fragColor.rgb, 0.0);
      }
    }
  }

  return fragColor;
}
`,ji=1024,Vi=4,nt=()=>{},st={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},$i={x:0,y:0,width:0,height:0};function Hi(o){return Math.pow(2,Math.ceil(Math.log2(o)))}function Ki(o,e,t,i){const n=Math.min(t/e.width,i/e.height),s=Math.floor(e.width*n),r=Math.floor(e.height*n);return n===1?{image:e,width:s,height:r}:(o.canvas.height=r,o.canvas.width=s,o.clearRect(0,0,s,r),o.drawImage(e,0,0,e.width,e.height,0,0,s,r),{image:o.canvas,width:s,height:r})}function de(o){return o&&(o.id||o.url)}function Nt(o){const{device:e}=o;e.type==="webgl"?o.generateMipmapsWebGL():e.type==="webgpu"&&e.generateMipmapsWebGPU(o)}function Zi(o,e,t,i){const{width:n,height:s,device:r}=o,a=r.createTexture({format:"rgba8unorm",width:e,height:t,sampler:i,mipLevels:r.getMipLevelCount(e,t)}),l=r.createCommandEncoder();l.copyTextureToTexture({sourceTexture:o,destinationTexture:a,width:n,height:s});const c=l.finish();return r.submit(c),Nt(a),o.destroy(),a}function rt(o,e,t){for(let i=0;i<e.length;i++){const{icon:n,xOffset:s}=e[i],r=de(n);o[r]={...n,x:s,y:t}}}function Xi({icons:o,buffer:e,mapping:t={},xOffset:i=0,yOffset:n=0,rowHeight:s=0,canvasWidth:r}){let a=[];for(let l=0;l<o.length;l++){const c=o[l],d=de(c);if(!t[d]){const{height:p,width:h}=c;i+h+e>r&&(rt(t,a,n),i=0,n=s+n+e,s=0,a=[]),a.push({icon:c,xOffset:i}),i=i+h+e,s=Math.max(s,p)}}return a.length>0&&rt(t,a,n),{mapping:t,rowHeight:s,xOffset:i,yOffset:n,canvasWidth:r,canvasHeight:Hi(s+n+e)}}function Ji(o,e,t){if(!o||!e)return null;t=t||{};const i={},{iterable:n,objectInfo:s}=be(o);for(const r of n){s.index++;const a=e(r,s),l=de(a);if(!a)throw new Error("Icon is missing.");if(!a.url)throw new Error("Icon url is missing.");!i[l]&&(!t[l]||a.url!==t[l].url)&&(i[l]={...a,source:r,sourceIndex:s.index})}return i}class Yi{constructor(e,{onUpdate:t=nt,onError:i=nt}){this._loadOptions=null,this._texture=null,this._externalTexture=null,this._mapping={},this._samplerParameters=null,this._pendingCount=0,this._autoPacking=!1,this._xOffset=0,this._yOffset=0,this._rowHeight=0,this._buffer=Vi,this._canvasWidth=ji,this._canvasHeight=0,this._canvas=null,this.device=e,this.onUpdate=t,this.onError=i}finalize(){this._texture?.delete()}getTexture(){return this._texture||this._externalTexture}getIconMapping(e){const t=this._autoPacking?de(e):e;return this._mapping[t]||$i}setProps({loadOptions:e,autoPacking:t,iconAtlas:i,iconMapping:n,textureParameters:s}){e&&(this._loadOptions=e),t!==void 0&&(this._autoPacking=t),n&&(this._mapping=n),i&&(this._texture?.delete(),this._texture=null,this._externalTexture=i),s&&(this._samplerParameters=s)}get isLoaded(){return this._pendingCount===0}packIcons(e,t){if(!this._autoPacking||typeof document>"u")return;const i=Object.values(Ji(e,t,this._mapping)||{});if(i.length>0){const{mapping:n,xOffset:s,yOffset:r,rowHeight:a,canvasHeight:l}=Xi({icons:i,buffer:this._buffer,canvasWidth:this._canvasWidth,mapping:this._mapping,rowHeight:this._rowHeight,xOffset:this._xOffset,yOffset:this._yOffset});this._rowHeight=a,this._mapping=n,this._xOffset=s,this._yOffset=r,this._canvasHeight=l,this._texture||(this._texture=this.device.createTexture({format:"rgba8unorm",data:null,width:this._canvasWidth,height:this._canvasHeight,sampler:this._samplerParameters||st,mipLevels:this.device.getMipLevelCount(this._canvasWidth,this._canvasHeight)})),this._texture.height!==this._canvasHeight&&(this._texture=Zi(this._texture,this._canvasWidth,this._canvasHeight,this._samplerParameters||st)),this.onUpdate(!0),this._canvas=this._canvas||document.createElement("canvas"),this._loadIcons(i)}}_loadIcons(e){const t=this._canvas.getContext("2d",{willReadFrequently:!0});for(const i of e)this._pendingCount++,di(i.url,this._loadOptions).then(n=>{const s=de(i),r=this._mapping[s],{x:a,y:l,width:c,height:d}=r,{image:p,width:h,height:v}=Ki(t,n,c,d),_=a+(c-h)/2,C=l+(d-v)/2;this._texture?.copyExternalImage({image:p,x:_,y:C,width:h,height:v}),r.x=_,r.y=C,r.width=h,r.height=v,this._texture&&Nt(this._texture),this.onUpdate(h!==c||v!==d)}).catch(n=>{this.onError({url:i.url,source:i.source,sourceIndex:i.sourceIndex,loadOptions:this._loadOptions,error:n})}).finally(()=>{this._pendingCount--})}}const Ut=[0,0,0,255],qi={iconAtlas:{type:"image",value:null,async:!0},iconMapping:{type:"object",value:{},async:!0},sizeScale:{type:"number",value:1,min:0},billboard:!0,sizeUnits:"pixels",sizeBasis:"height",sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},alphaCutoff:{type:"number",value:.05,min:0,max:1},getPosition:{type:"accessor",value:o=>o.position},getIcon:{type:"accessor",value:o=>o.icon},getColor:{type:"accessor",value:Ut},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},onIconError:{type:"function",value:null,optional:!0},textureParameters:{type:"object",ignore:!0,value:null}};class Ie extends q{getShaders(){return super.getShaders({vs:Ui,fs:Gi,source:Wi,modules:[Q,Ae,ee,Ni]})}initializeState(){this.state={iconManager:new Yi(this.context.device,{onUpdate:this._onUpdate.bind(this),onError:this._onError.bind(this)})},this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,accessor:"getSize",defaultValue:1},instanceIconDefs:{size:7,accessor:"getIcon",transform:this.getInstanceIconDef,shaderAttributes:{instanceOffsets:{size:2,elementOffset:0},instanceIconFrames:{size:4,elementOffset:2},instanceColorModes:{size:1,elementOffset:6}}},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:Ut},instanceAngles:{size:1,transition:!0,accessor:"getAngle"},instancePixelOffset:{size:2,transition:!0,accessor:"getPixelOffset"}})}updateState(e){super.updateState(e);const{props:t,oldProps:i,changeFlags:n}=e,s=this.getAttributeManager(),{iconAtlas:r,iconMapping:a,data:l,getIcon:c,textureParameters:d}=t,{iconManager:p}=this.state;if(typeof r=="string")return;const h=r||this.internalState.isAsyncPropLoading("iconAtlas");p.setProps({loadOptions:t.loadOptions,autoPacking:!h,iconAtlas:r,iconMapping:h?a:null,textureParameters:d}),h?i.iconMapping!==t.iconMapping&&s.invalidate("getIcon"):(n.dataChanged||n.updateTriggersChanged&&(n.updateTriggersChanged.all||n.updateTriggersChanged.getIcon))&&p.packIcons(l,c),n.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),s.invalidateAll())}get isLoaded(){return super.isLoaded&&this.state.iconManager.isLoaded}finalizeState(e){super.finalizeState(e),this.state.iconManager.finalize()}draw({uniforms:e}){const{sizeScale:t,sizeBasis:i,sizeMinPixels:n,sizeMaxPixels:s,sizeUnits:r,billboard:a,alphaCutoff:l}=this.props,{iconManager:c}=this.state,d=c.getTexture();if(d){const p=this.state.model,h={iconsTexture:d,iconsTextureDim:[d.width,d.height],sizeUnits:J[r],sizeScale:t,sizeBasis:i==="height"?1:0,sizeMinPixels:n,sizeMaxPixels:s,billboard:a,alphaCutoff:l};p.shaderInputs.setProps({icon:h}),p.draw(this.context.renderPass)}}_getModel(){const e=[-1,-1,1,-1,-1,1,1,1];return new K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new Y({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array(e)}}}),isInstanced:!0})}_onUpdate(e){e?(this.getAttributeManager()?.invalidate("getIcon"),this.setNeedsUpdate()):this.setNeedsRedraw()}_onError(e){const t=this.getCurrentLayer()?.props.onIconError;t?t(e):Z.error(e.error.message)()}getInstanceIconDef(e){const{x:t,y:i,width:n,height:s,mask:r,anchorX:a=n/2,anchorY:l=s/2}=this.state.iconManager.getIconMapping(e);return[n/2-a,s/2-l,t,i,n,s,r?1:0]}}Ie.defaultProps=qi;Ie.layerName="IconLayer";const at=`layout(std140) uniform lineUniforms {
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  float useShortestPath;
  highp int widthUnits;
} line;
`,Qi={name:"line",source:"",vs:at,fs:at,uniformTypes:{widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",useShortestPath:"f32",widthUnits:"i32"}},eo=`// ---------- Helper Structures & Functions ----------

// Placeholder filter functions.
fn deckgl_filter_size(offset: vec3<f32>, geometry: Geometry) -> vec3<f32> {
  return offset;
}
fn deckgl_filter_gl_position(p: vec4<f32>, geometry: Geometry) -> vec4<f32> {
  if (picking.isAttribute > 0.5) {
    // For depth picking, write normalized depth into the picking payload.
    // This mirrors the legacy DECKGL_FILTER_GL_POSITION hook on WebGL.
  }
  return p;
}

// Compute an extrusion offset given a line direction (in clipspace),
// an offset direction (-1 or 1), and a width in pixels.
// Assumes a uniform "project" with a viewportSize field is available.
fn getExtrusionOffset(line_clipspace: vec2<f32>, offset_direction: f32, width: f32) -> vec2<f32> {
  // project.viewportSize should be provided as a uniform (not shown here)
  let dir_screenspace = normalize(line_clipspace * project.viewportSize);
  // Rotate by 90°: (x,y) becomes (-y,x)
  let rotated = vec2<f32>(-dir_screenspace.y, dir_screenspace.x);
  return rotated * offset_direction * width / 2.0;
}

// Splits the line between two points at a given x coordinate.
// Interpolates the y and z components.
fn splitLine(a: vec3<f32>, b: vec3<f32>, x: f32) -> vec3<f32> {
  let t: f32 = (x - a.x) / (b.x - a.x);
  return vec3<f32>(x, a.yz + t * (b.yz - a.yz));
}

// ---------- Uniforms & Global Structures ----------

struct LineUniforms {
  widthScale: f32,
  widthMinPixels: f32,
  widthMaxPixels: f32,
  useShortestPath: f32,
  widthUnits: i32,
};

@group(0) @binding(0)
var<uniform> line: LineUniforms;



// ---------- Vertex Output Structure ----------

struct Varyings {
  @builtin(position) gl_Position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) pickingColor: vec3<f32>,
};

// ---------- Vertex Shader Entry Point ----------

@vertex
fn vertexMain(
  @location(0) positions: vec3<f32>,
  @location(1) instanceSourcePositions: vec3<f32>,
  @location(2) instanceTargetPositions: vec3<f32>,
  @location(3) instanceSourcePositions64Low: vec3<f32>,
  @location(4) instanceTargetPositions64Low: vec3<f32>,
  @location(5) instanceColors: vec4<f32>,
  @location(6) instancePickingColors: vec3<f32>,
  @location(7) instanceWidths: f32
) -> Varyings {
  geometry.worldPosition = instanceSourcePositions;
  geometry.worldPositionAlt = instanceTargetPositions;

  var source_world: vec3<f32> = instanceSourcePositions;
  var target_world: vec3<f32> = instanceTargetPositions;
  var source_world_64low: vec3<f32> = instanceSourcePositions64Low;
  var target_world_64low: vec3<f32> = instanceTargetPositions64Low;

  // Apply shortest-path adjustments if needed.
  if (line.useShortestPath > 0.5 || line.useShortestPath < -0.5) {
    source_world.x = (source_world.x + 180.0 % 360.0) - 180.0;
    target_world.x = (target_world.x + 180.0 % 360.0) - 180.0;
    let deltaLng: f32 = target_world.x - source_world.x;

    if (deltaLng * line.useShortestPath > 180.0) {
      source_world.x = source_world.x + 360.0 * line.useShortestPath;
      source_world = splitLine(source_world, target_world, 180.0 * line.useShortestPath);
      source_world_64low = vec3<f32>(0.0, 0.0, 0.0);
    } else if (deltaLng * line.useShortestPath < -180.0) {
      target_world.x = target_world.x + 360.0 * line.useShortestPath;
      target_world = splitLine(source_world, target_world, 180.0 * line.useShortestPath);
      target_world_64low = vec3<f32>(0.0, 0.0, 0.0);
    } else if (line.useShortestPath < 0.0) {
      var abortOut: Varyings;
      abortOut.gl_Position = vec4<f32>(0.0);
      abortOut.vColor = vec4<f32>(0.0);
      abortOut.uv = vec2<f32>(0.0);
      return abortOut;
    }
  }

  // Project Pos and target positions to clip space.
  let sourceResult = project_position_to_clipspace_and_commonspace(source_world, source_world_64low, vec3<f32>(0.0));
  let targetResult = project_position_to_clipspace_and_commonspace(target_world, target_world_64low, vec3<f32>(0.0));
  let sourcePos: vec4<f32> = sourceResult.clipPosition;
  let targetPos: vec4<f32> = targetResult.clipPosition;
  let source_commonspace: vec4<f32> = sourceResult.commonPosition;
  let target_commonspace: vec4<f32> = targetResult.commonPosition;

  // Interpolate along the line segment.
  let segmentIndex: f32 = positions.x;
  let p: vec4<f32> = sourcePos + segmentIndex * (targetPos - sourcePos);
  geometry.position = source_commonspace + segmentIndex * (target_commonspace - source_commonspace);
  let uv: vec2<f32> = positions.xy;
  geometry.uv = uv;
  geometry.pickingColor = instancePickingColors;

  // Determine width in pixels.
  let widthPixels: f32 = clamp(
    project_unit_size_to_pixel(instanceWidths * line.widthScale, line.widthUnits),
    line.widthMinPixels, line.widthMaxPixels
  );

  // Compute extrusion offset.
  let extrusion: vec2<f32> = getExtrusionOffset(targetPos.xy - sourcePos.xy, positions.y, widthPixels);
  let offset: vec3<f32> = vec3<f32>(extrusion, 0.0);

  // Apply deck.gl filter functions.
  let filteredOffset = deckgl_filter_size(offset, geometry);
  let filteredP = deckgl_filter_gl_position(p, geometry);

  let clipOffset: vec2<f32> = project_pixel_size_to_clipspace(filteredOffset.xy);
  let finalPosition: vec4<f32> = filteredP + vec4<f32>(clipOffset, 0.0, 0.0);

  // Compute color.
  var vColor: vec4<f32> = vec4<f32>(instanceColors.rgb, instanceColors.a * layer.opacity);
  // vColor = deckgl_filter_color(vColor, geometry);

  var output: Varyings;
  output.gl_Position = finalPosition;
  output.vColor = vColor;
  output.uv = uv;
  output.pickingColor = instancePickingColors;
  return output;
}

@fragment
fn fragmentMain(
  @location(0) vColor: vec4<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) pickingColor: vec3<f32>
) -> @location(0) vec4<f32> {
  // Create and initialize geometry with the provided uv.
  var geometry: Geometry;
  geometry.uv = uv;

  // Start with the input color.
  var fragColor: vec4<f32> = vColor;

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(pickingColor)) {
      discard;
    }
    return vec4<f32>(pickingColor, 1.0);
  }

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(pickingColor - highlightedObjectColor))) {
      let highLightAlpha = picking.highlightColor.a;
      let blendedAlpha = highLightAlpha + fragColor.a * (1.0 - highLightAlpha);
      if (blendedAlpha > 0.0) {
        let highLightRatio = highLightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highLightRatio),
          blendedAlpha
        );
      } else {
        fragColor = vec4<f32>(fragColor.rgb, 0.0);
      }
    }
  }

  // Apply premultiplied alpha as required by transparent canvas
  fragColor = deckgl_premultiplied_alpha(fragColor);

  return fragColor;
}
`,to=`#version 300 es
#define SHADER_NAME line-layer-vertex-shader
in vec3 positions;
in vec3 instanceSourcePositions;
in vec3 instanceTargetPositions;
in vec3 instanceSourcePositions64Low;
in vec3 instanceTargetPositions64Low;
in vec4 instanceColors;
in vec3 instancePickingColors;
in float instanceWidths;
out vec4 vColor;
out vec2 uv;
vec2 getExtrusionOffset(vec2 line_clipspace, float offset_direction, float width) {
vec2 dir_screenspace = normalize(line_clipspace * project.viewportSize);
dir_screenspace = vec2(-dir_screenspace.y, dir_screenspace.x);
return dir_screenspace * offset_direction * width / 2.0;
}
vec3 splitLine(vec3 a, vec3 b, float x) {
float t = (x - a.x) / (b.x - a.x);
return vec3(x, mix(a.yz, b.yz, t));
}
void main(void) {
geometry.worldPosition = instanceSourcePositions;
geometry.worldPositionAlt = instanceTargetPositions;
vec3 source_world = instanceSourcePositions;
vec3 target_world = instanceTargetPositions;
vec3 source_world_64low = instanceSourcePositions64Low;
vec3 target_world_64low = instanceTargetPositions64Low;
if (line.useShortestPath > 0.5 || line.useShortestPath < -0.5) {
source_world.x = mod(source_world.x + 180., 360.0) - 180.;
target_world.x = mod(target_world.x + 180., 360.0) - 180.;
float deltaLng = target_world.x - source_world.x;
if (deltaLng * line.useShortestPath > 180.) {
source_world.x += 360. * line.useShortestPath;
source_world = splitLine(source_world, target_world, 180. * line.useShortestPath);
source_world_64low = vec3(0.0);
} else if (deltaLng * line.useShortestPath < -180.) {
target_world.x += 360. * line.useShortestPath;
target_world = splitLine(source_world, target_world, 180. * line.useShortestPath);
target_world_64low = vec3(0.0);
} else if (line.useShortestPath < 0.) {
gl_Position = vec4(0.);
return;
}
}
vec4 source_commonspace;
vec4 target_commonspace;
vec4 source = project_position_to_clipspace(source_world, source_world_64low, vec3(0.), source_commonspace);
vec4 target = project_position_to_clipspace(target_world, target_world_64low, vec3(0.), target_commonspace);
float segmentIndex = positions.x;
vec4 p = mix(source, target, segmentIndex);
geometry.position = mix(source_commonspace, target_commonspace, segmentIndex);
uv = positions.xy;
geometry.uv = uv;
geometry.pickingColor = instancePickingColors;
float widthPixels = clamp(
project_size_to_pixel(instanceWidths * line.widthScale, line.widthUnits),
line.widthMinPixels, line.widthMaxPixels
);
vec3 offset = vec3(
getExtrusionOffset(target.xy - source.xy, positions.y, widthPixels),
0.0);
DECKGL_FILTER_SIZE(offset, geometry);
DECKGL_FILTER_GL_POSITION(p, geometry);
gl_Position = p + vec4(project_pixel_size_to_clipspace(offset.xy), 0.0, 0.0);
vColor = vec4(instanceColors.rgb, instanceColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,io=`#version 300 es
#define SHADER_NAME line-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
fragColor = vColor;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,oo=[0,0,0,255],no={getSourcePosition:{type:"accessor",value:o=>o.sourcePosition},getTargetPosition:{type:"accessor",value:o=>o.targetPosition},getColor:{type:"accessor",value:oo},getWidth:{type:"accessor",value:1},widthUnits:"pixels",widthScale:{type:"number",value:1,min:0},widthMinPixels:{type:"number",value:0,min:0},widthMaxPixels:{type:"number",value:Number.MAX_SAFE_INTEGER,min:0}};class Gt extends q{getBounds(){return this.getAttributeManager()?.getBounds(["instanceSourcePositions","instanceTargetPositions"])}getShaders(){return super.getShaders({vs:to,fs:io,source:eo,modules:[Q,Ae,ee,Qi]})}get wrapLongitude(){return!1}initializeState(){this.getAttributeManager().addInstanced({instanceSourcePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getSourcePosition"},instanceTargetPositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getTargetPosition"},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:[0,0,0,255]},instanceWidths:{size:1,transition:!0,accessor:"getWidth",defaultValue:1}})}updateState(e){super.updateState(e),e.changeFlags.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){const{widthUnits:t,widthScale:i,widthMinPixels:n,widthMaxPixels:s,wrapLongitude:r}=this.props,a=this.state.model,l={widthUnits:J[t],widthScale:i,widthMinPixels:n,widthMaxPixels:s,useShortestPath:r?1:0};a.shaderInputs.setProps({line:l}),a.draw(this.context.renderPass),r&&(a.shaderInputs.setProps({line:{...l,useShortestPath:-1}}),a.draw(this.context.renderPass))}_getModel(){const e=[0,-1,0,0,1,0,1,-1,0,1,1,0];return new K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new Y({topology:"triangle-strip",attributes:{positions:{size:3,value:new Float32Array(e)}}}),isInstanced:!0})}}Gt.layerName="LineLayer";Gt.defaultProps=no;const lt=`layout(std140) uniform pointCloudUniforms {
  float radiusPixels;
  highp int sizeUnits;
} pointCloud;
`,so={name:"pointCloud",source:"",vs:lt,fs:lt,uniformTypes:{radiusPixels:"f32",sizeUnits:"i32"}},ro=`#version 300 es
#define SHADER_NAME point-cloud-layer-vertex-shader
in vec3 positions;
in vec3 instanceNormals;
in vec4 instanceColors;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec3 instancePickingColors;
out vec4 vColor;
out vec2 unitPosition;
void main(void) {
geometry.worldPosition = instancePositions;
geometry.normal = project_normal(instanceNormals);
unitPosition = positions.xy;
geometry.uv = unitPosition;
geometry.pickingColor = instancePickingColors;
vec3 offset = vec3(positions.xy * project_size_to_pixel(pointCloud.radiusPixels, pointCloud.sizeUnits), 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
vec3 lightColor = lighting_getLightColor(instanceColors.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, instanceColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,ao=`#version 300 es
#define SHADER_NAME point-cloud-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 unitPosition;
out vec4 fragColor;
void main(void) {
geometry.uv = unitPosition.xy;
float distToCenter = length(unitPosition);
if (distToCenter > 1.0) {
discard;
}
fragColor = vColor;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,lo=`struct PointCloudUniforms {
  radiusPixels: f32,
  sizeUnits: i32,
};

@group(0) @binding(0)
var<uniform> pointCloudUniforms: PointCloudUniforms;

struct ConstantAttributes {
  instanceNormals: vec3<f32>,
  instanceColors: vec4<f32>,
  instancePositions: vec3<f32>,
  instancePositions64Low: vec3<f32>,
  instancePickingColors: vec3<f32>
};

const constants = ConstantAttributes(
  vec3<f32>(1.0, 0.0, 0.0),
  vec4<f32>(0.0, 0.0, 0.0, 1.0),
  vec3<f32>(0.0),
  vec3<f32>(0.0),
  vec3<f32>(0.0)
);

struct Attributes {
  @builtin(instance_index) instanceIndex : u32,
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions: vec3<f32>,
  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceNormals: vec3<f32>,
  @location(4) instanceColors: vec4<f32>,
  @location(5) instancePickingColors: vec3<f32>
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) unitPosition: vec2<f32>,
  @location(2) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  geometry.worldPosition = attributes.instancePositions;

  let centerResult = project_position_to_clipspace_and_commonspace(
    attributes.instancePositions,
    attributes.instancePositions64Low,
    vec3<f32>(0.0)
  );
  geometry.position = centerResult.commonPosition;
  geometry.normal = project_normal(attributes.instanceNormals);

  // position on the containing square in [-1, 1] space
  varyings.unitPosition = attributes.positions.xy;
  geometry.uv = varyings.unitPosition;
  geometry.pickingColor = attributes.instancePickingColors;

  // Find the center of the point and add the current vertex
  let offset = vec3<f32>(
    attributes.positions.xy *
      project_unit_size_to_pixel(pointCloudUniforms.radiusPixels, pointCloudUniforms.sizeUnits),
    0.0
  );
  // DECKGL_FILTER_SIZE(offset, geometry);

  varyings.position = centerResult.clipPosition;
  // DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  let clipPixels = project_pixel_size_to_clipspace(offset.xy);
  varyings.position.x += clipPixels.x;
  varyings.position.y += clipPixels.y;

  // Apply lighting
  let lightColor = lighting_getLightColor2(attributes.instanceColors.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);

  // Apply opacity to instance color, or return instance picking color
  varyings.vColor = vec4(lightColor, attributes.instanceColors.a * layer.opacity);
  // DECKGL_FILTER_COLOR(vColor, geometry);
  varyings.pickingColor = attributes.instancePickingColors;

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  // var geometry: Geometry;
  // geometry.uv = unitPosition.xy;

  let distToCenter = length(varyings.unitPosition);
  if (distToCenter > 1.0) {
    discard;
  }

  var fragColor: vec4<f32>;

  fragColor = varyings.vColor;

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(varyings.pickingColor)) {
      discard;
    }
    return vec4<f32>(varyings.pickingColor, 1.0);
  }

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(varyings.pickingColor - highlightedObjectColor))) {
      let highLightAlpha = picking.highlightColor.a;
      let blendedAlpha = highLightAlpha + fragColor.a * (1.0 - highLightAlpha);
      if (blendedAlpha > 0.0) {
        let highLightRatio = highLightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highLightRatio),
          blendedAlpha
        );
      } else {
        fragColor = vec4<f32>(fragColor.rgb, 0.0);
      }
    }
  }

  // Apply premultiplied alpha as required by transparent canvas
  fragColor = deckgl_premultiplied_alpha(fragColor);

  return fragColor;
}
`,Wt=[0,0,0,255],jt=[0,0,1],co={sizeUnits:"pixels",pointSize:{type:"number",min:0,value:10},getPosition:{type:"accessor",value:o=>o.position},getNormal:{type:"accessor",value:jt},getColor:{type:"accessor",value:Wt},material:!0,radiusPixels:{deprecatedFor:"pointSize"}};function uo(o){const{header:e,attributes:t}=o;if(!(!e||!t)&&(o.length=e.vertexCount,t.POSITION&&(t.instancePositions=t.POSITION),t.NORMAL&&(t.instanceNormals=t.NORMAL),t.COLOR_0)){const{size:i,value:n}=t.COLOR_0;t.instanceColors={size:i,type:"unorm8",value:n}}}class Vt extends q{getShaders(){return super.getShaders({vs:ro,fs:ao,source:lo,modules:[Q,Ae,Ge,ee,so]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceNormals:{size:3,transition:!0,accessor:"getNormal",defaultValue:jt},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:Wt}})}updateState(e){const{changeFlags:t,props:i}=e;super.updateState(e),t.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll()),t.dataChanged&&uo(i.data)}draw({uniforms:e}){const{pointSize:t,sizeUnits:i}=this.props,n=this.state.model,s={sizeUnits:J[i],radiusPixels:t};n.shaderInputs.setProps({pointCloud:s}),n.draw(this.context.renderPass)}_getModel(){const e=[];for(let t=0;t<3;t++){const i=t/3*Math.PI*2;e.push(Math.cos(i)*2,Math.sin(i)*2,0)}return new K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new Y({topology:"triangle-list",attributes:{positions:new Float32Array(e)}}),isInstanced:!0})}}Vt.layerName="PointCloudLayer";Vt.defaultProps=co;const ct=`layout(std140) uniform scatterplotUniforms {
  float radiusScale;
  float radiusMinPixels;
  float radiusMaxPixels;
  float lineWidthScale;
  float lineWidthMinPixels;
  float lineWidthMaxPixels;
  float stroked;
  float filled;
  bool antialiasing;
  bool billboard;
  highp int radiusUnits;
  highp int lineWidthUnits;
} scatterplot;
`,fo={name:"scatterplot",vs:ct,fs:ct,source:"",uniformTypes:{radiusScale:"f32",radiusMinPixels:"f32",radiusMaxPixels:"f32",lineWidthScale:"f32",lineWidthMinPixels:"f32",lineWidthMaxPixels:"f32",stroked:"f32",filled:"f32",antialiasing:"f32",billboard:"f32",radiusUnits:"i32",lineWidthUnits:"i32"}},go=`#version 300 es
#define SHADER_NAME scatterplot-layer-vertex-shader
in vec3 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceRadius;
in float instanceLineWidths;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
in vec3 instancePickingColors;
out vec4 vFillColor;
out vec4 vLineColor;
out vec2 unitPosition;
out float innerUnitRadius;
out float outerRadiusPixels;
void main(void) {
geometry.worldPosition = instancePositions;
outerRadiusPixels = clamp(
project_size_to_pixel(scatterplot.radiusScale * instanceRadius, scatterplot.radiusUnits),
scatterplot.radiusMinPixels, scatterplot.radiusMaxPixels
);
float lineWidthPixels = clamp(
project_size_to_pixel(scatterplot.lineWidthScale * instanceLineWidths, scatterplot.lineWidthUnits),
scatterplot.lineWidthMinPixels, scatterplot.lineWidthMaxPixels
);
outerRadiusPixels += scatterplot.stroked * lineWidthPixels / 2.0;
float edgePadding = scatterplot.antialiasing ? (outerRadiusPixels + SMOOTH_EDGE_RADIUS) / outerRadiusPixels : 1.0;
unitPosition = edgePadding * positions.xy;
geometry.uv = unitPosition;
geometry.pickingColor = instancePickingColors;
innerUnitRadius = 1.0 - scatterplot.stroked * lineWidthPixels / outerRadiusPixels;
if (scatterplot.billboard) {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = edgePadding * positions * outerRadiusPixels;
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset = edgePadding * positions * project_pixel_size(outerRadiusPixels);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vFillColor, geometry);
vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vLineColor, geometry);
}
`,po=`#version 300 es
#define SHADER_NAME scatterplot-layer-fragment-shader
precision highp float;
in vec4 vFillColor;
in vec4 vLineColor;
in vec2 unitPosition;
in float innerUnitRadius;
in float outerRadiusPixels;
out vec4 fragColor;
void main(void) {
geometry.uv = unitPosition;
float distToCenter = length(unitPosition) * outerRadiusPixels;
float inCircle = scatterplot.antialiasing ?
smoothedge(distToCenter, outerRadiusPixels) :
step(distToCenter, outerRadiusPixels);
if (inCircle == 0.0) {
discard;
}
if (scatterplot.stroked > 0.5) {
float isLine = scatterplot.antialiasing ?
smoothedge(innerUnitRadius * outerRadiusPixels, distToCenter) :
step(innerUnitRadius * outerRadiusPixels, distToCenter);
if (scatterplot.filled > 0.5) {
fragColor = mix(vFillColor, vLineColor, isLine);
} else {
if (isLine == 0.0) {
discard;
}
fragColor = vec4(vLineColor.rgb, vLineColor.a * isLine);
}
} else if (scatterplot.filled < 0.5) {
discard;
} else {
fragColor = vFillColor;
}
fragColor.a *= inCircle;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,ho=`// Main shaders

struct ScatterplotUniforms {
  radiusScale: f32,
  radiusMinPixels: f32,
  radiusMaxPixels: f32,
  lineWidthScale: f32,
  lineWidthMinPixels: f32,
  lineWidthMaxPixels: f32,
  stroked: f32,
  filled: i32,
  antialiasing: i32,
  billboard: i32,
  radiusUnits: i32,
  lineWidthUnits: i32,
};

struct ConstantAttributeUniforms {
 instancePositions: vec3<f32>,
 instancePositions64Low: vec3<f32>,
 instanceRadius: f32,
 instanceLineWidths: f32,
 instanceFillColors: vec4<f32>,
 instanceLineColors: vec4<f32>,
 instancePickingColors: vec3<f32>,

 instancePositionsConstant: i32,
 instancePositions64LowConstant: i32,
 instanceRadiusConstant: i32,
 instanceLineWidthsConstant: i32,
 instanceFillColorsConstant: i32,
 instanceLineColorsConstant: i32,
 instancePickingColorsConstant: i32
};

@group(0) @binding(0) var<uniform> scatterplot: ScatterplotUniforms;

struct ConstantAttributes {
  instancePositions: vec3<f32>,
  instancePositions64Low: vec3<f32>,
  instanceRadius: f32,
  instanceLineWidths: f32,
  instanceFillColors: vec4<f32>,
  instanceLineColors: vec4<f32>,
  instancePickingColors: vec3<f32>
};

const constants = ConstantAttributes(
  vec3<f32>(0.0),
  vec3<f32>(0.0),
  0.0,
  0.0,
  vec4<f32>(0.0, 0.0, 0.0, 1.0),
  vec4<f32>(0.0, 0.0, 0.0, 1.0),
  vec3<f32>(0.0)
);

struct Attributes {
  @builtin(instance_index) instanceIndex : u32,
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions: vec3<f32>,
  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceRadius: f32,
  @location(4) instanceLineWidths: f32,
  @location(5) instanceFillColors: vec4<f32>,
  @location(6) instanceLineColors: vec4<f32>,
  @location(7) instancePickingColors: vec3<f32>,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vFillColor: vec4<f32>,
  @location(1) vLineColor: vec4<f32>,
  @location(2) unitPosition: vec2<f32>,
  @location(3) innerUnitRadius: f32,
  @location(4) outerRadiusPixels: f32,
  @location(5) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  // Draw an inline geometry constant array clip space triangle to verify that rendering works.
  // var positions = array<vec2<f32>, 3>(vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5));
  // if (attributes.instanceIndex == 0) {
  //   varyings.position = vec4<f32>(positions[attributes.vertexIndex], 0.0, 1.0);
  //   return varyings;
  // }

  geometry.worldPosition = attributes.instancePositions;

  // Multiply out radius and clamp to limits
  varyings.outerRadiusPixels = clamp(
    project_unit_size_to_pixel(scatterplot.radiusScale * attributes.instanceRadius, scatterplot.radiusUnits),
    scatterplot.radiusMinPixels, scatterplot.radiusMaxPixels
  );

  // Multiply out line width and clamp to limits
  let lineWidthPixels = clamp(
    project_unit_size_to_pixel(scatterplot.lineWidthScale * attributes.instanceLineWidths, scatterplot.lineWidthUnits),
    scatterplot.lineWidthMinPixels, scatterplot.lineWidthMaxPixels
  );

  // outer radius needs to offset by half stroke width
  varyings.outerRadiusPixels += scatterplot.stroked * lineWidthPixels / 2.0;
  // Expand geometry to accommodate edge smoothing
  let edgePadding = select(
    (varyings.outerRadiusPixels + SMOOTH_EDGE_RADIUS) / varyings.outerRadiusPixels,
    1.0,
    scatterplot.antialiasing != 0
  );

  // position on the containing square in [-1, 1] space
  varyings.unitPosition = edgePadding * attributes.positions.xy;
  geometry.uv = varyings.unitPosition;
  geometry.pickingColor = attributes.instancePickingColors;

  varyings.innerUnitRadius = 1.0 - scatterplot.stroked * lineWidthPixels / varyings.outerRadiusPixels;

  if (scatterplot.billboard != 0) {
    varyings.position = project_position_to_clipspace(attributes.instancePositions, attributes.instancePositions64Low, vec3<f32>(0.0)); // TODO , geometry.position);
    // DECKGL_FILTER_GL_POSITION(varyings.position, geometry);
    let offset = attributes.positions; // * edgePadding * varyings.outerRadiusPixels;
    // DECKGL_FILTER_SIZE(offset, geometry);
    let clipPixels = project_pixel_size_to_clipspace(offset.xy);
    varyings.position.x = clipPixels.x;
    varyings.position.y = clipPixels.y;
  } else {
    let offset = edgePadding * attributes.positions * project_pixel_size_float(varyings.outerRadiusPixels);
    // DECKGL_FILTER_SIZE(offset, geometry);
    varyings.position = project_position_to_clipspace(attributes.instancePositions, attributes.instancePositions64Low, offset); // TODO , geometry.position);
    // DECKGL_FILTER_GL_POSITION(varyings.position, geometry);
  }

  // Apply opacity to instance color, or return instance picking color
  varyings.vFillColor = vec4<f32>(attributes.instanceFillColors.rgb, attributes.instanceFillColors.a * layer.opacity);
  // DECKGL_FILTER_COLOR(varyings.vFillColor, geometry);
  varyings.vLineColor = vec4<f32>(attributes.instanceLineColors.rgb, attributes.instanceLineColors.a * layer.opacity);
  // DECKGL_FILTER_COLOR(varyings.vLineColor, geometry);
  varyings.pickingColor = attributes.instancePickingColors;

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  // var geometry: Geometry;
  // geometry.uv = unitPosition;

  let distToCenter = length(varyings.unitPosition) * varyings.outerRadiusPixels;
  let inCircle = select(
    smoothedge(distToCenter, varyings.outerRadiusPixels),
    step(distToCenter, varyings.outerRadiusPixels),
    scatterplot.antialiasing != 0
  );

  if (inCircle == 0.0) {
    discard;
  }

  var fragColor: vec4<f32>;

  if (scatterplot.stroked != 0) {
    let isLine = select(
      smoothedge(varyings.innerUnitRadius * varyings.outerRadiusPixels, distToCenter),
      step(varyings.innerUnitRadius * varyings.outerRadiusPixels, distToCenter),
      scatterplot.antialiasing != 0
    );

    if (scatterplot.filled != 0) {
      fragColor = mix(varyings.vFillColor, varyings.vLineColor, isLine);
    } else {
      if (isLine == 0.0) {
        discard;
      }
      fragColor = vec4<f32>(varyings.vLineColor.rgb, varyings.vLineColor.a * isLine);
    }
  } else if (scatterplot.filled == 0) {
    discard;
  } else {
    fragColor = varyings.vFillColor;
  }

  fragColor.a *= inCircle;

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(varyings.pickingColor)) {
      discard;
    }
    return vec4<f32>(varyings.pickingColor, 1.0);
  }

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(varyings.pickingColor - highlightedObjectColor))) {
      let highLightAlpha = picking.highlightColor.a;
      let blendedAlpha = highLightAlpha + fragColor.a * (1.0 - highLightAlpha);
      if (blendedAlpha > 0.0) {
        let highLightRatio = highLightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highLightRatio),
          blendedAlpha
        );
      } else {
        fragColor = vec4<f32>(fragColor.rgb, 0.0);
      }
    }
  }

  // Apply premultiplied alpha as required by transparent canvas
  fragColor = deckgl_premultiplied_alpha(fragColor);

  return fragColor;
  // return vec4<f32>(0, 0, 1, 1);
}
`,ut=[0,0,0,255],vo={radiusUnits:"meters",radiusScale:{type:"number",min:0,value:1},radiusMinPixels:{type:"number",min:0,value:0},radiusMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},lineWidthUnits:"meters",lineWidthScale:{type:"number",min:0,value:1},lineWidthMinPixels:{type:"number",min:0,value:0},lineWidthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},stroked:!1,filled:!0,billboard:!1,antialiasing:!0,getPosition:{type:"accessor",value:o=>o.position},getRadius:{type:"accessor",value:1},getFillColor:{type:"accessor",value:ut},getLineColor:{type:"accessor",value:ut},getLineWidth:{type:"accessor",value:1},strokeWidth:{deprecatedFor:"getLineWidth"},outline:{deprecatedFor:"stroked"},getColor:{deprecatedFor:["getFillColor","getLineColor"]}};class je extends q{getShaders(){return super.getShaders({vs:go,fs:po,source:ho,modules:[Q,Ae,ee,fo]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceRadius:{size:1,transition:!0,accessor:"getRadius",defaultValue:1},instanceFillColors:{size:this.props.colorFormat.length,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255]},instanceLineColors:{size:this.props.colorFormat.length,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1}})}updateState(e){super.updateState(e),e.changeFlags.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){const{radiusUnits:t,radiusScale:i,radiusMinPixels:n,radiusMaxPixels:s,stroked:r,filled:a,billboard:l,antialiasing:c,lineWidthUnits:d,lineWidthScale:p,lineWidthMinPixels:h,lineWidthMaxPixels:v}=this.props,_={stroked:r,filled:a,billboard:l,antialiasing:c,radiusUnits:J[t],radiusScale:i,radiusMinPixels:n,radiusMaxPixels:s,lineWidthUnits:J[d],lineWidthScale:p,lineWidthMinPixels:h,lineWidthMaxPixels:v},C=this.state.model;C.shaderInputs.setProps({scatterplot:_}),C.draw(this.context.renderPass)}_getModel(){const e=[-1,-1,0,1,-1,0,-1,1,0,1,1,0];return new K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new Y({topology:"triangle-strip",attributes:{positions:{size:3,value:new Float32Array(e)}}}),isInstanced:!0})}}je.defaultProps=vo;je.layerName="ScatterplotLayer";const Ve={CLOCKWISE:1,COUNTER_CLOCKWISE:-1};function $e(o,e,t={}){return xo(o,t)!==e?(mo(o,t),!0):!1}function xo(o,e={}){return Math.sign(yo(o,e))}const dt={x:0,y:1,z:2};function yo(o,e={}){const{start:t=0,end:i=o.length,plane:n="xy"}=e,s=e.size||2;let r=0;const a=dt[n[0]],l=dt[n[1]];for(let c=t,d=i-s;c<i;c+=s)r+=(o[c+a]-o[d+a])*(o[c+l]+o[d+l]),d=c;return r/2}function mo(o,e){const{start:t=0,end:i=o.length,size:n=2}=e,s=(i-t)/n,r=Math.floor(s/2);for(let a=0;a<r;++a){const l=t+a*n,c=t+(s-1-a)*n;for(let d=0;d<n;++d){const p=o[l+d];o[l+d]=o[c+d],o[c+d]=p}}}function X(o,e){const t=e.length,i=o.length;if(i>0){let n=!0;for(let s=0;s<t;s++)if(o[i-t+s]!==e[s]){n=!1;break}if(n)return!1}for(let n=0;n<t;n++)o[i+n]=e[n];return!0}function Be(o,e){const t=e.length;for(let i=0;i<t;i++)o[i]=e[i]}function fe(o,e,t,i,n=[]){const s=i+e*t;for(let r=0;r<t;r++)n[r]=o[s+r];return n}function Ne(o,e,t,i,n=[]){let s,r;if(t&8)s=(i[3]-o[1])/(e[1]-o[1]),r=3;else if(t&4)s=(i[1]-o[1])/(e[1]-o[1]),r=1;else if(t&2)s=(i[2]-o[0])/(e[0]-o[0]),r=2;else if(t&1)s=(i[0]-o[0])/(e[0]-o[0]),r=0;else return null;for(let a=0;a<o.length;a++)n[a]=(r&1)===a?i[r]:s*(e[a]-o[a])+o[a];return n}function ye(o,e){let t=0;return o[0]<e[0]?t|=1:o[0]>e[2]&&(t|=2),o[1]<e[1]?t|=4:o[1]>e[3]&&(t|=8),t}function $t(o,e){const{size:t=2,broken:i=!1,gridResolution:n=10,gridOffset:s=[0,0],startIndex:r=0,endIndex:a=o.length}=e||{},l=(a-r)/t;let c=[];const d=[c],p=fe(o,0,t,r);let h,v;const _=Kt(p,n,s,[]),C=[];X(c,p);for(let L=1;L<l;L++){for(h=fe(o,L,t,r,h),v=ye(h,_);v;){Ne(p,h,v,_,C);const w=ye(C,_);w&&(Ne(p,C,w,_,C),v=w),X(c,C),Be(p,C),_o(_,n,v),i&&c.length>t&&(c=[],d.push(c),X(c,p)),v=ye(h,_)}X(c,h),Be(p,h)}return i?d:d[0]}const ft=0,Po=1;function Ht(o,e=null,t){if(!o.length)return[];const{size:i=2,gridResolution:n=10,gridOffset:s=[0,0],edgeTypes:r=!1}=t||{},a=[],l=[{pos:o,types:r?new Array(o.length/i).fill(Po):null,holes:e||[]}],c=[[],[]];let d=[];for(;l.length;){const{pos:p,types:h,holes:v}=l.shift();Co(p,i,v[0]||p.length,c),d=Kt(c[0],n,s,d);const _=ye(c[1],d);if(_){let C=gt(p,h,i,0,v[0]||p.length,d,_);const L={pos:C[0].pos,types:C[0].types,holes:[]},w={pos:C[1].pos,types:C[1].types,holes:[]};l.push(L,w);for(let T=0;T<v.length;T++)C=gt(p,h,i,v[T],v[T+1]||p.length,d,_),C[0]&&(L.holes.push(L.pos.length),L.pos=ge(L.pos,C[0].pos),r&&(L.types=ge(L.types,C[0].types))),C[1]&&(w.holes.push(w.pos.length),w.pos=ge(w.pos,C[1].pos),r&&(w.types=ge(w.types,C[1].types)))}else{const C={positions:p};r&&(C.edgeTypes=h),v.length&&(C.holeIndices=v),a.push(C)}}return a}function gt(o,e,t,i,n,s,r){const a=(n-i)/t,l=[],c=[],d=[],p=[],h=[];let v,_,C;const L=fe(o,a-1,t,i);let w=Math.sign(r&8?L[1]-s[3]:L[0]-s[2]),T=e&&e[a-1],I=0,M=0;for(let E=0;E<a;E++)v=fe(o,E,t,i,v),_=Math.sign(r&8?v[1]-s[3]:v[0]-s[2]),C=e&&e[i/t+E],_&&w&&w!==_&&(Ne(L,v,r,s,h),X(l,h)&&d.push(T),X(c,h)&&p.push(T)),_<=0?(X(l,v)&&d.push(C),I-=_):d.length&&(d[d.length-1]=ft),_>=0?(X(c,v)&&p.push(C),M+=_):p.length&&(p[p.length-1]=ft),Be(L,v),w=_,T=C;return[I?{pos:l,types:e&&d}:null,M?{pos:c,types:e&&p}:null]}function Kt(o,e,t,i){const n=Math.floor((o[0]-t[0])/e)*e+t[0],s=Math.floor((o[1]-t[1])/e)*e+t[1];return i[0]=n,i[1]=s,i[2]=n+e,i[3]=s+e,i}function _o(o,e,t){t&8?(o[1]+=e,o[3]+=e):t&4?(o[1]-=e,o[3]-=e):t&2?(o[0]+=e,o[2]+=e):t&1&&(o[0]-=e,o[2]-=e)}function Co(o,e,t,i){let n=1/0,s=-1/0,r=1/0,a=-1/0;for(let l=0;l<t;l+=e){const c=o[l],d=o[l+1];n=c<n?c:n,s=c>s?c:s,r=d<r?d:r,a=d>a?d:a}return i[0][0]=n,i[0][1]=r,i[1][0]=s,i[1][1]=a,i}function ge(o,e){for(let t=0;t<e.length;t++)o.push(e[t]);return o}const Lo=85.051129;function So(o,e){const{size:t=2,startIndex:i=0,endIndex:n=o.length,normalize:s=!0}=e||{},r=o.slice(i,n);Zt(r,t,0,n-i);const a=$t(r,{size:t,broken:!0,gridResolution:360,gridOffset:[-180,-180]});if(s)for(const l of a)Xt(l,t);return a}function wo(o,e=null,t){const{size:i=2,normalize:n=!0,edgeTypes:s=!1}=t||{};e=e||[];const r=[],a=[];let l=0,c=0;for(let p=0;p<=e.length;p++){const h=e[p]||o.length,v=c,_=bo(o,i,l,h);for(let C=_;C<h;C++)r[c++]=o[C];for(let C=l;C<_;C++)r[c++]=o[C];Zt(r,i,v,c),Ao(r,i,v,c,t?.maxLatitude),l=h,a[p]=c}a.pop();const d=Ht(r,a,{size:i,gridResolution:360,gridOffset:[-180,-180],edgeTypes:s});if(n)for(const p of d)Xt(p.positions,i);return d}function bo(o,e,t,i){let n=-1,s=-1;for(let r=t+1;r<i;r+=e){const a=Math.abs(o[r]);a>n&&(n=a,s=r-1)}return s}function Ao(o,e,t,i,n=Lo){const s=o[t],r=o[i-e];if(Math.abs(s-r)>180){const a=fe(o,0,e,t);a[0]+=Math.round((r-s)/360)*360,X(o,a),a[1]=Math.sign(a[1])*n,X(o,a),a[0]=s,X(o,a)}}function Zt(o,e,t,i){let n=o[0],s;for(let r=t;r<i;r+=e){s=o[r];const a=s-n;(a>180||a<-180)&&(s-=Math.round(a/360)*360),o[r]=n=s}}function Xt(o,e){let t;const i=o.length/e;for(let s=0;s<i&&(t=o[s*e],(t+180)%360===0);s++);const n=-Math.round(t/360)*360;if(n!==0)for(let s=0;s<i;s++)o[s*e]+=n}class Io extends Y{constructor(e){const{indices:t,attributes:i}=Mo(e);super({...e,indices:t,attributes:i})}}function Mo(o){const{radius:e,height:t=1,nradial:i=10}=o;let{vertices:n}=o;n&&(Z.assert(n.length>=i),n=n.flatMap(v=>[v[0],v[1]]),$e(n,Ve.COUNTER_CLOCKWISE));const s=t>0,r=i+1,a=s?r*3+1:i,l=Math.PI*2/i,c=new Uint16Array(s?i*3*2:0),d=new Float32Array(a*3),p=new Float32Array(a*3);let h=0;if(s){for(let v=0;v<r;v++){const _=v*l,C=v%i,L=Math.sin(_),w=Math.cos(_);for(let T=0;T<2;T++)d[h+0]=n?n[C*2]:w*e,d[h+1]=n?n[C*2+1]:L*e,d[h+2]=(1/2-T)*t,p[h+0]=n?n[C*2]:w,p[h+1]=n?n[C*2+1]:L,h+=3}d[h+0]=d[h-3],d[h+1]=d[h-2],d[h+2]=d[h-1],h+=3}for(let v=s?0:1;v<r;v++){const _=Math.floor(v/2)*Math.sign(.5-v%2),C=_*l,L=(_+i)%i,w=Math.sin(C),T=Math.cos(C);d[h+0]=n?n[L*2]:T*e,d[h+1]=n?n[L*2+1]:w*e,d[h+2]=t/2,p[h+2]=1,h+=3}if(s){let v=0;for(let _=0;_<i;_++)c[v++]=_*2+0,c[v++]=_*2+2,c[v++]=_*2+0,c[v++]=_*2+1,c[v++]=_*2+1,c[v++]=_*2+3}return{indices:c,attributes:{POSITION:{size:3,value:d},NORMAL:{size:3,value:p}}}}const pt=`layout(std140) uniform columnUniforms {
  float radius;
  float angle;
  vec2 offset;
  bool extruded;
  bool stroked;
  bool isStroke;
  float coverage;
  float elevationScale;
  float edgeDistance;
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  highp int radiusUnits;
  highp int widthUnits;
} column;
`,To={name:"column",vs:pt,fs:pt,uniformTypes:{radius:"f32",angle:"f32",offset:"vec2<f32>",extruded:"f32",stroked:"f32",isStroke:"f32",coverage:"f32",elevationScale:"f32",edgeDistance:"f32",widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",radiusUnits:"i32",widthUnits:"i32"}},Eo=`#version 300 es
#define SHADER_NAME column-layer-vertex-shader
in vec3 positions;
in vec3 normals;
in vec3 instancePositions;
in float instanceElevations;
in vec3 instancePositions64Low;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
in float instanceStrokeWidths;
in vec3 instancePickingColors;
out vec4 vColor;
#ifdef FLAT_SHADING
out vec3 cameraPosition;
out vec4 position_commonspace;
#endif
void main(void) {
geometry.worldPosition = instancePositions;
vec4 color = column.isStroke ? instanceLineColors : instanceFillColors;
mat2 rotationMatrix = mat2(cos(column.angle), sin(column.angle), -sin(column.angle), cos(column.angle));
float elevation = 0.0;
float strokeOffsetRatio = 1.0;
if (column.extruded) {
elevation = instanceElevations * (positions.z + 1.0) / 2.0 * column.elevationScale;
} else if (column.stroked) {
float widthPixels = clamp(
project_size_to_pixel(instanceStrokeWidths * column.widthScale, column.widthUnits),
column.widthMinPixels, column.widthMaxPixels) / 2.0;
float halfOffset = project_pixel_size(widthPixels) / project_size(column.edgeDistance * column.coverage * column.radius);
if (column.isStroke) {
strokeOffsetRatio -= sign(positions.z) * halfOffset;
} else {
strokeOffsetRatio -= halfOffset;
}
}
float shouldRender = float(color.a > 0.0 && instanceElevations >= 0.0);
float dotRadius = column.radius * column.coverage * shouldRender;
geometry.pickingColor = instancePickingColors;
vec3 centroidPosition = vec3(instancePositions.xy, instancePositions.z + elevation);
vec3 centroidPosition64Low = instancePositions64Low;
vec2 offset = (rotationMatrix * positions.xy * strokeOffsetRatio + column.offset) * dotRadius;
if (column.radiusUnits == UNIT_METERS) {
offset = project_size(offset);
} else if (column.radiusUnits == UNIT_PIXELS) {
offset = project_pixel_size(offset);
}
vec3 pos = vec3(offset, 0.);
DECKGL_FILTER_SIZE(pos, geometry);
gl_Position = project_position_to_clipspace(centroidPosition, centroidPosition64Low, pos, geometry.position);
geometry.normal = project_normal(vec3(rotationMatrix * normals.xy, normals.z));
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
if (column.extruded && !column.isStroke) {
#ifdef FLAT_SHADING
cameraPosition = project.cameraPosition;
position_commonspace = geometry.position;
vColor = vec4(color.rgb, color.a * layer.opacity);
#else
vec3 lightColor = lighting_getLightColor(color.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, color.a * layer.opacity);
#endif
} else {
vColor = vec4(color.rgb, color.a * layer.opacity);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,Oo=`#version 300 es
#define SHADER_NAME column-layer-fragment-shader
precision highp float;
out vec4 fragColor;
in vec4 vColor;
#ifdef FLAT_SHADING
in vec3 cameraPosition;
in vec4 position_commonspace;
#endif
void main(void) {
fragColor = vColor;
geometry.uv = vec2(0.);
#ifdef FLAT_SHADING
if (column.extruded && !column.isStroke && !bool(picking.isActive)) {
vec3 normal = normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)));
fragColor.rgb = lighting_getLightColor(vColor.rgb, cameraPosition, position_commonspace.xyz, normal);
}
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,Le=[0,0,0,255],zo={diskResolution:{type:"number",min:4,value:20},vertices:null,radius:{type:"number",min:0,value:1e3},angle:{type:"number",value:0},offset:{type:"array",value:[0,0]},coverage:{type:"number",min:0,max:1,value:1},elevationScale:{type:"number",min:0,value:1},radiusUnits:"meters",lineWidthUnits:"meters",lineWidthScale:1,lineWidthMinPixels:0,lineWidthMaxPixels:Number.MAX_SAFE_INTEGER,extruded:!0,wireframe:!1,filled:!0,stroked:!1,flatShading:!1,getPosition:{type:"accessor",value:o=>o.position},getFillColor:{type:"accessor",value:Le},getLineColor:{type:"accessor",value:Le},getLineWidth:{type:"accessor",value:1},getElevation:{type:"accessor",value:1e3},material:!0,getColor:{deprecatedFor:["getFillColor","getLineColor"]}};class He extends q{getShaders(){const e={},{flatShading:t}=this.props;return t&&(e.FLAT_SHADING=1),super.getShaders({vs:Eo,fs:Oo,defines:e,modules:[Q,t?fi:Ge,ee,To]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceElevations:{size:1,transition:!0,accessor:"getElevation"},instanceFillColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getFillColor",defaultValue:Le},instanceLineColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getLineColor",defaultValue:Le},instanceStrokeWidths:{size:1,accessor:"getLineWidth",transition:!0}})}updateState(e){super.updateState(e);const{props:t,oldProps:i,changeFlags:n}=e,s=n.extensionsChanged||t.flatShading!==i.flatShading;s&&(this.state.models?.forEach(a=>a.destroy()),this.setState(this._getModels()),this.getAttributeManager().invalidateAll());const r=this.getNumInstances();this.state.fillModel.setInstanceCount(r),this.state.wireframeModel.setInstanceCount(r),(s||t.diskResolution!==i.diskResolution||t.vertices!==i.vertices||(t.extruded||t.stroked)!==(i.extruded||i.stroked))&&this._updateGeometry(t)}getGeometry(e,t,i){const n=new Io({radius:1,height:i?2:0,vertices:t,nradial:e});let s=0;if(t)for(let r=0;r<e;r++){const a=t[r],l=Math.sqrt(a[0]*a[0]+a[1]*a[1]);s+=l/e}else s=1;return this.setState({edgeDistance:Math.cos(Math.PI/e)*s}),n}_getModels(){const e=this.getShaders(),t=this.getAttributeManager().getBufferLayouts(),i=new K(this.context.device,{...e,id:`${this.props.id}-fill`,bufferLayout:t,isInstanced:!0}),n=new K(this.context.device,{...e,id:`${this.props.id}-wireframe`,bufferLayout:t,isInstanced:!0});return{fillModel:i,wireframeModel:n,models:[n,i]}}_updateGeometry({diskResolution:e,vertices:t,extruded:i,stroked:n}){const s=this.getGeometry(e,t,i||n);this.setState({fillVertexCount:s.attributes.POSITION.value.length/3});const r=this.state.fillModel,a=this.state.wireframeModel;r.setGeometry(s),r.setTopology("triangle-strip"),r.setIndexBuffer(null),a.setGeometry(s),a.setTopology("line-list")}draw({uniforms:e}){const{lineWidthUnits:t,lineWidthScale:i,lineWidthMinPixels:n,lineWidthMaxPixels:s,radiusUnits:r,elevationScale:a,extruded:l,filled:c,stroked:d,wireframe:p,offset:h,coverage:v,radius:_,angle:C}=this.props,L=this.state.fillModel,w=this.state.wireframeModel,{fillVertexCount:T,edgeDistance:I}=this.state,M={radius:_,angle:C/180*Math.PI,offset:h,extruded:l,stroked:d,coverage:v,elevationScale:a,edgeDistance:I,radiusUnits:J[r],widthUnits:J[t],widthScale:i,widthMinPixels:n,widthMaxPixels:s};l&&p&&(w.shaderInputs.setProps({column:{...M,isStroke:!0}}),w.draw(this.context.renderPass)),c&&(L.setVertexCount(T),L.shaderInputs.setProps({column:{...M,isStroke:!1}}),L.draw(this.context.renderPass)),!l&&d&&(L.setVertexCount(T*2/3),L.shaderInputs.setProps({column:{...M,isStroke:!0}}),L.draw(this.context.renderPass))}}He.layerName="ColumnLayer";He.defaultProps=zo;const Ro={cellSize:{type:"number",min:0,value:1e3},offset:{type:"array",value:[1,1]}};class Jt extends He{_updateGeometry(){const e=new pi;this.state.fillModel.setGeometry(e)}draw({uniforms:e}){const{elevationScale:t,extruded:i,offset:n,coverage:s,cellSize:r,angle:a,radiusUnits:l}=this.props,c=this.state.fillModel,d={radius:r/2,radiusUnits:J[l],angle:a,offset:n,extruded:i,stroked:!1,coverage:s,elevationScale:t,edgeDistance:1,isStroke:!1,widthUnits:0,widthScale:0,widthMinPixels:0,widthMaxPixels:0};c.shaderInputs.setProps({column:d}),c.draw(this.context.renderPass)}}Jt.layerName="GridCellLayer";Jt.defaultProps=Ro;function Fo(o,e,t,i){let n;if(Array.isArray(o[0])){const s=o.length*e;n=new Array(s);for(let r=0;r<o.length;r++)for(let a=0;a<e;a++)n[r*e+a]=o[r][a]||0}else n=o;return t?$t(n,{size:e,gridResolution:t}):i?So(n,{size:e}):n}const ko=1,Do=2,Oe=4;class Bo extends kt{constructor(e){super({...e,attributes:{positions:{size:3,padding:18,initialize:!0,type:e.fp64?Float64Array:Float32Array},segmentTypes:{size:1,type:Uint8ClampedArray}}})}get(e){return this.attributes[e]}getGeometryFromBuffer(e){return this.normalize?super.getGeometryFromBuffer(e):null}normalizeGeometry(e){return this.normalize?Fo(e,this.positionSize,this.opts.resolution,this.opts.wrapLongitude):e}getGeometrySize(e){if(ht(e)){let i=0;for(const n of e)i+=this.getGeometrySize(n);return i}const t=this.getPathLength(e);return t<2?0:this.isClosed(e)?t<3?0:t+2:t}updateGeometryAttributes(e,t){if(t.geometrySize!==0)if(e&&ht(e))for(const i of e){const n=this.getGeometrySize(i);t.geometrySize=n,this.updateGeometryAttributes(i,t),t.vertexStart+=n}else this._updateSegmentTypes(e,t),this._updatePositions(e,t)}_updateSegmentTypes(e,t){const i=this.attributes.segmentTypes,n=e?this.isClosed(e):!1,{vertexStart:s,geometrySize:r}=t;i.fill(0,s,s+r),n?(i[s]=Oe,i[s+r-2]=Oe):(i[s]+=ko,i[s+r-2]+=Do),i[s+r-1]=Oe}_updatePositions(e,t){const{positions:i}=this.attributes;if(!i||!e)return;const{vertexStart:n,geometrySize:s}=t,r=new Array(3);for(let a=n,l=0;l<s;a++,l++)this.getPointOnPath(e,l,r),i[a*3]=r[0],i[a*3+1]=r[1],i[a*3+2]=r[2]}getPathLength(e){return e.length/this.positionSize}getPointOnPath(e,t,i=[]){const{positionSize:n}=this;t*n>=e.length&&(t+=1-e.length/n);const s=t*n;return i[0]=e[s],i[1]=e[s+1],i[2]=n===3&&e[s+2]||0,i}isClosed(e){if(!this.normalize)return!!this.opts.loop;const{positionSize:t}=this,i=e.length-t;return e[0]===e[i]&&e[1]===e[i+1]&&(t===2||e[2]===e[i+2])}}function ht(o){return Array.isArray(o[0])}const vt=`layout(std140) uniform pathUniforms {
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  float jointType;
  float capType;
  float miterLimit;
  bool billboard;
  highp int widthUnits;
} path;
`,No={name:"path",vs:vt,fs:vt,uniformTypes:{widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",jointType:"f32",capType:"f32",miterLimit:"f32",billboard:"f32",widthUnits:"i32"}},Uo=`#version 300 es
#define SHADER_NAME path-layer-vertex-shader
in vec2 positions;
in float instanceTypes;
in vec3 instanceStartPositions;
in vec3 instanceEndPositions;
in vec3 instanceLeftPositions;
in vec3 instanceRightPositions;
in vec3 instanceLeftPositions64Low;
in vec3 instanceStartPositions64Low;
in vec3 instanceEndPositions64Low;
in vec3 instanceRightPositions64Low;
in float instanceStrokeWidths;
in vec4 instanceColors;
in vec3 instancePickingColors;
uniform float opacity;
out vec4 vColor;
out vec2 vCornerOffset;
out float vMiterLength;
out vec2 vPathPosition;
out float vPathLength;
out float vJointType;
const float EPSILON = 0.001;
const vec3 ZERO_OFFSET = vec3(0.0);
float flipIfTrue(bool flag) {
return -(float(flag) * 2. - 1.);
}
vec3 getLineJoinOffset(
vec3 prevPoint, vec3 currPoint, vec3 nextPoint,
vec2 width
) {
bool isEnd = positions.x > 0.0;
float sideOfPath = positions.y;
float isJoint = float(sideOfPath == 0.0);
vec3 deltaA3 = (currPoint - prevPoint);
vec3 deltaB3 = (nextPoint - currPoint);
mat3 rotationMatrix;
bool needsRotation = !path.billboard && project_needs_rotation(currPoint, rotationMatrix);
if (needsRotation) {
deltaA3 = deltaA3 * rotationMatrix;
deltaB3 = deltaB3 * rotationMatrix;
}
vec2 deltaA = deltaA3.xy / width;
vec2 deltaB = deltaB3.xy / width;
float lenA = length(deltaA);
float lenB = length(deltaB);
vec2 dirA = lenA > 0. ? normalize(deltaA) : vec2(0.0, 0.0);
vec2 dirB = lenB > 0. ? normalize(deltaB) : vec2(0.0, 0.0);
vec2 perpA = vec2(-dirA.y, dirA.x);
vec2 perpB = vec2(-dirB.y, dirB.x);
vec2 tangent = dirA + dirB;
tangent = length(tangent) > 0. ? normalize(tangent) : perpA;
vec2 miterVec = vec2(-tangent.y, tangent.x);
vec2 dir = isEnd ? dirA : dirB;
vec2 perp = isEnd ? perpA : perpB;
float L = isEnd ? lenA : lenB;
float sinHalfA = abs(dot(miterVec, perp));
float cosHalfA = abs(dot(dirA, miterVec));
float turnDirection = flipIfTrue(dirA.x * dirB.y >= dirA.y * dirB.x);
float cornerPosition = sideOfPath * turnDirection;
float miterSize = 1.0 / max(sinHalfA, EPSILON);
miterSize = mix(
min(miterSize, max(lenA, lenB) / max(cosHalfA, EPSILON)),
miterSize,
step(0.0, cornerPosition)
);
vec2 offsetVec = mix(miterVec * miterSize, perp, step(0.5, cornerPosition))
* (sideOfPath + isJoint * turnDirection);
bool isStartCap = lenA == 0.0 || (!isEnd && (instanceTypes == 1.0 || instanceTypes == 3.0));
bool isEndCap = lenB == 0.0 || (isEnd && (instanceTypes == 2.0 || instanceTypes == 3.0));
bool isCap = isStartCap || isEndCap;
if (isCap) {
offsetVec = mix(perp * sideOfPath, dir * path.capType * 4.0 * flipIfTrue(isStartCap), isJoint);
vJointType = path.capType;
} else {
vJointType = path.jointType;
}
vPathLength = L;
vCornerOffset = offsetVec;
vMiterLength = dot(vCornerOffset, miterVec * turnDirection);
vMiterLength = isCap ? isJoint : vMiterLength;
vec2 offsetFromStartOfPath = vCornerOffset + deltaA * float(isEnd);
vPathPosition = vec2(
dot(offsetFromStartOfPath, perp),
dot(offsetFromStartOfPath, dir)
);
geometry.uv = vPathPosition;
float isValid = step(instanceTypes, 3.5);
vec3 offset = vec3(offsetVec * width * isValid, 0.0);
if (needsRotation) {
offset = rotationMatrix * offset;
}
return offset;
}
void clipLine(inout vec4 position, vec4 refPosition) {
if (position.w < EPSILON) {
float r = (EPSILON - refPosition.w) / (position.w - refPosition.w);
position = refPosition + (position - refPosition) * r;
}
}
void main() {
geometry.pickingColor = instancePickingColors;
vColor = vec4(instanceColors.rgb, instanceColors.a * layer.opacity);
float isEnd = positions.x;
vec3 prevPosition = mix(instanceLeftPositions, instanceStartPositions, isEnd);
vec3 prevPosition64Low = mix(instanceLeftPositions64Low, instanceStartPositions64Low, isEnd);
vec3 currPosition = mix(instanceStartPositions, instanceEndPositions, isEnd);
vec3 currPosition64Low = mix(instanceStartPositions64Low, instanceEndPositions64Low, isEnd);
vec3 nextPosition = mix(instanceEndPositions, instanceRightPositions, isEnd);
vec3 nextPosition64Low = mix(instanceEndPositions64Low, instanceRightPositions64Low, isEnd);
geometry.worldPosition = currPosition;
vec2 widthPixels = vec2(clamp(
project_size_to_pixel(instanceStrokeWidths * path.widthScale, path.widthUnits),
path.widthMinPixels, path.widthMaxPixels) / 2.0);
vec3 width;
if (path.billboard) {
vec4 prevPositionScreen = project_position_to_clipspace(prevPosition, prevPosition64Low, ZERO_OFFSET);
vec4 currPositionScreen = project_position_to_clipspace(currPosition, currPosition64Low, ZERO_OFFSET, geometry.position);
vec4 nextPositionScreen = project_position_to_clipspace(nextPosition, nextPosition64Low, ZERO_OFFSET);
clipLine(prevPositionScreen, currPositionScreen);
clipLine(nextPositionScreen, currPositionScreen);
clipLine(currPositionScreen, mix(nextPositionScreen, prevPositionScreen, isEnd));
width = vec3(widthPixels, 0.0);
DECKGL_FILTER_SIZE(width, geometry);
vec3 offset = getLineJoinOffset(
prevPositionScreen.xyz / prevPositionScreen.w,
currPositionScreen.xyz / currPositionScreen.w,
nextPositionScreen.xyz / nextPositionScreen.w,
project_pixel_size_to_clipspace(width.xy)
);
DECKGL_FILTER_GL_POSITION(currPositionScreen, geometry);
gl_Position = vec4(currPositionScreen.xyz + offset * currPositionScreen.w, currPositionScreen.w);
} else {
prevPosition = project_position(prevPosition, prevPosition64Low);
currPosition = project_position(currPosition, currPosition64Low);
nextPosition = project_position(nextPosition, nextPosition64Low);
width = vec3(project_pixel_size(widthPixels), 0.0);
DECKGL_FILTER_SIZE(width, geometry);
vec3 offset = getLineJoinOffset(prevPosition, currPosition, nextPosition, width.xy);
geometry.position = vec4(currPosition + offset, 1.0);
gl_Position = project_common_position_to_clipspace(geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,Go=`#version 300 es
#define SHADER_NAME path-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 vCornerOffset;
in float vMiterLength;
in vec2 vPathPosition;
in float vPathLength;
in float vJointType;
out vec4 fragColor;
void main(void) {
geometry.uv = vPathPosition;
if (vPathPosition.y < 0.0 || vPathPosition.y > vPathLength) {
if (vJointType > 0.5 && length(vCornerOffset) > 1.0) {
discard;
}
if (vJointType < 0.5 && vMiterLength > path.miterLimit + 1.0) {
discard;
}
}
fragColor = vColor;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,Yt=[0,0,0,255],Wo={widthUnits:"meters",widthScale:{type:"number",min:0,value:1},widthMinPixels:{type:"number",min:0,value:0},widthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},jointRounded:!1,capRounded:!1,miterLimit:{type:"number",min:0,value:4},billboard:!1,_pathType:null,getPath:{type:"accessor",value:o=>o.path},getColor:{type:"accessor",value:Yt},getWidth:{type:"accessor",value:1},rounded:{deprecatedFor:["jointRounded","capRounded"]}},ze={enter:(o,e)=>e.length?e.subarray(e.length-o.length):o};class Me extends q{getShaders(){return super.getShaders({vs:Uo,fs:Go,modules:[Q,ee,No]})}get wrapLongitude(){return!1}getBounds(){return this.getAttributeManager()?.getBounds(["vertexPositions"])}initializeState(){this.getAttributeManager().addInstanced({vertexPositions:{size:3,vertexOffset:1,type:"float64",fp64:this.use64bitPositions(),transition:ze,accessor:"getPath",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{instanceLeftPositions:{vertexOffset:0},instanceStartPositions:{vertexOffset:1},instanceEndPositions:{vertexOffset:2},instanceRightPositions:{vertexOffset:3}}},instanceTypes:{size:1,type:"uint8",update:this.calculateSegmentTypes,noAlloc:!0},instanceStrokeWidths:{size:1,accessor:"getWidth",transition:ze,defaultValue:1},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",accessor:"getColor",transition:ze,defaultValue:Yt},instancePickingColors:{size:4,type:"uint8",accessor:(i,{index:n,target:s})=>this.encodePickingColor(i&&i.__source?i.__source.index:n,s)}}),this.setState({pathTesselator:new Bo({fp64:this.use64bitPositions()})})}updateState(e){super.updateState(e);const{props:t,changeFlags:i}=e,n=this.getAttributeManager();if(i.dataChanged||i.updateTriggersChanged&&(i.updateTriggersChanged.all||i.updateTriggersChanged.getPath)){const{pathTesselator:r}=this.state,a=t.data.attributes||{};r.updateGeometry({data:t.data,geometryBuffer:a.getPath,buffers:a,normalize:!t._pathType,loop:t._pathType==="loop",getGeometry:t.getPath,positionFormat:t.positionFormat,wrapLongitude:t.wrapLongitude,resolution:this.context.viewport.resolution,dataChanged:i.dataChanged}),this.setState({numInstances:r.instanceCount,startIndices:r.vertexStarts}),i.dataChanged||n.invalidateAll()}i.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),n.invalidateAll())}getPickingInfo(e){const t=super.getPickingInfo(e),{index:i}=t,n=this.props.data;return n[0]&&n[0].__source&&(t.object=n.find(s=>s.__source.index===i)),t}disablePickingIndex(e){const t=this.props.data;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){const{jointRounded:t,capRounded:i,billboard:n,miterLimit:s,widthUnits:r,widthScale:a,widthMinPixels:l,widthMaxPixels:c}=this.props,d=this.state.model,p={jointType:Number(t),capType:Number(i),billboard:n,widthUnits:J[r],widthScale:a,miterLimit:s,widthMinPixels:l,widthMaxPixels:c};d.shaderInputs.setProps({path:p}),d.draw(this.context.renderPass)}_getModel(){const e=[0,1,2,1,4,2,1,3,4,3,5,4],t=[0,0,0,-1,0,1,1,-1,1,1,1,0];return new K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new Y({topology:"triangle-list",attributes:{indices:new Uint16Array(e),positions:{value:new Float32Array(t),size:2}}}),isInstanced:!0})}calculatePositions(e){const{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateSegmentTypes(e){const{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("segmentTypes")}}Me.defaultProps=Wo;Me.layerName="PathLayer";var pe={exports:{}},xt;function jo(){if(xt)return pe.exports;xt=1,pe.exports=o,pe.exports.default=o;function o(u,g,f){f=f||2;var x=g&&g.length,y=x?g[0]*f:u.length,m=e(u,0,y,f,!0),P=[];if(!m||m.next===m.prev)return P;var S,A,b,N,k,z,G;if(x&&(m=l(u,g,m,f)),u.length>80*f){S=b=u[0],A=N=u[1];for(var D=f;D<y;D+=f)k=u[D],z=u[D+1],k<S&&(S=k),z<A&&(A=z),k>b&&(b=k),z>N&&(N=z);G=Math.max(b-S,N-A),G=G!==0?32767/G:0}return i(m,P,f,S,A,G,0),P}function e(u,g,f,x,y){var m,P;if(y===ie(u,g,f,x)>0)for(m=g;m<f;m+=x)P=V(m,u[m],u[m+1],P);else for(m=f-x;m>=g;m-=x)P=V(m,u[m],u[m+1],P);return P&&M(P,P.next)&&(H(P),P=P.next),P}function t(u,g){if(!u)return u;g||(g=u);var f=u,x;do if(x=!1,!f.steiner&&(M(f,f.next)||I(f.prev,f,f.next)===0)){if(H(f),f=g=f.prev,f===f.next)break;x=!0}else f=f.next;while(x||f!==g);return g}function i(u,g,f,x,y,m,P){if(u){!P&&m&&v(u,x,y,m);for(var S=u,A,b;u.prev!==u.next;){if(A=u.prev,b=u.next,m?s(u,x,y,m):n(u)){g.push(A.i/f|0),g.push(u.i/f|0),g.push(b.i/f|0),H(u),u=b.next,S=b.next;continue}if(u=b,u===S){P?P===1?(u=r(t(u),g,f),i(u,g,f,x,y,m,2)):P===2&&a(u,g,f,x,y,m):i(t(u),g,f,x,y,m,1);break}}}}function n(u){var g=u.prev,f=u,x=u.next;if(I(g,f,x)>=0)return!1;for(var y=g.x,m=f.x,P=x.x,S=g.y,A=f.y,b=x.y,N=y<m?y<P?y:P:m<P?m:P,k=S<A?S<b?S:b:A<b?A:b,z=y>m?y>P?y:P:m>P?m:P,G=S>A?S>b?S:b:A>b?A:b,D=x.next;D!==g;){if(D.x>=N&&D.x<=z&&D.y>=k&&D.y<=G&&w(y,S,m,A,P,b,D.x,D.y)&&I(D.prev,D,D.next)>=0)return!1;D=D.next}return!0}function s(u,g,f,x){var y=u.prev,m=u,P=u.next;if(I(y,m,P)>=0)return!1;for(var S=y.x,A=m.x,b=P.x,N=y.y,k=m.y,z=P.y,G=S<A?S<b?S:b:A<b?A:b,D=N<k?N<z?N:z:k<z?k:z,se=S>A?S>b?S:b:A>b?A:b,re=N>k?N>z?N:z:k>z?k:z,Ye=C(G,D,g,f,x),qe=C(se,re,g,f,x),R=u.prevZ,F=u.nextZ;R&&R.z>=Ye&&F&&F.z<=qe;){if(R.x>=G&&R.x<=se&&R.y>=D&&R.y<=re&&R!==y&&R!==P&&w(S,N,A,k,b,z,R.x,R.y)&&I(R.prev,R,R.next)>=0||(R=R.prevZ,F.x>=G&&F.x<=se&&F.y>=D&&F.y<=re&&F!==y&&F!==P&&w(S,N,A,k,b,z,F.x,F.y)&&I(F.prev,F,F.next)>=0))return!1;F=F.nextZ}for(;R&&R.z>=Ye;){if(R.x>=G&&R.x<=se&&R.y>=D&&R.y<=re&&R!==y&&R!==P&&w(S,N,A,k,b,z,R.x,R.y)&&I(R.prev,R,R.next)>=0)return!1;R=R.prevZ}for(;F&&F.z<=qe;){if(F.x>=G&&F.x<=se&&F.y>=D&&F.y<=re&&F!==y&&F!==P&&w(S,N,A,k,b,z,F.x,F.y)&&I(F.prev,F,F.next)>=0)return!1;F=F.nextZ}return!0}function r(u,g,f){var x=u;do{var y=x.prev,m=x.next.next;!M(y,m)&&E(y,x,x.next,m)&&O(y,m)&&O(m,y)&&(g.push(y.i/f|0),g.push(x.i/f|0),g.push(m.i/f|0),H(x),H(x.next),x=u=m),x=x.next}while(x!==u);return t(x)}function a(u,g,f,x,y,m){var P=u;do{for(var S=P.next.next;S!==P.prev;){if(P.i!==S.i&&T(P,S)){var A=U(P,S);P=t(P,P.next),A=t(A,A.next),i(P,g,f,x,y,m,0),i(A,g,f,x,y,m,0);return}S=S.next}P=P.next}while(P!==u)}function l(u,g,f,x){var y=[],m,P,S,A,b;for(m=0,P=g.length;m<P;m++)S=g[m]*x,A=m<P-1?g[m+1]*x:u.length,b=e(u,S,A,x,!1),b===b.next&&(b.steiner=!0),y.push(L(b));for(y.sort(c),m=0;m<y.length;m++)f=d(y[m],f);return f}function c(u,g){return u.x-g.x}function d(u,g){var f=p(u,g);if(!f)return g;var x=U(f,u);return t(x,x.next),t(f,f.next)}function p(u,g){var f=g,x=u.x,y=u.y,m=-1/0,P;do{if(y<=f.y&&y>=f.next.y&&f.next.y!==f.y){var S=f.x+(y-f.y)*(f.next.x-f.x)/(f.next.y-f.y);if(S<=x&&S>m&&(m=S,P=f.x<f.next.x?f:f.next,S===x))return P}f=f.next}while(f!==g);if(!P)return null;var A=P,b=P.x,N=P.y,k=1/0,z;f=P;do x>=f.x&&f.x>=b&&x!==f.x&&w(y<N?x:m,y,b,N,y<N?m:x,y,f.x,f.y)&&(z=Math.abs(y-f.y)/(x-f.x),O(f,u)&&(z<k||z===k&&(f.x>P.x||f.x===P.x&&h(P,f)))&&(P=f,k=z)),f=f.next;while(f!==A);return P}function h(u,g){return I(u.prev,u,g.prev)<0&&I(g.next,u,u.next)<0}function v(u,g,f,x){var y=u;do y.z===0&&(y.z=C(y.x,y.y,g,f,x)),y.prevZ=y.prev,y.nextZ=y.next,y=y.next;while(y!==u);y.prevZ.nextZ=null,y.prevZ=null,_(y)}function _(u){var g,f,x,y,m,P,S,A,b=1;do{for(f=u,u=null,m=null,P=0;f;){for(P++,x=f,S=0,g=0;g<b&&(S++,x=x.nextZ,!!x);g++);for(A=b;S>0||A>0&&x;)S!==0&&(A===0||!x||f.z<=x.z)?(y=f,f=f.nextZ,S--):(y=x,x=x.nextZ,A--),m?m.nextZ=y:u=y,y.prevZ=m,m=y;f=x}m.nextZ=null,b*=2}while(P>1);return u}function C(u,g,f,x,y){return u=(u-f)*y|0,g=(g-x)*y|0,u=(u|u<<8)&16711935,u=(u|u<<4)&252645135,u=(u|u<<2)&858993459,u=(u|u<<1)&1431655765,g=(g|g<<8)&16711935,g=(g|g<<4)&252645135,g=(g|g<<2)&858993459,g=(g|g<<1)&1431655765,u|g<<1}function L(u){var g=u,f=u;do(g.x<f.x||g.x===f.x&&g.y<f.y)&&(f=g),g=g.next;while(g!==u);return f}function w(u,g,f,x,y,m,P,S){return(y-P)*(g-S)>=(u-P)*(m-S)&&(u-P)*(x-S)>=(f-P)*(g-S)&&(f-P)*(m-S)>=(y-P)*(x-S)}function T(u,g){return u.next.i!==g.i&&u.prev.i!==g.i&&!$(u,g)&&(O(u,g)&&O(g,u)&&j(u,g)&&(I(u.prev,u,g.prev)||I(u,g.prev,g))||M(u,g)&&I(u.prev,u,u.next)>0&&I(g.prev,g,g.next)>0)}function I(u,g,f){return(g.y-u.y)*(f.x-g.x)-(g.x-u.x)*(f.y-g.y)}function M(u,g){return u.x===g.x&&u.y===g.y}function E(u,g,f,x){var y=W(I(u,g,f)),m=W(I(u,g,x)),P=W(I(f,x,u)),S=W(I(f,x,g));return!!(y!==m&&P!==S||y===0&&B(u,f,g)||m===0&&B(u,x,g)||P===0&&B(f,u,x)||S===0&&B(f,g,x))}function B(u,g,f){return g.x<=Math.max(u.x,f.x)&&g.x>=Math.min(u.x,f.x)&&g.y<=Math.max(u.y,f.y)&&g.y>=Math.min(u.y,f.y)}function W(u){return u>0?1:u<0?-1:0}function $(u,g){var f=u;do{if(f.i!==u.i&&f.next.i!==u.i&&f.i!==g.i&&f.next.i!==g.i&&E(f,f.next,u,g))return!0;f=f.next}while(f!==u);return!1}function O(u,g){return I(u.prev,u,u.next)<0?I(u,g,u.next)>=0&&I(u,u.prev,g)>=0:I(u,g,u.prev)<0||I(u,u.next,g)<0}function j(u,g){var f=u,x=!1,y=(u.x+g.x)/2,m=(u.y+g.y)/2;do f.y>m!=f.next.y>m&&f.next.y!==f.y&&y<(f.next.x-f.x)*(m-f.y)/(f.next.y-f.y)+f.x&&(x=!x),f=f.next;while(f!==u);return x}function U(u,g){var f=new te(u.i,u.x,u.y),x=new te(g.i,g.x,g.y),y=u.next,m=g.prev;return u.next=g,g.prev=u,f.next=y,y.prev=f,x.next=f,f.prev=x,m.next=x,x.prev=m,x}function V(u,g,f,x){var y=new te(u,g,f);return x?(y.next=x.next,y.prev=x,x.next.prev=y,x.next=y):(y.prev=y,y.next=y),y}function H(u){u.next.prev=u.prev,u.prev.next=u.next,u.prevZ&&(u.prevZ.nextZ=u.nextZ),u.nextZ&&(u.nextZ.prevZ=u.prevZ)}function te(u,g,f){this.i=u,this.x=g,this.y=f,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}o.deviation=function(u,g,f,x){var y=g&&g.length,m=y?g[0]*f:u.length,P=Math.abs(ie(u,0,m,f));if(y)for(var S=0,A=g.length;S<A;S++){var b=g[S]*f,N=S<A-1?g[S+1]*f:u.length;P-=Math.abs(ie(u,b,N,f))}var k=0;for(S=0;S<x.length;S+=3){var z=x[S]*f,G=x[S+1]*f,D=x[S+2]*f;k+=Math.abs((u[z]-u[D])*(u[G+1]-u[z+1])-(u[z]-u[G])*(u[D+1]-u[z+1]))}return P===0&&k===0?0:Math.abs((k-P)/P)};function ie(u,g,f,x){for(var y=0,m=g,P=f-x;m<f;m+=x)y+=(u[P]-u[m])*(u[m+1]+u[P+1]),P=m;return y}return o.flatten=function(u){for(var g=u[0][0].length,f={vertices:[],holes:[],dimensions:g},x=0,y=0;y<u.length;y++){for(var m=0;m<u[y].length;m++)for(var P=0;P<g;P++)f.vertices.push(u[y][m][P]);y>0&&(x+=u[y-1].length,f.holes.push(x))}return f},pe.exports}var Vo=jo();const $o=gi(Vo),he=Ve.CLOCKWISE,yt=Ve.COUNTER_CLOCKWISE,oe={};function Ho(o){if(o=o&&o.positions||o,!Array.isArray(o)&&!ArrayBuffer.isView(o))throw new Error("invalid polygon")}function le(o){return"positions"in o?o.positions:o}function me(o){return"holeIndices"in o?o.holeIndices:null}function Ko(o){return Array.isArray(o[0])}function Zo(o){return o.length>=1&&o[0].length>=2&&Number.isFinite(o[0][0])}function Xo(o){const e=o[0],t=o[o.length-1];return e[0]===t[0]&&e[1]===t[1]&&e[2]===t[2]}function Jo(o,e,t,i){for(let n=0;n<e;n++)if(o[t+n]!==o[i-e+n])return!1;return!0}function mt(o,e,t,i,n){let s=e;const r=t.length;for(let a=0;a<r;a++)for(let l=0;l<i;l++)o[s++]=t[a][l]||0;if(!Xo(t))for(let a=0;a<i;a++)o[s++]=t[0][a]||0;return oe.start=e,oe.end=s,oe.size=i,$e(o,n,oe),s}function Pt(o,e,t,i,n=0,s,r){s=s||t.length;const a=s-n;if(a<=0)return e;let l=e;for(let c=0;c<a;c++)o[l++]=t[n+c];if(!Jo(t,i,n,s))for(let c=0;c<i;c++)o[l++]=t[n+c];return oe.start=e,oe.end=l,oe.size=i,$e(o,r,oe),l}function qt(o,e){Ho(o);const t=[],i=[];if("positions"in o){const{positions:n,holeIndices:s}=o;if(s){let r=0;for(let a=0;a<=s.length;a++)r=Pt(t,r,n,e,s[a-1],s[a],a===0?he:yt),i.push(r);return i.pop(),{positions:t,holeIndices:i}}o=n}if(!Ko(o))return Pt(t,0,o,e,0,t.length,he),t;if(!Zo(o)){let n=0;for(const[s,r]of o.entries())n=mt(t,n,r,e,s===0?he:yt),i.push(n);return i.pop(),{positions:t,holeIndices:i}}return mt(t,0,o,e,he),t}function Re(o,e,t){const i=o.length/3;let n=0;for(let s=0;s<i;s++){const r=(s+1)%i;n+=o[s*3+e]*o[r*3+t],n-=o[r*3+e]*o[s*3+t]}return Math.abs(n/2)}function _t(o,e,t,i){const n=o.length/3;for(let s=0;s<n;s++){const r=s*3,a=o[r+0],l=o[r+1],c=o[r+2];o[r+e]=a,o[r+t]=l,o[r+i]=c}}function Yo(o,e,t,i){let n=me(o);n&&(n=n.map(a=>a/e));let s=le(o);const r=i&&e===3;if(t){const a=s.length;s=s.slice();const l=[];for(let c=0;c<a;c+=e){l[0]=s[c],l[1]=s[c+1],r&&(l[2]=s[c+2]);const d=t(l);s[c]=d[0],s[c+1]=d[1],r&&(s[c+2]=d[2])}}if(r){const a=Re(s,0,1),l=Re(s,0,2),c=Re(s,1,2);if(!a&&!l&&!c)return[];a>l&&a>c||(l>c?(t||(s=s.slice()),_t(s,0,2,1)):(t||(s=s.slice()),_t(s,2,0,1)))}return $o(s,n,e)}class qo extends kt{constructor(e){const{fp64:t,IndexType:i=Uint32Array}=e;super({...e,attributes:{positions:{size:3,type:t?Float64Array:Float32Array},vertexValid:{type:Uint16Array,size:1},indices:{type:i,size:1}}})}get(e){const{attributes:t}=this;return e==="indices"?t.indices&&t.indices.subarray(0,this.vertexCount):t[e]}updateGeometry(e){super.updateGeometry(e);const t=this.buffers.indices;if(t)this.vertexCount=(t.value||t).length;else if(this.data&&!this.getGeometry)throw new Error("missing indices buffer")}normalizeGeometry(e){if(this.normalize){const t=qt(e,this.positionSize);return this.opts.resolution?Ht(le(t),me(t),{size:this.positionSize,gridResolution:this.opts.resolution,edgeTypes:!0}):this.opts.wrapLongitude?wo(le(t),me(t),{size:this.positionSize,maxLatitude:86,edgeTypes:!0}):t}return e}getGeometrySize(e){if(Ct(e)){let t=0;for(const i of e)t+=this.getGeometrySize(i);return t}return le(e).length/this.positionSize}getGeometryFromBuffer(e){return this.normalize||!this.buffers.indices?super.getGeometryFromBuffer(e):null}updateGeometryAttributes(e,t){if(e&&Ct(e))for(const i of e){const n=this.getGeometrySize(i);t.geometrySize=n,this.updateGeometryAttributes(i,t),t.vertexStart+=n,t.indexStart=this.indexStarts[t.geometryIndex+1]}else{const i=e;this._updateIndices(i,t),this._updatePositions(i,t),this._updateVertexValid(i,t)}}_updateIndices(e,{geometryIndex:t,vertexStart:i,indexStart:n}){const{attributes:s,indexStarts:r,typedArrayManager:a}=this;let l=s.indices;if(!l||!e)return;let c=n;const d=Yo(e,this.positionSize,this.opts.preproject,this.opts.full3d);l=a.allocate(l,n+d.length,{copy:!0});for(let p=0;p<d.length;p++)l[c++]=d[p]+i;r[t+1]=n+d.length,s.indices=l}_updatePositions(e,{vertexStart:t,geometrySize:i}){const{attributes:{positions:n},positionSize:s}=this;if(!n||!e)return;const r=le(e);for(let a=t,l=0;l<i;a++,l++){const c=r[l*s],d=r[l*s+1],p=s>2?r[l*s+2]:0;n[a*3]=c,n[a*3+1]=d,n[a*3+2]=p}}_updateVertexValid(e,{vertexStart:t,geometrySize:i}){const{positionSize:n}=this,s=this.attributes.vertexValid,r=e&&me(e);if(e&&e.edgeTypes?s.set(e.edgeTypes,t):s.fill(1,t,t+i),r)for(let a=0;a<r.length;a++)s[t+r[a]/n-1]=0;s[t+i-1]=0}}function Ct(o){return Array.isArray(o)&&o.length>0&&!Number.isFinite(o[0])}const Lt=`layout(std140) uniform solidPolygonUniforms {
  bool extruded;
  bool isWireframe;
  float elevationScale;
} solidPolygon;
`,Qo={name:"solidPolygon",vs:Lt,fs:Lt,uniformTypes:{extruded:"f32",isWireframe:"f32",elevationScale:"f32"}},Qt=`in vec4 fillColors;
in vec4 lineColors;
in vec3 pickingColors;
out vec4 vColor;
struct PolygonProps {
vec3 positions;
vec3 positions64Low;
vec3 normal;
float elevations;
};
vec3 project_offset_normal(vec3 vector) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT_OFFSETS) {
return normalize(vector * project.commonUnitsPerWorldUnit);
}
return project_normal(vector);
}
void calculatePosition(PolygonProps props) {
vec3 pos = props.positions;
vec3 pos64Low = props.positions64Low;
vec3 normal = props.normal;
vec4 colors = solidPolygon.isWireframe ? lineColors : fillColors;
geometry.worldPosition = props.positions;
geometry.pickingColor = pickingColors;
if (solidPolygon.extruded) {
pos.z += props.elevations * solidPolygon.elevationScale;
}
gl_Position = project_position_to_clipspace(pos, pos64Low, vec3(0.), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
if (solidPolygon.extruded) {
#ifdef IS_SIDE_VERTEX
normal = project_offset_normal(normal);
#else
normal = project_normal(normal);
#endif
geometry.normal = normal;
vec3 lightColor = lighting_getLightColor(colors.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, colors.a * layer.opacity);
} else {
vColor = vec4(colors.rgb, colors.a * layer.opacity);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,en=`#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader
in vec3 vertexPositions;
in vec3 vertexPositions64Low;
in float elevations;
${Qt}
void main(void) {
PolygonProps props;
props.positions = vertexPositions;
props.positions64Low = vertexPositions64Low;
props.elevations = elevations;
props.normal = vec3(0.0, 0.0, 1.0);
calculatePosition(props);
}
`,tn=`#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader-side
#define IS_SIDE_VERTEX
in vec2 positions;
in vec3 vertexPositions;
in vec3 nextVertexPositions;
in vec3 vertexPositions64Low;
in vec3 nextVertexPositions64Low;
in float elevations;
in float instanceVertexValid;
${Qt}
void main(void) {
if(instanceVertexValid < 0.5){
gl_Position = vec4(0.);
return;
}
PolygonProps props;
vec3 pos;
vec3 pos64Low;
vec3 nextPos;
vec3 nextPos64Low;
#if RING_WINDING_ORDER_CW == 1
pos = vertexPositions;
pos64Low = vertexPositions64Low;
nextPos = nextVertexPositions;
nextPos64Low = nextVertexPositions64Low;
#else
pos = nextVertexPositions;
pos64Low = nextVertexPositions64Low;
nextPos = vertexPositions;
nextPos64Low = vertexPositions64Low;
#endif
props.positions = mix(pos, nextPos, positions.x);
props.positions64Low = mix(pos64Low, nextPos64Low, positions.x);
props.normal = vec3(
pos.y - nextPos.y + (pos64Low.y - nextPos64Low.y),
nextPos.x - pos.x + (nextPos64Low.x - pos64Low.x),
0.0);
props.elevations = elevations * positions.y;
calculatePosition(props);
}
`,on=`#version 300 es
#define SHADER_NAME solid-polygon-layer-fragment-shader
precision highp float;
in vec4 vColor;
out vec4 fragColor;
void main(void) {
fragColor = vColor;
geometry.uv = vec2(0.);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,Se=[0,0,0,255],nn={filled:!0,extruded:!1,wireframe:!1,_normalize:!0,_windingOrder:"CW",_full3d:!1,elevationScale:{type:"number",min:0,value:1},getPolygon:{type:"accessor",value:o=>o.polygon},getElevation:{type:"accessor",value:1e3},getFillColor:{type:"accessor",value:Se},getLineColor:{type:"accessor",value:Se},material:!0},ve={enter:(o,e)=>e.length?e.subarray(e.length-o.length):o};class Te extends q{getShaders(e){return super.getShaders({vs:e==="top"?en:tn,fs:on,defines:{RING_WINDING_ORDER_CW:!this.props._normalize&&this.props._windingOrder==="CCW"?0:1},modules:[Q,Ge,ee,Qo]})}get wrapLongitude(){return!1}getBounds(){return this.getAttributeManager()?.getBounds(["vertexPositions"])}initializeState(){const{viewport:e}=this.context;let{coordinateSystem:t}=this.props;const{_full3d:i}=this.props;e.isGeospatial&&t==="default"&&(t="lnglat");let n;t==="lnglat"&&(i?n=e.projectPosition.bind(e):n=e.projectFlat.bind(e)),this.setState({numInstances:0,polygonTesselator:new qo({preproject:n,fp64:this.use64bitPositions(),IndexType:Uint32Array})});const s=this.getAttributeManager(),r=!0;s.remove(["instancePickingColors"]),s.add({indices:{size:1,isIndexed:!0,update:this.calculateIndices,noAlloc:r},vertexPositions:{size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:ve,accessor:"getPolygon",update:this.calculatePositions,noAlloc:r,shaderAttributes:{nextVertexPositions:{vertexOffset:1}}},instanceVertexValid:{size:1,type:"uint16",stepMode:"instance",update:this.calculateVertexValid,noAlloc:r},elevations:{size:1,stepMode:"dynamic",transition:ve,accessor:"getElevation"},fillColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:ve,accessor:"getFillColor",defaultValue:Se},lineColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:ve,accessor:"getLineColor",defaultValue:Se},pickingColors:{size:4,type:"uint8",stepMode:"dynamic",accessor:(a,{index:l,target:c})=>this.encodePickingColor(a&&a.__source?a.__source.index:l,c)}})}getPickingInfo(e){const t=super.getPickingInfo(e),{index:i}=t,n=this.props.data;return n[0]&&n[0].__source&&(t.object=n.find(s=>s.__source.index===i)),t}disablePickingIndex(e){const t=this.props.data;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){const{extruded:t,filled:i,wireframe:n,elevationScale:s}=this.props,{topModel:r,sideModel:a,wireframeModel:l,polygonTesselator:c}=this.state,d={extruded:!!t,elevationScale:s,isWireframe:!1};l&&n&&(l.setInstanceCount(c.instanceCount-1),l.shaderInputs.setProps({solidPolygon:{...d,isWireframe:!0}}),l.draw(this.context.renderPass)),a&&i&&(a.setInstanceCount(c.instanceCount-1),a.shaderInputs.setProps({solidPolygon:d}),a.draw(this.context.renderPass)),r&&i&&(r.setVertexCount(c.vertexCount),r.shaderInputs.setProps({solidPolygon:d}),r.draw(this.context.renderPass))}updateState(e){super.updateState(e),this.updateGeometry(e);const{props:t,oldProps:i,changeFlags:n}=e,s=this.getAttributeManager();(n.extensionsChanged||t.filled!==i.filled||t.extruded!==i.extruded)&&(this.state.models?.forEach(a=>a.destroy()),this.setState(this._getModels()),s.invalidateAll())}updateGeometry({props:e,oldProps:t,changeFlags:i}){if(i.dataChanged||i.updateTriggersChanged&&(i.updateTriggersChanged.all||i.updateTriggersChanged.getPolygon)){const{polygonTesselator:s}=this.state,r=e.data.attributes||{};s.updateGeometry({data:e.data,normalize:e._normalize,geometryBuffer:r.getPolygon,buffers:r,getGeometry:e.getPolygon,positionFormat:e.positionFormat,wrapLongitude:e.wrapLongitude,resolution:this.context.viewport.resolution,fp64:this.use64bitPositions(),dataChanged:i.dataChanged,full3d:e._full3d}),this.setState({numInstances:s.instanceCount,startIndices:s.vertexStarts}),i.dataChanged||this.getAttributeManager().invalidateAll()}}_getModels(){const{id:e,filled:t,extruded:i}=this.props;let n,s,r;if(t){const a=this.getShaders("top");a.defines.NON_INSTANCED_MODEL=1;const l=this.getAttributeManager().getBufferLayouts({isInstanced:!1});n=new K(this.context.device,{...a,id:`${e}-top`,topology:"triangle-list",bufferLayout:l,isIndexed:!0,userData:{excludeAttributes:{instanceVertexValid:!0}}})}if(i){const a=this.getAttributeManager().getBufferLayouts({isInstanced:!0});s=new K(this.context.device,{...this.getShaders("side"),id:`${e}-side`,bufferLayout:a,geometry:new Y({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,1,1,0,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}}),r=new K(this.context.device,{...this.getShaders("side"),id:`${e}-wireframe`,bufferLayout:a,geometry:new Y({topology:"line-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,0,1,1,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}})}return{models:[s,r,n].filter(Boolean),topModel:n,sideModel:s,wireframeModel:r}}calculateIndices(e){const{polygonTesselator:t}=this.state;e.startIndices=t.indexStarts,e.value=t.get("indices")}calculatePositions(e){const{polygonTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateVertexValid(e){e.value=this.state.polygonTesselator.get("vertexValid")}}Te.defaultProps=nn;Te.layerName="SolidPolygonLayer";function ei({data:o,getIndex:e,dataRange:t,replace:i}){const{startRow:n=0,endRow:s=1/0}=t,r=o.length;let a=r,l=r;for(let h=0;h<r;h++){const v=e(o[h]);if(a>h&&v>=n&&(a=h),v>=s){l=h;break}}let c=a;const p=l-a!==i.length?o.slice(l):void 0;for(let h=0;h<i.length;h++)o[c++]=i[h];if(p){for(let h=0;h<p.length;h++)o[c++]=p[h];o.length=c}return{startRow:a,endRow:a+i.length}}const ti=[0,0,0,255],sn=[0,0,0,255],rn={stroked:!0,filled:!0,extruded:!1,elevationScale:1,wireframe:!1,_normalize:!0,_windingOrder:"CW",lineWidthUnits:"meters",lineWidthScale:1,lineWidthMinPixels:0,lineWidthMaxPixels:Number.MAX_SAFE_INTEGER,lineJointRounded:!1,lineMiterLimit:4,getPolygon:{type:"accessor",value:o=>o.polygon},getFillColor:{type:"accessor",value:sn},getLineColor:{type:"accessor",value:ti},getLineWidth:{type:"accessor",value:1},getElevation:{type:"accessor",value:1e3},material:!0};class ii extends We{initializeState(){this.state={paths:[],pathsDiff:null},this.props.getLineDashArray&&Z.removed("getLineDashArray","PathStyleExtension")()}updateState({changeFlags:e}){const t=e.dataChanged||e.updateTriggersChanged&&(e.updateTriggersChanged.all||e.updateTriggersChanged.getPolygon);if(t&&Array.isArray(e.dataChanged)){const i=this.state.paths.slice(),n=e.dataChanged.map(s=>ei({data:i,getIndex:r=>r.__source.index,dataRange:s,replace:this._getPaths(s)}));this.setState({paths:i,pathsDiff:n})}else t&&this.setState({paths:this._getPaths(),pathsDiff:null})}_getPaths(e={}){const{data:t,getPolygon:i,positionFormat:n,_normalize:s}=this.props,r=[],a=n==="XY"?2:3,{startRow:l,endRow:c}=e,{iterable:d,objectInfo:p}=be(t,l,c);for(const h of d){p.index++;let v=i(h,p);s&&(v=qt(v,a));const{holeIndices:_}=v,C=v.positions||v;if(_)for(let L=0;L<=_.length;L++){const w=C.slice(_[L-1]||0,_[L]||C.length);r.push(this.getSubLayerRow({path:w},h,p.index))}else r.push(this.getSubLayerRow({path:C},h,p.index))}return r}renderLayers(){const{data:e,_dataDiff:t,stroked:i,filled:n,extruded:s,wireframe:r,_normalize:a,_windingOrder:l,elevationScale:c,transitions:d,positionFormat:p}=this.props,{lineWidthUnits:h,lineWidthScale:v,lineWidthMinPixels:_,lineWidthMaxPixels:C,lineJointRounded:L,lineMiterLimit:w,lineDashJustified:T}=this.props,{getFillColor:I,getLineColor:M,getLineWidth:E,getLineDashArray:B,getElevation:W,getPolygon:$,updateTriggers:O,material:j}=this.props,{paths:U,pathsDiff:V}=this.state,H=this.getSubLayerClass("fill",Te),te=this.getSubLayerClass("stroke",Me),ie=this.shouldRenderSubLayer("fill",U)&&new H({_dataDiff:t,extruded:s,elevationScale:c,filled:n,wireframe:r,_normalize:a,_windingOrder:l,getElevation:W,getFillColor:I,getLineColor:s&&r?M:ti,material:j,transitions:d},this.getSubLayerProps({id:"fill",updateTriggers:O&&{getPolygon:O.getPolygon,getElevation:O.getElevation,getFillColor:O.getFillColor,lineColors:s&&r,getLineColor:O.getLineColor}}),{data:e,positionFormat:p,getPolygon:$}),u=!s&&i&&this.shouldRenderSubLayer("stroke",U)&&new te({_dataDiff:V&&(()=>V),widthUnits:h,widthScale:v,widthMinPixels:_,widthMaxPixels:C,jointRounded:L,miterLimit:w,dashJustified:T,_pathType:"loop",transitions:d&&{getWidth:d.getLineWidth,getColor:d.getLineColor,getPath:d.getPolygon},getColor:this.getSubLayerAccessor(M),getWidth:this.getSubLayerAccessor(E),getDashArray:this.getSubLayerAccessor(B)},this.getSubLayerProps({id:"stroke",updateTriggers:O&&{getWidth:O.getLineWidth,getColor:O.getLineColor,getDashArray:O.getLineDashArray}}),{data:U,positionFormat:p,getPath:g=>g.path});return[!s&&ie,u,s&&ie]}}ii.layerName="PolygonLayer";ii.defaultProps=rn;function an(o,e){if(!o)return null;const t="startIndices"in o?o.startIndices[e]:e,i=o.featureIds.value[t];return t!==-1?ln(o,i,t):null}function ln(o,e,t){const i={properties:{...o.properties[e]}};for(const n in o.numericProps)i.properties[n]=o.numericProps[n].value[t];return i}function cn(o,e){const t={points:null,lines:null,polygons:null};for(const i in t){const n=o[i].globalFeatureIds.value;t[i]=new Uint8ClampedArray(n.length*4);const s=[];for(let r=0;r<n.length;r++)e(n[r],s),t[i][r*4+0]=s[0],t[i][r*4+1]=s[1],t[i][r*4+2]=s[2],t[i][r*4+3]=255}return t}const St=`layout(std140) uniform sdfUniforms {
  float gamma;
  bool enabled;
  float buffer;
  float outlineBuffer;
  vec4 outlineColor;
} sdf;
`,un={name:"sdf",vs:St,fs:St,uniformTypes:{gamma:"f32",enabled:"f32",buffer:"f32",outlineBuffer:"f32",outlineColor:"vec4<f32>"}},ce={none:0,start:1,center:2,end:3},dn=`layout(std140) uniform textUniforms {
  highp vec2 cutoffPixels;
  highp ivec2 align;
  highp float fontSize;
  bool flipY;
} text;

#define ALIGN_MODE_START ${ce.start}
#define ALIGN_MODE_CENTER ${ce.center}
#define ALIGN_MODE_END ${ce.end}
`,oi={name:"text",vs:dn,getUniforms:({contentCutoffPixels:o=[0,0],contentAlignHorizontal:e="none",contentAlignVertical:t="none",fontSize:i,viewport:n})=>({cutoffPixels:o,align:[ce[e],ce[t]],fontSize:i,flipY:n?.flipY??!1}),uniformTypes:{cutoffPixels:"vec2<f32>",align:"vec2<i32>",fontSize:"f32",flipY:"f32"}},fn=`#version 300 es
#define SHADER_NAME multi-icon-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceSizes;
in float instanceAngles;
in vec4 instanceColors;
in vec3 instancePickingColors;
in vec4 instanceIconFrames;
in float instanceColorModes;
in vec2 instanceOffsets;
in vec2 instancePixelOffset;
in vec4 instanceClipRect;
out float vColorMode;
out vec4 vColor;
out vec2 vTextureCoords;
out vec2 uv;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = angle * PI / 180.0;
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
float getPixelOffsetFromAlignment(float anchor, float extent, float clipStart, float clipEnd, int mode) {
if (clipEnd < clipStart) return 0.0;
if (mode == ALIGN_MODE_START) {
return max(- (anchor + clipStart), 0.0);
}
if (mode == ALIGN_MODE_CENTER) {
float _min = max(0., anchor + clipStart);
float _max = min(extent, anchor + clipEnd);
return _min < _max ? (_min + _max) / 2.0 - anchor : 0.0;
}
if (mode == ALIGN_MODE_END) {
return min(extent - (anchor + clipEnd), 0.);
}
return 0.0;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
geometry.pickingColor = instancePickingColors;
uv = positions;
vec2 iconSize = instanceIconFrames.zw;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * icon.sizeScale, icon.sizeUnits),
icon.sizeMinPixels, icon.sizeMaxPixels
);
float instanceScale = sizePixels / text.fontSize;
vec2 pixelOffset = positions / 2.0 * iconSize + instanceOffsets;
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles) * instanceScale;
pixelOffset += instancePixelOffset;
pixelOffset.y *= -1.0;
vec2 anchorPosScreen;
if (icon.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
anchorPosScreen = gl_Position.xy / gl_Position.w;
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
if (text.flipY) {
offset_common.y *= -1.;
}
DECKGL_FILTER_SIZE(offset_common, geometry);
vec4 anchorPos = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0));
anchorPosScreen = anchorPos.xy / anchorPos.w;
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
anchorPosScreen = vec2(anchorPosScreen.x + 1.0, 1.0 - anchorPosScreen.y) / 2.0 * project.viewportSize / project.devicePixelRatio;
vec2 xy = project_size_to_pixel(instanceClipRect.xy);
vec2 wh = project_size_to_pixel(instanceClipRect.zw);
if (text.flipY) {
xy.y = -xy.y - wh.y;
}
if (text.align.x > 0 || text.align.y > 0) {
vec2 viewportPixels = project.viewportSize / project.devicePixelRatio;
vec2 scrollPixels = vec2(
getPixelOffsetFromAlignment(anchorPosScreen.x, viewportPixels.x, xy.x, xy.x + wh.x, text.align.x),
-getPixelOffsetFromAlignment(anchorPosScreen.y, viewportPixels.y, -xy.y - wh.y, -xy.y, text.align.y)
);
pixelOffset += scrollPixels;
gl_Position.xy += project_pixel_size_to_clipspace(scrollPixels);
}
if (instanceClipRect.z >= 0.) {
if (pixelOffset.x < xy.x || pixelOffset.x > xy.x + wh.x) {
gl_Position = vec4(0.0);
}
else if (text.cutoffPixels.x > 0.) {
float vpWidth = project.viewportSize.x / project.devicePixelRatio;
float l = max(anchorPosScreen.x + xy.x, 0.0);
float r = min(anchorPosScreen.x + xy.x + wh.x, vpWidth);
if (r - l < text.cutoffPixels.x) {
gl_Position = vec4(0.0);
}
}
}
if (instanceClipRect.w >= 0.) {
if (pixelOffset.y < xy.y || pixelOffset.y > xy.y + wh.y) {
gl_Position = vec4(0.0);
}
else if (text.cutoffPixels.y > 0.) {
float vpHeight = project.viewportSize.y / project.devicePixelRatio;
float t = max(anchorPosScreen.y - xy.y - wh.y, 0.0);
float b = min(anchorPosScreen.y - xy.y, vpHeight);
if (b - t < text.cutoffPixels.y) {
gl_Position = vec4(0.0);
}
}
}
vTextureCoords = mix(
instanceIconFrames.xy,
instanceIconFrames.xy + iconSize,
(positions.xy + 1.0) / 2.0
) / icon.iconsTextureDim;
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
vColorMode = instanceColorModes;
}
`,gn=`#version 300 es
#define SHADER_NAME multi-icon-layer-fragment-shader
precision highp float;
uniform sampler2D iconsTexture;
in vec4 vColor;
in vec2 vTextureCoords;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
if (!bool(picking.isActive)) {
float alpha = texture(iconsTexture, vTextureCoords).a;
vec4 color = vColor;
if (sdf.enabled) {
float distance = alpha;
alpha = smoothstep(sdf.buffer - sdf.gamma, sdf.buffer + sdf.gamma, distance);
if (sdf.outlineBuffer > 0.0) {
float inFill = alpha;
float inBorder = smoothstep(sdf.outlineBuffer - sdf.gamma, sdf.outlineBuffer + sdf.gamma, distance);
color = mix(sdf.outlineColor, vColor, inFill);
alpha = inBorder;
}
}
float a = alpha * color.a;
if (a < icon.alphaCutoff) {
discard;
}
fragColor = vec4(color.rgb, a * layer.opacity);
}
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,Fe=192/256,pn={getIconOffsets:{type:"accessor",value:o=>o.offsets},getContentBox:{type:"accessor",value:[0,0,-1,-1]},fontSize:1,alphaCutoff:.001,smoothing:.1,outlineWidth:0,outlineColor:{type:"color",value:[0,0,0,255]},contentCutoffPixels:{type:"array",value:[0,0]},contentAlignHorizontal:"none",contentAlignVertical:"none"};class Ke extends Ie{getShaders(){const e=super.getShaders();return{...e,modules:[...e.modules,oi,un],vs:fn,fs:gn}}initializeState(){super.initializeState();const e=this.getAttributeManager(),t=e.attributes.instanceIconDefs;t.settings.update=this.calculateInstanceIconDefs,e.addInstanced({instancePickingColors:{type:"uint8",size:4,accessor:(i,{index:n,target:s})=>this.encodePickingColor(n,s)},instanceClipRect:{size:4,accessor:"getContentBox",defaultValue:[0,0,-1,-1]}})}updateState(e){super.updateState(e);const{props:t,oldProps:i,changeFlags:n}=e,{outlineColor:s}=t;if(n.updateTriggersChanged&&(n.updateTriggersChanged.getIcon||n.updateTriggersChanged.getIconOffsets)&&this.getAttributeManager().invalidate("instanceIconDefs"),s!==i.outlineColor){const r=[s[0]/255,s[1]/255,s[2]/255,(s[3]??255)/255];this.setState({outlineColor:r})}!t.sdf&&t.outlineWidth&&Z.warn(`${this.id}: fontSettings.sdf is required to render outline`)()}draw(e){const{sdf:t,smoothing:i,fontSize:n,outlineWidth:s,contentCutoffPixels:r,contentAlignHorizontal:a,contentAlignVertical:l}=this.props,{outlineColor:c}=this.state,d=s?Math.max(i,Fe*(1-s)):-1,p=this.state.model,h={buffer:Fe,outlineBuffer:d,gamma:i,enabled:!!t,outlineColor:c},v={contentCutoffPixels:r,contentAlignHorizontal:a,contentAlignVertical:l,fontSize:n,viewport:this.context.viewport};if(p.shaderInputs.setProps({sdf:h,text:v}),super.draw(e),t&&s){const{iconManager:_}=this.state;_.getTexture()&&(p.shaderInputs.setProps({sdf:{...h,outlineBuffer:Fe}}),p.draw(this.context.renderPass))}}calculateInstanceIconDefs(e,{startRow:t,endRow:i}){const{data:n,getIcon:s,getIconOffsets:r}=this.props;let a=e.getVertexOffset(t);const l=e.value,{iterable:c,objectInfo:d}=be(n,t,i);for(const p of c){d.index++;const h=s(p,d),v=r(p,d);if(h){let _=0;for(const C of Array.from(h)){const L=super.getInstanceIconDef(C);L[0]=v[_*2],L[1]+=v[_*2+1],L[6]=1,l.set(L,a),a+=e.size,_++}}}}}Ke.defaultProps=pn;Ke.layerName="MultiIconLayer";const ue=1e20,Ze=new Float64Array(256);for(let o=0;o<256;o++){const e=.5-Math.pow(o/255,.45454545454545453);Ze[o]=e*Math.abs(e)}Ze[255]=-ue;class hn{constructor({fontSize:e=24,buffer:t=3,radius:i=8,cutoff:n=.25,fontFamily:s="sans-serif",fontWeight:r="normal",fontStyle:a="normal",lang:l=null}={}){this.buffer=t,this.radius=i,this.cutoff=n,this.lang=l;const c=this.size=e+t*4,d=this._createCanvas(c),p=this.ctx=d.getContext("2d",{willReadFrequently:!0});p.font=`${a} ${r} ${e}px ${s}`,p.textBaseline="alphabetic",p.textAlign="left",p.fillStyle="black",this.gridOuter=new Float64Array(c*c),this.gridInner=new Float64Array(c*c),this.f=new Float64Array(c),this.z=new Float64Array(c+1),this.v=new Uint16Array(c)}_createCanvas(e){if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(e,e);const t=document.createElement("canvas");return t.width=t.height=e,t}draw(e){const{width:t,actualBoundingBoxAscent:i,actualBoundingBoxDescent:n,actualBoundingBoxLeft:s,actualBoundingBoxRight:r}=this.ctx.measureText(e),a=Math.ceil(i),l=Math.floor(-s),c=Math.max(0,Math.min(this.size-this.buffer,Math.ceil(r)-l)),d=Math.max(0,Math.min(this.size-this.buffer,a+Math.ceil(n))),p=c+2*this.buffer,h=d+2*this.buffer,v=Math.max(p*h,0),_=new Uint8ClampedArray(v),C={data:_,width:p,height:h,glyphWidth:c,glyphHeight:d,glyphTop:a,glyphLeft:l,glyphAdvance:t};if(c===0||d===0)return C;const{ctx:L,buffer:w,gridInner:T,gridOuter:I}=this;this.lang&&(L.lang=this.lang),L.clearRect(w,w,c,d),L.fillText(e,w-l,w+a);const M=L.getImageData(w,w,c,d);I.fill(ue,0,v),T.fill(0,0,v);let E=3;for(let O=0;O<d;O++){let j=(O+w)*p+w;for(let U=0;U<c;U++,E+=4,j++){const V=M.data[E];if(V===0)continue;const H=Ze[V];I[j]=Math.max(0,H),T[j]=Math.max(0,-H)}}wt(I,0,0,p,h,p,this.f,this.v,this.z);const B=Math.min(w,1);wt(T,w-B,w-B,c+2*B,d+2*B,p,this.f,this.v,this.z);const W=255/this.radius,$=255*(1-this.cutoff);for(let O=0;O<v;O++){const j=Math.sqrt(I[O])-Math.sqrt(T[O]);_[O]=Math.round($-W*j)}return C}}function wt(o,e,t,i,n,s,r,a,l){for(let c=e;c<e+i;c++)bt(o,t*s+c,s,n,r,a,l);for(let c=t;c<t+n;c++)bt(o,c*s+e,1,i,r,a,l)}function bt(o,e,t,i,n,s,r){s[0]=0,r[0]=-ue,r[1]=ue,n[0]=o[e];for(let a=1,l=0,c=0;a<i;a++){n[a]=o[e+a*t];const d=a*a;do{const p=s[l];c=(n[a]-n[p]+d-p*p)/(a-p)/2}while(c<=r[l]&&--l>-1);l++,s[l]=a,r[l]=c,r[l+1]=ue}for(let a=0,l=0;a<i;a++){for(;r[l+1]<a;)l++;const c=s[l],d=a-c;o[e+a*t]=n[c]+d*d}}const vn=32,xn=[];function yn(o){return Math.pow(2,Math.ceil(Math.log2(o)))}function mn({characterSet:o,measureText:e,buffer:t,maxCanvasWidth:i,mapping:n={},xOffset:s=0,yOffsetMin:r=0,yOffsetMax:a=0}){let l=s,c=r,d=a;for(const p of o)if(!n[p]){const{advance:h,width:v,ascent:_,descent:C}=e(p),L=_+C;l+v+t*2>i&&(l=0,c=d),n[p]={x:l+t,y:c+t,width:v,height:L,advance:h,anchorX:v/2,anchorY:_},l+=v+t*2,d=Math.max(d,c+L+t*2)}return{mapping:n,xOffset:l,yOffsetMin:c,yOffsetMax:d,canvasHeight:yn(d)}}function ni(o,e,t,i){let n=0;for(let s=e;s<t;s++){const r=o[s];n+=i[r]?.advance||0}return n}function si(o,e,t,i,n,s){let r=e,a=0;for(let l=e;l<t;l++){const c=ni(o,l,l+1,n);a+c>i&&(r<l&&s.push(l),r=l,a=0),a+=c}return a}function Pn(o,e,t,i,n,s){let r=e,a=e,l=e,c=0;for(let d=e;d<t;d++)if((o[d]===" "||o[d+1]===" "||d+1===t)&&(l=d+1),l>a){let p=ni(o,a,l,n);c+p>i&&(r<a&&(s.push(a),r=a,c=0),p>i&&(p=si(o,a,l,i,n,s),r=s[s.length-1])),a=l,c+=p}return c}function _n(o,e,t,i,n=0,s){s===void 0&&(s=o.length);const r=[];return e==="break-all"?si(o,n,s,t,i,r):Pn(o,n,s,t,i,r),r}function Cn(o,e,t,i,n,s){let r=0,a=0;for(let l=e;l<t;l++){const c=o[l],d=i[c];d&&(a=Math.max(a,d.height))}for(let l=e;l<t;l++){const c=o[l],d=i[c];d?(n[l]=r+d.anchorX,r+=d.advance):(Z.warn(`Missing character: ${c} (${c.codePointAt(0)})`)(),n[l]=r,r+=vn)}s[0]=r,s[1]=a}function Ln(o,e,t,i,n,s){const r=Array.from(o),a=r.length,l=new Array(a),c=new Array(a),d=new Array(a),p=(i==="break-word"||i==="break-all")&&isFinite(n)&&n>0,h=[0,0],v=[0,0];let _=0,C=e+t/2,L=0,w=0;for(let T=0;T<=a;T++){const I=r[T];if((I===`
`||T===a)&&(w=T),w>L){const M=p?_n(r,i,n,s,L,w):xn;for(let E=0;E<=M.length;E++){const B=E===0?L:M[E-1],W=E<M.length?M[E]:w;Cn(r,B,W,s,l,v);for(let $=B;$<W;$++)c[$]=C,d[$]=v[0];_++,C+=t,h[0]=Math.max(h[0],v[0])}L=w}I===`
`&&(l[L]=0,c[L]=0,d[L]=0,L++)}return h[1]=_*t,{x:l,y:c,rowWidth:d,size:h}}function Sn({value:o,length:e,stride:t,offset:i,startIndices:n,characterSet:s}){const r=o.BYTES_PER_ELEMENT,a=t?t/r:1,l=i?i/r:0,c=n[e]||Math.ceil((o.length-l)/a),d=s&&new Set,p=new Array(e);let h=o;if(a>1||l>0){const v=o.constructor;h=new v(c);for(let _=0;_<c;_++)h[_]=o[_*a+l]}for(let v=0;v<e;v++){const _=n[v],C=n[v+1]||c,L=h.subarray(_,C);p[v]=String.fromCodePoint.apply(null,L),d&&L.forEach(d.add,d)}if(d)for(const v of d)s.add(String.fromCodePoint(v));return{texts:p,characterCount:c}}class ri{constructor(e=5){this._cache={},this._order=[],this.limit=e}get(e){const t=this._cache[e];return t&&(this._deleteOrder(e),this._appendOrder(e)),t}set(e,t){this._cache[e]?(this.delete(e),this._cache[e]=t,this._appendOrder(e)):(Object.keys(this._cache).length===this.limit&&this.delete(this._order[0]),this._cache[e]=t,this._appendOrder(e))}delete(e){this._cache[e]&&(delete this._cache[e],this._deleteOrder(e))}_deleteOrder(e){const t=this._order.indexOf(e);t>=0&&this._order.splice(t,1)}_appendOrder(e){this._order.push(e)}}function wn(){const o=[];for(let e=32;e<128;e++)o.push(String.fromCharCode(e));return o}const ne={fontFamily:"Monaco, monospace",fontWeight:"normal",characterSet:wn(),fontSize:64,buffer:4,sdf:!1,cutoff:.25,radius:12,smoothing:.1},At=1024,It=.9,Mt=.3,ai=3;let we=new ri(ai);function bn(o,e){let t;typeof e=="string"?t=new Set(Array.from(e)):t=new Set(e);const i=we.get(o);if(!i)return t;for(const n in i.mapping)t.has(n)&&t.delete(n);return t}function An(o,e){for(let t=0;t<o.length;t++)e.data[4*t+3]=o[t]}function Tt(o,e,t,i){o.font=`${i} ${t}px ${e}`,o.fillStyle="#000",o.textBaseline="alphabetic",o.textAlign="left"}function In(o,e,t){if(t===void 0){const n=o.measureText("A");return n.fontBoundingBoxAscent?{advance:0,width:0,ascent:Math.ceil(n.fontBoundingBoxAscent),descent:Math.ceil(n.fontBoundingBoxDescent)}:{advance:0,width:0,ascent:e*It,descent:e*Mt}}const i=o.measureText(t);return i.actualBoundingBoxAscent?{advance:i.width,width:Math.ceil(i.actualBoundingBoxRight-i.actualBoundingBoxLeft),ascent:Math.ceil(i.actualBoundingBoxAscent),descent:Math.ceil(i.actualBoundingBoxDescent)}:{advance:i.width,width:i.width,ascent:e*It,descent:e*Mt}}function Mn(o){Z.assert(Number.isFinite(o)&&o>=ai,"Invalid cache limit"),we=new ri(o)}class Tn{constructor(){this.props={...ne}}get atlas(){return this._atlas}get mapping(){return this._atlas&&this._atlas.mapping}setProps(e={}){Object.assign(this.props,e),e._getFontRenderer&&(this._getFontRenderer=e._getFontRenderer),this._key=this._getKey();const t=bn(this._key,this.props.characterSet),i=we.get(this._key);if(i&&t.size===0){this._atlas!==i&&(this._atlas=i);return}const n=this._generateFontAtlas(t,i);this._atlas=n,we.set(this._key,n)}_generateFontAtlas(e,t){const{fontFamily:i,fontWeight:n,fontSize:s,buffer:r,sdf:a,radius:l,cutoff:c}=this.props;let d=t&&t.data;d||(d=document.createElement("canvas"),d.width=At);const p=d.getContext("2d",{willReadFrequently:!0});Tt(p,i,s,n);const h=M=>In(p,s,M);let v;this._getFontRenderer?v=this._getFontRenderer(this.props):a&&(v={measure:h,draw:En(this.props)});const{mapping:_,canvasHeight:C,xOffset:L,yOffsetMin:w,yOffsetMax:T}=mn({measureText:M=>v?v.measure(M):h(M),buffer:r,characterSet:e,maxCanvasWidth:At,...t&&{mapping:t.mapping,xOffset:t.xOffset,yOffsetMin:t.yOffsetMin,yOffsetMax:t.yOffsetMax}});if(d.height!==C){const M=d.height>0?p.getImageData(0,0,d.width,d.height):null;d.height=C,M&&p.putImageData(M,0,0)}if(Tt(p,i,s,n),v)for(const M of e){const E=_[M],{data:B,left:W=0,top:$=0}=v.draw(M),O=E.x-W,j=E.y-$,U=Math.max(0,Math.round(O)),V=Math.max(0,Math.round(j)),H=Math.min(B.width,d.width-U),te=Math.min(B.height,d.height-V);p.putImageData(B,U,V,0,0,H,te),E.x+=U-O,E.y+=V-j}else for(const M of e){const E=_[M];p.fillText(M,E.x,E.y+E.anchorY)}const I=v?v.measure():h();return{baselineOffset:(I.ascent-I.descent)/2,xOffset:L,yOffsetMin:w,yOffsetMax:T,mapping:_,data:d,width:d.width,height:d.height}}_getKey(){const{fontFamily:e,fontWeight:t,fontSize:i,buffer:n,sdf:s,radius:r,cutoff:a}=this.props;return s?`${e} ${t} ${i} ${n} ${r} ${a}`:`${e} ${t} ${i} ${n}`}}function En({fontSize:o,buffer:e,radius:t,cutoff:i,fontFamily:n,fontWeight:s}){const r=new hn({fontSize:o,buffer:e,radius:t,cutoff:i,fontFamily:n,fontWeight:`${s}`});return a=>{const{data:l,width:c,height:d}=r.draw(a),p=new ImageData(c,d);return An(l,p),{data:p,left:e,top:e}}}const Et=`layout(std140) uniform textBackgroundUniforms {
  bool billboard;
  float sizeScale;
  float sizeMinPixels;
  float sizeMaxPixels;
  vec4 borderRadius;
  vec4 padding;
  highp int sizeUnits;
  bool stroked;
} textBackground;
`,On={name:"textBackground",vs:Et,fs:Et,uniformTypes:{billboard:"f32",sizeScale:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",borderRadius:"vec4<f32>",padding:"vec4<f32>",sizeUnits:"i32",stroked:"f32"}},zn=`#version 300 es
#define SHADER_NAME text-background-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceRects;
in vec4 instanceClipRect;
in float instanceSizes;
in float instanceAngles;
in vec2 instancePixelOffsets;
in float instanceLineWidths;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
in vec3 instancePickingColors;
out vec4 vFillColor;
out vec4 vLineColor;
out float vLineWidth;
out vec2 uv;
out vec2 dimensions;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = radians(angle);
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
geometry.pickingColor = instancePickingColors;
uv = positions;
vLineWidth = instanceLineWidths;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * textBackground.sizeScale, textBackground.sizeUnits),
textBackground.sizeMinPixels, textBackground.sizeMaxPixels
);
float instanceScale = sizePixels / text.fontSize;
dimensions = instanceRects.zw * instanceScale + textBackground.padding.xy + textBackground.padding.zw;
vec2 pixelOffset = (positions * instanceRects.zw + instanceRects.xy) * instanceScale + mix(-textBackground.padding.xy, textBackground.padding.zw, positions);
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles);
pixelOffset += instancePixelOffsets;
pixelOffset.y *= -1.0;
vec2 xy = project_size_to_pixel(instanceClipRect.xy);
vec2 wh = project_size_to_pixel(instanceClipRect.zw);
if (text.flipY) {
xy.y = -xy.y - wh.y;
}
if (instanceClipRect.z >= 0.0) {
dimensions.x = wh.x;
pixelOffset.x = xy.x + uv.x * wh.x + mix(-textBackground.padding.x, textBackground.padding.z, uv.x);
}
if (instanceClipRect.w >= 0.0) {
dimensions.y = wh.y;
pixelOffset.y = xy.y + uv.y * wh.y + mix(-textBackground.padding.y, textBackground.padding.w, uv.y);
}
if (textBackground.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
if (text.flipY) {
offset_common.y *= -1.;
}
DECKGL_FILTER_SIZE(offset_common, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vFillColor, geometry);
vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vLineColor, geometry);
}
`,Rn=`#version 300 es
#define SHADER_NAME text-background-layer-fragment-shader
precision highp float;
in vec4 vFillColor;
in vec4 vLineColor;
in float vLineWidth;
in vec2 uv;
in vec2 dimensions;
out vec4 fragColor;
float round_rect(vec2 p, vec2 size, vec4 radii) {
vec2 pixelPositionCB = (p - 0.5) * size;
vec2 sizeCB = size * 0.5;
float maxBorderRadius = min(size.x, size.y) * 0.5;
vec4 borderRadius = vec4(min(radii, maxBorderRadius));
borderRadius.xy =
(pixelPositionCB.x > 0.0) ? borderRadius.xy : borderRadius.zw;
borderRadius.x = (pixelPositionCB.y > 0.0) ? borderRadius.x : borderRadius.y;
vec2 q = abs(pixelPositionCB) - sizeCB + borderRadius.x;
return -(min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - borderRadius.x);
}
float rect(vec2 p, vec2 size) {
vec2 pixelPosition = p * size;
return min(min(pixelPosition.x, size.x - pixelPosition.x),
min(pixelPosition.y, size.y - pixelPosition.y));
}
vec4 get_stroked_fragColor(float dist) {
float isBorder = smoothedge(dist, vLineWidth);
return mix(vFillColor, vLineColor, isBorder);
}
void main(void) {
geometry.uv = uv;
if (textBackground.borderRadius != vec4(0.0)) {
float distToEdge = round_rect(uv, dimensions, textBackground.borderRadius);
float shapeAlpha = smoothedge(-distToEdge, 0.0);
if (shapeAlpha == 0.0) {
discard;
}
if (textBackground.stroked) {
fragColor = get_stroked_fragColor(distToEdge);
} else {
fragColor = vFillColor;
}
fragColor.a *= shapeAlpha;
} else {
if (textBackground.stroked) {
float distToEdge = rect(uv, dimensions);
fragColor = get_stroked_fragColor(distToEdge);
} else {
fragColor = vFillColor;
}
}
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,Fn={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,fontSize:1,borderRadius:{type:"object",value:0},padding:{type:"array",value:[0,0,0,0]},getPosition:{type:"accessor",value:o=>o.position},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},getBoundingRect:{type:"accessor",value:[0,0,0,0]},getClipRect:{type:"accessor",value:[0,0,-1,-1]},getFillColor:{type:"accessor",value:[0,0,0,255]},getLineColor:{type:"accessor",value:[0,0,0,255]},getLineWidth:{type:"accessor",value:1}};class Xe extends q{getShaders(){return super.getShaders({vs:zn,fs:Rn,modules:[Q,ee,On,oi]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,accessor:"getSize",defaultValue:1},instanceAngles:{size:1,transition:!0,accessor:"getAngle"},instanceRects:{size:4,accessor:"getBoundingRect"},instanceClipRect:{size:4,accessor:"getClipRect",defaultValue:[0,0,-1,-1]},instancePixelOffsets:{size:2,transition:!0,accessor:"getPixelOffset"},instanceFillColors:{size:4,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255]},instanceLineColors:{size:4,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1}})}updateState(e){super.updateState(e);const{changeFlags:t}=e;t.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){const{billboard:t,sizeScale:i,sizeUnits:n,sizeMinPixels:s,sizeMaxPixels:r,getLineWidth:a,fontSize:l}=this.props;let{padding:c,borderRadius:d}=this.props;c.length<4&&(c=[c[0],c[1],c[0],c[1]]),Array.isArray(d)||(d=[d,d,d,d]);const p=this.state.model,h={billboard:t,stroked:!!a,borderRadius:d,padding:c,sizeUnits:J[n],sizeScale:i,sizeMinPixels:s,sizeMaxPixels:r},v={fontSize:l,viewport:this.context.viewport};p.shaderInputs.setProps({textBackground:h,text:v}),p.draw(this.context.renderPass)}_getModel(){const e=[0,0,1,0,0,1,1,1];return new K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new Y({topology:"triangle-strip",vertexCount:4,attributes:{positions:{size:2,value:new Float32Array(e)}}}),isInstanced:!0})}}Xe.defaultProps=Fn;Xe.layerName="TextBackgroundLayer";const Ot={start:1,middle:0,end:-1},zt={top:1,center:0,bottom:-1},ke=[0,0,0,255],kn=1,Dn={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,background:!1,getBackgroundColor:{type:"accessor",value:[255,255,255,255]},getBorderColor:{type:"accessor",value:ke},getBorderWidth:{type:"accessor",value:0},backgroundBorderRadius:{type:"object",value:0},backgroundPadding:{type:"array",value:[0,0,0,0]},characterSet:{type:"object",value:ne.characterSet},fontFamily:ne.fontFamily,fontWeight:ne.fontWeight,lineHeight:kn,outlineWidth:{type:"number",value:0,min:0},outlineColor:{type:"color",value:ke},fontSettings:{type:"object",value:{},compare:1},wordBreak:"break-word",maxWidth:{type:"number",value:-1},contentCutoffPixels:{type:"array",value:[0,0]},contentAlignHorizontal:"none",contentAlignVertical:"none",getText:{type:"accessor",value:o=>o.text},getPosition:{type:"accessor",value:o=>o.position},getColor:{type:"accessor",value:ke},getSize:{type:"accessor",value:32},getAngle:{type:"accessor",value:0},getTextAnchor:{type:"accessor",value:"middle"},getAlignmentBaseline:{type:"accessor",value:"center"},getPixelOffset:{type:"accessor",value:[0,0]},getContentBox:{type:"accessor",value:[0,0,-1,-1]},backgroundColor:{deprecatedFor:["background","getBackgroundColor"]}};class Je extends We{constructor(){super(...arguments),this.getBoundingRect=(e,t)=>{const{size:[i,n]}=this.transformParagraph(e,t),{getTextAnchor:s,getAlignmentBaseline:r}=this.props,a=Ot[typeof s=="function"?s(e,t):s],l=zt[typeof r=="function"?r(e,t):r];return[(a-1)*i/2,(l-1)*n/2,i,n]},this.getIconOffsets=(e,t)=>{const{getTextAnchor:i,getAlignmentBaseline:n}=this.props,{x:s,y:r,rowWidth:a,size:[,l]}=this.transformParagraph(e,t),c=Ot[typeof i=="function"?i(e,t):i],d=zt[typeof n=="function"?n(e,t):n],p=s.length,h=new Array(p*2);let v=0;for(let _=0;_<p;_++)h[v++]=(c-1)*a[_]/2+s[_],h[v++]=(d-1)*l/2+r[_];return h}}initializeState(){this.state={styleVersion:0,fontAtlasManager:new Tn},this.props.maxWidth>0&&Z.once(1,"v8.9 breaking change: TextLayer maxWidth is now relative to text size")()}updateState(e){const{props:t,oldProps:i,changeFlags:n}=e;(n.dataChanged||n.updateTriggersChanged&&(n.updateTriggersChanged.all||n.updateTriggersChanged.getText))&&this._updateText(),(this._updateFontAtlas()||t.lineHeight!==i.lineHeight||t.wordBreak!==i.wordBreak||t.maxWidth!==i.maxWidth)&&this.setState({styleVersion:this.state.styleVersion+1})}getPickingInfo({info:e}){return e.object=e.index>=0?this.props.data[e.index]:null,e}_updateFontAtlas(){const{fontSettings:e,fontFamily:t,fontWeight:i,_getFontRenderer:n}=this.props,{fontAtlasManager:s,characterSet:r}=this.state,a={...e,characterSet:r,fontFamily:t,fontWeight:i,_getFontRenderer:n};if(!s.mapping)return s.setProps(a),!0;for(const l in a)if(a[l]!==s.props[l])return s.setProps(a),!0;return!1}_updateText(){const{data:e,characterSet:t}=this.props,i=e.attributes?.getText;let{getText:n}=this.props,s=e.startIndices,r;const a=t==="auto"&&new Set;if(i&&s){const{texts:l,characterCount:c}=Sn({...ArrayBuffer.isView(i)?{value:i}:i,length:e.length,startIndices:s,characterSet:a});r=c,n=(d,{index:p})=>l[p]}else{const{iterable:l,objectInfo:c}=be(e);s=[0],r=0;for(const d of l){c.index++;const p=Array.from(n(d,c)||"");a&&p.forEach(a.add,a),r+=p.length,s.push(r)}}this.setState({getText:n,startIndices:s,numInstances:r,characterSet:a||t})}transformParagraph(e,t){const{fontAtlasManager:i}=this.state,n=i.mapping,{baselineOffset:s}=i.atlas,{fontSize:r}=i.props,a=this.state.getText,{wordBreak:l,lineHeight:c,maxWidth:d}=this.props,p=a(e,t)||"";return Ln(p,s,c*r,l,d*r,n)}renderLayers(){const{startIndices:e,numInstances:t,getText:i,fontAtlasManager:{atlas:n,mapping:s},styleVersion:r}=this.state,{data:a,_dataDiff:l,getPosition:c,getColor:d,getSize:p,getAngle:h,getPixelOffset:v,getBackgroundColor:_,getBorderColor:C,getBorderWidth:L,getContentBox:w,backgroundBorderRadius:T,backgroundPadding:I,background:M,billboard:E,fontSettings:B,outlineWidth:W,outlineColor:$,sizeScale:O,sizeUnits:j,sizeMinPixels:U,sizeMaxPixels:V,contentCutoffPixels:H,contentAlignHorizontal:te,contentAlignVertical:ie,transitions:u,updateTriggers:g}=this.props,f=this.getSubLayerClass("characters",Ke),x=this.getSubLayerClass("background",Xe),{fontSize:y}=this.state.fontAtlasManager.props;return[M&&new x({getFillColor:_,getLineColor:C,getLineWidth:L,borderRadius:T,padding:I,getPosition:c,getSize:p,getAngle:h,getPixelOffset:v,getClipRect:w,billboard:E,sizeScale:O,sizeUnits:j,sizeMinPixels:U,sizeMaxPixels:V,fontSize:y,transitions:u&&{getPosition:u.getPosition,getAngle:u.getAngle,getSize:u.getSize,getFillColor:u.getBackgroundColor,getLineColor:u.getBorderColor,getLineWidth:u.getBorderWidth,getPixelOffset:u.getPixelOffset}},this.getSubLayerProps({id:"background",updateTriggers:{getPosition:g.getPosition,getAngle:g.getAngle,getSize:g.getSize,getFillColor:g.getBackgroundColor,getLineColor:g.getBorderColor,getLineWidth:g.getBorderWidth,getPixelOffset:g.getPixelOffset,getBoundingRect:{getText:g.getText,getTextAnchor:g.getTextAnchor,getAlignmentBaseline:g.getAlignmentBaseline,styleVersion:r}}}),{data:a.attributes&&a.attributes.background?{length:a.length,attributes:a.attributes.background}:a,_dataDiff:l,autoHighlight:!1,getBoundingRect:this.getBoundingRect}),new f({sdf:B.sdf,smoothing:Number.isFinite(B.smoothing)?B.smoothing:ne.smoothing,outlineWidth:W/(B.radius||ne.radius),outlineColor:$,iconAtlas:n,iconMapping:s,getPosition:c,getColor:d,getSize:p,getAngle:h,getPixelOffset:v,getContentBox:w,billboard:E,sizeScale:O,sizeUnits:j,sizeMinPixels:U,sizeMaxPixels:V,fontSize:y,contentCutoffPixels:H,contentAlignHorizontal:te,contentAlignVertical:ie,transitions:u&&{getPosition:u.getPosition,getAngle:u.getAngle,getColor:u.getColor,getSize:u.getSize,getPixelOffset:u.getPixelOffset,getContentBox:u.getContentBox}},this.getSubLayerProps({id:"characters",updateTriggers:{all:g.getText,getPosition:g.getPosition,getAngle:g.getAngle,getColor:g.getColor,getSize:g.getSize,getPixelOffset:g.getPixelOffset,getContentBox:g.getContentBox,getIconOffsets:{getTextAnchor:g.getTextAnchor,getAlignmentBaseline:g.getAlignmentBaseline,styleVersion:r}}}),{data:a,_dataDiff:l,startIndices:e,numInstances:t,getIconOffsets:this.getIconOffsets,getIcon:i})]}static set fontAtlasCacheLimit(e){Mn(e)}}Je.defaultProps=Dn;Je.layerName="TextLayer";const Pe={circle:{type:je,props:{filled:"filled",stroked:"stroked",lineWidthMaxPixels:"lineWidthMaxPixels",lineWidthMinPixels:"lineWidthMinPixels",lineWidthScale:"lineWidthScale",lineWidthUnits:"lineWidthUnits",pointRadiusMaxPixels:"radiusMaxPixels",pointRadiusMinPixels:"radiusMinPixels",pointRadiusScale:"radiusScale",pointRadiusUnits:"radiusUnits",pointAntialiasing:"antialiasing",pointBillboard:"billboard",getFillColor:"getFillColor",getLineColor:"getLineColor",getLineWidth:"getLineWidth",getPointRadius:"getRadius"}},icon:{type:Ie,props:{iconAtlas:"iconAtlas",iconMapping:"iconMapping",iconSizeMaxPixels:"sizeMaxPixels",iconSizeMinPixels:"sizeMinPixels",iconSizeScale:"sizeScale",iconSizeUnits:"sizeUnits",iconAlphaCutoff:"alphaCutoff",iconBillboard:"billboard",getIcon:"getIcon",getIconAngle:"getAngle",getIconColor:"getColor",getIconPixelOffset:"getPixelOffset",getIconSize:"getSize"}},text:{type:Je,props:{textSizeMaxPixels:"sizeMaxPixels",textSizeMinPixels:"sizeMinPixels",textSizeScale:"sizeScale",textSizeUnits:"sizeUnits",textBackground:"background",textBackgroundPadding:"backgroundPadding",textFontFamily:"fontFamily",textFontWeight:"fontWeight",textLineHeight:"lineHeight",textMaxWidth:"maxWidth",textOutlineColor:"outlineColor",textOutlineWidth:"outlineWidth",textWordBreak:"wordBreak",textCharacterSet:"characterSet",textBillboard:"billboard",textFontSettings:"fontSettings",getText:"getText",getTextAngle:"getAngle",getTextColor:"getColor",getTextPixelOffset:"getPixelOffset",getTextSize:"getSize",getTextAnchor:"getTextAnchor",getTextAlignmentBaseline:"getAlignmentBaseline",getTextBackgroundColor:"getBackgroundColor",getTextBorderColor:"getBorderColor",getTextBorderWidth:"getBorderWidth"}}},_e={type:Me,props:{lineWidthUnits:"widthUnits",lineWidthScale:"widthScale",lineWidthMinPixels:"widthMinPixels",lineWidthMaxPixels:"widthMaxPixels",lineJointRounded:"jointRounded",lineCapRounded:"capRounded",lineMiterLimit:"miterLimit",lineBillboard:"billboard",getLineColor:"getColor",getLineWidth:"getWidth"}},Ue={type:Te,props:{extruded:"extruded",filled:"filled",wireframe:"wireframe",elevationScale:"elevationScale",material:"material",_full3d:"_full3d",getElevation:"getElevation",getFillColor:"getFillColor",getLineColor:"getLineColor"}};function ae({type:o,props:e}){const t={};for(const i in e)t[i]=o.defaultProps[e[i]];return t}function De(o,e){const{transitions:t,updateTriggers:i}=o.props,n={updateTriggers:{},transitions:t&&{getPosition:t.geometry}};for(const s in e){const r=e[s];let a=o.props[s];s.startsWith("get")&&(a=o.getSubLayerAccessor(a),n.updateTriggers[r]=i[s],t&&(n.transitions[r]=t[s])),n[r]=a}return n}function Bn(o){if(Array.isArray(o))return o;switch(Z.assert(o.type,"GeoJSON does not have type"),o.type){case"Feature":return[o];case"FeatureCollection":return Z.assert(Array.isArray(o.features),"GeoJSON does not have features array"),o.features;default:return[{geometry:o}]}}function Rt(o,e,t={}){const i={pointFeatures:[],lineFeatures:[],polygonFeatures:[],polygonOutlineFeatures:[]},{startRow:n=0,endRow:s=o.length}=t;for(let r=n;r<s;r++){const a=o[r],{geometry:l}=a;if(l)if(l.type==="GeometryCollection"){Z.assert(Array.isArray(l.geometries),"GeoJSON does not have geometries array");const{geometries:c}=l;for(let d=0;d<c.length;d++){const p=c[d];Ft(p,i,e,a,r)}}else Ft(l,i,e,a,r)}return i}function Ft(o,e,t,i,n){const{type:s,coordinates:r}=o,{pointFeatures:a,lineFeatures:l,polygonFeatures:c,polygonOutlineFeatures:d}=e;if(!Un(s,r)){Z.warn(`${s} coordinates are malformed`)();return}switch(s){case"Point":a.push(t({geometry:o},i,n));break;case"MultiPoint":r.forEach(p=>{a.push(t({geometry:{type:"Point",coordinates:p}},i,n))});break;case"LineString":l.push(t({geometry:o},i,n));break;case"MultiLineString":r.forEach(p=>{l.push(t({geometry:{type:"LineString",coordinates:p}},i,n))});break;case"Polygon":c.push(t({geometry:o},i,n)),r.forEach(p=>{d.push(t({geometry:{type:"LineString",coordinates:p}},i,n))});break;case"MultiPolygon":r.forEach(p=>{c.push(t({geometry:{type:"Polygon",coordinates:p}},i,n)),p.forEach(h=>{d.push(t({geometry:{type:"LineString",coordinates:h}},i,n))})});break}}const Nn={Point:1,MultiPoint:2,LineString:2,MultiLineString:3,Polygon:3,MultiPolygon:4};function Un(o,e){let t=Nn[o];for(Z.assert(t,`Unknown GeoJSON type ${o}`);e&&--t>0;)e=e[0];return e&&Number.isFinite(e[0])}function li(){return{points:{},lines:{},polygons:{},polygonsOutline:{}}}function xe(o){return o.geometry.coordinates}function Gn(o,e){const t=li(),{pointFeatures:i,lineFeatures:n,polygonFeatures:s,polygonOutlineFeatures:r}=o;return t.points.data=i,t.points._dataDiff=e.pointFeatures&&(()=>e.pointFeatures),t.points.getPosition=xe,t.lines.data=n,t.lines._dataDiff=e.lineFeatures&&(()=>e.lineFeatures),t.lines.getPath=xe,t.polygons.data=s,t.polygons._dataDiff=e.polygonFeatures&&(()=>e.polygonFeatures),t.polygons.getPolygon=xe,t.polygonsOutline.data=r,t.polygonsOutline._dataDiff=e.polygonOutlineFeatures&&(()=>e.polygonOutlineFeatures),t.polygonsOutline.getPath=xe,t}function Wn(o,e){const t=li(),{points:i,lines:n,polygons:s}=o,r=cn(o,e);t.points.data={length:i.positions.value.length/i.positions.size,attributes:{...i.attributes,getPosition:i.positions,instancePickingColors:{size:4,value:r.points}},properties:i.properties,numericProps:i.numericProps,featureIds:i.featureIds},t.lines.data={length:n.pathIndices.value.length-1,startIndices:n.pathIndices.value,attributes:{...n.attributes,getPath:n.positions,instancePickingColors:{size:4,value:r.lines}},properties:n.properties,numericProps:n.numericProps,featureIds:n.featureIds},t.lines._pathType="open";const a=s.positions.value.length/s.positions.size,l=Array(a).fill(1);for(const c of s.primitivePolygonIndices.value)l[c-1]=0;return t.polygons.data={length:s.polygonIndices.value.length-1,startIndices:s.polygonIndices.value,attributes:{...s.attributes,getPolygon:s.positions,instanceVertexValid:{size:1,value:new Uint16Array(l)},pickingColors:{size:4,value:r.polygons}},properties:s.properties,numericProps:s.numericProps,featureIds:s.featureIds},t.polygons._normalize=!1,s.triangles&&(t.polygons.data.attributes.indices=s.triangles.value),t.polygonsOutline.data={length:s.primitivePolygonIndices.value.length-1,startIndices:s.primitivePolygonIndices.value,attributes:{...s.attributes,getPath:s.positions,instancePickingColors:{size:4,value:r.polygons}},properties:s.properties,numericProps:s.numericProps,featureIds:s.featureIds},t.polygonsOutline._pathType="open",t}const jn=["points","linestrings","polygons"],Vn={...ae(Pe.circle),...ae(Pe.icon),...ae(Pe.text),...ae(_e),...ae(Ue),stroked:!0,filled:!0,extruded:!1,wireframe:!1,_full3d:!1,iconAtlas:{type:"object",value:null},iconMapping:{type:"object",value:{}},getIcon:{type:"accessor",value:o=>o.properties.icon},getText:{type:"accessor",value:o=>o.properties.text},pointType:"circle",getRadius:{deprecatedFor:"getPointRadius"}};class ci extends We{initializeState(){this.state={layerProps:{},features:{},featuresDiff:{}}}updateState({props:e,changeFlags:t}){if(!t.dataChanged)return;const{data:i}=this.props,n=i&&"points"in i&&"polygons"in i&&"lines"in i;this.setState({binary:n}),n?this._updateStateBinary({props:e,changeFlags:t}):this._updateStateJSON({props:e,changeFlags:t})}_updateStateBinary({props:e,changeFlags:t}){const i=Wn(e.data,this.encodePickingColor);this.setState({layerProps:i})}_updateStateJSON({props:e,changeFlags:t}){const i=Bn(e.data),n=this.getSubLayerRow.bind(this);let s={};const r={};if(Array.isArray(t.dataChanged)){const l=this.state.features;for(const c in l)s[c]=l[c].slice(),r[c]=[];for(const c of t.dataChanged){const d=Rt(i,n,c);for(const p in l)r[p].push(ei({data:s[p],getIndex:h=>h.__source.index,dataRange:c,replace:d[p]}))}}else s=Rt(i,n);const a=Gn(s,r);this.setState({features:s,featuresDiff:r,layerProps:a})}getPickingInfo(e){const t=super.getPickingInfo(e),{index:i,sourceLayer:n}=t;return t.featureType=jn.find(s=>n.id.startsWith(`${this.id}-${s}-`)),i>=0&&n.id.startsWith(`${this.id}-points-text`)&&this.state.binary&&(t.index=this.props.data.points.globalFeatureIds.value[i]),t}_updateAutoHighlight(e){const t=`${this.id}-points-`,i=e.featureType==="points";for(const n of this.getSubLayers())n.id.startsWith(t)===i&&n.updateAutoHighlight(e)}_renderPolygonLayer(){const{extruded:e,wireframe:t}=this.props,{layerProps:i}=this.state,n="polygons-fill",s=this.shouldRenderSubLayer(n,i.polygons?.data)&&this.getSubLayerClass(n,Ue.type);if(s){const r=De(this,Ue.props),a=e&&t;return a||delete r.getLineColor,r.updateTriggers.lineColors=a,new s(r,this.getSubLayerProps({id:n,updateTriggers:r.updateTriggers}),i.polygons)}return null}_renderLineLayers(){const{extruded:e,stroked:t}=this.props,{layerProps:i}=this.state,n="polygons-stroke",s="linestrings",r=!e&&t&&this.shouldRenderSubLayer(n,i.polygonsOutline?.data)&&this.getSubLayerClass(n,_e.type),a=this.shouldRenderSubLayer(s,i.lines?.data)&&this.getSubLayerClass(s,_e.type);if(r||a){const l=De(this,_e.props);return[r&&new r(l,this.getSubLayerProps({id:n,updateTriggers:l.updateTriggers}),i.polygonsOutline),a&&new a(l,this.getSubLayerProps({id:s,updateTriggers:l.updateTriggers}),i.lines)]}return null}_renderPointLayers(){const{pointType:e}=this.props,{layerProps:t,binary:i}=this.state;let{highlightedObjectIndex:n}=this.props;!i&&Number.isFinite(n)&&(n=t.points.data.findIndex(a=>a.__source.index===n));const s=new Set(e.split("+")),r=[];for(const a of s){const l=`points-${a}`,c=Pe[a],d=c&&this.shouldRenderSubLayer(l,t.points?.data)&&this.getSubLayerClass(l,c.type);if(d){const p=De(this,c.props);let h=t.points;if(a==="text"&&i){const{instancePickingColors:v,..._}=h.data.attributes;h={...h,data:{...h.data,attributes:_}}}r.push(new d(p,this.getSubLayerProps({id:l,updateTriggers:p.updateTriggers,highlightedObjectIndex:n}),h))}}return r}renderLayers(){const{extruded:e}=this.props,t=this._renderPolygonLayer(),i=this._renderLineLayers(),n=this._renderPointLayers();return[!e&&t,i,n,e&&t]}getSubLayerAccessor(e){const{binary:t}=this.state;return!t||typeof e!="function"?super.getSubLayerAccessor(e):(i,n)=>{const{data:s,index:r}=n,a=an(s,r);return e(a,n)}}}ci.layerName="GeoJsonLayer";ci.defaultProps=Vn;export{Dt as ArcLayer,Bt as BitmapLayer,He as ColumnLayer,ci as GeoJsonLayer,Jt as GridCellLayer,Ie as IconLayer,Gt as LineLayer,Me as PathLayer,Vt as PointCloudLayer,ii as PolygonLayer,je as ScatterplotLayer,Te as SolidPolygonLayer,Je as TextLayer,Ke as _MultiIconLayer,Xe as _TextBackgroundLayer};
