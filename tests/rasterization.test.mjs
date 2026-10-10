import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../CG_Assignment1_BabylonJS_2D_Rasterisation/starter/src/rasterization.js', import.meta.url), 'utf8');
const r = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const color = r.rgb(255, 0, 0);
const pixel = (f,x,y) => [...f.data.slice(4*(y*f.width+x),4*(y*f.width+x)+4)];
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-9, `${a} != ${b}`);
const A={x:2,y:2}, B={x:14,y:2}, C={x:2,y:14};
for (const [P, expected] of [[A,[1,0,0]],[B,[0,1,0]],[C,[0,0,1]],[{x:6,y:6},[1/3,1/3,1/3]],[{x:8,y:8},[0,.5,.5]]]) {
 const w=r.barycentric(P,A,B,C); Object.values(w).forEach((v,i)=>close(v,expected[i]));
 close(w.alpha*A.x+w.beta*B.x+w.gamma*C.x,P.x);
 close(w.alpha*A.y+w.beta*B.y+w.gamma*C.y,P.y);
}
assert.ok(Object.values(r.barycentric({x:15,y:15},A,B,C)).some(v=>v<0));
assert.equal(r.barycentric(A,A,A,C),null);
for (const name of ['drawLineExplicit','drawLineImplicit']) {
 for (const end of [[14,2],[2,14],[14,14],[5,14],[14,5],[1,14],[14,1],[2,2]]) {
  const f=r.createFramebuffer(20,20), g=r.createFramebuffer(20,20);
  r[name](f,2,2,...end,color); r[name](g,...end,2,2,color);
  assert.deepEqual(f.data,g.data,`${name}: reverse ${end}`);
  assert.equal(pixel(f,2,2)[3],255); assert.equal(pixel(f,...end)[3],255);
 }
}
let f=r.createFramebuffer(24,24);
r.drawLineImplicit(f,10,20,20,20,color);
assert.equal(pixel(f,9,20)[3],0); assert.equal(pixel(f,21,20)[3],0);
assert.equal(f.data.filter((v,i)=>i%4===3&&v===255).length,11);
f=r.createFramebuffer(20,20); r.drawLineExplicit(f,3.1,4.1,3.2,4.2,color);
assert.equal(pixel(f,3,4)[3],255);
// Fractional half-pixel lines must choose exactly one row/column, in either direction.
for (const endpoints of [[2,5.5,12,5.5],[5.5,2,5.5,12]]) {
 const forward=r.createFramebuffer(20,20), backward=r.createFramebuffer(20,20);
 r.drawLineImplicit(forward,...endpoints,color);
 r.drawLineImplicit(backward,...endpoints.slice(2),...endpoints.slice(0,2),color);
 assert.deepEqual(forward.data,backward.data,'half-pixel ties are direction independent');
 assert.equal(forward.data.filter((v,i)=>i%4===3&&v===255).length,11);
 for(let k=2;k<=12;k++) {
  const horizontal=endpoints[1]===5.5;
  assert.equal(pixel(forward,horizontal?k:6,horizontal?6:k)[3],255);
  assert.equal(pixel(forward,horizontal?k:5,horizontal?5:k)[3],0);
 }
}
f=r.createFramebuffer(20,20); r.drawLineImplicit(f,3.1,4.1,3.2,4.2,color);
assert.equal(pixel(f,3,4)[3],255,'short implicit segment retains its rounded endpoint');
for (const name of ['drawLineExplicit','drawLineImplicit']) {
 f=r.createFramebuffer(20,20); r[name](f,-10,8,30,8,color);
 assert.equal(f.data.filter((v,i)=>i%4===3&&v===255).length,20,'line clipping');
}
for (const vertices of [[A,B,C],[C,B,A],[{x:-4,y:-3},B,C]]) {
 const half=r.createFramebuffer(20,20), bary=r.createFramebuffer(20,20);
 r.drawTriangleHalfPlane(half,...vertices,color);
 r.drawTriangleBarycentric(bary,...vertices,color,color,color);
 assert.deepEqual(half.data,bary.data,'equal flat-colour coverage including clipping and winding');
}
f=r.createFramebuffer(20,20);
r.drawTriangleBarycentric(f,A,B,C,r.rgb(255,0,0),r.rgb(0,255,0),r.rgb(0,0,255));
assert.deepEqual(pixel(f,6,6),[85,85,85,255]);
assert.deepEqual(pixel(f,2,2),[255,0,0,255]);
assert.deepEqual(pixel(f,8,8),[0,128,128,255]);
const reversed=r.createFramebuffer(20,20);
r.drawTriangleBarycentric(reversed,C,B,A,r.rgb(0,0,255),r.rgb(0,255,0),r.rgb(255,0,0));
for(let i=0;i<f.data.length;i++) assert.ok(Math.abs(f.data[i]-reversed.data[i])<=1);
f=r.createFramebuffer(20,20);
r.drawTriangleHalfPlane(f,A,A,C,color);
r.drawTriangleBarycentric(f,A,A,C,color,color,color);
assert.ok(f.data.every(v=>v===0));
console.log('PASS: barycentric reconstruction, vertices/centroid/edge/outside, line orientations/reversal, finite endpoints, subpixel segments, clipping, winding, colour and degenerate triangles.');
