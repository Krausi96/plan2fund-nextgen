import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Target, Award, Lightbulb, Shield } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          About Plan2Fund
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          We're on a mission to democratize access to funding by making professional 
          business planning accessible to every entrepreneur, regardless of their background.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <Card className="p-8">
          <div className="flex items-center mb-4">
            <Target className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold">Our Mission</h2>
          </div>
          <p className="text-gray-600">
            To eliminate the barriers between great ideas and the funding they need to succeed. 
            We believe every entrepreneur deserves access to professional-grade business planning tools 
            and funding opportunities.
          </p>
        </Card>

        <Card className="p-8">
          <div className="flex items-center mb-4">
            <Lightbulb className="w-8 h-8 text-yellow-600 mr-3" />
            <h2 className="text-2xl font-semibold">Our Vision</h2>
          </div>
          <p className="text-gray-600">
            A world where funding is accessible to all, where great ideas don't die due to 
            lack of resources, and where every entrepreneur has the tools to build a successful business.
          </p>
        </Card>
      </div>

      {/* What We Do */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">What We Do</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Smart Matching</h3>
            <p className="text-gray-600">
              Our AI-powered recommendation engine matches you with the perfect funding programs 
              based on your specific situation and needs.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Professional Plans</h3>
            <p className="text-gray-600">
              Generate institution-grade business plans that meet the standards of banks, 
              investors, and public funding programs.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Expert Guidance</h3>
            <p className="text-gray-600">
              Get personalized advice and step-by-step guidance throughout your funding journey, 
              from application to success.
            </p>
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
        <div className="prose max-w-3xl mx-auto text-gray-600">
          <p className="text-lg mb-6">
            Plan2Fund was born from a simple observation: too many brilliant entrepreneurs 
            struggle to access funding not because their ideas aren't good enough, but because 
            they lack the resources to create professional business plans and navigate the 
            complex world of funding opportunities.
          </p>
          <p className="text-lg mb-6">
            Our founders, having experienced this challenge firsthand, set out to create a 
            solution that would level the playing field. We built Plan2Fund to be the bridge 
            between great ideas and the funding they deserve.
          </p>
          <p className="text-lg">
            Today, we're proud to help entrepreneurs across Austria and Europe access over 
            €2 billion in funding opportunities, with a success rate that speaks to the 
            quality of our platform and the dedication of our users.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-gray-600">Business Plans Created</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-600 mb-2">€2M+</div>
            <div className="text-gray-600">Funding Secured</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-purple-600 mb-2">95%</div>
            <div className="text-gray-600">Success Rate</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-orange-600 mb-2">50+</div>
            <div className="text-gray-600">Funding Programs</div>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Sarah Chen</h3>
            <p className="text-blue-600 mb-2">CEO & Co-Founder</p>
            <p className="text-gray-600 text-sm">
              Former investment banker with 10+ years experience in startup funding and business development.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Marcus Weber</h3>
            <p className="text-blue-600 mb-2">CTO & Co-Founder</p>
            <p className="text-gray-600 text-sm">
              Tech entrepreneur and AI specialist with expertise in natural language processing and recommendation systems.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Anna Petrov</h3>
            <p className="text-blue-600 mb-2">Head of Product</p>
            <p className="text-gray-600 text-sm">
              UX designer and product strategist focused on making complex processes simple and accessible.
            </p>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-blue-50 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4">Ready to Start Your Funding Journey?</h2>
        <p className="text-gray-600 mb-6">
          Join hundreds of entrepreneurs who have successfully secured funding with Plan2Fund.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/reco">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Find Your Funding
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline">
              Get in Touch
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}