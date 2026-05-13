import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SHARE_TITLE = "DEMOCRATISING.AI";
const SHARE_TEXT = "The power of AI belongs to everyone.";
const SHARE_URL = "https://democratising.ai/";

const supportsNativeShare =
  typeof navigator !== "undefined" && typeof navigator.share === "function";

const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
  SHARE_TEXT
)}&url=${encodeURIComponent(SHARE_URL)}`;
const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
  SHARE_URL
)}`;

const shareLabel = "Got a network? Spread the word.";
const shareTriggerClasses =
  "text-left text-foreground/85 hover:text-accent transition-colors focus:outline-none focus-visible:underline";

const FinalCTA = () => {
  const [copied, setCopied] = useState(false);

  const scrollToEcosystem = () => {
    document.getElementById("ecosystem")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: SHARE_TITLE,
        text: SHARE_TEXT,
        url: SHARE_URL,
      });
    } catch {
      // user cancelled or share failed; no fallback needed
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard write blocked; silently fail
    }
  };

  return (
    <section className="py-20 md:py-28 bg-background border-t border-border/60">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="max-w-3xl">
          <p className="eyebrow mb-5">Get involved</p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-8">
            Join the movement.
          </h2>

          <p className="text-lg md:text-xl text-foreground/85 leading-relaxed mb-10">
            The power of AI belongs to everyone. We're a collective of thinkers, makers, and leaders shaping a more accessible AI future, together.
          </p>

          <ul className="space-y-3 border-l-2 border-accent pl-6 mb-12 text-lg text-foreground/85">
            <li>Got something to say? Write for the regional network.</li>
            <li>Got expertise to share? Join us as a trainer.</li>
            <li>Got an idea worth covering? Tell us about it.</li>
            <li>
              {supportsNativeShare ? (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className={shareTriggerClasses}
                >
                  {shareLabel}
                </button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className={shareTriggerClasses}>
                      {shareLabel}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem asChild>
                      <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Share on X
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Share on LinkedIn
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault();
                        handleCopyLink();
                      }}
                    >
                      {copied ? "Copied" : "Copy link"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-7 py-6 h-auto rounded-sm font-semibold"
              asChild
            >
              <a href="mailto:hello@democratising.ai">Get in touch</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={scrollToEcosystem}
              className="border-foreground/40 bg-transparent text-foreground hover:bg-foreground/10 hover:border-foreground/60 text-base px-7 py-6 h-auto rounded-sm font-semibold"
            >
              Explore the ecosystem
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
