import { IconBox } from "@/components/ui/IconBox";
import { IconSun } from "@/components/ui/Icons";

export function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] px-[60px] py-[56px] text-white lg:flex">
      <div className="pointer-events-none absolute -right-[120px] -top-[140px] h-[420px] w-[420px] rounded-full bg-white/[.12]" />
      <div className="pointer-events-none absolute -bottom-[110px] -left-[80px] h-[300px] w-[300px] rounded-full bg-white/[.10]" />

      <div className="relative flex items-center gap-[13px]">
        <IconBox bg="rgba(255,255,255,.22)" color="#fff" size={46} radius={14}>
          <IconSun size={26} strokeWidth={2.2} />
        </IconBox>
        <span className="font-fredoka text-[21px] font-semibold tracking-[0.5px]">
          OpenDayCare
        </span>
      </div>

      <div className="relative">
        <h1 className="mb-[18px] font-fredoka text-[42px] leading-[1.12] font-semibold">
          El día de cada niño,
          <br />
          compartido con su familia.
        </h1>
        <p className="m-0 max-w-[430px] text-[17px] leading-[1.6] text-white/[.92]">
          Publicá momentos, gestioná las salas y mantené a las familias cerca,
          desde un solo lugar.
        </p>
      </div>

      <div className="relative text-[14px] text-white/[.9]">
        🌿 Guardería Sala Soles
      </div>
    </aside>
  );
}
