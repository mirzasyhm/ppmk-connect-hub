import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Lock, Unlock, Clock } from "lucide-react";

interface CommunityCardProps {
  community: {
    id: string;
    name: string;
    description: string;
    type: string;
    member_count: number;
    is_private: boolean;
    created_at: string;
    image_url?: string;
  };
}

export const CommunityCard = ({ community }: CommunityCardProps) => {
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
            <span className="text-sm font-bold text-muted-foreground uppercase">COMMUNITY</span>
          </div>
          <div className="flex items-center gap-2">
            {community.is_private ? (
              <Lock className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Unlock className="w-4 h-4 text-primary" />
            )}
          </div>
        </div>
        <h3 className="text-xl font-bold text-foreground uppercase">{community.name}</h3>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {community.image_url && (
          <img 
            src={community.image_url} 
            alt={community.name}
            className="w-full h-48 object-cover border-2 border-foreground"
          />
        )}
        
        <Badge className={`${getTypeColor(community.type)} border border-foreground font-bold`}>
          {formatType(community.type)}
        </Badge>
        
        <p className="text-foreground leading-relaxed">{community.description}</p>
        
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">
            {community.member_count} members
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Created {new Date(community.created_at).toLocaleDateString()}
          </div>
          
          <Button variant="brutal" className="font-bold uppercase">
            {community.is_private ? 'Request to Join' : 'Join Community'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};