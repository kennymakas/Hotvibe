import { useEffect, useRef, useState } from "react";

const CLIENT_ID = "ca-pub-9201085628594562";
const SLOT_ID = "3586225434";

export default function AdSense({ className = "" }) {
  const adRef = useRef(null);
  const pushedRef = useRef(false);
  const [unfilled, setUnfilled] = useState(false);

  useEffect(() => {
    const ad = adRef.current;
    if (!ad || pushedRef.current) return undefined;

    let cancelled = false;
    let timer;

    const pushAd = () => {
      if (cancelled || pushedRef.current || !adRef.current) return;
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        pushedRef.current = true;
      } catch (error) {
        // The script may still be loading. Retry briefly instead of pushing
        // multiple times from React renders.
        if (!cancelled) timer = window.setTimeout(pushAd, 250);
      }
    };

    // The script is loaded globally in index.html. Wait for it if necessary.
    if (window.adsbygoogle) {
      pushAd();
    } else {
      timer = window.setTimeout(pushAd, 250);
    }

    const observer = new MutationObserver(() => {
      const status = ad.getAttribute("data-ad-status");
      setUnfilled(status === "unfilled");
    });
    observer.observe(ad, { attributes: true, attributeFilter: ["data-ad-status"] });

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={`adsense-wrap${unfilled ? " adsense-unfilled" : ""}${className ? ` ${className}` : ""}`}>
      <span className="adsense-label">Advertisement</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={SLOT_ID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
