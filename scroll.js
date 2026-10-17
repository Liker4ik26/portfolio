// Scroll is native. One scheduled frame reads geometry, then updates visual properties.
const scrollPreference=matchMedia('(prefers-reduced-motion: reduce)');
const clampScroll=value=>Math.max(0,Math.min(1,value));
const scrollScenes=[...document.querySelectorAll('main>.section')].map((section,index,sections)=>{
  const track=document.createElement('div');track.className='section-track';track.style.zIndex=String(index+1);
  section.before(track);track.append(section);section.classList.add('scroll-scene');
  if(index===sections.length-1){section.classList.add('scroll-scene-last');track.classList.add('contact-track')}
  return {section,track,last:index===sections.length-1};
});
function measureScrollScenes(){
  const headerHeight=document.querySelector('.header').offsetHeight;
  document.documentElement.style.setProperty('--scene-header-height',`${headerHeight}px`);
  scrollScenes.forEach(({section,track,last},index)=>{
    const keepFactsReadable=['about','certificates'].includes(section.id)&&section.offsetHeight>innerHeight-headerHeight;
    const overlap=last||scrollPreference.matches||keepFactsReadable?0:Math.min(Math.round(innerHeight*(innerWidth<651?.45:.72)),scrollScenes[index+1].section.offsetHeight);
    track.style.setProperty('--scene-overlap',`${overlap}px`);
    track.style.setProperty('--scene-track-height',`${section.offsetHeight+overlap}px`);
    section.style.setProperty('--scene-top',`${Math.min(headerHeight,innerHeight-section.offsetHeight)}px`);
  });
  scheduleScrollFrame();
}
let scrollTitles=[],readingWords=[],scrollFrame=0;
const scrollMedia=[...document.querySelectorAll('.commercial-cover,.portfolio-card .project-image')];
const scrollCards=[...document.querySelectorAll('.portfolio-card')];
const scrollLabels=[...document.querySelectorAll('.section-label')];
const scrollHero=document.querySelector('.hero'),scrollPortrait=document.querySelector('.portrait'),scrollBackdrop=document.querySelector('.portrait-backdrop');
const scrollHeroCopy=document.querySelector('.hero-copy'),scrollMarquee=document.querySelector('.name-marquee'),scrollContact=document.querySelector('.contact');

function prepareScrollText(){
  scrollTitles=[...document.querySelectorAll('.section h2')].map(heading=>{
    heading.classList.remove('reveal');
    if(!heading.querySelector('.title-line')){
      const groups=[[]];
      [...heading.childNodes].forEach(node=>{if(node.nodeName==='BR')groups.push([]);else groups[groups.length-1].push(node)});
      heading.replaceChildren(...groups.map(nodes=>{const line=document.createElement('span'),inner=document.createElement('span');line.className='title-line';inner.className='title-line-inner';inner.append(...nodes);line.append(inner);return line}));
    }
    return {heading,lines:[...heading.querySelectorAll('.title-line-inner')]};
  });
  const paragraph=document.querySelector('.about-copy p[data-i="aboutCopy"]');
  if(!paragraph.querySelector('.reading-word')){
    const fragments=paragraph.textContent.split(/(\s+)/).map(text=>{if(/^\s+$/.test(text))return document.createTextNode(text);const word=document.createElement('span');word.className='reading-word';word.textContent=text;return word});
    paragraph.replaceChildren(...fragments);
  }
  readingWords=[...paragraph.querySelectorAll('.reading-word')];
  scheduleScrollFrame();
}
function scheduleScrollFrame(){if(!scrollFrame)scrollFrame=requestAnimationFrame(renderScrollFrame)}
function renderScrollFrame(){
  scrollFrame=0;
  const height=innerHeight,mobile=innerWidth<651;
  const contactRect=scrollContact.getBoundingClientRect();
  const availableHeight=Math.max(1,height-document.querySelector('.header').offsetHeight);
  const contactCoverage=clampScroll((height-contactRect.top)/Math.max(1,Math.min(contactRect.height,availableHeight)));
  scrollContact.parentElement.style.setProperty('--contact-backdrop',String(clampScroll((contactCoverage-.35)/.65)));
  if(scrollPreference.matches)return;
  const titleRects=scrollTitles.map(item=>item.heading.getBoundingClientRect());
  const mediaRects=scrollMedia.map(el=>el.getBoundingClientRect());
  const cardRects=scrollCards.map(el=>el.getBoundingClientRect());
  const labelRects=scrollLabels.map(el=>el.getBoundingClientRect());
  const heroRect=scrollHero.getBoundingClientRect(),marqueeRect=scrollMarquee.getBoundingClientRect();
  const readingRect=document.querySelector('.about-copy').getBoundingClientRect();
  const sceneRects=scrollScenes.map(({track})=>track.getBoundingClientRect());
  scrollTitles.forEach((item,index)=>{
    const rect=titleRects[index],progress=clampScroll((height*.95-rect.top)/(height*.36));
    item.lines.forEach((line,lineIndex)=>{const p=clampScroll(progress*1.2-lineIndex*.1);line.style.setProperty('--title-y',`${(1-p)*110}%`);line.style.setProperty('--title-rotate',`${(1-p)*2}deg`);line.style.setProperty('--title-opacity',String(.2+p*.8))});
  });
  const readingProgress=clampScroll((height*.94-readingRect.top)/(height*.48));
  readingWords.forEach((word,index)=>word.style.setProperty('--word-opacity',String(.38+.62*clampScroll(readingProgress*1.5-index/readingWords.length*.5))));
  scrollMedia.forEach((element,index)=>{
    const rect=mediaRects[index];if(rect.bottom< -100||rect.top>height+150)return;
    const enter=clampScroll((height*.98-rect.top)/(height*.37));
    const drift=(clampScroll((height-rect.top)/(height+rect.height))-.5)*(mobile?15:35);
    element.style.setProperty('--media-mask',`${(1-enter)*32}%`);element.style.setProperty('--media-y',`${drift}px`);
    const travel=clampScroll((height-rect.top)/(height+rect.height));
    element.style.setProperty('--photo-scale',String(1+travel*(mobile?.07:.14)));
    element.style.setProperty('--photo-y',`${(.5-travel)*(mobile?10:24)}px`);
    element.style.setProperty('--photo-x',`${(travel-.5)*(index%2===0?1:-1)*(mobile?4:12)}px`);
  });
  scrollCards.forEach((card,index)=>{
    const rect=cardRects[index],p=clampScroll((height-rect.top)/(height*.65));
    card.style.setProperty('--card-y',`${(1-p)*(mobile?20:[30,65,100][index%3])}px`);
  });
  scrollLabels.forEach((label,index)=>{const p=clampScroll((height*.96-labelRects[index].top)/(height*.3));label.style.setProperty('--label-x',`${(1-p)*-24}px`);label.style.setProperty('--label-opacity',String(.35+p*.65))});
  const heroProgress=clampScroll(-heroRect.top/Math.max(heroRect.height,1));
  scrollPortrait.style.setProperty('--portrait-y',`${heroProgress*(mobile?12:45)}px`);
  scrollBackdrop.style.setProperty('--portrait-drift',`${heroProgress*(mobile?15:70)}px`);
  scrollHeroCopy.style.setProperty('--hero-copy-y',`${heroProgress*(mobile?-8:-35)}px`);
  scrollMarquee.firstElementChild.style.setProperty('--marquee-x',`${-clampScroll((height-marqueeRect.top)/(height+marqueeRect.height))*(mobile?60:180)}px`);
  const contactProgress=clampScroll((height-contactRect.top)/(height*.65));
  scrollContact.style.setProperty('--contact-round',`${(1-contactProgress)*(mobile?40:110)}px`);
  document.querySelector('.contact-circle').style.setProperty('--contact-button-y',`${(1-contactProgress)*60}px`);
  scrollScenes.forEach(({section,last},index)=>{
    const enter=clampScroll((height-sceneRects[index].top)/(height*.72));
    const next=last?null:sceneRects[index+1];
    const exit=next?clampScroll((height-next.top)/(height*.85)):0;
    section.style.setProperty('--scene-dim',String(1-exit*.16));
    section.style.setProperty('--scene-radius',`${(1-enter)*(mobile?30:65)+exit*(mobile?12:24)}px`);
  });
}
const blockObserver=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('scroll-visible',entry.isIntersecting)),{threshold:.06,rootMargin:'0px 0px -30px 0px'});
document.querySelectorAll('.expertise-grid article,.timeline article,.recommendation,.stats>div,.about-copy>p+ p').forEach((element,index)=>{element.classList.add('scroll-block');element.style.setProperty('--block-delay',`${index%3*100}ms`);blockObserver.observe(element)});
function updateScrollPreference(){document.documentElement.classList.toggle('scroll-motion',!scrollPreference.matches);measureScrollScenes()}
prepareScrollText();updateScrollPreference();
scrollPreference.addEventListener('change',updateScrollPreference);
document.addEventListener('portfolio:languagechange',prepareScrollText);
addEventListener('scroll',scheduleScrollFrame,{passive:true});addEventListener('resize',measureScrollScenes);
const filterLayoutObserver=new MutationObserver(scheduleScrollFrame);
filterLayoutObserver.observe(document.querySelector('.work'),{subtree:true,attributes:true,attributeFilter:['hidden']});
const sceneSizeObserver=new ResizeObserver(measureScrollScenes);
scrollScenes.forEach(({section})=>sceneSizeObserver.observe(section));
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
  const hash=link.getAttribute('href');const target=hash==='#'?null:document.querySelector(hash);
  const scene=target?.closest('.section-track');if(hash!=='#'&&!scene)return;
  event.preventDefault();const top=scene?scene.getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight:0;
  if(location.hash!==hash)history.pushState(null,'',hash);
  window.scrollTo({top,behavior:scrollPreference.matches?'auto':'smooth'});
}));
if(document.fonts)document.fonts.ready.then(measureScrollScenes);
addEventListener('load',measureScrollScenes);
