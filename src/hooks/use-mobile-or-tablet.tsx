import * as React from "react";

// Matches Tailwind's `xl` breakpoint (1280px). Anything below is considered
// mobile or tablet for the floating-dialog UX on the Dashboard.
const BREAKPOINT = 1280;

export function useIsMobileOrTablet() {
  const [isSmall, setIsSmall] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINT - 1}px)`);
    const onChange = () => setIsSmall(window.innerWidth < BREAKPOINT);
    mql.addEventListener("change", onChange);
    setIsSmall(window.innerWidth < BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isSmall;
}
