import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Clock, MessageCircle } from "lucide-react";

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
  };
}

export const CurrencyExchangeCard = ({ exchange }: CurrencyExchangeCardProps) => {
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
            <Button variant="brutal" size="sm" className="font-bold uppercase">
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};