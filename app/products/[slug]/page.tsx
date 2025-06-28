'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { productsAPI, cartAPI, reviewsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart, Heart, Star, Minus, Plus, Share2, Award,Truck, Shield, RotateCcw, ThumbsUp, Flag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { toast } from 'sonner';

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  currentPrice: number;
  originalPrice?: number;
  discountPercentage?: number;
  brand: string;
  images: Array<{ url: string; alt: string; isPrimary: boolean }>;
  category: { name: string; slug: string };
  rating: { average: number; count: number };
  inventory: { quantity: number; trackQuantity: boolean };
  attributes: Array<{ name: string; value: string }>;
  variants: Array<{ name: string; options: string[]; price?: number }>;
  keyAttributes: {
    size: string[];
    color: string[];
  };
  features: string[];
  isFeatured: boolean;
  tags: string[];
}

interface Review {
  _id: string;
  user: { firstName: string; lastName: string; avatar?: string };
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  images: Array<{ url: string; alt: string }>;
  adminResponse?: {
    message: string;
    respondedBy: { firstName: string; lastName: string };
    respondedAt: string;
  };
  createdAt: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const slug = params.slug as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<any>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({    
    rating: 5,
    title: '',
    comment: ''
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productRes = await productsAPI.getBySlug(slug);
        setProduct(productRes.data);
        
        // Set default selections
        if (productRes.data.keyAttributes?.size?.length > 0) {
          setSelectedSize(productRes.data.keyAttributes.size[0]);
        }
        if (productRes.data.keyAttributes?.color?.length > 0) {
          setSelectedColor(productRes.data.keyAttributes.color[0]);
        }
        
        // Get related products
        if (productRes.data._id) {
          try {
            const relatedResponse = await productsAPI.getRelated(productRes.data._id);
            setRelatedProducts(relatedResponse.data);
          } catch (error) {
            console.error('Error fetching related products:', error);
          }
        }

        // Get reviews
        fetchReviews(productRes.data._id);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const fetchReviews = async (productId: string) => {
    setReviewsLoading(true);
    try {
      const response = await reviewsAPI.getByProduct(productId, { limit: 10 });
      setReviews(response.data.reviews);
      setReviewStats(response.data.ratingStats);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) {
      toast.error('Please login to submit a review');
      return;
    }

    try {
      await reviewsAPI.create({
        productId: product._id,
        ...reviewFormData
      });
      toast.success('Review submitted successfully!');
      setReviewDialogOpen(false);
      setReviewFormData({ rating: 5, title: '', comment: '' });
      fetchReviews(product._id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await reviewsAPI.markHelpful(reviewId);
      toast.success('Review marked as helpful');
      fetchReviews(product!._id);
    } catch (error: any) {
      toast.error('Failed to mark review as helpful');
    }
  };

  const handleReportReview = async (reviewId: string) => {
    try {
      await reviewsAPI.report(reviewId);
      toast.success('Review reported');
    } catch (error: any) {
      toast.error('Failed to report review');
    }
  };


  const getRatingStars = (rating: number, size = 'h-5 w-5') => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingDistribution = () => {
    const total = reviewStats.reduce((sum: number, stat: any) => sum + stat.count, 0);
    return [5, 4, 3, 2, 1].map(rating => {
      const stat = reviewStats.find((s: any) => s._id === rating);
      const count = stat ? stat.count : 0;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      return { rating, count, percentage };
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      await cartAPI.add({ productId: product._id, quantity });
      toast.success(`${product.name} added to cart!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleAddToWishlist = () => {
    if (!product) return;
    
    // Add to wishlist logic here
    toast.success(`${product.name} added to wishlist!`);
  };

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

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">The product you are looking for doesnot exist.</p>
          <Link href="/products">
            <Button>Browse All Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const savings = product.originalPrice && product.originalPrice > product.currentPrice 
    ? (product.originalPrice - product.currentPrice).toFixed(2) 
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-blue-600">Products</Link>
          <span>/</span>
          <Link href={`/categories/${product.category.slug}`} className="hover:text-blue-600">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-white">
              <img
                src={product.images[selectedImage]?.url || primaryImage?.url || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
                alt={product.images[selectedImage]?.alt || product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 ${
                      selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{product.brand}</Badge>
                <Badge variant="outline">{product.category.name}</Badge>
                {product.isFeatured && (
                  <Badge className="bg-yellow-500 hover:bg-yellow-600">Featured</Badge>
                )}
                {product.discountPercentage && product.discountPercentage > 0 && (
                  <Badge className="bg-red-500 hover:bg-red-600">{product.discountPercentage}% OFF</Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating.average)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">
                    {product.rating.average} ({product.rating.count} reviews)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-bold text-gray-900">${product.currentPrice}</span>
                {product.originalPrice && product.originalPrice > product.currentPrice && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      ${product.originalPrice}
                    </span>
                    {savings && (
                      <Badge className="bg-green-100 text-green-800">
                        Save ${savings}
                      </Badge>
                    )}
                  </>
                )}
              </div>

              <p className="text-gray-600 mb-6">
                {product.shortDescription || product.description}
              </p>
            </div>

            {/* Size Selection */}
            {product.keyAttributes?.size && product.keyAttributes.size.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Size: {selectedSize}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.keyAttributes.size.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                        selectedSize === size
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.keyAttributes?.color && product.keyAttributes.color.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Color: {selectedColor}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.keyAttributes.color.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                        selectedColor === color
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={product.inventory.trackQuantity && quantity >= product.inventory.quantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {product.inventory.trackQuantity && (
                <p className="text-sm text-gray-600">
                  {product.inventory.quantity} items in stock
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button 
                onClick={handleAddToCart}
                className="flex-1"
                disabled={product.inventory.trackQuantity && product.inventory.quantity === 0}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Button variant="outline" onClick={handleAddToWishlist}>
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Key Features</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="h-4 w-4" />
                Free Shipping
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                Secure Payment
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RotateCcw className="h-4 w-4" />
                Easy Returns
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="mb-16">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.rating.count})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  <p>{product.description}</p>
                  
                  {product.features && product.features.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Features</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {product.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="specifications" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Product Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="font-medium">Brand</span>
                        <span className="text-gray-600">{product.brand}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="font-medium">Category</span>
                        <span className="text-gray-600">{product.category.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Available Options</h3>
                    <div className="space-y-3">
                      {product.keyAttributes?.size && product.keyAttributes.size.length > 0 && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-medium">Available Sizes</span>
                          <span className="text-gray-600">{product.keyAttributes.size.join(', ')}</span>
                        </div>
                      )}
                      {product.keyAttributes?.color && product.keyAttributes.color.length > 0 && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-medium">Available Colors</span>
                          <span className="text-gray-600">{product.keyAttributes.color.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {product.attributes.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Additional Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {product.attributes.map((attr, index) => (
                        <div key={index} className="flex justify-between py-2 border-b">
                          <span className="font-medium">{attr.name}</span>
                          <span className="text-gray-600">{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-6">
              {/* Review Summary */}
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">{product.rating.average}</div>
                      <div className="flex justify-center mb-2">
                        {getRatingStars(product.rating.average)}
                      </div>
                      <p className="text-gray-600">{product.rating.count} reviews</p>
                    </div>
                    <div className="space-y-2">
                      {getRatingDistribution().map(({ rating, count, percentage }) => (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-sm w-8">{rating}★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-400 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {user && (
                    <div className="mt-6 pt-6 border-t">
                      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>Write a Review</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Write a Review</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div>
                              <Label>Rating</Label>
                              <div className="flex gap-1 mt-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    type="button"
                                    onClick={() => setReviewFormData({ ...reviewFormData, rating })}
                                    className="p-1"
                                  >
                                    <Star
                                      className={`h-6 w-6 ${
                                        rating <= reviewFormData.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="title">Review Title</Label>
                              <Input
                                id="title"
                                value={reviewFormData.title}
                                onChange={(e) => setReviewFormData({ ...reviewFormData, title: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="comment">Your Review</Label>
                              <Textarea
                                id="comment"
                                value={reviewFormData.comment}
                                onChange={(e) => setReviewFormData({ ...reviewFormData, comment: e.target.value })}
                                rows={4}
                                required
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit">Submit Review</Button>
                              <Button type="button" variant="outline" onClick={() => setReviewDialogOpen(false)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reviews List */}
              <div className="space-y-6">
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <Card key={review._id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {review.user.firstName.charAt(0)}{review.user.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {review.user.firstName} {review.user.lastName}
                                </span>
                                {review.isVerifiedPurchase && (
                                  <Badge variant="secondary" className="text-xs">
                                    Verified Purchase
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex">{getRatingStars(review.rating, 'h-4 w-4')}</div>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <h4 className="font-semibold mb-2">{review.title}</h4>
                        <p className="text-gray-600 mb-4">{review.comment}</p>
                        
                        {review.adminResponse && (
                          <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-blue-900">
                                Response from {review.adminResponse.respondedBy.firstName} {review.adminResponse.respondedBy.lastName}
                              </span>
                              <span className="text-xs text-blue-600">
                                {new Date(review.adminResponse.respondedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-blue-800">{review.adminResponse.message}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkHelpful(review._id)}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Helpful ({review.helpfulVotes})
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReportReview(review._id)}
                          >
                            <Flag className="h-4 w-4 mr-1" />
                            Report
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Card key={relatedProduct._id} className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="relative overflow-hidden">
                    <img
                      src={relatedProduct.images[0]?.url || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
                      alt={relatedProduct.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {relatedProduct.discountPercentage && relatedProduct.discountPercentage > 0 && (
                      <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                        {relatedProduct.discountPercentage}% OFF
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <Link href={`/products/${relatedProduct.slug}`}>
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                        {relatedProduct.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-500 mb-2">{relatedProduct.brand}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">${relatedProduct.currentPrice}</span>
                        {relatedProduct.originalPrice && relatedProduct.originalPrice > relatedProduct.currentPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ${relatedProduct.originalPrice}
                          </span>
                        )}
                      </div>
                      <Button size="sm">View</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}