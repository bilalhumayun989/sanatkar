import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface TrendingListing {
  id: string;
  title: string;
  price: number | null;
  image_urls: string[] | null;
  brand: string | null;
  category: string | null;
}

interface Props {
  listings: TrendingListing[];
}

export default function TrendingSection({ listings }: Props) {
  const items = listings.slice(0, 12);
  if (items.length === 0) return null;

  // 3 columns × 4 rows — pad to nearest multiple of 4 so columns are balanced
  const col1 = items.slice(0, 4);
  const col2 = items.slice(4, 8);
  const col3 = items.slice(8, 12);
  const columns = [col1, col2, col3].filter(col => col.length > 0);

  return (
    <section aria-labelledby="trending-heading">

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-xl">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Trending across Pakistan
          </p>
          <h2
            id="trending-heading"
            className="text-2xl font-normal tracking-tight text-slate-900 sm:text-3xl"
          >
            Buyers are searching for these.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            The most-searched machinery, parts, and vehicles on Sanatkar this week.
          </p>
        </div>
        <Link
          href="/buyer"
          className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-[#006b80] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#005466] md:self-auto"
        >
          Explore All Trends
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* 3-col × 4-row grid */}
      <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-12">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="divide-y divide-slate-100">
            {col.map((item, rowIdx) => {
              const rank = colIdx * 4 + rowIdx + 1;
              return (
                <Link
                  key={`${item.id}-${rank}`}
                  href={`/buyer/${item.id}`}
                  className="group flex items-center gap-4 py-4 sm:py-5"
                >
                  {/* Rank */}
                  <span className="w-7 shrink-0 select-none text-left text-2xl font-light tabular-nums text-slate-200 transition-colors group-hover:text-slate-300">
                    {rank}
                  </span>

                  {/* Thumbnail */}
                  <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200/80 transition-all group-hover:ring-slate-300 sm:h-[84px] sm:w-[84px]">
                    {item.image_urls?.[0] ? (
                      <Image
                        src={item.image_urls[0]}
                        alt={item.title}
                        fill
                        sizes="84px"
                        loading="lazy"
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-medium tracking-wider text-slate-300">
                        {(item.brand ?? item.category ?? '?').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[15px] font-normal leading-snug text-slate-900 transition-colors group-hover:text-[#006b80]">
                      {item.title}
                    </p>
                    {item.brand && (
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {item.brand}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}