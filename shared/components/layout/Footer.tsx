import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { useI18n } from "@/shared/contexts/I18nContext";

export default function Footer() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();
  const copyrightText =
    ((t('footer.copyright') as string) || `© {year} Plan2Fund`).replace('{year}', String(currentYear));

  return (
    <footer className="border-t-2 border-neutral-200 bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Company Info */}
          <div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-neutral-700 to-neutral-900 bg-clip-text text-transparent mb-6">Plan2Fund</h3>
            <p className="text-neutral-700 mb-8 max-w-md leading-relaxed">
              {t("footer.tagline")}
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-lg flex items-center justify-center">
                  <Mail className="h-4 w-4 text-neutral-600" />
                </div>
                <span className="text-neutral-700 font-medium">{t("footer.email")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-lg flex items-center justify-center">
                  <Phone className="h-4 w-4 text-neutral-600" />
                </div>
                <span className="text-neutral-700 font-medium">{t("footer.phone")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-neutral-600" />
                </div>
                <span className="text-neutral-700 font-medium">{t("footer.address")}</span>
              </div>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-neutral-900 mb-6 text-lg uppercase tracking-wide">{t('footer.company')}</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/contact" className="text-neutral-700 hover:text-neutral-900 transition-colors font-medium">{t('footer.contact')}</Link></li>
              <li><Link href="/marketing/about#partners" className="text-neutral-700 hover:text-neutral-900 transition-colors font-medium">{t('footer.forPartners')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-neutral-900 mb-6 text-lg uppercase tracking-wide">{t('footer.legal')}</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/legal/privacy" className="text-neutral-700 hover:text-neutral-900 transition-colors font-medium">{t('footer.privacy')}</Link></li>
              <li><Link href="/legal/terms" className="text-neutral-700 hover:text-neutral-900 transition-colors font-medium">{t('footer.terms')}</Link></li>
              <li><Link href="/marketing/about" className="text-neutral-700 hover:text-neutral-900 transition-colors font-medium">{t('footer.legalNotice')}</Link></li>
              <li><Link href="/legal/privacy#security" className="text-neutral-700 hover:text-neutral-900 transition-colors font-medium">{t('footer.security')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t-2 border-neutral-200 text-center">
          <div className="text-sm text-neutral-600 font-medium">
            {copyrightText}
          </div>
        </div>
      </div>
    </footer>
  );
}
