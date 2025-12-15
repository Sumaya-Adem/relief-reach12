import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { BottomNavigation } from '@/components/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building2, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, profile, role, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <>
      <Helmet>
        <title>Profile | Badbaado Aid Track</title>
        <meta name="description" content="View and manage your profile." />
      </Helmet>
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground text-sm mt-1">Your account information</p>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {profile?.fullName || 'No name set'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                  <Badge variant={isAdmin ? 'default' : 'secondary'}>
                    {role === 'admin' ? 'Admin' : 'NGO User'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium truncate">{user?.email}</p>
                    </div>
                  </div>

                  {profile?.organizationName && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Organization</p>
                        <p className="text-sm font-medium truncate">{profile.organizationName}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Role</p>
                      <p className="text-sm font-medium">
                        {role === 'admin' ? 'Administrator' : 'NGO User'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </main>
        <BottomNavigation />
      </div>
    </>
  );
}
