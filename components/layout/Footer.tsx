import Link from 'next/link';
// import Image from 'next/image';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <h3 className="text-2xl font-bold text-gold">Auriga Racing</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Your premier destination for professional speed skating equipment. 
              Serving inline and ice speed skating athletes worldwide since 2010.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Speed Skating */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gold">Speed Skating</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/categories/skate-packages" className="text-gray-400 hover:text-white transition-colors">
                  Skate Packages
                </Link>
              </li>
              <li>
                <Link href="/categories/boots" className="text-gray-400 hover:text-white transition-colors">
                  Boots
                </Link>
              </li>
              <li>
                <Link href="/categories/frames" className="text-gray-400 hover:text-white transition-colors">
                  Frames
                </Link>
              </li>
              <li>
                <Link href="/categories/wheels-bearings" className="text-gray-400 hover:text-white transition-colors">
                  Wheels & Bearings
                </Link>
              </li>
              <li>
                <Link href="/categories/helmets" className="text-gray-400 hover:text-white transition-colors">
                  Helmets & Safety
                </Link>
              </li>
            </ul>
          </div>

          {/* Other Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gold">Other Categories</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/categories/fashion" className="text-gray-400 hover:text-white transition-colors">
                  Fashion & Apparel
                </Link>
              </li>
              <li>
                <Link href="/categories/cycling" className="text-gray-400 hover:text-white transition-colors">
                  Cycling & Triathlon
                </Link>
              </li>
              <li>
                <Link href="/deals" className="text-gray-400 hover:text-white transition-colors">
                  Hot Deals
                </Link>
              </li>
              <li>
                <Link href="/categories/accessories" className="text-gray-400 hover:text-white transition-colors">
                  Accessories
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gold">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gold mr-3 flex-shrink-0" />
                <span className="text-gray-400">
                  Speed Skating Center<br />
                  Amsterdam, Netherlands
                </span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gold mr-3 flex-shrink-0" />
                <span className="text-gray-400">+31 20 123 4567</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gold mr-3 flex-shrink-0" />
                <span className="text-gray-400">info@aurigaracing.com</span>
              </div>
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-gold mr-3 flex-shrink-0" />
                <span className="text-gray-400">Professional Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gold/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 Auriga Racing. All rights reserved. Professional speed skating equipment.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/shipping" className="text-gray-400 hover:text-white transition-colors">
                Shipping Info
              </Link>
              <Link href="/returns" className="text-gray-400 hover:text-white transition-colors">
                Returns
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}