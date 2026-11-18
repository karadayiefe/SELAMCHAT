import { useState } from "react";
import { Copy, Expand, Sparkles } from "lucide-react";
import type { RoomCardData } from "@/lib/chatApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RoomCard({ card }: { card: RoomCardData }) {
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
      <aside className="room-card-aside">
        <button
          type="button"
          className="room-card-mini"
          onClick={() => setOpen(true)}
          aria-label="Sohbet Kartını büyüt"
          aria-haspopup="dialog"
        >
          <span className="room-card-mini-title">
            <Sparkles size={13} aria-hidden="true" />
            Sohbet Kartı
            <Expand size={13} className="room-card-expand" aria-hidden="true" />
          </span>
          <span className="room-card-mini-pair">
            <span className="room-card-mini-animal" style={{ color: first.color }}>{first.emoji}</span>
            <span className="room-card-x" aria-hidden="true">×</span>
            <span className="room-card-mini-animal" style={{ color: second.color }}>{second.emoji}</span>
          </span>
          <span className="room-card-mini-names">{first.name} × {second.name}</span>
          <code className="room-card-mini-code">{card.code}</code>
        </button>
      </aside>

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
