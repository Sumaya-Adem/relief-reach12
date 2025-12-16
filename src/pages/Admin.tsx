import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationsTab } from '@/components/admin/OrganizationsTab';
import { UsersTab } from '@/components/admin/UsersTab';
import { RulesTab } from '@/components/admin/RulesTab';
import { WarningsTab } from '@/components/admin/WarningsTab';
import { ReportsTab } from '@/components/admin/ReportsTab';
import { Building2, Users, Settings, AlertTriangle, FileCheck } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('reports');

  return (
    <>
      <Helmet>
        <title>Admin Panel | Badbaado Aid Track</title>
        <meta name="description" content="Admin panel for managing organizations, users, and system settings." />
      </Helmet>
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">Review reports, manage organizations, and system settings</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Reports</span>
              </TabsTrigger>
              <TabsTrigger value="organizations" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Organizations</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Rules</span>
              </TabsTrigger>
              <TabsTrigger value="warnings" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Warnings</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="reports">
                <ReportsTab />
              </TabsContent>
              <TabsContent value="organizations">
                <OrganizationsTab />
              </TabsContent>
              <TabsContent value="users">
                <UsersTab />
              </TabsContent>
              <TabsContent value="rules">
                <RulesTab />
              </TabsContent>
              <TabsContent value="warnings">
                <WarningsTab />
              </TabsContent>
            </div>
          </Tabs>
        </main>
        <BottomNavigation />
      </div>
    </>
  );
}
