"use client";

import { ArrowLeftRight, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/Menu";
import { signOut } from "@/lib/actions";

export function UserMenu({ name, email }: { name: string; email: string }) {
  return (
    <Menu
      label="Account menu"
      align="right"
      triggerClassName="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-100"
      trigger={
        <>
          <Avatar name={name} size="sm" />
          <span className="hidden sm:inline">{name}</span>
          <ChevronDown size={15} aria-hidden className="text-zinc-500" />
        </>
      }
    >
      <MenuLabel>
        Signed in as <span className="font-medium text-zinc-900">{name}</span>
        <br />
        {email}
      </MenuLabel>
      <MenuSeparator />
      <form action={signOut} role="none">
        <MenuItem type="submit" icon={<ArrowLeftRight size={16} aria-hidden />}>
          Switch user
        </MenuItem>
      </form>
    </Menu>
  );
}
