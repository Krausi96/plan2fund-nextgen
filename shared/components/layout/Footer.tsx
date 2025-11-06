import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { useI18n } from "@/shared/contexts/I18nContext";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Plan2Fund</h3>
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
            <h4 className="font-semibold text-gray-900 mb-4">{t('footer.company')}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">{t('footer.contact')}</Link></li>
              <li><Link href="/about#partners" className="text-gray-600 hover:text-blue-600 transition-colors">{t('footer.forPartners')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link href="/terms" className="text-gray-600 hover:text-blue-600 transition-colors">{t('footer.terms')}</Link></li>
              <li><Link href="/legal" className="text-gray-600 hover:text-blue-600 transition-colors">{t('footer.legalNotice')}</Link></li>
              <li><Link href="/privacy#security" className="text-gray-600 hover:text-blue-600 transition-colors">{t('footer.security')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} Plan2Fund. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
