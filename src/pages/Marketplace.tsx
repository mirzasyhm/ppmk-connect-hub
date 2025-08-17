import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketplaceCard } from "@/components/FeedItems/MarketplaceCard";
import { CurrencyExchangeCard } from "@/components/FeedItems/CurrencyExchangeCard";
import { Plus, Search, ArrowLeftRight, ShoppingCart } from "lucide-react";
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

interface CurrencyExchange {
  id: string;
  have_currency: string;
  have_amount: number;
  want_currency: string;
  want_amount: number;
  exchange_rate?: number;
  description?: string;
  status: string;
  created_at: string;
}

export const Marketplace = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [currencyExchanges, setCurrencyExchanges] = useState<CurrencyExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [exchangeSearchTerm, setExchangeSearchTerm] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("all");

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    fetchData();

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsResult, exchangesResult] = await Promise.all([
        supabase
          .from("marketplace")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("currency_exchanges")
          .select("*")
          .order("created_at", { ascending: false })
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (exchangesResult.error) throw exchangesResult.error;

      setItems(itemsResult.data || []);
      setCurrencyExchanges(exchangesResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load marketplace data");
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

  const filteredExchanges = currencyExchanges.filter(exchange => {
    const matchesSearch = exchange.description?.toLowerCase().includes(exchangeSearchTerm.toLowerCase()) ||
                         exchange.have_currency.toLowerCase().includes(exchangeSearchTerm.toLowerCase()) ||
                         exchange.want_currency.toLowerCase().includes(exchangeSearchTerm.toLowerCase());
    const matchesCurrency = currencyFilter === "all" || 
                           exchange.have_currency === currencyFilter || 
                           exchange.want_currency === currencyFilter;
    
    return matchesSearch && matchesCurrency;
  });

  const categories = [...new Set(items.map(item => item.category))];
  const conditions = [...new Set(items.map(item => item.condition))];
  const currencies = [...new Set([
    ...currencyExchanges.map(e => e.have_currency),
    ...currencyExchanges.map(e => e.want_currency)
  ])];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} session={session} profile={profile} />
      
      <main className="flex-1 p-6">
        <div className="container mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground uppercase">Marketplace</h1>
            <p className="text-muted-foreground mt-2">Buy, sell, and exchange with fellow students</p>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-2 border-2 border-foreground">
            <TabsTrigger value="items" className="font-bold uppercase">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy/Sell Items
            </TabsTrigger>
            <TabsTrigger value="exchange" className="font-bold uppercase">
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Currency Exchange
            </TabsTrigger>
          </TabsList>

          {/* Buy/Sell Items Tab */}
          <TabsContent value="items" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground uppercase">Items for Sale</h2>
              <Button className="font-bold uppercase">
                <Plus className="w-4 h-4 mr-2" />
                List Item
              </Button>
            </div>

            {/* Item Filters */}
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

            {/* Items Results */}
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

            {/* Items Grid */}
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
          </TabsContent>

          {/* Currency Exchange Tab */}
          <TabsContent value="exchange" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground uppercase">Currency Exchange</h2>
              <Button className="font-bold uppercase">
                <Plus className="w-4 h-4 mr-2" />
                Post Exchange
              </Button>
            </div>

            {/* Exchange Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exchange posts..."
                    value={exchangeSearchTerm}
                    onChange={(e) => setExchangeSearchTerm(e.target.value)}
                    className="pl-10 border-2 border-foreground"
                  />
                </div>
              </div>
              
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-48 border-2 border-foreground">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  {currencies.map(currency => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Exchange Results */}
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                Showing {filteredExchanges.length} of {currencyExchanges.length} exchange posts
              </p>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-foreground">
                  {currencyExchanges.filter(e => e.status === 'active').length} Active
                </Badge>
                <Badge variant="outline" className="border-foreground">
                  {currencyExchanges.filter(e => e.status === 'completed').length} Completed
                </Badge>
              </div>
            </div>

            {/* Exchange Posts Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-muted border-2 border-foreground animate-pulse"></div>
                ))}
              </div>
            ) : filteredExchanges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExchanges.map(exchange => (
                  <CurrencyExchangeCard key={exchange.id} exchange={exchange} />
                ))}
              </div>
            ) : (
              <Card className="border-2 border-foreground shadow-brutal">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground text-lg">No currency exchange posts found</p>
                  <Button className="mt-4 font-bold uppercase">
                    <Plus className="w-4 h-4 mr-2" />
                    Be the first to post an exchange
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  );
};