'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Award, 
  Globe, 
  Heart, 
  Shield, 
  Truck, 
  Star,
  CheckCircle,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
  const stats = [
    { label: 'Happy Customers', value: '50,000+', icon: Users },
    { label: 'Products Sold', value: '1M+', icon: Award },
    { label: 'Countries Served', value: '25+', icon: Globe },
    { label: 'Years of Excellence', value: '10+', icon: Star },
  ];

  const values = [
    {
      icon: Heart,
      title: 'Customer First',
      description: 'We put our customers at the heart of everything we do, ensuring exceptional service and satisfaction.'
    },
    {
      icon: Shield,
      title: 'Quality Assurance',
      description: 'Every product is carefully selected and tested to meet our high standards of quality and reliability.'
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Quick and reliable shipping to get your orders to you as fast as possible, wherever you are.'
    },
    {
      icon: CheckCircle,
      title: 'Trust & Security',
      description: 'Your data and transactions are protected with industry-leading security measures.'
    }
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      description: 'Visionary leader with 15+ years in e-commerce and retail innovation.'
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
      description: 'Technology expert focused on creating seamless digital experiences.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Customer Experience',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
      description: 'Passionate about delivering exceptional customer service and support.'
    },
    {
      name: 'David Kim',
      role: 'Head of Operations',
      image: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg',
      description: 'Operations specialist ensuring efficient logistics and fulfillment.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">About Auriga Racing</h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            We are passionate about bringing you the best products and shopping experience. 
            Our mission is to make quality accessible to everyone, everywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Get in Touch
              </Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Shop Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 2014, Auriga Racing began as a small startup with a big dream: to revolutionize 
                  online shopping by making it more personal, reliable, and enjoyable for everyone.
                </p>
                <p>
                  What started as a team of five passionate individuals has grown into a global 
                  marketplace serving millions of customers worldwide. We have maintained our core 
                  values of quality, integrity, and customer satisfaction throughout our journey.
                </p>
                <p>
                  Today, we are proud to offer over 100,000 products from trusted brands and 
                  emerging creators, all carefully curated to meet our high standards. Our 
                  commitment to innovation drives us to continuously improve and expand our services.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg"
                alt="Our team working together"
                className="rounded-lg shadow-xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-blue-600 text-white p-6 rounded-lg">
                <div className="text-2xl font-bold">10+</div>
                <div className="text-sm">Years of Excellence</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These core principles guide everything we do and shape the experience we create for our customers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The passionate people behind Auriga Racing who work tirelessly to bring you the best shopping experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <Badge variant="secondary" className="mb-3">{member.role}</Badge>
                  <p className="text-gray-600 text-sm">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl mb-8 max-w-4xl mx-auto leading-relaxed">
            To democratize access to quality products by creating an inclusive, innovative, and sustainable 
            e-commerce platform that connects customers with the products they love while supporting 
            businesses of all sizes to thrive in the digital marketplace.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">🌍</div>
              <h3 className="text-lg font-semibold mb-2">Global Reach</h3>
              <p className="text-blue-100">Connecting customers worldwide with quality products</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">🤝</div>
              <h3 className="text-lg font-semibold mb-2">Trust & Reliability</h3>
              <p className="text-blue-100">Building lasting relationships through exceptional service</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">🚀</div>
              <h3 className="text-lg font-semibold mb-2">Innovation</h3>
              <p className="text-blue-100">Continuously evolving to meet changing customer needs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h2>
          <p className="text-xl text-gray-600 mb-8">
            Have questions or want to learn more about Auriga Racing? We do love to hear from you.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="flex items-center justify-center space-x-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700">hello@estore.com</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Phone className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700">+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700">New York, NY</span>
            </div>
          </div>
          
          <Link href="/contact">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Contact Us Today
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}