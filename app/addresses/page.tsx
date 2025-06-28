'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { addressesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Plus, Edit, Trash2, Star } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

interface Address {
  _id: string;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  type: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function AddressesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    phone: '',
    type: 'both',
    isDefault: false,
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchAddresses();
  }, [user, router]);

  const fetchAddresses = async () => {
    try {
      const response = await addressesAPI.getAll();
      setAddresses(response.data);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
      phone: '',
      type: 'both',
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const handleEdit = (address: Address) => {
    setFormData({
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company || '',
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone || '',
      type: address.type,
      isDefault: address.isDefault,
    });
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingAddress) {
        const response = await addressesAPI.update(editingAddress._id, formData);
        setAddresses(addresses.map(addr => 
          addr._id === editingAddress._id ? response.data.address : addr
        ));
        toast.success('Address updated successfully');
      } else {
        const response = await addressesAPI.create(formData);
        setAddresses([...addresses, response.data.address]);
        toast.success('Address created successfully');
      }
      
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      await addressesAPI.delete(addressId);
      setAddresses(addresses.filter(addr => addr._id !== addressId));
      toast.success('Address deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await addressesAPI.setDefault(addressId);
      setAddresses(addresses.map(addr => ({
        ...addr,
        isDefault: addr._id === addressId
      })));
      toast.success('Default address updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to set default address');
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Addresses</h1>
          <p className="text-gray-600">Manage your shipping and billing addresses</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Saved Addresses</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="address1">Address Line 1</Label>
                  <Input
                    id="address1"
                    value={formData.address1}
                    onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                  <Input
                    id="address2"
                    value={formData.address2}
                    onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="type">Address Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shipping">Shipping Only</SelectItem>
                      <SelectItem value="billing">Billing Only</SelectItem>
                      <SelectItem value="both">Both Shipping & Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="isDefault">Set as default address</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No addresses saved</h2>
            <p className="text-gray-600 mb-8">
              Add your first address to make checkout faster and easier.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Address
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <Card key={address._id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {address.firstName} {address.lastName}
                      </CardTitle>
                      {address.isDefault && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(address)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(address._id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {address.company && (
                    <p className="text-sm font-medium text-gray-700">{address.company}</p>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    <p>{address.address1}</p>
                    {address.address2 && <p>{address.address2}</p>}
                    <p>{address.city}, {address.state} {address.postalCode}</p>
                    <p>{address.country}</p>
                  </div>

                  {address.phone && (
                    <p className="text-sm text-gray-600">{address.phone}</p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <Badge variant="outline">
                      {address.type === 'both' ? 'Shipping & Billing' : 
                       address.type === 'shipping' ? 'Shipping' : 'Billing'}
                    </Badge>
                    
                    {!address.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address._id)}
                      >
                        Set as Default
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}