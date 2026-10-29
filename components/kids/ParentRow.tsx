import { Avatar } from "@/components/ui/Avatar";
import type { Parent } from "@/lib/types/kids";

type ParentRowProps = {
  parent: Parent;
};

export function ParentRow({ parent }: ParentRowProps) {
  const statusConfig =
    parent.status === "active"
      ? {
          bg: "#CFEBD8",
          color: "#3E9B6C",
          label: "ACTIVA",
        }
      : {
          bg: "#F7E7A6",
          color: "#9A7B1E",
          label: "PENDIENTE",
        };

  const statusSubtitle =
    parent.status === "active" ? "activa" : "invitación enviada";

  return (
    <div className="flex items-center gap-3">
      <Avatar
        initial={parent.initial}
        bg={parent.avatarBg}
        textColor="#fff"
        size={40}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-extrabold text-text">
          {parent.name}
        </div>
        <div className="text-[12.5px] text-muted-2">
          {parent.role} · {statusSubtitle}
        </div>
      </div>
      <span
        className="flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold"
        style={{ background: statusConfig.bg, color: statusConfig.color }}
      >
        {statusConfig.label}
      </span>
    </div>
  );
}
