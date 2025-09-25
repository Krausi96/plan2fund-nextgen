import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock, MessageCircle, HelpCircle } from "lucide-react";
import { useState } from "react";
import SEOHead from "@/components/common/SEOHead";
import { useI18n } from "@/contexts/I18nContext";

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
      
      <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          {t('contact.title')}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6">{t('contact.form.title')}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
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
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
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
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
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
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              {t('contact.form.submit')}
            </Button>
          </form>
        </Card>

        {/* Contact Information */}
        <div className="space-y-8">
          {/* Contact Details */}
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-6">{t('contact.info.title')}</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <Mail className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">{t('contact.info.email.title')}</h3>
                  <p className="text-gray-600">{t('contact.info.email.value')}</p>
                  <p className="text-sm text-gray-500">{t('contact.info.email.note')}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">{t('contact.info.phone.title')}</h3>
                  <p className="text-gray-600">{t('contact.info.phone.value')}</p>
                  <p className="text-sm text-gray-500">{t('contact.info.phone.note')}</p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">{t('contact.info.office.title')}</h3>
                  <p className="text-gray-600" style={{ whiteSpace: 'pre-line' }}>
                    {t('contact.info.office.value')}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">{t('contact.info.hours.title')}</h3>
                  <p className="text-gray-600" style={{ whiteSpace: 'pre-line' }}>
                    {t('contact.info.hours.value')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Help */}
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-6">{t('contact.help.title')}</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <HelpCircle className="w-5 h-5 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">{t('contact.help.faq.title')}</h3>
                  <p className="text-sm text-gray-600 mb-2">{t('contact.help.faq.description')}</p>
                  <a href="/faq" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    {t('contact.help.faq.link')}
                  </a>
                </div>
              </div>

              <div className="flex items-start">
                <MessageCircle className="w-5 h-5 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">{t('contact.help.chat.title')}</h3>
                  <p className="text-sm text-gray-600">{t('contact.help.chat.description')}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Mail className="w-5 h-5 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">{t('contact.help.support.title')}</h3>
                  <p className="text-sm text-gray-600">{t('contact.help.support.email')}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t('contact.faq.title')}</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">{t('contact.faq.howItWorks.question')}</h3>
            <p className="text-gray-600">
              {t('contact.faq.howItWorks.answer')}
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">{t('contact.faq.dataSecurity.question')}</h3>
            <p className="text-gray-600">
              {t('contact.faq.dataSecurity.answer')}
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">{t('contact.faq.timeToComplete.question')}</h3>
            <p className="text-gray-600">
              {t('contact.faq.timeToComplete.answer')}
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">{t('contact.faq.refunds.question')}</h3>
            <p className="text-gray-600">
              {t('contact.faq.refunds.answer')}
            </p>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}
