import { LogOut, ListChecks } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const Navbar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="border-b bg-card">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ListChecks className="h-4 w-4" />
          </div>
          TaskFlow
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm text-muted-foreground sm:inline">{user.name}</span>
          <Button size="icon" variant="ghost" onClick={logout} title="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
