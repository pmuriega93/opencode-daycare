import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { IconBox } from "@/components/ui/IconBox";
import { IconSun } from "@/components/ui/Icons";
import type { Invitation } from "@/lib/types/auth";

type ActivationFormProps = {
  invitation: Invitation;
};

export function ActivationForm({ invitation }: ActivationFormProps) {
  return (
    <div className="w-full max-w-[440px]">
      <IconBox
        bg="linear-gradient(155deg,#F8C3A8,#F2937A)"
        color="#fff"
        size={58}
        radius={18}
        className="mb-[22px] shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]"
      >
        <IconSun size={30} strokeWidth={2.2} />
      </IconBox>

      <h1 className="mb-2 font-fredoka text-[32px] leading-[1.15] font-semibold text-text">
        Bienvenida a OpenDayCare
      </h1>
      <p className="mb-[26px] text-[15.5px] leading-[1.55] text-muted">
        Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar
        la cuenta.
      </p>

      <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-line-input bg-white px-4 py-[14px]">
        <Avatar
          initial={invitation.initial}
          bg={invitation.avatarBg}
          textColor={invitation.avatarText}
          size={44}
        />
        <div>
          <div className="text-[13px] text-muted">Te invitaron a seguir a</div>
          <div className="font-fredoka text-[17px] font-semibold text-text">
            {invitation.kidName} · {invitation.roomLabel}
          </div>
        </div>
      </div>

      <FormField
        label="CÓDIGO DE INVITACIÓN"
        defaultValue={invitation.code}
        inputClassName="mb-[18px] font-fredoka text-[18px]! font-bold tracking-[3px]"
      />
      <FormField
        label="EMAIL"
        type="email"
        defaultValue={invitation.email}
        inputClassName="mb-[18px]"
      />
      <FormField
        label="CREAR CONTRASEÑA"
        type="password"
        defaultValue={invitation.password}
        inputClassName="mb-[18px] border-[#F2A78E]!"
      />

      <label className="relative mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-[14px]">
        <input type="checkbox" defaultChecked className="peer sr-only" />
        <span className="mt-px h-6 w-6 flex-none rounded-[8px] bg-[#5FB97E]" />
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-[20.5px] top-[19.5px] opacity-0 peer-checked:opacity-100"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="text-[14px] leading-[1.45] text-[#8A7234]">
          {invitation.consentText}
        </span>
      </label>

      <Button
        href="/familia/feed"
        className="w-full p-[15px]! rounded-[15px]! text-[16px]! shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]!"
      >
        Activar mi cuenta
      </Button>

      <p className="mt-[22px] text-center text-[14.5px] text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-extrabold text-accent-2">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
