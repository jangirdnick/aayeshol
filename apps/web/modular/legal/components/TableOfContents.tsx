'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Hash } from 'lucide-react';

export interface TocItem {
  id: string;
  title: string;
  badge?: string;
}

interface TableOfContentsProps {
  items: TocItem[];
  title?: string;
  className?: string;
}

export function TableOfContents({
  items,
  title = 'On this page',
  className,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = React.useState<string>(items[0]?.id || '');

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0% -60% 0%',
        threshold: 0,
      },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollTo = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      window.history.pushState(null, '', `#${id}`);
      setActiveId(id);
    }
  };

  return (
    <nav aria-label="Table of Contents" className={cn('flex flex-col gap-3 text-xs', className)}>
      <div className="flex items-center gap-2 pb-1 font-mono uppercase tracking-wider text-[10px] font-semibold text-muted-foreground/80">
        <Hash className="size-3 text-muted-foreground/60" />
        <span>{title}</span>
      </div>

      <ul className="flex flex-col border-l border-border/50 text-[13px]">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => scrollTo(item.id, e)}
                className={cn(
                  'group flex items-center justify-between py-1.5 pl-3.5 -ml-px border-l-2 transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'border-foreground font-medium text-foreground bg-foreground/[0.03]'
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground',
                )}
              >
                <span className="truncate">{item.title}</span>
                {item.badge && (
                  <span
                    className={cn(
                      'ml-2 rounded px-1.5 py-0.5 text-[9px] font-mono shrink-0 transition-colors',
                      isActive
                        ? 'bg-foreground text-background font-semibold'
                        : 'bg-muted/60 text-muted-foreground/80 border border-border/40',
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
