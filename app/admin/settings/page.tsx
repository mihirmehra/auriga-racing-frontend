'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { settingsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings as SettingsIcon, 
  Save,
  Globe,
  ShoppingCart,
  Palette,
  Shield,
  Mail,
  Bell
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'sonner';

interface Setting {
  key: string;
  value: any;
  type: string;
  category: string;
  description: string;
  isPublic: boolean;
  isEditable: boolean;
}

export default function AdminSettingsPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    fetchSettings();
  }, [isAdmin, router]);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      setSettings(response.data);
      
      // Initialize form data
      const initialData: Record<string, any> = {};
      response.data.forEach((setting: Setting) => {
        initialData[setting.key] = setting.value;
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (category: string) => {
    setSaving(true);
    try {
      const categorySettings = settings.filter(s => s.category === category);
      
      for (const setting of categorySettings) {
        if (setting.isEditable && formData[setting.key] !== setting.value) {
          await settingsAPI.update(setting.key, {
            value: formData[setting.key],
            type: setting.type,
            category: setting.category,
            description: setting.description,
            isPublic: setting.isPublic,
            isEditable: setting.isEditable
          });
        }
      }
      
      toast.success('Settings saved successfully');
      fetchSettings(); // Refresh settings
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInitialize = async () => {
    try {
      await settingsAPI.initialize();
      toast.success('Default settings initialized');
      fetchSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initialize settings');
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const renderSettingInput = (setting: Setting) => {
    const value = formData[setting.key];

    if (!setting.isEditable) {
      return (
        <div className="text-sm text-gray-500">
          {setting.type === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
        </div>
      );
    }

    switch (setting.type) {
      case 'boolean':
        return (
          <Checkbox
            checked={value || false}
            onCheckedChange={(checked) => updateFormData(setting.key, checked)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value || 0}
            onChange={(e) => updateFormData(setting.key, parseFloat(e.target.value) || 0)}
          />
        );
      case 'string':
        if (setting.description?.includes('description') || setting.key.includes('description')) {
          return (
            <Textarea
              value={value || ''}
              onChange={(e) => updateFormData(setting.key, e.target.value)}
              rows={3}
            />
          );
        }
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateFormData(setting.key, e.target.value)}
          />
        );
      default:
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => updateFormData(setting.key, e.target.value)}
          />
        );
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(s => s.category === category);
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Configure your store settings and preferences</p>
          </div>
          <Button onClick={handleInitialize} variant="outline">
            Initialize Defaults
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="commerce" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Commerce
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Display
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>General Settings</CardTitle>
                  <p className="text-sm text-gray-600">Basic store information and configuration</p>
                </div>
                <Button onClick={() => handleSave('general')} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {getSettingsByCategory('general').map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={setting.key} className="text-sm font-medium">
                        {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {setting.isPublic && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          Public
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-xs text-gray-500">{setting.description}</p>
                    )}
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commerce">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Commerce Settings</CardTitle>
                  <p className="text-sm text-gray-600">Payment, shipping, and order configuration</p>
                </div>
                <Button onClick={() => handleSave('commerce')} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {getSettingsByCategory('commerce').map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={setting.key} className="text-sm font-medium">
                        {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {setting.isPublic && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          Public
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-xs text-gray-500">{setting.description}</p>
                    )}
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Display Settings</CardTitle>
                  <p className="text-sm text-gray-600">UI and presentation configuration</p>
                </div>
                <Button onClick={() => handleSave('display')} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {getSettingsByCategory('display').map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={setting.key} className="text-sm font-medium">
                        {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {setting.isPublic && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          Public
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-xs text-gray-500">{setting.description}</p>
                    )}
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Feature Settings</CardTitle>
                  <p className="text-sm text-gray-600">Enable or disable store features</p>
                </div>
                <Button onClick={() => handleSave('features')} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {getSettingsByCategory('features').map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={setting.key} className="text-sm font-medium">
                        {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                      {setting.isPublic && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          Public
                        </span>
                      )}
                    </div>
                    {setting.description && (
                      <p className="text-xs text-gray-500">{setting.description}</p>
                    )}
                    {renderSettingInput(setting)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <p className="text-sm text-gray-600">Security and authentication configuration</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Security Notice</h4>
                    <p className="text-sm text-yellow-700">
                      Security settings are managed through environment variables and server configuration.
                      Contact your system administrator for security-related changes.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                      <p className="text-xs text-gray-500 mb-2">Enable 2FA for admin accounts</p>
                      <Checkbox disabled />
                      <span className="ml-2 text-sm text-gray-500">Coming soon</span>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Session Timeout</Label>
                      <p className="text-xs text-gray-500 mb-2">Automatic logout after inactivity</p>
                      <Input value="30 minutes" disabled />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Password Policy</Label>
                      <p className="text-xs text-gray-500 mb-2">Minimum password requirements</p>
                      <Input value="8 characters minimum" disabled />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <p className="text-sm text-gray-600">Email and system notification preferences</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Order Notifications</Label>
                      <p className="text-xs text-gray-500 mb-2">Send email notifications for new orders</p>
                      <Checkbox defaultChecked />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Low Stock Alerts</Label>
                      <p className="text-xs text-gray-500 mb-2">Alert when products are running low</p>
                      <Checkbox defaultChecked />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Customer Registration</Label>
                      <p className="text-xs text-gray-500 mb-2">Notify when new customers register</p>
                      <Checkbox />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">System Updates</Label>
                      <p className="text-xs text-gray-500 mb-2">Receive notifications about system updates</p>
                      <Checkbox defaultChecked />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button>
                      <Save className="h-4 w-4 mr-2" />
                      Save Notification Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}