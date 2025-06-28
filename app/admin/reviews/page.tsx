'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { reviewsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star, 
  Search,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  ThumbsUp,
  Flag,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'sonner';

interface Review {
  _id: string;
  user: { _id: string; firstName: string; lastName: string; email: string };
  product: { _id: string; name: string; slug: string; images: Array<{ url: string; alt: string }> };
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulVotes: number;
  reportCount: number;
  images: Array<{ url: string; alt: string }>;
  adminResponse?: {
    message: string;
    respondedBy: { firstName: string; lastName: string };
    respondedAt: string;
  };
  createdAt: string;
}

export default function AdminReviewsPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [responseData, setResponseData] = useState({
    message: ''
  });

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    fetchReviews();
  }, [isAdmin, router, currentPage, searchQuery, statusFilter, ratingFilter]);

  const fetchReviews = async () => {
    try {
      const params: any = {
        page: currentPage,
        limit: 10
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (ratingFilter && ratingFilter !== 'all') params.rating = parseInt(ratingFilter);

      const response = await reviewsAPI.getAll(params);
      setReviews(response.data.reviews);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string, isApproved: boolean) => {
    try {
      await reviewsAPI.approve(reviewId, { isApproved });
      setReviews(reviews.map(review => 
        review._id === reviewId ? { ...review, isApproved } : review
      ));
      toast.success(`Review ${isApproved ? 'approved' : 'rejected'} successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update review status');
    }
  };

  const handleRespond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    setSubmitting(true);
    try {
      const response = await reviewsAPI.respond(selectedReview._id, responseData);
      setReviews(reviews.map(review => 
        review._id === selectedReview._id ? response.data.review : review
      ));
      toast.success('Admin response added successfully');
      setDialogOpen(false);
      setResponseData({ message: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add response');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
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
            <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
            <p className="text-gray-600">Manage customer reviews and feedback</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reviews.filter(r => r.isApproved).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reviews.filter(r => !r.isApproved).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Flag className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Reported</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reviews.filter(r => r.reportCount > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setRatingFilter('all');
                setCurrentPage(1);
              }}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reviews ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="border rounded-lg p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <img
                        src={review.product.images[0]?.url || 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg'}
                        alt={review.product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">{getRatingStars(review.rating)}</div>
                          <span className="text-sm text-gray-500">
                            by {review.user.firstName} {review.user.lastName}
                          </span>
                          {review.isVerifiedPurchase && (
                            <Badge variant="secondary" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{review.title}</h3>
                        <p className="text-gray-600 mb-2">{review.comment}</p>
                        <Link href={`/products/${review.product.slug}`} className="text-sm text-blue-600 hover:underline">
                          {review.product.name}
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={review.isApproved ? 'default' : 'secondary'}>
                        {review.isApproved ? 'Approved' : 'Pending'}
                      </Badge>
                      {review.reportCount > 0 && (
                        <Badge variant="destructive">
                          {review.reportCount} Reports
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {review.helpfulVotes} helpful
                      </div>
                      {review.reportCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Flag className="h-4 w-4" />
                          {review.reportCount} reports
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!review.isApproved && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(review._id, true)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      {review.isApproved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(review._id, false)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReview(review);
                          setResponseData({ 
                            message: review.adminResponse?.message || '' 
                          });
                          setDialogOpen(true);
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Respond
                      </Button>
                    </div>
                  </div>

                  {review.adminResponse && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Admin Response by {review.adminResponse.respondedBy.firstName} {review.adminResponse.respondedBy.lastName}
                        </span>
                        <span className="text-xs text-blue-600">
                          {new Date(review.adminResponse.respondedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-blue-800">{review.adminResponse.message}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Response Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Admin Response</DialogTitle>
            </DialogHeader>
            
            {selectedReview && (
              <form onSubmit={handleRespond} className="space-y-4">
                <div>
                  <Label>Review</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{getRatingStars(selectedReview.rating)}</div>
                      <span className="text-sm text-gray-600">{selectedReview.title}</span>
                    </div>
                    <p className="text-sm text-gray-700">{selectedReview.comment}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Your Response</Label>
                  <Textarea
                    id="message"
                    value={responseData.message}
                    onChange={(e) => setResponseData({ ...responseData, message: e.target.value })}
                    placeholder="Write your response to this review..."
                    rows={4}
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save Response'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}