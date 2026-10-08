const categories = ["For You", "Trending", "Lifestyle"];
export default function CategoryTabs({ category, setCategory }) {
  return <div className="category-tabs">
    {categories.map(item => <button key={item} className={`category-tab ${category===item?"active":""}`} onClick={()=>setCategory(item)}>{item}</button>)}
  </div>;
}
