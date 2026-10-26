import { Constants, Effect, RenderTargetTexture, Scene, ShaderMaterial, Texture, Vector2 } from '@babylonjs/core';
import { EffectBlendMode } from '../effect-definition';
import { ARCANE_FRAGMENT, CINEMATIC_FRAGMENT, FIRE_FRAGMENT } from './native-shaders';

const vertex=`precision highp float;
 attribute vec3 position; attribute vec2 uv; attribute vec4 color;
 uniform mat4 worldViewProjection; varying vec2 vUV; varying vec4 vColor;
 void main(){vUV=uv;vColor=color;gl_Position=worldViewProjection*vec4(position,1.0);}`;
const blend=`
 uniform float uLayerAlpha; uniform float uBlend; uniform sampler2D uBackdrop; uniform vec2 uViewport;
 vec3 blendColor(vec3 b,vec3 s){
  if(uBlend<.5)return s;
  if(uBlend<1.5)return b+s;
  if(uBlend<2.5)return 1.0-(1.0-b)*(1.0-s);
  if(uBlend<3.5)return b*s;
  if(uBlend<4.5)return mix(2.0*b*s,1.0-2.0*(1.0-b)*(1.0-s),step(vec3(.5),b));
  if(uBlend<5.5){vec3 d=mix(((16.0*b-12.0)*b+4.0)*b,sqrt(max(b,vec3(0.0))),step(vec3(.25),b));return mix(b-(1.0-2.0*s)*b*(1.0-b),b+(2.0*s-1.0)*(d-b),step(vec3(.5),s));}
  if(uBlend<6.5)return mix(2.0*b*s,1.0-2.0*(1.0-b)*(1.0-s),step(vec3(.5),s));
  if(uBlend<7.5)return min(b,s);
  if(uBlend<8.5)return max(b,s);
  return abs(b-s);
 }
 vec4 finishLayer(vec4 c){
  c.a*=uLayerAlpha;
  if(uBlend>.5){vec3 back=texture2D(uBackdrop,gl_FragCoord.xy/uViewport).rgb;c.rgb=blendColor(back,c.rgb);}
  return c;
 }
`;
export const NATIVE_BLEND_FUNCTIONS=blend.replace(/uniform[^;]+;/g,'');
const particle=`precision highp float; varying vec2 vUV; varying vec4 vColor; uniform vec3 uMain; uniform vec3 uCore; uniform float uClock;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
 void main(){float tile=floor(vUV.x/2.0);vec2 p=vec2(fract(vUV.x/2.0)*2.0-1.0,vUV.y*2.0-1.0);float r=length(p),a=0.0;
 if(tile<.5){float n=noise(p*4.0+uClock*.1)*.55+noise(p*9.0)*.3+noise(p*19.0)*.15;a=pow(max(0.0,1.0-r*r),1.5)*smoothstep(.12,.75,n);}
 else if(tile<1.5)a=exp(-dot(p,p)*6.0)*max(0.0,1.0-r);
 else if(tile<2.5)a=exp(-(p.x*p.x*38.0+p.y*p.y*5.0))*max(0.0,1.0-r);
 else if(tile<3.5)a=step(r,.5+noise(p*5.0)*.2)*max(0.0,1.0-r);
 else if(tile<4.5){float n=noise(p*5.0+vec2(uClock*1.5,-uClock*5.0))*.65+noise(p*13.0-uClock*2.0)*.35;float body=(1.0-p.y)*.35-abs(p.x+(n-.5)*.45);a=smoothstep(-.08,.18,body)*smoothstep(-1.0,-.7,p.y)*(1.0-smoothstep(.4,1.0,p.y))*(.4+n*.6);}
 else {float crystal=abs(p.x)*.8+abs(p.y)*.45;a=(1.0-smoothstep(.35,.46,crystal))*max(0.0,1.0-r);}
 vec3 tint=tile>3.5&&tile<4.5?mix(vColor.rgb*1.5,uCore*2.0,clamp((1.0-vUV.y)*.7,0.0,1.0)):vColor.rgb*(tile>.5?1.6:1.0);
 gl_FragColor=vec4(tint,a*vColor.a);}`;
const ribbon=`precision highp float;varying vec2 vUV;varying vec4 vColor;uniform vec3 uMain;uniform vec3 uCore;uniform float uClock;
 void main(){float d=abs(vUV.y*2.0-1.0),edge=pow(max(0.0,1.0-d),1.3),hot=exp(-d*d*85.0);float strands=.7+.3*sin(vUV.x*145.0-uClock*20.0+sin(vUV.x*50.0)*3.0);gl_FragColor=vec4(mix(vColor.rgb*1.3,uCore*2.0,hot),edge*(.6+strands*.4)*vColor.a);}`;
const barrier=`precision highp float;varying vec2 vUV;uniform vec3 uMain;uniform vec3 uCore;uniform float uClock;uniform float uVariant;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
 void main(){vec2 p=vUV;float n=noise(p*vec2(16.,8.)+vec2(0.,-uClock*2.));float detail=noise(p*40.+n*2.);float edge=smoothstep(0.,.035,p.x)*smoothstep(0.,.035,1.-p.x)*smoothstep(0.,.035,p.y)*smoothstep(0.,.06,1.-p.y);float a=.2+n*.4,hot=pow(detail,5.);
 if(uVariant<.5){vec2 cell=abs(fract(p*vec2(14.,6.))-.5);hot+=pow(max(cell.x,cell.y)*2.,18.);}
 else if(uVariant<1.5){a=smoothstep(.1,.8,n+(1.-p.y)*.65)*edge;hot=pow(max(0.,1.-p.y+n*.4),3.);}
 else if(uVariant<2.5){hot+=pow(1.-abs(sin(p.x*90.+p.y*43.+n*2.)),20.);a=.5+detail*.3;}
 else if(uVariant<3.5){a=pow(max(0.,1.-abs(sin(p.x*39.+sin(p.y*9.)*3.))),5.);hot=a*.4;}
 else {vec2 brick=fract(p*vec2(12.,5.)+vec2(step(.5,fract(p.y*5.))*.5,0.));float seam=step(.04,brick.x)*step(.04,brick.y);a=.85;hot=seam*.15+detail*.1;}
 gl_FragColor=vec4(mix(uMain*(.4+detail*.6),uCore,clamp(hot,0.,1.)),a*edge);}`;
let registered=false;
function register(){if(registered)return;registered=true;for(const [name,fragment] of Object.entries({fire:FIRE_FRAGMENT,cinematic:CINEMATIC_FRAGMENT,arcane:ARCANE_FRAGMENT,particle,ribbon,barrier})){
 Effect.ShadersStore['lwNative'+name+'VertexShader']=vertex;
 const source=fragment.replace(/gl_FragColor\s*=\s*([^;]+);/g,'gl_FragColor = finishLayer($1);');
 Effect.ShadersStore['lwNative'+name+'FragmentShader']=source.replace('void main()',blend+'\nvoid main()');
}}
export const nativeBlendModes:EffectBlendMode[]=['normal','add','screen','multiply','overlay','soft-light','hard-light','darken','lighten','difference'];
export function createNativeMaterial(scene:Scene,family:'fire'|'arcane'|'cinematic'|'particle'|'ribbon'|'barrier',name:string):ShaderMaterial{
 register();const m=new ShaderMaterial(name,scene,{vertex:'lwNative'+family,fragment:'lwNative'+family},{attributes:['position','uv','color'],uniforms:['worldViewProjection','uLayerAlpha','uBlend','uViewport','uMain','uCore','uClock','uProgress','uMode','uVariant','uStrength','uTime','uStyle','uElement','uTurbulence','uAlpha','uColor','uBloom','uDistortion','uScorch','uSeed','uSmoke','uLight','uShadow','uEmbers','uFlame','uSmokeColor'],samplers:['uBackdrop'],needAlphaBlending:true});
 m.backFaceCulling=false;m.disableDepthWrite=true;m.alphaMode=Constants.ALPHA_COMBINE;m.setFloat('uLayerAlpha',1);m.setFloat('uBlend',0);m.setVector2('uViewport',new Vector2(scene.getEngine().getRenderWidth(),scene.getEngine().getRenderHeight()));
 m.onBindObservable.add(()=>m.getEffect()?.setVector2('uViewport',new Vector2(scene.getEngine().getRenderWidth(),scene.getEngine().getRenderHeight())));return m;
}
/** Artistic blends snapshot the scene plus preceding effect layers. They retain depth-tested
 * world meshes; no canvas texture or Pixi overlay is used. Allocated only when requested. */
export function createBlendBackdrop(scene:Scene,id:string,order:number,owner:string):RenderTargetTexture{
 const engine=scene.getEngine(),scale=Math.min(1,1024/Math.max(engine.getRenderWidth(),engine.getRenderHeight()));
 const r=new RenderTargetTexture('lw-blend-'+id,{width:Math.max(1,Math.round(engine.getRenderWidth()*scale)),height:Math.max(1,Math.round(engine.getRenderHeight()*scale))},scene,false,true,Constants.TEXTURETYPE_UNSIGNED_BYTE,false,Texture.BILINEAR_SAMPLINGMODE,true);
 r.renderListPredicate=mesh=>{const meta=mesh.metadata;return meta?.lwNativeOwner!==owner||meta.lwNativeOrder<order;};
 r.ignoreCameraViewport=true;scene.customRenderTargets.push(r);return r;
}
