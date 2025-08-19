import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarketplaceCard } from "@/components/FeedItems/MarketplaceCard";
import { CurrencyExchangeCard } from "@/components/FeedItems/CurrencyExchangeCard";
import { Plus, Search, ArrowLeftRight, ShoppingCart, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  seller_id: string;
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
  user_id: string;
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
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isCreateExchangeOpen, setIsCreateExchangeOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    price: "",
    currency: "USD",
    category: "",
    condition: "",
    image_url: ""
  });
  const [newExchange, setNewExchange] = useState({
    have_currency: "",
    have_amount: "",
    want_currency: "",
    want_amount: "",
    description: ""
  });
  const { toast } = useToast();

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
      toast({
        title: "Error",
        description: "Failed to load marketplace data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async () => {
    if (!newItem.title.trim() || !newItem.description.trim() || !newItem.price || !user) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("marketplace")
        .insert({
          seller_id: user.id,
          title: newItem.title.trim(),
          description: newItem.description.trim(),
          price: parseFloat(newItem.price),
          currency: newItem.currency,
          category: newItem.category,
          condition: newItem.condition,
          image_url: newItem.image_url || null
        });

      if (error) throw error;

      setNewItem({
        title: "",
        description: "",
        price: "",
        currency: "USD",
        category: "",
        condition: "",
        image_url: ""
      });
      setIsCreateItemOpen(false);
      fetchData();
      
      toast({
        title: "Item listed",
        description: "Your item has been listed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error listing item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateExchange = async () => {
    if (!newExchange.have_currency || !newExchange.have_amount || !newExchange.want_currency || !newExchange.want_amount || !user) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("currency_exchanges")
        .insert({
          user_id: user.id,
          have_currency: newExchange.have_currency,
          have_amount: parseFloat(newExchange.have_amount),
          want_currency: newExchange.want_currency,
          want_amount: parseFloat(newExchange.want_amount),
          description: newExchange.description || null,
          exchange_rate: parseFloat(newExchange.want_amount) / parseFloat(newExchange.have_amount)
        });

      if (error) throw error;

      setNewExchange({
        have_currency: "",
        have_amount: "",
        want_currency: "",
        want_amount: "",
        description: ""
      });
      setIsCreateExchangeOpen(false);
      fetchData();
      
      toast({
        title: "Exchange posted",
        description: "Your currency exchange post has been created.",
      });
    } catch (error: any) {
      toast({
        title: "Error creating exchange",
        description: error.message,
        variant: "destructive",
      });
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
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
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
              <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
                <DialogTrigger asChild>
                  <Button className="font-bold uppercase">
                    <Plus className="w-4 h-4 mr-2" />
                    List Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>List New Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="item-title">Title</Label>
                      <Input
                        id="item-title"
                        value={newItem.title}
                        onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                        placeholder="Item title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-description">Description</Label>
                      <Textarea
                        id="item-description"
                        value={newItem.description}
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                        placeholder="Describe your item"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="item-price">Price</Label>
                        <Input
                          id="item-price"
                          type="number"
                          value={newItem.price}
                          onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="item-currency">Currency</Label>
                        <Select
                          value={newItem.currency}
                          onValueChange={(value) => setNewItem({...newItem, currency: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="KRW">KRW</SelectItem>
                            <SelectItem value="MYR">MYR</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="item-category">Category</Label>
                      <Select
                        value={newItem.category}
                        onValueChange={(value) => setNewItem({...newItem, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="books">Books</SelectItem>
                          <SelectItem value="clothing">Clothing</SelectItem>
                          <SelectItem value="furniture">Furniture</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="item-condition">Condition</Label>
                      <Select
                        value={newItem.condition}
                        onValueChange={(value) => setNewItem({...newItem, condition: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="like_new">Like New</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="item-image">Image URL (Optional)</Label>
                      <Input
                        id="item-image"
                        value={newItem.image_url}
                        onChange={(e) => setNewItem({...newItem, image_url: e.target.value})}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateItem} className="flex-1">List Item</Button>
                      <Button variant="outline" onClick={() => setIsCreateItemOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
              <Dialog open={isCreateExchangeOpen} onOpenChange={setIsCreateExchangeOpen}>
                <DialogTrigger asChild>
                  <Button className="font-bold uppercase">
                    <Plus className="w-4 h-4 mr-2" />
                    Post Exchange
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Post Currency Exchange</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="have-currency">I Have</Label>
                        <Select
                          value={newExchange.have_currency}
                          onValueChange={(value) => setNewExchange({...newExchange, have_currency: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="KRW">KRW</SelectItem>
                            <SelectItem value="MYR">MYR</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="have-amount">Amount</Label>
                        <Input
                          id="have-amount"
                          type="number"
                          value={newExchange.have_amount}
                          onChange={(e) => setNewExchange({...newExchange, have_amount: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="want-currency">I Want</Label>
                        <Select
                          value={newExchange.want_currency}
                          onValueChange={(value) => setNewExchange({...newExchange, want_currency: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="KRW">KRW</SelectItem>
                            <SelectItem value="MYR">MYR</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="want-amount">Amount</Label>
                        <Input
                          id="want-amount"
                          type="number"
                          value={newExchange.want_amount}
                          onChange={(e) => setNewExchange({...newExchange, want_amount: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="exchange-description">Description (Optional)</Label>
                      <Textarea
                        id="exchange-description"
                        value={newExchange.description}
                        onChange={(e) => setNewExchange({...newExchange, description: e.target.value})}
                        placeholder="Additional details about the exchange"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateExchange} className="flex-1">Post Exchange</Button>
                      <Button variant="outline" onClick={() => setIsCreateExchangeOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
      </div>
    </div>
  );
};