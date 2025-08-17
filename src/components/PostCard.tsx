import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: any;
  currentUserId: string;
  onLikeUpdate: () => void;
}

export const PostCard = ({ post, currentUserId, onLikeUpdate }: PostCardProps) => {
  const [liking, setLiking] = useState(false);
  const { toast } = useToast();

  const isLiked = post.likes?.some((like: any) => like.user_id === currentUserId);
  const likeCount = post.likes?.length || 0;

  const handleLike = async () => {
    setLiking(true);
    try {
      if (isLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ post_id: post.id, user_id: currentUserId });
        
        if (error) throw error;
      }
      onLikeUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    } finally {
      setLiking(false);
    }
  };

  return (
    <Card className="bg-gradient-card backdrop-blur-md border-border/50 shadow-card hover:shadow-glow transition-smooth">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.profiles?.avatar_url} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              {post.profiles?.display_name?.charAt(0) || 
               post.profiles?.username?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">
              {post.profiles?.display_name || post.profiles?.username || "Unknown User"}
            </p>
            <p className="text-sm text-muted-foreground">
              @{post.profiles?.username || "user"} · {" "}
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>
        
        {post.image_url && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img 
              src={post.image_url} 
              alt="Post image" 
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        <div className="flex items-center gap-4 pt-4 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={liking}
            className={`gap-2 ${isLiked ? 'text-social hover:text-social/80' : 'text-muted-foreground hover:text-social'} transition-smooth`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            {likeCount}
          </Button>
          
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary transition-smooth">
            <MessageCircle className="w-4 h-4" />
            0
          </Button>
          
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary transition-smooth">
            <Share className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};