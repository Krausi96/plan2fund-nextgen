import Head from "next/head";
import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";

export default function ForStartupsAustria() {
  return (
    <>
      <Head>
        <title>Startups & Entrepreneurs Österreich - Plan2Fund</title>
        <meta name="description" content="Verwandle deine innovativen Ideen in die Realität mit umfassender Geschäftsplanung. Zugang zu Pre-Seed-Finanzierung, MVP-Entwicklung und Marktvalidierungsprogrammen in Österreich." />
        <meta property="og:title" content="Startups & Entrepreneurs Österreich - Plan2Fund" />
        <meta property="og:description" content="Verwandle deine innovativen Ideen in die Realität mit umfassender Geschäftsplanung für österreichische Startups." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://plan2fund.com/for/startups-austria" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Startups Österreich - Plan2Fund" />
        <meta name="twitter:description" content="Geschäftsplanung für österreichische Startups und Entrepreneure." />
        <link rel="canonical" href="https://plan2fund.com/for/startups-austria" />
        <link rel="alternate" hrefLang="en" href="https://plan2fund.com/for/startups" />
        <link rel="alternate" hrefLang="de" href="https://plan2fund.com/for/startups-austria" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ 
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Startups & Entrepreneurs Österreich - Plan2Fund",
              "description": "Geschäftsplanung für österreichische Startups und Entrepreneure",
              "url": "https://plan2fund.com/for/startups-austria",
              "inLanguage": "de-AT",
              "about": {
                "@type": "Thing",
                "name": "Startup Funding Austria",
                "description": "Förderprogramme für österreichische Startups"
              }
            })
          }}
        />
      </Head>
      
      <main>
        <HeroLite
          title="Startups & Entrepreneurs Österreich"
          subtitle="Verwandle deine innovativen Ideen in die Realität mit umfassender Geschäftsplanung. Zugang zu Pre-Seed-Finanzierung, MVP-Entwicklung und Marktvalidierungsprogrammen."
        />
        
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Österreichische Förderprogramme für Startups</h2>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-xl font-semibold mb-2">AWS PreSeed</h3>
                  <p className="text-gray-600">
                    Bis zu €50.000 für innovative Geschäftsideen in der Frühphase. 
                    Perfekt für MVP-Entwicklung und Marktvalidierung.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-xl font-semibold mb-2">FFG Basisprogramm</h3>
                  <p className="text-gray-600">
                    Forschungs- und Entwicklungsprojekte mit bis zu €200.000 Förderung. 
                    Ideal für technologieorientierte Startups.
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-6">
                  <h3 className="text-xl font-semibold mb-2">EU Startup Calls</h3>
                  <p className="text-gray-600">
                    Horizon Europe und andere EU-Programme für innovative Unternehmen 
                    mit internationalem Potenzial.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-6">Warum Plan2Fund für österreichische Startups?</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <h4 className="font-semibold">Lokale Expertise</h4>
                    <p className="text-gray-600">Speziell entwickelt für österreichische Förderlandschaft</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <h4 className="font-semibold">Schnelle Umsetzung</h4>
                    <p className="text-gray-600">Geschäftsplan in unter 30 Minuten erstellen</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <h4 className="font-semibold">Programm-Bewusstsein</h4>
                    <p className="text-gray-600">Automatische Anpassung an Förderkriterien</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <h4 className="font-semibold">Deutsche Sprache</h4>
                    <p className="text-gray-600">Vollständig auf Deutsch verfügbar</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>
        
        <CTAStrip
          title="Bereit, dein Startup zu finanzieren?"
          subtitle="Erstelle deinen Geschäftsplan und finde die passenden Förderprogramme für dein österreichisches Startup."
          primaryAction={{
            label: "Plan starten",
            href: "/reco"
          }}
          secondaryAction={{
            label: "Preise ansehen",
            href: "/pricing"
          }}
        />
      </main>
    </>
  );
}
