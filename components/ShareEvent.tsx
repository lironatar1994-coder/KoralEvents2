"use client";
import { useEffect, useState } from "react";
import { MessageCircle, Share2 } from "lucide-react";
/*
 * "Ask a friend first": share the event before signing up. Uses the phone's
 * share sheet when there is one, otherwise opens a ready WhatsApp message.
 */
export function ShareEvent({ title, when }: { title: string; when: string }) {
  const [native, setNative] = useState(false);
  // The page address is only known in the browser; keep the first render
  // identical to the server's and fill the link in afterwards.
  const [link, setLink] = useState("");
  useEffect(() => {
    setNative("share" in navigator);
    setLink(window.location.href.split("#")[0]);
  }, []);
  const text = `היי! ראיתי ערב שנראה לי בשבילנו: ״${title}״, ${when}. בואי איתי?`;
  async function share() {
    try {
      await navigator.share({ title, text, url: link });
    } catch {
      /* closed the sheet */
    }
  }
  if (native)
    return (
      <button type="button" className="k-share" onClick={share}>
        <Share2 size={16} /> שתפי עם חברה
      </button>
    );
  return (
    <a
      className="k-share"
      href={`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`}
      target="_blank"
      rel="noreferrer"
    >
      <MessageCircle size={16} /> שתפי עם חברה בוואטסאפ
    </a>
  );
}
