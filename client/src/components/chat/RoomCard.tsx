import { useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import type { RoomCardData } from "@/lib/chatApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RoomCard({ card, size = "default" }: { card: RoomCardData; size?: "default" | "large" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [first, second] = card.animals;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(card.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`btn btn-ghost ${size === "large" ? "room-card-trigger room-card-trigger--large" : "btn-sm room-card-trigger"} shrink-0`}
        onClick={() => setOpen(true)}
        aria-label="Sohbet Kartını aç"
        aria-haspopup="dialog"
      >
        <Sparkles size={size === "large" ? 15 : 13} aria-hidden="true" />
        <span>Sohbet Kartı</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="room-card-dialog">
          <DialogHeader>
            <DialogTitle>Sohbet Kartı</DialogTitle>
            <DialogDescription>Bu oda için ortak, geçici eşleşme kartı.</DialogDescription>
          </DialogHeader>
          <div className="room-card-large">
            <div className="room-card-large-pair">
              <div className="room-card-large-animal">
                <span style={{ color: first.color }}>{first.emoji}</span>
                <b>{first.name}</b>
              </div>
              <span className="room-card-large-x" aria-hidden="true">×</span>
              <div className="room-card-large-animal">
                <span style={{ color: second.color }}>{second.emoji}</span>
                <b>{second.name}</b>
              </div>
            </div>
            <code className="room-card-large-code">{card.code}</code>
            <button type="button" className="btn btn-ghost room-card-copy" onClick={() => void copyCode()}>
              <Copy size={15} aria-hidden="true" />
              {copied ? "Kopyalandı" : "Kodu kopyala"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
