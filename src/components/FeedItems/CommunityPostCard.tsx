import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";

interface CommunityPostCardProps {
  post: {
    id: string;
    title?: string;
    content: string;
    created_at: string;
    image_url?: string;
    communities: {
      name: string;
      type: string;
    };
  };
}

export const CommunityPostCard = ({ post }: CommunityPostCardProps) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'student_club': return 'bg-primary text-primary-foreground';
      case 'university_group': return 'bg-secondary text-secondary-foreground';
      case 'age_group': return 'bg-muted text-muted-foreground';
      case 'interest_group': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatType = (type: string) => {
    return type.replace('_', ' ').toUpperCase();
  };

  return (
    <Card className="border-2 border-foreground shadow-brutal">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-muted-foreground uppercase">COMMUNITY POST</span>
          </div>
          <Badge className={`${getTypeColor(post.communities.type)} border border-foreground font-bold`}>
            {formatType(post.communities.type)}
          </Badge>
        </div>
        <div>
          <p className="text-sm font-bold text-primary uppercase">{post.communities.name}</p>
          {post.title && (
            <h3 className="text-xl font-bold text-foreground uppercase mt-1">{post.title}</h3>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {post.image_url && (
          <img 
            src={post.image_url} 
            alt={post.title || 'Community post'}
            className="w-full h-48 object-cover border-2 border-foreground"
          />
        )}
        
        <p className="text-foreground leading-relaxed">{post.content}</p>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {new Date(post.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};