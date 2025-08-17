import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, DollarSign, Clock } from "lucide-react";

interface MarketplaceCardProps {
  item: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    category: string;
    condition: string;
    status: string;
    created_at: string;
    image_url?: string;
  };
}

export const MarketplaceCard = ({ item }: MarketplaceCardProps) => {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-primary text-primary-foreground';
      case 'like_new': return 'bg-secondary text-secondary-foreground';
      case 'good': return 'bg-muted text-muted-foreground';
      case 'fair': return 'bg-muted text-muted-foreground';
      case 'poor': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-primary text-primary-foreground';
      case 'sold': return 'bg-destructive text-destructive-foreground';
      case 'reserved': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="border-2 border-foreground shadow-brutal">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-muted-foreground uppercase">MARKETPLACE</span>
          </div>
          <Badge className={`${getStatusColor(item.status)} border border-foreground font-bold uppercase`}>
            {item.status}
          </Badge>
        </div>
        <h3 className="text-xl font-bold text-foreground uppercase">{item.title}</h3>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {item.image_url && (
          <img 
            src={item.image_url} 
            alt={item.title}
            className="w-full h-48 object-cover border-2 border-foreground"
          />
        )}
        
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <span className="text-2xl font-bold text-foreground">
            {item.currency === 'USD' ? '$' : item.currency}{item.price}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Badge className={`${getConditionColor(item.condition)} border border-foreground font-bold uppercase`}>
            {item.condition.replace('_', ' ')}
          </Badge>
          <Badge className="bg-muted text-muted-foreground border border-foreground font-bold uppercase">
            {item.category}
          </Badge>
        </div>
        
        <p className="text-foreground leading-relaxed">{item.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {new Date(item.created_at).toLocaleDateString()}
          </div>
          
          {item.status === 'available' && (
            <Button variant="brutal" className="font-bold uppercase">
              Contact Seller
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};