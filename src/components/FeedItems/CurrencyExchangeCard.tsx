import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeftRight, Clock, MessageCircle, User } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface CurrencyExchangeCardProps {
  exchange: {
    id: string;
    have_currency: string;
    have_amount: number;
    want_currency: string;
    want_amount: number;
    exchange_rate?: number;
    description?: string;
    status: string;
    created_at: string;
    user_id: string;
  };
}

export const CurrencyExchangeCard = ({ exchange }: CurrencyExchangeCardProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContactUser = async () => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to contact this user.",
          variant: "destructive",
        });
        return;
      }

      // Don't allow users to message themselves
      if (user.id === exchange.user_id) {
        toast({
          title: "Cannot contact yourself",
          description: "You cannot message your own exchange post.",
          variant: "destructive",
        });
        return;
      }

      // Check if conversation already exists
      const { data: existingConversation, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${exchange.user_id}),and(participant_1.eq.${exchange.user_id},participant_2.eq.${user.id})`)
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
            participant_2: exchange.user_id
          })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating conversation:", createError);
          throw createError;
        }

        conversationId = newConversation.id;

        // Send initial message about the exchange
        await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: `Hi! I'm interested in your currency exchange: ${formatAmount(exchange.have_amount, exchange.have_currency)} → ${formatAmount(exchange.want_amount, exchange.want_currency)}`,
            message_type: "text"
          });
      }

      // Navigate to messages page
      navigate("/messages");
      
      toast({
        title: "Message started",
        description: "Opening conversation...",
      });

    } catch (error: any) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-primary text-primary-foreground';
      case 'completed': return 'bg-secondary text-secondary-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'KRW': return '₩';
      case 'MYR': return 'RM';
      case 'USD': return '$';
      default: return currency;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${getCurrencySymbol(currency)}${amount.toLocaleString()}`;
  };

  return (
    <Card className="border-2 border-foreground shadow-brutal">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-muted-foreground uppercase">CURRENCY EXCHANGE</span>
          </div>
          <Badge className={`${getStatusColor(exchange.status)} border border-foreground font-bold uppercase`}>
            {exchange.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {formatAmount(exchange.have_amount, exchange.have_currency)}
            </div>
            <div className="text-sm text-muted-foreground uppercase font-bold">
              {exchange.have_currency}
            </div>
          </div>
          
          <div className="mx-6">
            <ArrowLeftRight className="w-8 h-8 text-primary" />
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {formatAmount(exchange.want_amount, exchange.want_currency)}
            </div>
            <div className="text-sm text-muted-foreground uppercase font-bold">
              {exchange.want_currency}
            </div>
          </div>
        </div>

        {exchange.exchange_rate && (
          <div className="text-center text-sm text-muted-foreground">
            Rate: 1 {exchange.have_currency} = {exchange.exchange_rate.toFixed(6)} {exchange.want_currency}
          </div>
        )}
        
        {exchange.description && (
          <p className="text-foreground leading-relaxed text-sm">{exchange.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {new Date(exchange.created_at).toLocaleDateString()}
          </div>
          
          {exchange.status === 'active' && (
            <Button 
              variant="brutal" 
              size="sm" 
              className="font-bold uppercase" 
              onClick={handleContactUser}
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
                  Message
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};