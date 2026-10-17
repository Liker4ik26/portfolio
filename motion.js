const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
function updateMotionPreference(){document.documentElement.classList.toggle('motion-enabled',!motionPreference.matches)}
updateMotionPreference();motionPreference.addEventListener('change',updateMotionPreference);
const animatedHeader=document.querySelector('.header');
const animatedNav=animatedHeader.querySelector('nav');
const animatedNavLinks=[...animatedNav.querySelectorAll('a[href^="#"]')];
const navIndicator=document.createElement('span');
navIndicator.className='nav-indicator';navIndicator.setAttribute('aria-hidden','true');animatedNav.append(navIndicator);
const navSections=[...document.querySelectorAll('.section[id]')].filter(section=>animatedNavLinks.some(link=>link.hash===`#${section.id}`));
let activeNavLink=null,hoveredNavLink=null,headerFrame=0;
function placeNavIndicator(link){
  navIndicator.classList.toggle('visible',!!link);
  if(!link)return;
  const navRect=animatedNav.getBoundingClientRect(),linkRect=link.getBoundingClientRect();
  navIndicator.style.setProperty('--nav-x',`${linkRect.left-navRect.left-12}px`);
  navIndicator.style.setProperty('--nav-y',`${linkRect.top-navRect.top-9}px`);
  navIndicator.style.setProperty('--nav-width',`${linkRect.width+24}px`);
  navIndicator.style.setProperty('--nav-height',`${linkRect.height+18}px`);
}
function updateAnimatedHeader(){
  headerFrame=0;animatedHeader.classList.toggle('has-scrolled',scrollY>20);
  const threshold=animatedHeader.offsetHeight+innerHeight*.2;
  const section=navSections.findLast(item=>item.getBoundingClientRect().top<=threshold);
  activeNavLink=animatedNavLinks.find(link=>link.hash===`#${section?.id}`)||null;
  animatedNavLinks.forEach(link=>{if(link===activeNavLink)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
  placeNavIndicator(hoveredNavLink||activeNavLink);
}
function queueHeaderUpdate(){if(!headerFrame)headerFrame=requestAnimationFrame(updateAnimatedHeader)}
animatedNavLinks.forEach(link=>{
  link.addEventListener('pointerenter',()=>{hoveredNavLink=link;placeNavIndicator(link)});
  link.addEventListener('focus',()=>placeNavIndicator(link));
  link.addEventListener('blur',()=>placeNavIndicator(activeNavLink));
});
animatedNav.addEventListener('pointerleave',()=>{hoveredNavLink=null;placeNavIndicator(activeNavLink)});
addEventListener('scroll',queueHeaderUpdate,{passive:true});addEventListener('resize',queueHeaderUpdate);
document.addEventListener('portfolio:languagechange',queueHeaderUpdate);addEventListener('load',queueHeaderUpdate);
document.fonts.ready.then(queueHeaderUpdate);queueHeaderUpdate();
document.querySelectorAll('.github-projects .reveal,.commercial-projects .reveal').forEach((el,i)=>el.style.setProperty('--reveal-delay',`${i%3*95}ms`));
document.querySelectorAll('.skill-card').forEach((el,i)=>el.style.setProperty('--skill-delay',`${i%3*110}ms`));
if(matchMedia('(pointer:fine)').matches){document.querySelectorAll('.commercial-cover,.project-image').forEach(el=>{
  el.addEventListener('pointermove',event=>{if(motionPreference.matches)return;const rect=el.getBoundingClientRect();el.style.setProperty('--tilt-x',`${-(event.clientY-rect.top-rect.height/2)/rect.height*5}deg`);el.style.setProperty('--tilt-y',`${(event.clientX-rect.left-rect.width/2)/rect.width*5}deg`)});
  el.addEventListener('pointerleave',()=>{el.style.removeProperty('--tilt-x');el.style.removeProperty('--tilt-y')});
})}
const galleryImage=document.getElementById('gallery-image');
galleryImage.addEventListener('load',()=>{if(motionPreference.matches)return;galleryImage.classList.remove('gallery-changing');requestAnimationFrame(()=>galleryImage.classList.add('gallery-changing'))});

// Keep the bird in the top layer so it also follows the pointer over modal dialogs.
const birdPointer=matchMedia('(hover:hover) and (pointer:fine)');
if('showPopover' in HTMLElement.prototype){
  fetch('assets/flutter-bird-cursor.svg').then(response=>{if(!response.ok)throw new Error('Cursor unavailable');return response.text()}).then(source=>{
    const svg=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;
    if(svg.localName!=='svg')return;
    const layer=document.createElement('div');
    layer.className='bird-cursor-layer';layer.popover='manual';layer.setAttribute('aria-hidden','true');
    const trail=document.createElement('div');trail.className='bird-trail';layer.append(trail);
    const bird=document.createElement('div');bird.className='bird-cursor';bird.append(document.importNode(svg,true));layer.append(bird);document.body.append(layer);
    let idleTimer,activeDialog=null,lastTrail=null,lastMotion=null;
    const resetBirdTilt=()=>{lastMotion=null;bird.style.setProperty('--bird-tilt','0deg')};
    const tiltBird=event=>{
      if(motionPreference.matches){resetBirdTilt();return}
      const point={x:event.clientX,y:event.clientY,time:event.timeStamp};
      if(lastMotion){
        const elapsed=Math.max(8,point.time-lastMotion.time);
        const angle=Math.max(-12,Math.min(12,((point.x-lastMotion.x)*8-(point.y-lastMotion.y)*6)/elapsed));
        bird.style.setProperty('--bird-tilt',`${angle.toFixed(2)}deg`);
      }
      lastMotion=point;
    };
    const leaveTrail=event=>{
      if(motionPreference.matches)return;
      const point={x:event.clientX,y:event.clientY,time:event.timeStamp};
      if(!lastTrail||point.time-lastTrail.time>140){lastTrail=point;return}
      if(point.time-lastTrail.time<24)return;
      const dx=point.x-lastTrail.x,dy=point.y-lastTrail.y,distance=Math.hypot(dx,dy);
      if(distance<5)return;
      const count=Math.min(4,Math.ceil(distance/10));
      for(let i=0;i<count;i++){
        const dot=document.createElement('span');dot.className='bird-trail-dot';
        dot.style.left=`${lastTrail.x+dx*i/count+24}px`;dot.style.top=`${lastTrail.y+dy*i/count+9}px`;
        dot.style.setProperty('--trail-angle',`${Math.atan2(dy,dx)}rad`);
        if(trail.childElementCount>=40)trail.firstElementChild.remove();
        trail.append(dot);setTimeout(()=>dot.remove(),600);
      }
      lastTrail=point;
    };
    const updateBirdHover=target=>bird.classList.toggle('hovering',target instanceof Element&&!!target.closest('button:not(:disabled),a[href],[role="button"],.project-case,.project-card,.engineering-card'));
    document.addEventListener('pointerover',event=>updateBirdHover(event.target));
    document.addEventListener('pointerout',event=>updateBirdHover(event.relatedTarget));
    const hideBird=()=>{clearTimeout(idleTimer);resetBirdTilt();lastTrail=null;trail.replaceChildren();bird.classList.remove('moving','hovering','pressing');layer.querySelectorAll('.bird-spark-burst').forEach(burst=>burst.remove());document.documentElement.classList.remove('bird-cursor-active');if(layer.matches(':popover-open'))layer.hidePopover()};
    const raiseBird=()=>{
      const dialog=document.querySelector('dialog:modal');
      if(dialog!==activeDialog&&layer.matches(':popover-open'))layer.hidePopover();
      activeDialog=dialog;
      if(!layer.matches(':popover-open'))layer.showPopover();
    };
    document.addEventListener('pointermove',event=>{
      if(!birdPointer.matches||event.pointerType!=='mouse'){hideBird();return}
      raiseBird();
      leaveTrail(event);
      tiltBird(event);
      bird.style.transform=`translate3d(${event.clientX-2}px,${event.clientY-13}px,0)`;
      updateBirdHover(event.target);
      document.documentElement.classList.add('bird-cursor-active');
      bird.classList.add('moving');clearTimeout(idleTimer);
      idleTimer=setTimeout(()=>{bird.classList.remove('moving');resetBirdTilt()},140);
    },{passive:true});
    document.addEventListener('pointerdown',event=>{
      if(birdPointer.matches&&event.pointerType==='mouse'&&event.button===0)bird.classList.add('pressing');
    },{passive:true});
    const releaseBird=()=>bird.classList.remove('pressing');
    window.addEventListener('pointerup',releaseBird,{passive:true});
    window.addEventListener('pointercancel',releaseBird,{passive:true});
    document.addEventListener('click',event=>{
      if(!birdPointer.matches||event.pointerType!=='mouse'||event.button!==0||motionPreference.matches)return;
      releaseBird();
      bird.querySelector('svg').animate([{scale:'.82'},{scale:'1.08',offset:.65},{scale:'1'}],{duration:300,easing:'ease-out'});
      const bursts=layer.querySelectorAll('.bird-spark-burst');
      if(bursts.length>=4)bursts[0].remove();
      const burst=document.createElement('div');burst.className='bird-spark-burst';
      burst.style.left=`${event.clientX+18}px`;burst.style.top=`${event.clientY+7}px`;
      for(let i=0;i<12;i++){
        const spark=document.createElement('span'),angle=i*Math.PI/6;
        spark.className='bird-spark';
        spark.style.setProperty('--spark-x',`${Math.cos(angle)*(54+i%3*9)}px`);
        spark.style.setProperty('--spark-y',`${Math.sin(angle)*(54+i%3*9)}px`);
        burst.append(spark);
      }
      layer.append(burst);setTimeout(()=>burst.remove(),1000);
      // Opening a dialog on this click must not cover the bird or its sparkles.
      queueMicrotask(()=>{if(layer.matches(':popover-open'))raiseBird()});
    },{capture:true,passive:true});
    document.documentElement.addEventListener('pointerleave',hideBird);
    window.addEventListener('blur',hideBird);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)hideBird()});
    birdPointer.addEventListener('change',hideBird);
    motionPreference.addEventListener('change',()=>{resetBirdTilt();lastTrail=null;trail.replaceChildren()});
  }).catch(()=>{/* The native SVG cursor remains available if the overlay cannot load. */});
}
