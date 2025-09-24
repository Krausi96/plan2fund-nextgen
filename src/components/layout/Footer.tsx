import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50 text-gray-600">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold text-blue-600 mb-4">Plan2Fund</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Helping founders find funding and build comprehensive business plans 
              that meet Austrian and EU program standards.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>hello@plan2fund.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                <span>+43 1 234 5678</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>Vienna, Austria</span>
              </div>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link></li>
              <li><Link href="/about#partners" className="hover:text-blue-600 transition-colors">For partners</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/legal" className="hover:text-blue-600 transition-colors">Legal Notice</Link></li>
              <li><Link href="/privacy#security" className="hover:text-blue-600 transition-colors">Security & data</Link></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            We help you prepare your application; decisions are made by the providers.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} Plan2Fund. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
            <Link href="/legal" className="hover:text-blue-600 transition-colors">Legal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
