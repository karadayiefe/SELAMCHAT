import { useState } from "react";
import { Check, Moon, Settings2, Sparkles, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const options: { id: Theme; label: string; description: string; icon: typeof Moon }[] = [
  { id: "dark", label: "Koyu", description: "", icon: Moon },
  { id: "light", label: "Açık", description: "", icon: Sun },
  { id: "vice-city", label: "GTA 6 · Vice City", description: "Özel tema", icon: Sparkles },
];

export function ThemeSettings() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <>
      <button
        type="button"
        className="settings-trigger"
        onClick={() => setOpen(true)}
        aria-label="Ayarları aç"
        title="Ayarlar"
      >
        <Settings2 size={16} aria-hidden="true" />
        <span>Ayarlar</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="settings-dialog">
          <DialogHeader>
            <DialogTitle>Ayarlar</DialogTitle>
            <DialogDescription>Görünüm temasını seç.</DialogDescription>
          </DialogHeader>
          <div className="theme-options" role="group" aria-label="Tema seçimi">
            {options.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`theme-option${theme === id ? " theme-option--selected" : ""}`}
                onClick={() => setTheme(id)}
                aria-pressed={theme === id}
              >
                <span className={`theme-swatch theme-swatch--${id}`} aria-hidden="true">
                  <Icon size={19} />
                </span>
                <span className="theme-option-copy">
                  <span className="theme-option-title">{label}</span>
                  {description && <span className="theme-option-description">{description}</span>}
                </span>
                {theme === id && <Check className="theme-option-check" size={18} aria-label="Seçili" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
