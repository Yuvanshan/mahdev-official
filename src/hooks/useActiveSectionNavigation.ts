import { useEffect, useMemo, useState } from 'react';

interface SectionNavigationItem {
  id: string;
  href: string;
}

export function useActiveSectionNavigation(
  items: readonly SectionNavigationItem[],
  resetKey: string,
  enabled = true
) {
  const [activeId, setActiveId] = useState('home');
  const itemSignature = useMemo(
    () => items.map(({ id, href }) => `${id}:${href}`).join('|'),
    [items]
  );

  useEffect(() => {
    const homeId = items.find((item) => !item.href.includes('#'))?.id || 'home';
    setActiveId(homeId);
    if (!enabled) return;

    const sectionItems = items.filter((item) => item.href.includes('#'));
    const updateActiveSection = () => {
      const navigation = document.querySelector('.public-nav-shell');
      const threshold = (navigation?.getBoundingClientRect().bottom || 0) + 32;
      let nextActiveId = homeId;

      for (const item of sectionItems) {
        const sectionId = item.href.split('#').pop();
        const section = sectionId ? document.getElementById(sectionId) : null;
        if (section && section.getBoundingClientRect().top <= threshold) {
          nextActiveId = item.id;
        }
      }

      setActiveId((current) => current === nextActiveId ? current : nextActiveId);
    };

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);
    window.addEventListener('hashchange', updateActiveSection);
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
      window.removeEventListener('hashchange', updateActiveSection);
    };
  }, [enabled, itemSignature, resetKey]);

  return { activeId, setActiveId };
}
