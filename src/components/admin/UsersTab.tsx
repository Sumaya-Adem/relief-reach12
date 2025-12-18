import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Loader2, Users, UserPlus, Trash2 } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  organization_id: string | null;
  created_at: string;
  organization_name?: string | null;
  role?: string | null;
}

interface Organization {
  id: string;
  name: string;
}

export function UsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    organization_id: '',
    role: 'ngo_user' as 'admin' | 'ngo_user',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    // Fetch profiles with organizations
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id, user_id, email, full_name, organization_id, created_at,
        organizations (name)
      `)
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast({ variant: 'destructive', title: 'Error', description: profilesError.message });
      setIsLoading(false);
      return;
    }

    // Fetch all roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role');

    // Create a map of user_id to role
    const rolesMap = new Map<string, string>();
    rolesData?.forEach(r => rolesMap.set(r.user_id, r.role));

    // Combine data
    const combinedUsers: UserProfile[] = (profilesData || []).map(profile => ({
      id: profile.id,
      user_id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      organization_id: profile.organization_id,
      created_at: profile.created_at,
      organization_name: profile.organizations?.name || null,
      role: rolesMap.get(profile.user_id) || null,
    }));

    setUsers(combinedUsers);
    setIsLoading(false);
  };

  const fetchOrganizations = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    setOrganizations(data || []);
  };

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Create user via signup
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { full_name: formData.full_name },
      },
    });

    if (signUpError) {
      toast({ variant: 'destructive', title: 'Error', description: signUpError.message });
      setIsSaving(false);
      return;
    }

    if (authData.user) {
      // Update profile with organization
      if (formData.organization_id) {
        await supabase
          .from('profiles')
          .update({ organization_id: formData.organization_id })
          .eq('user_id', authData.user.id);
      }

      // Add role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: formData.role,
        });

      if (roleError) {
        toast({ variant: 'destructive', title: 'Error', description: roleError.message });
      } else {
        toast({ title: 'Success', description: 'User created successfully' });
        setIsDialogOpen(false);
        fetchUsers();
      }
    }

    setIsSaving(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        organization_id: formData.organization_id || null,
      })
      .eq('id', editingUser.id);

    if (profileError) {
      toast({ variant: 'destructive', title: 'Error', description: profileError.message });
      setIsSaving(false);
      return;
    }

    // Update role (delete existing, insert new)
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', editingUser.user_id);

    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: editingUser.user_id,
        role: formData.role,
      });

    if (roleError) {
      toast({ variant: 'destructive', title: 'Error', description: roleError.message });
    } else {
      toast({ title: 'Success', description: 'User updated successfully' });
      setIsDialogOpen(false);
      fetchUsers();
    }

    setIsSaving(false);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      full_name: '',
      organization_id: '',
      role: 'ngo_user',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      organization_id: user.organization_id || '',
      role: (user.role as 'admin' | 'ngo_user') || 'ngo_user',
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (user: UserProfile) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('delete-user', {
        body: { user_id: userToDelete.user_id },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({ title: 'Success', description: 'User deleted successfully' });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message || 'Failed to delete user' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (user: UserProfile) => {
    if (user.role === 'admin') {
      return <Badge className="bg-[hsl(var(--pastel-purple))] text-purple-800 border-0">Government Admin</Badge>;
    }
    if (user.role === 'ngo_user') {
      return <Badge className="bg-[hsl(var(--pastel-blue))] text-blue-800 border-0">NGO User</Badge>;
    }
    return <Badge variant="outline">No Role</Badge>;
  };

  const isNgoUser = formData.role === 'ngo_user';

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="admin-card-blue border-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Users ({users.length})
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              {/* Role Selection First */}
              <div className="space-y-2">
                <Label htmlFor="role">User Type *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'ngo_user', organization_id: value === 'admin' ? '' : formData.organization_id })}
                >
                  <SelectTrigger className={isNgoUser ? 'bg-[hsl(var(--pastel-blue)/0.3)]' : 'bg-[hsl(var(--pastel-purple)/0.3)]'}>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ngo_user">NGO User (Organization Staff)</SelectItem>
                    <SelectItem value="admin">Government Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {isNgoUser 
                    ? 'NGO users can submit and view their organization\'s reports' 
                    : 'Government admins can review and approve all NGO reports'}
                </p>
              </div>

              {!editingUser && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                    />
                    <p className="text-xs text-muted-foreground">
                      Share this password with the user so they can login
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              {/* Only show organization for NGO users */}
              {isNgoUser && (
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization *</Label>
                  <Select
                    value={formData.organization_id}
                    onValueChange={(value) => setFormData({ ...formData, organization_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select NGO organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {organizations.length === 0 && (
                    <p className="text-xs text-destructive">
                      No organizations available. Create an organization first.
                    </p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSaving || (isNgoUser && !formData.organization_id && !editingUser)}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser ? 'Update' : 'Create'} User
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No users yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.full_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <span className="text-muted-foreground italic">Government</span>
                    ) : (
                      user.organization_name || (
                        <span className="text-muted-foreground">Not assigned</span>
                      )
                    )}
                  </TableCell>
                  <TableCell>{getRoleBadge(user)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(user)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.full_name || userToDelete?.email}</strong>? 
              This action cannot be undone and will remove all their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
