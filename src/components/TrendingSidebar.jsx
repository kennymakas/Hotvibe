const trends = [
  ["#Kampala", "12.4K posts"],
  ["#Music", "9.8K posts"],
  ["#HotVibe", "8.7K posts"],
  ["#Culture", "6.3K posts"],
  ["#Weekend", "5.1K posts"],
];

export default function TrendingSidebar({ setSearch }) {
  return (
    <aside className="trending-sidebar">
      <section className="side-card">
        <div className="side-card-title">
          <h2>Trending Now</h2>
          <span>View all</span>
        </div>

        {trends.map(([tag, count], index) => (
          <button
            key={tag}
            className="trend-row"
            onClick={() => setSearch(tag)}
          >
            <b>{index + 1}.</b>
            <div>
              <strong>{tag}</strong>
              <small>{count}</small>
            </div>
          </button>
        ))}
      </section>

      <section className="side-card about-card">
        <h2>About HotVibe</h2>
        <p>A simple place to discover interesting photos, videos and stories.</p>
      </section>
    </aside>
  );
}
