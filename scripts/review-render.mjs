// Exercise the real HTTP routing/render pipeline in-process, without credentials,
// network requests, submissions or a public listening socket.
import {PassThrough} from 'node:stream';
process.env.VERCEL = '1';
const {default:server} = await import('../server.mjs');
export function renderRouteForReview(route,renderer=server) {
  return new Promise((resolve,reject) => {
    const req=new PassThrough();
    req.url=route; req.method='GET'; req.headers={host:'localhost'};
    req.socket={remoteAddress:'127.0.0.1'};
    const res={status:200,headers:{},setHeader(name,value){this.headers[name.toLowerCase()]=value;},getHeader(name){return this.headers[name.toLowerCase()];},writeHead(status,headers){this.status=status;Object.assign(this.headers,headers);},end(body){resolve({status:this.status,headers:this.headers,html:body?.toString()??''});},on(){return this;}};
    try { renderer.emit('request',req,res); } catch(error) {reject(error);}
  });
}
