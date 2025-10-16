import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface PlatformCardProps {
  logo?: boolean;
  headline: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
  gradient: string;
}

const PlatformCard = ({ logo, headline, description, ctaText, ctaUrl, gradient }: PlatformCardProps) => {
  return (
    <Card className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${gradient}`} />
      
      <CardHeader className="space-y-4">
        {logo && (
          <div className="w-16 h-16 rounded-xl bg-gradient-primary/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-lg bg-primary/30" />
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

        <Button 
          variant="ghost" 
          className="w-full justify-between group-hover:bg-primary/10 group-hover:text-primary transition-all"
          asChild
        >
          <a href={ctaUrl} target="_blank" rel="noopener noreferrer">
            {ctaText}
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlatformCard;
