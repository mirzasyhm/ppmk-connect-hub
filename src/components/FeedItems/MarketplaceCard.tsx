import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, DollarSign, Clock, MessageCircle, User } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContactSeller = async () => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to contact the seller.",
          variant: "destructive",
        });
        return;
      }

      // Don't allow users to message themselves
      if (user.id === item.seller_id) {
        toast({
          title: "Cannot contact yourself",
          description: "You cannot message your own listing.",
          variant: "destructive",
        });
        return;
      }

      // Check if conversation already exists
      const { data: existingConversation, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${item.seller_id}),and(participant_1.eq.${item.seller_id},participant_2.eq.${user.id})`)
        .maybeSingle();

      if (convError && convError.code !== 'PGRST116') {
        console.error("Error checking existing conversation:", convError);
        throw convError;
      }

      let conversationId = existingConversation?.id;

      // Create new conversation if doesn't exist
      if (!conversationId) {
        const { data: newConversation, error: createError } = await supabase
          .from("conversations")
          .insert({
            participant_1: user.id,
            participant_2: item.seller_id
          })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating conversation:", createError);
          throw createError;
        }

        conversationId = newConversation.id;

        // Send initial message about the item
        await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: `Hi! I'm interested in your listing: ${item.title} (${item.currency === 'USD' ? '$' : item.currency}${item.price})`,
            message_type: "text"
          });
      }

      // Navigate to messages page
      navigate("/messages");
      
      toast({
        title: "Message started",
        description: "Opening conversation with seller...",
      });

    } catch (error: any) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation with seller.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
            <Button 
              variant="brutal" 
              className="font-bold uppercase" 
              onClick={handleContactSeller}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Starting...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message Seller
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};