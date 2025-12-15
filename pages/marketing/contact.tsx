import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Mail, Phone, MapPin, Clock, MessageCircle, HelpCircle } from "lucide-react";
import { useState } from "react";
import SEOHead from '@/shared/components/common/SEOHead';
import { useI18n } from "@/shared/contexts/I18nContext";
import Link from "next/link";

export default function ContactPage() {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Contact form submitted:', formData);
    alert(t('contact.form.successMessage'));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
      <SEOHead pageKey="contact" />
      
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
          {t('contact.title')}
        </h1>
        <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto">
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <Card className="p-8 rounded-2xl border-2 border-neutral-200 shadow-md hover:shadow-lg transition-shadow bg-white">
          <h2 className="text-2xl font-bold mb-6 text-neutral-900">{t('contact.form.title')}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-neutral-900 mb-2">
                  {t('contact.form.name')} *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('contact.form.namePlaceholder')}
                  className="rounded-xl border-2 border-neutral-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-900 mb-2">
                  {t('contact.form.email')} *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('contact.form.emailPlaceholder')}
                  className="rounded-xl border-2 border-neutral-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-neutral-900 mb-2">
                {t('contact.form.subject')} *
              </label>
              <Input
                id="subject"
                name="subject"
                type="text"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder={t('contact.form.subjectPlaceholder')}
                className="rounded-xl border-2 border-neutral-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-neutral-900 mb-2">
                {t('contact.form.message')} *
              </label>
              <Textarea
                id="message"
                name="message"
                required
                value={formData.message}
                onChange={handleChange}
                placeholder={t('contact.form.messagePlaceholder')}
                rows={6}
                className="rounded-xl border-2 border-neutral-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              {t('contact.form.submit')}
            </Button>
          </form>
        </Card>

        {/* Contact Information */}
        <div className="space-y-8">
          {/* Contact Details */}
          <Card className="p-8 rounded-2xl border-2 border-neutral-200 shadow-md hover:shadow-lg transition-shadow bg-white">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900">{t('contact.info.title')}</h2>
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 mb-1 text-lg">{t('contact.info.email.title')}</h3>
                  <p className="text-neutral-700 mb-1">{t('contact.info.email.value')}</p>
                  <p className="text-sm text-neutral-600">{t('contact.info.email.note')}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 mb-1 text-lg">{t('contact.info.phone.title')}</h3>
                  <p className="text-neutral-700 mb-1">{t('contact.info.phone.value')}</p>
                  <p className="text-sm text-neutral-600">{t('contact.info.phone.note')}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 mb-1 text-lg">{t('contact.info.office.title')}</h3>
                  <p className="text-neutral-700" style={{ whiteSpace: 'pre-line' }}>
                    {t('contact.info.office.value')}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 mb-1 text-lg">{t('contact.info.hours.title')}</h3>
                  <p className="text-neutral-700" style={{ whiteSpace: 'pre-line' }}>
                    {t('contact.info.hours.value')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Help */}
          <Card className="p-8 rounded-2xl border-2 border-neutral-200 shadow-md hover:shadow-lg transition-shadow bg-white">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900">{t('contact.help.title')}</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                  <HelpCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 mb-2 text-lg">{t('contact.help.faq.title')}</h3>
                  <p className="text-sm text-neutral-700 mb-3 leading-relaxed">{t('contact.help.faq.description')}</p>
                  <a href="/faq" className="text-blue-600 hover:text-blue-700 text-sm font-semibold underline decoration-2 underline-offset-2">
                    {t('contact.help.faq.link')}
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 mb-2 text-lg">{t('contact.help.chat.title')}</h3>
                  <p className="text-sm text-neutral-700 leading-relaxed">{t('contact.help.chat.description')}</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 mb-2 text-lg">{t('contact.help.support.title')}</h3>
                  <p className="text-sm text-neutral-700">{t('contact.help.support.email')}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-16 text-center">
        <p className="text-neutral-600 mb-4">
          Have questions? Check out our <Link href="/faq" className="text-blue-600 hover:text-blue-700 font-semibold underline decoration-2 underline-offset-2">FAQ page</Link> for quick answers.
        </p>
      </div>
        </div>
      </div>
    </>
  );
}
