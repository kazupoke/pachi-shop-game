import { useEffect, useState } from "react";

interface ShareSheetProps {
  shareUrl: string;
  shareText: string;
  title: string;
  onClose: () => void;
}

/**
 * 汎用シェアシート (ボトムシート風モーダル)
 * - URLコピー / X / LINE / ネイティブ共有 (対応端末のみ)
 */
export function ShareSheet({ shareUrl, shareText, title, onClose }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement("textarea");
        ta.value = shareUrl;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const handleX = () => {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  const handleLine = () => {
    const intent = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  const canNative =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const handleNative = async () => {
    try {
      await navigator.share({ title, text: shareText, url: shareUrl });
    } catch {
      /* キャンセルは無視 */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full sm:max-w-sm bg-bg-panel border-t-4 sm:border-2 border-bg-card p-4 sm:m-4 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-pixel text-[11px] text-pachi-pink mb-3 text-center">
          ▶ お店をシェア
        </p>

        <div className="grid grid-cols-2 gap-2">
          {canNative && (
            <button
              onClick={handleNative}
              className="pixel-btn-secondary text-xs py-3 col-span-2"
            >
              📤 共有メニューを開く
            </button>
          )}
          <button
            onClick={handleCopy}
            className="pixel-btn-secondary text-xs py-3"
          >
            {copied ? "✓ コピーしました" : "🔗 URLをコピー"}
          </button>
          <button onClick={handleX} className="pixel-btn-secondary text-xs py-3">
            𝕏 で投稿
          </button>
          <button
            onClick={handleLine}
            className="text-xs py-3 font-dot border-2 bg-[#06c755] text-white border-[#06c755] col-span-2"
          >
            LINE で送る
          </button>
        </div>

        <div className="mt-3 bg-bg-base border-2 border-bg-card p-2 break-all text-[10px] text-white/60">
          {shareUrl}
        </div>

        <button
          onClick={onClose}
          className="pixel-btn-secondary w-full mt-3 text-xs"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
