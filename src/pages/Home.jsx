import CategoryTabs from "../components/CategoryTabs";
import TrendingSlider from "../components/TrendingSlider";
import PostCard from "../components/PostCard";
import { useEffect, useMemo, useState } from "react";

export default function Home({posts,category,setCategory,search,liked,saved,onLike,onSave,onComment,onView,targetPostId}) {
  useEffect(()=>{
    if(!targetPostId||!posts.length)return;
    const timer=setTimeout(()=>document.getElementById(`post-${targetPostId}`)?.scrollIntoView({behavior:"smooth",block:"start"}),250);
    return ()=>clearTimeout(timer);
  },[targetPostId,posts.length]);

  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;

  const filtered=useMemo(()=>{
    const query=search.trim().toLowerCase();
    const list=posts.filter(post=>{
      const categoryMatch=category==="For You"||post.category===category;
      const searchMatch=!query||String(post.title||"").toLowerCase().includes(query)||post.tags?.some(tag=>tag.toLowerCase().includes(query));
      return categoryMatch&&searchMatch;
    });

    // Always put the newest published posts first.
    return list.sort((a,b)=>new Date(b.createdAt||0).getTime()-new Date(a.createdAt||0).getTime());
  },[posts,category,search]);

  useEffect(()=>{
    setCurrentPage(1);
  },[category,search]);

  useEffect(()=>{
    const maxPage = Math.max(1, Math.ceil(filtered.length / postsPerPage));
    if (currentPage > maxPage) setCurrentPage(maxPage);
  },[filtered.length,currentPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / postsPerPage));
  const pagePosts = filtered.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openTrendingPost=(post)=>{
    setCategory("Trending");
    setTimeout(()=>document.getElementById(`post-${post.id}`)?.scrollIntoView({behavior:"smooth",block:"start"}),50);
  };

  return <main className="home">
    <TrendingSlider posts={posts} onOpen={openTrendingPost}/>
    <CategoryTabs category={category} setCategory={setCategory}/>
    <div className="feed">{filtered.length?pagePosts.map(post=><PostCard key={post.id} post={post}
      liked={liked.includes(post.id)} saved={saved.includes(post.id)} onLike={onLike} onSave={onSave} onComment={onComment} onView={onView}/>)
      :<div className="empty-feed"><h2>No posts found</h2><p>Try another category or search term.</p></div>}

      {filtered.length > 0 && (
        <nav className="feed-pagination" aria-label="Post pages">
          {Array.from({ length: Math.max(3, totalPages) }, (_, index) => index + 1).slice(0, Math.max(3, totalPages)).map(page => (
            <button
              key={page}
              type="button"
              className={currentPage === page ? "active" : ""}
              onClick={() => goToPage(page)}
              disabled={page > totalPages}
              aria-current={currentPage === page ? "page" : undefined}
              aria-label={`Load post page ${page}`}
            >{page}</button>
          ))}
        </nav>
      )}
    </div>
  </main>;
}
