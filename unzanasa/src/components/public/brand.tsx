"use client";

import Link from "next/link";
import { UNZA_LOGO, UNZANASA_LOGO } from "@/lib/brand-logos";

/** UNZANASA + UNZA lockup used in the public navbar and footer. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="flex items-center gap-1.5">
        <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg" style={{ background: "#006633", border: "2px solid #006633" }} title="University of Zambia">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={UNZA_LOGO} alt="UNZA" className="h-full w-full object-cover" />
        </span>
        <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-black/5" title="UNZANASA">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={UNZANASA_LOGO} alt="UNZANASA" className="h-full w-full object-contain p-0.5" />
        </span>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-[15px] font-black tracking-tight text-white">UNZANASA</div>
          <div className="text-[9.5px] text-white/55">Univ. of Zambia Natural Sciences Student Assoc.</div>
        </div>
      )}
    </Link>
  );
}
