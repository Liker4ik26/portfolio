// Scroll is native. One scheduled frame reads geometry, then updates visual properties.
const scrollPreference=matchMedia('(prefers-reduced-motion: reduce)');
const clampScroll=value=>Math.max(0,Math.min(1,value));
const scrollStyleValues=new WeakMap();
function writeScrollStyle(element,property,value){
  let values=scrollStyleValues.get(element);
  if(!values){values=new Map();scrollStyleValues.set(element,values)}
  if(values.get(property)===value)return;
  values.set(property,value);element.style.setProperty(property,value);
}
let scrollHeaderHeight=100;
const scrollScenes=[...document.querySelectorAll('main>.section')].map((section,index,sections)=>{
  const track=document.createElement('div');track.className='section-track';track.style.zIndex=String(index+1);
  section.before(track);track.append(section);section.classList.add('scroll-scene');
  if(index===sections.length-1){section.classList.add('scroll-scene-last');track.classList.add('contact-track')}
  return {section,track,last:index===sections.length-1};
});
function measureScrollScenes(){
  const headerHeight=document.querySelector('.header').offsetHeight;
  const sectionHeights=scrollScenes.map(({section})=>section.offsetHeight);
  scrollHeaderHeight=headerHeight;
  writeScrollStyle(document.documentElement,'--scene-header-height',`${headerHeight}px`);
  scrollScenes.forEach(({section,track,last},index)=>{
    const sectionHeight=sectionHeights[index];
    const keepFactsReadable=['about','certificates'].includes(section.id)&&sectionHeight>innerHeight-headerHeight;
    const overlap=last||scrollPreference.matches||keepFactsReadable?0:Math.min(Math.round(innerHeight*(innerWidth<651?.45:.72)),sectionHeights[index+1]);
    writeScrollStyle(track,'--scene-overlap',`${overlap}px`);
    writeScrollStyle(track,'--scene-track-height',`${sectionHeight+overlap}px`);
    writeScrollStyle(section,'--scene-top',`${Math.min(headerHeight,innerHeight-sectionHeight)}px`);
  });
  scheduleScrollFrame();
}
let scrollTitles=[],readingWords=[],scrollFrame=0;
const scrollMedia=[...document.querySelectorAll('.commercial-cover,.portfolio-card .project-image')];
const scrollCards=[...document.querySelectorAll('.portfolio-card')];
const scrollLabels=[...document.querySelectorAll('.section-label')];
const scrollHero=document.querySelector('.hero'),scrollPortrait=document.querySelector('.portrait'),scrollBackdrop=document.querySelector('.portrait-backdrop');
const scrollHeroCopy=document.querySelector('.hero-copy'),scrollContact=document.querySelector('.contact');
const scrollReading=document.querySelector('.about-copy'),scrollContactButton=document.querySelector('.contact-circle');
const sectionNavigation=[...document.querySelectorAll('.header nav a[href^="#"]')];
let navigationDestination=null,currentSection=null;
function updateSectionNavigation(){
  const headerHeight=scrollHeaderHeight;
  if(navigationDestination!==null){
    if(Math.abs(scrollY-navigationDestination)>3)return;
    navigationDestination=null;
  }
  // Use each scene's track: sticky sections overlap during their transitions.
  let active=null;
  for(const {section,track} of scrollScenes){
    if(track.getBoundingClientRect().top<=headerHeight+8)active=section.id;
  }
  if(active===currentSection)return;
  currentSection=active;
  sectionNavigation.forEach(link=>{
    if(link.hash===`#${active}`)link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
  const hash=active?`#${active}`:'';
  if(location.hash!==hash)history.replaceState(null,'',`${location.pathname}${location.search}${hash}`);
}


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
  updateSectionNavigation();
  const height=innerHeight,mobile=innerWidth<651;
  const contactRect=scrollContact.getBoundingClientRect();
  const availableHeight=Math.max(1,height-scrollHeaderHeight);
  const contactCoverage=clampScroll((height-contactRect.top)/Math.max(1,Math.min(contactRect.height,availableHeight)));
  const backdrop=String(clampScroll((contactCoverage-.35)/.65));
  if(scrollPreference.matches){writeScrollStyle(scrollContact.parentElement,'--contact-backdrop',backdrop);return}
  const titleRects=scrollTitles.map(item=>item.heading.getBoundingClientRect());
  const mediaRects=scrollMedia.map(el=>el.getBoundingClientRect());
  const cardRects=scrollCards.map(el=>el.getBoundingClientRect());
  const labelRects=scrollLabels.map(el=>el.getBoundingClientRect());
  const heroRect=scrollHero.getBoundingClientRect();
  const readingRect=scrollReading.getBoundingClientRect();
  const sceneRects=scrollScenes.map(({track})=>track.getBoundingClientRect());
  writeScrollStyle(scrollContact.parentElement,'--contact-backdrop',backdrop);
  scrollTitles.forEach((item,index)=>{
    const rect=titleRects[index],progress=clampScroll((height*.95-rect.top)/(height*.36));
    item.lines.forEach((line,lineIndex)=>{const p=clampScroll(progress*1.2-lineIndex*.1);writeScrollStyle(line,'--title-y',`${(1-p)*110}%`);writeScrollStyle(line,'--title-rotate',`${(1-p)*2}deg`);writeScrollStyle(line,'--title-opacity',String(.2+p*.8))});
  });
  const readingProgress=clampScroll((height*.94-readingRect.top)/(height*.48));
  readingWords.forEach((word,index)=>writeScrollStyle(word,'--word-opacity',String(.38+.62*clampScroll(readingProgress*1.5-index/readingWords.length*.5))));
  scrollMedia.forEach((element,index)=>{
    const rect=mediaRects[index];if(rect.bottom< -100||rect.top>height+150)return;
    const enter=clampScroll((height*.98-rect.top)/(height*.37));
    const drift=(clampScroll((height-rect.top)/(height+rect.height))-.5)*(mobile?15:35);
    writeScrollStyle(element,'--media-mask',`${(1-enter)*32}%`);writeScrollStyle(element,'--media-y',`${drift}px`);
    const travel=clampScroll((height-rect.top)/(height+rect.height));
    writeScrollStyle(element,'--photo-scale',String(1+travel*(mobile?.07:.14)));
    writeScrollStyle(element,'--photo-y',`${(.5-travel)*(mobile?10:24)}px`);
    writeScrollStyle(element,'--photo-x',`${(travel-.5)*(index%2===0?1:-1)*(mobile?4:12)}px`);
  });
  scrollCards.forEach((card,index)=>{
    const rect=cardRects[index],p=clampScroll((height-rect.top)/(height*.65));
    writeScrollStyle(card,'--card-y',`${(1-p)*(mobile?20:[30,65,100][index%3])}px`);
  });
  scrollLabels.forEach((label,index)=>{const p=clampScroll((height*.96-labelRects[index].top)/(height*.3));writeScrollStyle(label,'--label-x',`${(1-p)*-24}px`);writeScrollStyle(label,'--label-opacity',String(.35+p*.65))});
  const heroProgress=clampScroll(-heroRect.top/Math.max(heroRect.height,1));
  writeScrollStyle(scrollPortrait,'--portrait-y',`${heroProgress*(mobile?12:45)}px`);
  writeScrollStyle(scrollBackdrop,'--portrait-drift',`${heroProgress*(mobile?15:70)}px`);
  writeScrollStyle(scrollHeroCopy,'--hero-copy-y',`${heroProgress*(mobile?-8:-35)}px`);
  const contactProgress=clampScroll((height-contactRect.top)/(height*.65));
  writeScrollStyle(scrollContact,'--contact-round',`${(1-contactProgress)*(mobile?40:110)}px`);
  writeScrollStyle(scrollContactButton,'--contact-button-y',`${(1-contactProgress)*60}px`);
  scrollScenes.forEach(({section,last},index)=>{
    const enter=clampScroll((height-sceneRects[index].top)/(height*.72));
    const next=last?null:sceneRects[index+1];
    const exit=next?clampScroll((height-next.top)/(height*.85)):0;
    writeScrollStyle(section,'--scene-dim',String(1-exit*.16));
    writeScrollStyle(section,'--scene-radius',`${(1-enter)*(mobile?30:65)+exit*(mobile?12:24)}px`);
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
function navigateToSection(hash,behavior){
  const target=hash==='#'||!hash?null:document.getElementById(hash.slice(1));
  const scene=target?.closest('.section-track');if(hash&&hash!=='#'&&!scene)return false;
  const top=scene?scene.getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight:0;
  navigationDestination=Math.max(0,Math.min(top,document.documentElement.scrollHeight-innerHeight));
  window.scrollTo({top:navigationDestination,behavior});
  scheduleScrollFrame();return true;
}
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
  const hash=link.getAttribute('href');
  if(!navigateToSection(hash,scrollPreference.matches?'instant':'smooth'))return;
  event.preventDefault();
  if(location.hash!==hash)history.pushState(null,'',hash);
}));
['wheel','touchstart','pointerdown','keydown'].forEach(type=>addEventListener(type,()=>{navigationDestination=null},{passive:true}));
addEventListener('popstate',()=>navigateToSection(location.hash,'instant'));
// Native hash scrolling happens before the sticky scene tracks have been measured.
const initialSectionHash=location.hash;
addEventListener('load',()=>{measureScrollScenes();if(initialSectionHash)navigateToSection(initialSectionHash,'instant')});
if(document.fonts)document.fonts.ready.then(measureScrollScenes);
addEventListener('load',measureScrollScenes);
