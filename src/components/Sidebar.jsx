import { Flame, Home, Music2, Sparkles } from "lucide-react";
const items = [["For You",Home],["Trending",Flame],["Lifestyle",Sparkles],["Music",Music2]];
export default function Sidebar({ category, setCategory }) {
  return <aside className="sidebar">
    <nav className="sidebar-menu">{items.map(([label,Icon]) =>
      <button key={label} className={`sidebar-item ${category===label?"active":""}`} onClick={()=>setCategory(label)}>
        <Icon size={20}/><span>{label}</span>
      </button>)}</nav>
    <div className="sidebar-note"><strong>HotVibe</strong><p>Browse photos and videos. No public posting required.</p></div>
  </aside>;
}
