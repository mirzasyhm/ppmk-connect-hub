import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeftRight, Clock, MessageCircle, User } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchUserProfile = async () => {
    if (userProfile || loading) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", exchange.user_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user profile:", error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactUser = () => {
    fetchUserProfile();
    setIsContactOpen(true);
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
            <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
              <DialogTrigger asChild>
                <Button variant="brutal" size="sm" className="font-bold uppercase" onClick={handleContactUser}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Contact Exchange Partner</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="border border-foreground rounded p-4">
                    <h3 className="font-bold text-lg mb-2">Currency Exchange</h3>
                    <div className="flex items-center justify-center mb-4">
                      <div className="text-center">
                        <div className="text-sm font-bold">
                          {formatAmount(exchange.have_amount, exchange.have_currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">{exchange.have_currency}</div>
                      </div>
                      <ArrowLeftRight className="w-6 h-6 mx-4 text-primary" />
                      <div className="text-center">
                        <div className="text-sm font-bold">
                          {formatAmount(exchange.want_amount, exchange.want_currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">{exchange.want_currency}</div>
                      </div>
                    </div>
                    
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-muted-foreground">Loading user info...</span>
                      </div>
                    ) : userProfile ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted border border-foreground rounded flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {userProfile.display_name || userProfile.full_name || 'Exchange Partner'}
                            </p>
                            {userProfile.email && (
                              <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium">Contact Information:</h4>
                          <div className="text-sm space-y-1">
                            {userProfile.email && (
                              <p><strong>Email:</strong> {userProfile.email}</p>
                            )}
                            {userProfile.telephone_korea && (
                              <p><strong>Phone (Korea):</strong> {userProfile.telephone_korea}</p>
                            )}
                            {userProfile.telephone_malaysia && (
                              <p><strong>Phone (Malaysia):</strong> {userProfile.telephone_malaysia}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">Unable to load user information</p>
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