// Smooth desktop wheel input; touch scrolling and nested scrollers stay native.
(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  let frame=0,current=0,target=0,lastTime=0,lastWritten=0,direction=0,easeDuration=150;
  const maximum=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);
  const clamp=(value,max)=>Math.max(0,Math.min(max,value));
  function stop(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;direction=0;
  }
  function step(now){
    frame=0;
    if(reduced.matches||!finePointer.matches||document.hidden||Math.abs(scrollY-lastWritten)>2){stop();return}
    target=clamp(target,maximum());
    const elapsed=Math.min(64,Math.max(0,now-lastTime));lastTime=now;
    current+=(target-current)*(1-Math.exp(-elapsed/easeDuration));
    const settled=Math.abs(target-current)<.5;
    if(settled)current=target;
    window.scrollTo({top:current,behavior:'instant'});lastWritten=scrollY;
    if(!settled)frame=requestAnimationFrame(step);else direction=0;
  }
  function needsNativeScroll(event){
    for(const element of event.composedPath()){
      if(element===document.body||element===document.documentElement)break;
      if(!(element instanceof Element))continue;
      if(element.matches('dialog,input,textarea,select,[contenteditable]:not([contenteditable="false"]),[data-native-scroll]'))return true;
      if(element.scrollHeight>element.clientHeight+1&&/auto|scroll/.test(getComputedStyle(element).overflowY))return true;
    }
    return false;
  }
  addEventListener('wheel',event=>{
    if(event.defaultPrevented||!event.cancelable||reduced.matches||!finePointer.matches||event.ctrlKey||event.metaKey||event.shiftKey||!event.deltaY||Math.abs(event.deltaX)>Math.abs(event.deltaY)||needsNativeScroll(event)){stop();return}
    const now=performance.now();
    // Precision devices need less lag because the OS already supplies momentum.
    easeDuration=event.deltaMode===0&&(Math.abs(event.deltaY)<40||!Number.isInteger(event.deltaY))?65:150;
    const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
    const nextDirection=Math.sign(delta),max=maximum();
    if(!frame||direction!==nextDirection){current=scrollY;target=current}
    const nextTarget=clamp(target+delta,max);
    if(!frame&&Math.abs(nextTarget-current)<.5)return;
    event.preventDefault();target=nextTarget;direction=nextDirection;
    if(!frame){
      window.scrollTo({top:current,behavior:'instant'});
      lastWritten=scrollY;lastTime=now;frame=requestAnimationFrame(step);
    }
  },{passive:false});
  addEventListener('keydown',stop,{passive:true});
  addEventListener('pointerdown',stop,{passive:true,capture:true});
  addEventListener('touchstart',stop,{passive:true,capture:true});
  addEventListener('click',stop,{passive:true,capture:true});
  addEventListener('resize',stop,{passive:true});
  addEventListener('popstate',stop);addEventListener('hashchange',stop);
  document.addEventListener('visibilitychange',stop);
  document.addEventListener('portfolio:languagechange',stop);
  reduced.addEventListener('change',stop);finePointer.addEventListener('change',stop);
})();
