import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Play } from "lucide-react";

export default function TrendingSlider({ posts, onOpen }) {
  const trending = useMemo(() => posts.filter(p=>p.category==="Trending")
    .sort((a,b)=>(Number(b.views||0)-Number(a.views||0)) || (new Date(b.createdAt||0)-new Date(a.createdAt||0))).slice(0,8), [posts]);
  const [index,setIndex]=useState(0);

  useEffect(()=>{
    if (!trending.length) return;
    if (index>=trending.length) setIndex(0);
    const timer=setInterval(()=>setIndex(i=>(i+1)%trending.length),5000);
    return ()=>clearInterval(timer);
  },[trending.length,index]);

  if (!trending.length) return null;
  const post=trending[index];

  return <section className="trending-slider" aria-label="Trending media">
    <div className="trending-slider-heading">
      <div><span className="slider-kicker"><Flame size={14}/> TRENDING NOW</span><h2>What's hot on HotVibe</h2></div>
      <span className="slider-count">{index+1}/{trending.length}</span>
    </div>
    <button className="slider-media" onClick={()=>onOpen?.(post)}>
      {post.video ? <video src={post.video} muted autoPlay loop playsInline preload="metadata"/> :
        <img src={post.image} alt={post.title||"Trending media"}/>}
      <span className="slider-caption">{post.video&&<Play size={14} fill="currentColor"/>}{post.title||"Trending post"}</span>
    </button>
    {trending.length>1 && <>
      <button className="slider-arrow slider-prev" onClick={()=>setIndex((index-1+trending.length)%trending.length)} aria-label="Previous"><ChevronLeft size={20}/></button>
      <button className="slider-arrow slider-next" onClick={()=>setIndex((index+1)%trending.length)} aria-label="Next"><ChevronRight size={20}/></button>
      <div className="slider-dots">{trending.map((p,i)=><button key={p.id} className={i===index?"active":""} onClick={()=>setIndex(i)} aria-label={`Show trending ${i+1}`}/>)}</div>
    </>}
  </section>;
}
