import { Flame, Search, Home, Sparkles } from "lucide-react";

export default function Navbar({ search, setSearch, category, setCategory }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a className="logo" href="/" aria-label="HotVibe home">
          <img src="/images/logo.png" alt="HotVibe" className="logo-image" />
        </a>
        <div className="search-container">
          <div className="search-wrap">
            <Search size={18} />
            <input className="search-box" value={search} onChange={(e)=>setSearch(e.target.value)}
              placeholder="Search HotVibe..." aria-label="Search HotVibe" />
          </div>
        </div>
        <div className="nav-brand"><Flame size={20} /><span>HotVibe</span></div>
      </div>
      <div className="mobile-search-bar search-wrap">
        <Search size={17} />
        <input className="search-box" value={search} onChange={(e)=>setSearch(e.target.value)}
          placeholder="Search HotVibe..." aria-label="Search HotVibe" />
      </div>
      <nav className="mobile-top-nav" aria-label="Mobile navigation">
        <button onClick={()=>setCategory("For You")} className={category==="For You"?"active":""}><Home size={17}/> Home</button>
        <button onClick={()=>setCategory("Trending")} className={category==="Trending"?"active":""}><Flame size={17}/> Trending</button>
        <button onClick={()=>setCategory("Lifestyle")} className={category==="Lifestyle"?"active":""}><Sparkles size={17}/> Lifestyle</button>
      </nav>
    </header>
  );
}
