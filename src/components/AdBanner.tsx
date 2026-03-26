import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADS_CLIENT = "ca-pub-9547387897781374";
const ADS_SLOT = "6310002251";

export function AdBanner() {
  const adRef = useRef<HTMLModElement | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV || !adRef.current) {
      return;
    }

    let timeoutId: number | undefined;
    let attempts = 0;

    const requestAd = () => {
      const adElement = adRef.current;

      if (!adElement) {
        return;
      }

      if (adElement.getAttribute("data-adsbygoogle-status")) {
        return;
      }

      if (!window.adsbygoogle) {
        attempts += 1;

        if (attempts < 20) {
          timeoutId = window.setTimeout(requestAd, 250);
        } else {
          setLoadError(true);
        }

        return;
      }

      try {
        window.adsbygoogle.push({});
      } catch {
        setLoadError(true);
      }
    };

    requestAd();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <section className="relative z-10 mt-8 w-full">
      <div className="overflow-hidden rounded-[28px] bg-slate-950/35 p-3">
        {import.meta.env.DEV || loadError ? (
          <div className="min-h-[90px] w-full rounded-2xl  " />
        ) : (
          <ins
            ref={adRef}
            className="adsbygoogle block min-h-[90px] w-full overflow-hidden rounded-2xl  "
            style={{ display: "block" }}
            data-ad-client={ADS_CLIENT}
            data-ad-slot={ADS_SLOT}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        )}
      </div>
    </section>
  );
}
