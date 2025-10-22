import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, LucideIcon } from "lucide-react";

interface PlatformCardProps {
  logo?: boolean;
  headline: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  gradient: string;
  icon?: LucideIcon;
}

const PlatformCard = ({ logo, headline, description, ctaText, ctaUrl, gradient, icon: Icon }: PlatformCardProps) => {
  return (
    <a href={ctaUrl} target="_blank" rel="noopener noreferrer" className="block">
      <Card className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 h-full">
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${gradient}`} />
        
        <CardHeader className="space-y-4">
          {logo && Icon && (
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${gradient}`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          )}
          
          <CardTitle className="text-2xl font-bold group-hover:gradient-text transition-all">
            {headline}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <CardDescription className="text-base text-muted-foreground leading-relaxed">
            {description}
          </CardDescription>

          <div className="w-full flex justify-between items-center text-sm text-muted-foreground group-hover:text-primary transition-all">
            <span>{ctaText}</span>
            <ExternalLink className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </a>
  );
};

export default PlatformCard;
