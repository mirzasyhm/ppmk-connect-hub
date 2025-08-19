import { useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Send, Plus, Search, Clock } from "lucide-react";
import { toast } from "sonner";
interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  other_user?: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    sender_id: string;
  };
  unread_count?: number;
}
interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

interface UserProfile {
  user_id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
}
export const Messages = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Set up auth state listener
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const fetchProfile = async (userId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };
  const fetchConversations = async () => {
    if (!user) return;
    try {
      // Fetch conversations with the other participant's profile info
      const {
        data,
        error
      } = await supabase.from("conversations").select(`
          *,
          messages (
            content,
            sender_id,
            created_at
          )
        `).or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`).order("last_message_at", {
        ascending: false
      });
      if (error) throw error;

      // Get profile info for other participants
      const conversationsWithProfiles = await Promise.all((data || []).map(async conv => {
        const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
        const {
          data: profileData
        } = await supabase.from("profiles").select("display_name, username, avatar_url").eq("user_id", otherUserId).single();
        const lastMessage = conv.messages?.[conv.messages.length - 1];
        return {
          ...conv,
          other_user: profileData || {
            display_name: "Unknown User",
            username: "unknown"
          },
          last_message: lastMessage
        };
      }));
      setConversations(conversationsWithProfiles);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };
  const fetchMessages = async (conversationId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", {
        ascending: true
      });
      if (error) throw error;

      // Fetch sender profiles separately
      const messagesWithProfiles = await Promise.all((data || []).map(async message => {
        const {
          data: profileData
        } = await supabase.from("profiles").select("display_name, username, avatar_url").eq("user_id", message.sender_id).single();
        return {
          ...message,
          sender: profileData || {
            display_name: "Unknown User",
            username: "unknown"
          }
        };
      }));
      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    try {
      const {
        error
      } = await supabase.from("messages").insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        content: newMessage.trim()
      });
      if (error) throw error;
      setNewMessage("");
      fetchMessages(selectedConversation);
      fetchConversations(); // Refresh to update last message
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };

  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim() || !user) return;
    
    setSearchingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .neq("user_id", user.id) // Exclude current user
        .or(`display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setSearchingUsers(false);
    }
  };

  const startConversation = async (otherUser: UserProfile) => {
    if (!user) return;

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id")
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUser.user_id}),and(participant_1.eq.${otherUser.user_id},participant_2.eq.${user.id})`)
        .single();

      if (existingConv) {
        // Conversation exists, select it
        setSelectedConversation(existingConv.id);
        setNewConversationOpen(false);
        setUserSearchTerm("");
        setSearchResults([]);
        return;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          participant_1: user.id,
          participant_2: otherUser.user_id
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh conversations and select the new one
      await fetchConversations();
      setSelectedConversation(newConv.id);
      setNewConversationOpen(false);
      setUserSearchTerm("");
      setSearchResults([]);
      toast.success(`Started conversation with ${otherUser.display_name}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    }
  };
  const filteredConversations = conversations.filter(conv => conv.other_user?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || conv.other_user?.username?.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedConv = conversations.find(c => c.id === selectedConversation);
  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r border-border">
        {/* Conversations List */}
        <div className="w-80 border-r-2 border-foreground bg-card">
          <div className="p-4 border-b-2 border-foreground">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground uppercase">Messages</h2>
              <Dialog open={newConversationOpen} onOpenChange={setNewConversationOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="font-bold uppercase">
                    <Plus className="w-4 h-4 mr-2" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-foreground font-bold uppercase">
                      Start New Conversation
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by name or username..."
                        value={userSearchTerm}
                        onChange={(e) => {
                          setUserSearchTerm(e.target.value);
                          searchUsers(e.target.value);
                        }}
                        className="pl-10 border-2 border-foreground"
                      />
                    </div>

                    <ScrollArea className="max-h-60">
                      {searchingUsers ? (
                        <div className="p-4 text-center text-muted-foreground">
                          Searching users...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-2">
                          {searchResults.map((userProfile) => (
                            <Card
                              key={userProfile.user_id}
                              className="cursor-pointer border-2 border-foreground hover:bg-muted/50 transition-colors"
                              onClick={() => startConversation(userProfile)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8 border border-foreground">
                                    <AvatarImage src={userProfile.avatar_url} />
                                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                                      {userProfile.display_name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">
                                      {userProfile.display_name || "Unknown User"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      @{userProfile.username || "unknown"}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : userSearchTerm.trim() ? (
                        <div className="p-4 text-center text-muted-foreground">
                          No users found
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          Start typing to search for users
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search conversations..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 border-2 border-foreground" />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            {loading ? <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted border-2 border-foreground animate-pulse"></div>)}
              </div> : filteredConversations.length > 0 ? <div className="p-1 space-y-2">
                {filteredConversations.map(conversation => <Card key={conversation.id} className={`cursor-pointer border-2 border-foreground transition-colors ${selectedConversation === conversation.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'}`} onClick={() => setSelectedConversation(conversation.id)}>
                    <CardContent className="p-2">
                      <div className="flex items-center gap-2 w-full">
                        <Avatar className="w-6 h-6 border border-foreground flex-shrink-0">
                          <AvatarImage src={conversation.other_user?.avatar_url} />
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                            {conversation.other_user?.display_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-medium truncate text-xs">
                              {conversation.other_user?.display_name || "Unknown User"}
                            </p>
                            <div className="text-[10px] opacity-60 flex-shrink-0">
                              {conversation.last_message_at && 
                                new Date(conversation.last_message_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              }
                            </div>
                          </div>
                          <p className="text-[10px] opacity-60 truncate">
                            {conversation.last_message?.content || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>)}
              </div> : <div className="p-8 text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No conversations found</p>
              </div>}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation && selectedConv ? <>
              {/* Chat Header */}
              <div className="p-4 border-b-2 border-foreground bg-card">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-foreground">
                    <AvatarImage src={selectedConv.other_user?.avatar_url} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {selectedConv.other_user?.display_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-foreground">
                      {selectedConv.other_user?.display_name || "Unknown User"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      @{selectedConv.other_user?.username || "unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map(message => <div key={message.id} className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg border-2 border-foreground ${message.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>)}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t-2 border-foreground bg-card">
                <div className="flex gap-2">
                  <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === "Enter" && sendMessage()} className="border-2 border-foreground" />
                  <Button onClick={sendMessage} className="font-bold uppercase">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </> : <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">Choose a conversation from the left to start messaging</p>
              </div>
            </div>}
        </div>
    </div>
  );
};