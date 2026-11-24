"use client";

import { createContext, useContext, useEffect, useRef, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { usePopover } from "@/components/ui/usePopover";

const MenuContext = createContext<{ close: () => void }>({ close: () => {} });

type MenuProps = {
  /** Accessible name and tooltip of the trigger button. */
  label: string;
  trigger: ReactNode;
  align?: "left" | "right";
  triggerClassName?: string;
  children: ReactNode;
};

/**
 * Dropdown menu with the usual keyboard behaviour: Enter/Space/ArrowDown opens and focuses the
 * first item, arrows/Home/End move, Escape closes and refocuses the trigger, Tab closes.
 * The panel stays mounted while closed (hidden) so a <form> inside it can still submit.
 */
export function Menu({ label, trigger, align = "right", triggerClassName = "", children }: MenuProps) {
  const { open, setOpen, rootRef } = usePopover();
  const panelRef = useRef<HTMLDivElement>(null);
  const items = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []);

  useEffect(() => {
    if (open) items()[0]?.focus();
  }, [open]);

  function onPanelKeyDown(e: KeyboardEvent) {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    const move = (to: number) => {
      e.preventDefault();
      list[(to + list.length) % list.length]?.focus();
    };
    if (e.key === "ArrowDown") move(i + 1);
    else if (e.key === "ArrowUp") move(i - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(list.length - 1);
    else if (e.key === "Tab") setOpen(false);
  }

  return (
    <MenuContext.Provider value={{ close: () => setOpen(false) }}>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          data-popover-trigger
          title={label}
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && !open) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className={triggerClassName}
        >
          {trigger}
        </button>
        <div
          ref={panelRef}
          role="menu"
          aria-label={label}
          hidden={!open}
          onKeyDown={onPanelKeyDown}
          className={`absolute z-30 mt-1.5 min-w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      </div>
    </MenuContext.Provider>
  );
}

type ItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "role"> & { icon?: ReactNode; danger?: boolean };

/** A menu entry. Closes the menu when chosen; `type="submit"` entries work inside a <form>. */
export function MenuItem({ icon, danger, children, onClick, type = "button", className = "", ...rest }: ItemProps) {
  const { close } = useContext(MenuContext);
  return (
    <button
      type={type}
      role="menuitem"
      onClick={(e) => {
        onClick?.(e);
        close();
      }}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm focus-visible:bg-zinc-100 focus-visible:outline-none ${
        danger ? "text-red-700 hover:bg-red-50 focus-visible:bg-red-50" : "text-zinc-800 hover:bg-zinc-100"
      } ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-3 py-2 text-xs text-zinc-600">{children}</div>;
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-zinc-100" />;
}
