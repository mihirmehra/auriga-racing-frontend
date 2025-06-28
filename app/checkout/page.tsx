'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { cartAPI, addressesAPI, ordersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Truck, MapPin, User, Phone, Mail } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

interface CartItem {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    images: Array<{ url: string; alt: string }>;
  };
  quantity: number;
  price: number;
}

interface Cart {
  _id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
}

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
  isDefault: boolean;
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<string>('');
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<string>('');
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  
  const [newAddress, setNewAddress] = useState({
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
  });

  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      const [cartRes, addressesRes] = await Promise.all([
        cartAPI.get(),
        addressesAPI.getAll()
      ]);

      setCart(cartRes.data);
      setAddresses(addressesRes.data);

      // Set default addresses
      const defaultAddress = addressesRes.data.find((addr: Address) => addr.isDefault);
      if (defaultAddress) {
        setSelectedShippingAddress(defaultAddress._id);
        setSelectedBillingAddress(defaultAddress._id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = async () => {
    try {
      const response = await addressesAPI.create(newAddress);
      setAddresses([...addresses, response.data.address]);
      setSelectedShippingAddress(response.data.address._id);
      if (sameAsShipping) {
        setSelectedBillingAddress(response.data.address._id);
      }
      setShowNewAddressForm(false);
      setNewAddress({
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
      });
      toast.success('Address added successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!selectedShippingAddress) {
      toast.error('Please select a shipping address');
      return;
    }

    if (!sameAsShipping && !selectedBillingAddress) {
      toast.error('Please select a billing address');
      return;
    }

    setSubmitting(true);
    try {
      const shippingAddress = addresses.find(addr => addr._id === selectedShippingAddress);
      const billingAddress = sameAsShipping 
        ? shippingAddress 
        : addresses.find(addr => addr._id === selectedBillingAddress);

      const orderData = {
        items: cart.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        shippingAddress,
        billingAddress,
        paymentMethod,
      };

      const response = await ordersAPI.create(orderData);
      toast.success('Order placed successfully!');
      router.push(`/orders/${response.data.order._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
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

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add some items to your cart before checking out.</p>
          <Button onClick={() => router.push('/products')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = cart.subtotal;
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout</h1>
          <p className="text-gray-600">Complete your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {addresses.length > 0 && (
                  <div className="space-y-3">
                    <Label>Select an address</Label>
                    <RadioGroup
                      value={selectedShippingAddress}
                      onValueChange={setSelectedShippingAddress}
                    >
                      {addresses.map((address) => (
                        <div key={address._id} className="flex items-start space-x-2">
                          <RadioGroupItem value={address._id} id={`shipping-${address._id}`} />
                          <Label htmlFor={`shipping-${address._id}`} className="flex-1 cursor-pointer">
                            <div className="p-3 border rounded-lg hover:bg-gray-50">
                              <div className="font-medium">
                                {address.firstName} {address.lastName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {address.address1}
                                {address.address2 && `, ${address.address2}`}
                              </div>
                              <div className="text-sm text-gray-600">
                                {address.city}, {address.state} {address.postalCode}
                              </div>
                              {address.phone && (
                                <div className="text-sm text-gray-600">{address.phone}</div>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Add New Address
                </Button>

                {showNewAddressForm && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={newAddress.firstName}
                          onChange={(e) => setNewAddress({ ...newAddress, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={newAddress.lastName}
                          onChange={(e) => setNewAddress({ ...newAddress, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="company">Company (Optional)</Label>
                      <Input
                        id="company"
                        value={newAddress.company}
                        onChange={(e) => setNewAddress({ ...newAddress, company: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="address1">Address Line 1</Label>
                      <Input
                        id="address1"
                        value={newAddress.address1}
                        onChange={(e) => setNewAddress({ ...newAddress, address1: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                      <Input
                        id="address2"
                        value={newAddress.address2}
                        onChange={(e) => setNewAddress({ ...newAddress, address2: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={newAddress.postalCode}
                          onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleCreateAddress}>Save Address</Button>
                      <Button variant="outline" onClick={() => setShowNewAddressForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameAsShipping"
                    checked={sameAsShipping}
                    onCheckedChange={(checked) => {
                      // Check if the checked value is boolean
                      if (typeof checked === 'boolean') {
                        setSameAsShipping(checked);
                      }
                    }}
                  />
                  <Label htmlFor="sameAsShipping">Same as shipping address</Label>
                </div>

                {!sameAsShipping && addresses.length > 0 && (
                  <div className="space-y-3">
                    <Label>Select billing address</Label>
                    <RadioGroup
                      value={selectedBillingAddress}
                      onValueChange={setSelectedBillingAddress}
                    >
                      {addresses.map((address) => (
                        <div key={address._id} className="flex items-start space-x-2">
                          <RadioGroupItem value={address._id} id={`billing-${address._id}`} />
                          <Label htmlFor={`billing-${address._id}`} className="flex-1 cursor-pointer">
                            <div className="p-3 border rounded-lg hover:bg-gray-50">
                              <div className="font-medium">
                                {address.firstName} {address.lastName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {address.address1}
                                {address.address2 && `, ${address.address2}`}
                              </div>
                              <div className="text-sm text-gray-600">
                                {address.city}, {address.state} {address.postalCode}
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="credit_card" id="credit_card" />
                    <Label htmlFor="credit_card">Credit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="debit_card" id="debit_card" />
                    <Label htmlFor="debit_card">Debit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal">PayPal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                    <Label htmlFor="cash_on_delivery">Cash on Delivery</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.product._id} className="flex items-center gap-3">
                      <img
                        src={item.product.images[0]?.url || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={submitting || !selectedShippingAddress}
                >
                  {submitting ? 'Placing Order...' : `Place Order - $${total.toFixed(2)}`}
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  By placing your order, you agree to our Terms of Service and Privacy Policy.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}