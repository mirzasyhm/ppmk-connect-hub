import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImagePlus, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreatePostProps {
  profile: any;
  currentUserId: string;
  onPostCreated: () => void;
}

export const CreatePost = ({ profile, currentUserId, onPostCreated }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setPosting(true);
    try {
      const { error } = await supabase
        .from("posts")
        .insert({
          content: content.trim(),
          user_id: currentUserId,
        });

      if (error) throw error;

      setContent("");
      onPostCreated();
      toast({
        title: "Post created!",
        description: "Your post has been shared with your friends.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  return (
    <Card className="bg-card border-2 border-foreground shadow-brutal">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">
              What's on your mind?
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Share something with your friends..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none border-2 border-foreground bg-background"
            maxLength={500}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-primary"
              >
                <ImagePlus className="w-4 h-4" />
                Photo
              </Button>
              <span className="text-xs text-muted-foreground">
                {content.length}/500
              </span>
            </div>
            
            <Button
              type="submit"
              variant="brutal"
              size="sm"
              disabled={!content.trim() || posting}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {posting ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};