import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Clock, Edit, Trash2 } from "lucide-react";

interface BroadcastCardProps {
  broadcast: {
    id: string;
    title: string;
    content: string;
    priority: string;
    created_at: string;
    image_url?: string;
  };
  isAdmin?: boolean;
  onEdit?: (broadcast: any) => void;
  onDelete?: (broadcastId: string) => void;
}

export const BroadcastCard = ({ broadcast, isAdmin, onEdit, onDelete }: BroadcastCardProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-primary text-primary-foreground';
      case 'normal': return 'bg-secondary text-secondary-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Card className="border-2 border-foreground shadow-brutal">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-muted-foreground uppercase">PPMK BROADCAST</span>
          </div>
          <Badge className={`${getPriorityColor(broadcast.priority)} border border-foreground font-bold uppercase`}>
            {broadcast.priority}
          </Badge>
        </div>
        <h3 className="text-xl font-bold text-foreground uppercase">{broadcast.title}</h3>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {broadcast.image_url && (
          <img 
            src={broadcast.image_url} 
            alt={broadcast.title}
            className="w-full h-48 object-cover border-2 border-foreground"
          />
        )}
        
        <p className="text-foreground leading-relaxed">{broadcast.content}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {new Date(broadcast.created_at).toLocaleDateString()}
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(broadcast)}
                className="gap-1"
              >
                <Edit className="w-3 h-3" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete?.(broadcast.id)}
                className="gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};