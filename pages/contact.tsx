import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock, MessageCircle, HelpCircle } from "lucide-react";
import { useState } from "react";
import SEOHead from "@/components/common/SEOHead";

export default function ContactPage() {
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
    alert('Thank you for your message! We\'ll get back to you within 24 hours.');
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
          Get in Touch
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Have questions about funding opportunities or need help with your business plan? 
          We're here to help you succeed.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Send us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <Input
                id="subject"
                name="subject"
                type="text"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder="What can we help you with?"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <Textarea
                id="message"
                name="message"
                required
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us more about your question or project..."
                rows={6}
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Send Message
            </Button>
          </form>
        </Card>

        {/* Contact Information */}
        <div className="space-y-8">
          {/* Contact Details */}
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
            <div className="space-y-6">
              <div className="flex items-start">
                <Mail className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Email</h3>
                  <p className="text-gray-600">hello@plan2fund.com</p>
                  <p className="text-sm text-gray-500">We respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Phone</h3>
                  <p className="text-gray-600">+43 1 234 5678</p>
                  <p className="text-sm text-gray-500">Mon-Fri 9:00-18:00 CET</p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Office</h3>
                  <p className="text-gray-600">
                    Mariahilfer Straße 123<br />
                    1060 Vienna, Austria
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Business Hours</h3>
                  <p className="text-gray-600">
                    Monday - Friday: 9:00 - 18:00<br />
                    Saturday: 10:00 - 14:00<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Help */}
          <Card className="p-8">
            <h2 className="text-2xl font-semibold mb-6">Quick Help</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <HelpCircle className="w-5 h-5 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">FAQ</h3>
                  <p className="text-sm text-gray-600">Find answers to common questions</p>
                </div>
              </div>

              <div className="flex items-start">
                <MessageCircle className="w-5 h-5 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Live Chat</h3>
                  <p className="text-sm text-gray-600">Chat with our support team</p>
                </div>
              </div>

              <div className="flex items-start">
                <Mail className="w-5 h-5 text-green-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Support Email</h3>
                  <p className="text-sm text-gray-600">support@plan2fund.com</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">How does the funding recommendation work?</h3>
            <p className="text-gray-600">
              Our AI analyzes your business details and matches you with relevant funding programs 
              based on eligibility criteria, funding amounts, and program requirements.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Is my business plan data secure?</h3>
            <p className="text-gray-600">
              Yes, we use enterprise-grade security measures and are GDPR compliant. 
              Your data is encrypted and never shared without your consent.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">How long does it take to create a business plan?</h3>
            <p className="text-gray-600">
              Most users complete their business plan in 2-4 hours. Our guided process 
              and templates make it much faster than starting from scratch.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Do you offer refunds?</h3>
            <p className="text-gray-600">
              Yes, we offer a 30-day money-back guarantee if you're not satisfied 
              with our service. Contact us to request a refund.
            </p>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}
