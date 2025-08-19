import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, DollarSign, Clock, MessageCircle, User } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    seller_id: string;
  };
}

export const MarketplaceCard = ({ item }: MarketplaceCardProps) => {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSellerProfile = async () => {
    if (sellerProfile || loading) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", item.seller_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching seller profile:", error);
        return;
      }

      setSellerProfile(data);
    } catch (error) {
      console.error("Error fetching seller profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = () => {
    fetchSellerProfile();
    setIsContactOpen(true);
  };
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
            <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
              <DialogTrigger asChild>
                <Button variant="brutal" className="font-bold uppercase" onClick={handleContactSeller}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Seller
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Contact Seller</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border border-foreground rounded p-4">
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Price: {item.currency === 'USD' ? '$' : item.currency}{item.price}
                    </p>
                    
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-muted-foreground">Loading seller info...</span>
                      </div>
                    ) : sellerProfile ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted border border-foreground rounded flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {sellerProfile.display_name || sellerProfile.full_name || 'Seller'}
                            </p>
                            {sellerProfile.email && (
                              <p className="text-sm text-muted-foreground">{sellerProfile.email}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium">Contact Information:</h4>
                          <div className="text-sm space-y-1">
                            {sellerProfile.email && (
                              <p><strong>Email:</strong> {sellerProfile.email}</p>
                            )}
                            {sellerProfile.telephone_korea && (
                              <p><strong>Phone (Korea):</strong> {sellerProfile.telephone_korea}</p>
                            )}
                            {sellerProfile.telephone_malaysia && (
                              <p><strong>Phone (Malaysia):</strong> {sellerProfile.telephone_malaysia}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">Unable to load seller information</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setIsContactOpen(false)} 
                      variant="outline" 
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};