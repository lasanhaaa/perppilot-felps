import Image from "next/image";
import { AuthLogo, LogoMark } from "@/components/brand";

/**
 * Left half of every auth screen (Figma: "Sign up login" section).
 * The dotted map and its mono tags come from Figma as one image; the ETH tag on the
 * right edge is clipped in the export, so it is drawn again on top as text.
 */
export function AuthArt() {
  return (
    <aside aria-hidden="true" className="sticky top-0 hidden h-screen min-h-[720px] self-start overflow-hidden bg-canvas lg:block lg:w-[48.2%] lg:shrink-0">
      <Image src="/images/auth-bg.png" alt="" fill priority sizes="48vw" className="object-cover" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_30%,rgba(0,0,0,0.55)_100%)]" />

      <AuthLogo className="absolute top-[41px] left-[47px] z-10" />

      <div className="absolute top-[12.2%] left-[8%] w-[84%] max-w-[778px]">
        <div className="relative aspect-[778/693]">
          <Image src="/images/auth-world.png" alt="" fill sizes="45vw" className="object-contain mix-blend-lighten" />
          <div className="absolute top-[17.4%] left-[81.2%] flex flex-col gap-[7px] font-mono text-[clamp(9px,0.72vw,13px)] leading-none text-white uppercase">
            <span>ETH yield route</span>
            <span className="self-start bg-info-strong px-[6px] py-[4px]">Live strategy</span>
            <span>APY 08.42%</span>
          </div>
        </div>
      </div>

      <figure className="absolute right-[3.5%] bottom-[3%] left-[3.5%] z-10">
        <div className="absolute -top-[14px] left-[31px] flex gap-1">
          <span className="grid size-[29px] place-items-center bg-canvas">
            <LogoMark size={16} />
          </span>
          <span className="flex h-[29px] items-center bg-brand px-2 font-mono text-[14px] text-black uppercase">What they say</span>
        </div>
        <div className="bg-white px-[31px] pt-[38px] pb-[23px] text-black">
          <blockquote className="max-w-[800px] text-[clamp(15px,1.05vw,18px)] leading-[1.25] tracking-[-0.02em]">
            “A system that runs a liquidity style strategy to generate trading activity, accumulate volume, and target positive returns across
            markets.”
          </blockquote>
          <figcaption className="mt-6 flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold tracking-[-0.02em]">Jeff besos</span>
            <span className="text-[12px] text-black/40 uppercase">CEO Trade flow</span>
          </figcaption>
        </div>
      </figure>
    </aside>
  );
}
