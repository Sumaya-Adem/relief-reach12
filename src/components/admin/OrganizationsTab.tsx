import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Loader2, Building2, User } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
}

export function OrganizationsTab() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    // User account fields
    user_email: '',
    user_password: '',
    user_full_name: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name');

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setOrganizations(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (editingOrg) {
      // Update existing organization
      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          description: formData.description || null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
        })
        .eq('id', editingOrg.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      } else {
        toast({ title: 'Success', description: 'Organization updated successfully' });
        setIsDialogOpen(false);
        fetchOrganizations();
      }
    } else {
      // Save current admin session before creating new user
      const { data: currentSession } = await supabase.auth.getSession();
      
      // Create new organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          description: formData.description || null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
        })
        .select()
        .single();

      if (orgError) {
        if (orgError.message.includes('duplicate')) {
          toast({ variant: 'destructive', title: 'Error', description: 'An organization with this name already exists' });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: orgError.message });
        }
        setIsSaving(false);
        return;
      }

      // Create user account for the NGO (this will temporarily switch session)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.user_email,
        password: formData.user_password,
        options: {
          data: { full_name: formData.user_full_name },
        },
      });

      if (signUpError) {
        toast({ variant: 'destructive', title: 'Error creating user', description: signUpError.message });
        // Delete the org if user creation fails
        await supabase.from('organizations').delete().eq('id', orgData.id);
        setIsSaving(false);
        return;
      }

      if (authData.user) {
        // Update profile with organization using service role context
        // We need to wait a moment for the profile to be created by the trigger
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await supabase
          .from('profiles')
          .update({ organization_id: orgData.id })
          .eq('user_id', authData.user.id);

        // Add NGO user role
        await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'ngo_user',
          });

        toast({ 
          title: 'Success', 
          description: `NGO "${formData.name}" registered! Login: ${formData.user_email}` 
        });
      }

      // Restore admin session
      if (currentSession?.session) {
        await supabase.auth.setSession({
          access_token: currentSession.session.access_token,
          refresh_token: currentSession.session.refresh_token,
        });
      }

      setIsDialogOpen(false);
      fetchOrganizations();
    }

    setIsSaving(false);
  };

  const openCreateDialog = () => {
    setEditingOrg(null);
    setFormData({ 
      name: '', 
      description: '', 
      contact_email: '', 
      contact_phone: '',
      user_email: '',
      user_password: '',
      user_full_name: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      description: org.description || '',
      contact_email: org.contact_email || '',
      contact_phone: org.contact_phone || '',
      user_email: '',
      user_password: '',
      user_full_name: '',
    });
    setIsDialogOpen(true);
  };

  const toggleActive = async (org: Organization) => {
    const { error } = await supabase
      .from('organizations')
      .update({ is_active: !org.is_active })
      .eq('id', org.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      fetchOrganizations();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="admin-card-green border-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          NGO Organizations ({organizations.length})
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-secondary hover:bg-secondary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add NGO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingOrg ? 'Edit NGO' : 'Register New NGO'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organization Details */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organization Details
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g. Red Cross Somalia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the NGO"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="org@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="+252..."
                    />
                  </div>
                </div>
              </div>

              {/* User Account Section - Only for new organizations */}
              {!editingOrg && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      NGO Login Account
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Create login credentials for the NGO to access the system
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="user_full_name">Account Holder Name *</Label>
                      <Input
                        id="user_full_name"
                        value={formData.user_full_name}
                        onChange={(e) => setFormData({ ...formData, user_full_name: e.target.value })}
                        required
                        placeholder="NGO representative name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user_email">Login Email *</Label>
                      <Input
                        id="user_email"
                        type="email"
                        value={formData.user_email}
                        onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                        required
                        placeholder="user@ngo.org"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user_password">Login Password *</Label>
                      <Input
                        id="user_password"
                        type="password"
                        value={formData.user_password}
                        onChange={(e) => setFormData({ ...formData, user_password: e.target.value })}
                        required
                        minLength={6}
                        placeholder="Minimum 6 characters"
                      />
                      <p className="text-xs text-muted-foreground">
                        Share these credentials with the NGO so they can sign in
                      </p>
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingOrg ? 'Update Organization' : 'Register NGO & Create Account'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {organizations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No organizations yet. Create one to get started.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{org.name}</p>
                      {org.description && (
                        <p className="text-sm text-muted-foreground">{org.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {org.contact_email && <p>{org.contact_email}</p>}
                      {org.contact_phone && <p className="text-muted-foreground">{org.contact_phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={org.is_active 
                        ? 'bg-pastel-green text-green-800 border-0 cursor-pointer' 
                        : 'bg-muted text-muted-foreground cursor-pointer'}
                      onClick={() => toggleActive(org)}
                    >
                      {org.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(org)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
