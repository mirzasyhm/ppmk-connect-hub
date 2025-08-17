import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarketplaceCard } from "@/components/FeedItems/MarketplaceCard";
import { Plus, Search, ArrowLeftRight, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface MarketplaceItem {
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
}

export const Marketplace = () => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [exchangeAmount, setExchangeAmount] = useState("");
  const [exchangeFrom, setExchangeFrom] = useState("KRW");
  const [exchangeTo, setExchangeTo] = useState("MYR");
  const [exchangeRate, setExchangeRate] = useState(0.0034); // Example rate

  useEffect(() => {
    fetchMarketplaceItems();
  }, []);

  const fetchMarketplaceItems = async () => {
    try {
      const { data, error } = await supabase
        .from("marketplace")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching marketplace items:", error);
      toast.error("Failed to load marketplace items");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesCondition = conditionFilter === "all" || item.condition === conditionFilter;
    
    return matchesSearch && matchesCategory && matchesCondition;
  });

  const categories = [...new Set(items.map(item => item.category))];
  const conditions = [...new Set(items.map(item => item.condition))];

  const convertCurrency = () => {
    const amount = parseFloat(exchangeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const convertedAmount = exchangeFrom === "KRW" ? amount * exchangeRate : amount / exchangeRate;
    toast.success(`${amount} ${exchangeFrom} = ${convertedAmount.toFixed(2)} ${exchangeTo}`);
  };

  const swapCurrencies = () => {
    setExchangeFrom(exchangeTo);
    setExchangeTo(exchangeFrom);
    setExchangeRate(1 / exchangeRate);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground uppercase">Marketplace</h1>
            <p className="text-muted-foreground mt-2">Buy, sell, and exchange with fellow students</p>
          </div>
          <Button className="font-bold uppercase">
            <Plus className="w-4 h-4 mr-2" />
            List Item
          </Button>
        </div>

        {/* Currency Exchange Section */}
        <Card className="border-2 border-foreground shadow-brutal">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground uppercase">
              <ArrowLeftRight className="w-5 h-5" />
              Currency Exchange
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground uppercase">Amount</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={exchangeAmount}
                  onChange={(e) => setExchangeAmount(e.target.value)}
                  className="border-2 border-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground uppercase">From</label>
                <Select value={exchangeFrom} onValueChange={setExchangeFrom}>
                  <SelectTrigger className="border-2 border-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KRW">KRW (₩)</SelectItem>
                    <SelectItem value="MYR">MYR (RM)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground uppercase">To</label>
                <div className="flex gap-2">
                  <Select value={exchangeTo} onValueChange={setExchangeTo}>
                    <SelectTrigger className="border-2 border-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KRW">KRW (₩)</SelectItem>
                      <SelectItem value="MYR">MYR (RM)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={swapCurrencies}
                    className="border-2 border-foreground"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={convertCurrency} className="font-bold uppercase">
                Convert
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              Current rate: 1 KRW = {exchangeRate.toFixed(6)} MYR
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-foreground" />

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-foreground"
              />
            </div>
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48 border-2 border-foreground">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-48 border-2 border-foreground">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              {conditions.map(condition => (
                <SelectItem key={condition} value={condition}>
                  {condition.replace('_', ' ').charAt(0).toUpperCase() + condition.replace('_', ' ').slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Showing {filteredItems.length} of {items.length} items
          </p>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-foreground">
              {items.filter(item => item.status === 'available').length} Available
            </Badge>
            <Badge variant="outline" className="border-foreground">
              {items.filter(item => item.status === 'sold').length} Sold
            </Badge>
          </div>
        </div>

        {/* Marketplace Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-muted border-2 border-foreground animate-pulse"></div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <MarketplaceCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Card className="border-2 border-foreground shadow-brutal">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-lg">No items found matching your criteria</p>
              <Button className="mt-4 font-bold uppercase">
                <Plus className="w-4 h-4 mr-2" />
                Be the first to list an item
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};