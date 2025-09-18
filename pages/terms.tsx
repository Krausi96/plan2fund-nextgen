import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="prose max-w-none">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-lg text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using Plan2Fund ("the Service"), you accept and agree to be bound by 
            the terms and provision of this agreement. If you do not agree to abide by the above, 
            please do not use this service.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p className="mb-4">
            Plan2Fund provides an online platform that helps entrepreneurs and businesses:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Find relevant funding opportunities through our recommendation engine</li>
            <li>Create professional business plans using our templates and tools</li>
            <li>Access expert guidance and resources for funding applications</li>
            <li>Connect with funding programs and institutions</li>
          </ul>
          <p className="mb-4">
            The Service is provided "as is" and we reserve the right to modify, suspend, or 
            discontinue the Service at any time without notice.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <h3 className="text-xl font-medium mb-3">3.1 Account Creation</h3>
          <p className="mb-4">
            To use certain features of the Service, you must create an account. You agree to:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and update your information to keep it accurate</li>
            <li>Maintain the security of your password and account</li>
            <li>Accept responsibility for all activities under your account</li>
          </ul>

          <h3 className="text-xl font-medium mb-3">3.2 Account Termination</h3>
          <p className="mb-4">
            We may terminate or suspend your account at any time for violation of these terms 
            or for any other reason at our sole discretion.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
          <p className="mb-4">You agree to use the Service only for lawful purposes and in accordance with these terms. You agree not to:</p>
          <ul className="list-disc list-inside mb-4 space-y-2">
            <li>Use the Service for any illegal or unauthorized purpose</li>
            <li>Violate any laws in your jurisdiction</li>
            <li>Transmit any viruses, worms, or malicious code</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Use the Service to harass, abuse, or harm others</li>
            <li>Impersonate any person or entity</li>
            <li>Provide false or misleading information</li>
          </ul>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
          <h3 className="text-xl font-medium mb-3">5.1 Our Content</h3>
          <p className="mb-4">
            The Service and its original content, features, and functionality are owned by Plan2Fund 
            and are protected by international copyright, trademark, patent, trade secret, and other 
            intellectual property laws.
          </p>

          <h3 className="text-xl font-medium mb-3">5.2 Your Content</h3>
          <p className="mb-4">
            You retain ownership of any content you create using our Service. By using the Service, 
            you grant us a limited, non-exclusive, royalty-free license to use, store, and process 
            your content solely for the purpose of providing the Service.
          </p>

          <h3 className="text-xl font-medium mb-3">5.3 Third-Party Content</h3>
          <p className="mb-4">
            The Service may contain links to third-party websites or services. We are not responsible 
            for the content or practices of these third parties.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Payment Terms</h2>
          <h3 className="text-xl font-medium mb-3">6.1 Fees</h3>
          <p className="mb-4">
            Some features of the Service may require payment. All fees are non-refundable unless 
            otherwise stated. We reserve the right to change our fees at any time with notice.
          </p>

          <h3 className="text-xl font-medium mb-3">6.2 Billing</h3>
          <p className="mb-4">
            Payment is due in advance for subscription services. We may suspend or terminate your 
            account for non-payment.
          </p>

          <h3 className="text-xl font-medium mb-3">6.3 Refunds</h3>
          <p className="mb-4">
            We offer a 30-day money-back guarantee for new subscriptions. Refunds are processed 
            within 5-10 business days.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Privacy</h2>
          <p className="mb-4">
            Your privacy is important to us. Please review our Privacy Policy, which also governs 
            your use of the Service, to understand our practices.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Disclaimers</h2>
          <p className="mb-4">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
            EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF 
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p className="mb-4">
            WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, 
            OR THAT ANY DEFECTS WILL BE CORRECTED.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
          <p className="mb-4">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, PLAN2FUND SHALL NOT BE LIABLE FOR ANY 
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT 
            NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR RELATING TO YOUR 
            USE OF THE SERVICE.
          </p>
          <p className="mb-4">
            OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS 
            OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US FOR THE SERVICE IN THE 
            TWELVE MONTHS PRECEDING THE CLAIM.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
          <p className="mb-4">
            You agree to indemnify and hold harmless Plan2Fund and its officers, directors, 
            employees, and agents from any claims, damages, or expenses arising out of your 
            use of the Service or violation of these terms.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
          <p className="mb-4">
            These terms shall be governed by and construed in accordance with the laws of Austria, 
            without regard to its conflict of law provisions. Any disputes arising out of these 
            terms shall be subject to the exclusive jurisdiction of the courts of Vienna, Austria.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right to modify these terms at any time. We will notify users of any 
            material changes by posting the new terms on this page and updating the "Last updated" date.
          </p>
          <p className="mb-4">
            Your continued use of the Service after any such changes constitutes acceptance of the new terms.
          </p>
        </Card>

        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Severability</h2>
          <p className="mb-4">
            If any provision of these terms is found to be unenforceable or invalid, that provision 
            will be limited or eliminated to the minimum extent necessary so that the remaining terms 
            will remain in full force and effect.
          </p>
        </Card>

        <Card className="p-8">
          <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
          <p className="mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="space-y-2">
            <p><strong>Email:</strong> legal@plan2fund.com</p>
            <p><strong>Address:</strong> Mariahilfer Straße 123, 1060 Vienna, Austria</p>
            <p><strong>Phone:</strong> +43 1 234 5678</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
