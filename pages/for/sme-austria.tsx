import Head from "next/head";
import HeroLite from "@/components/common/HeroLite";
import CTAStrip from "@/components/common/CTAStrip";

export default function ForSMEAustria() {
  return (
    <>
      <Head>
        <title>KMU & Etablierte Unternehmen Österreich - Plan2Fund</title>
        <meta name="description" content="Skaliere dein bestehendes Unternehmen mit strategischer Finanzierung und Expansionsplänen. Finde Wachstumsfinanzierung, Marktexpansion und Technologie-Upgrade-Möglichkeiten in Österreich." />
        <meta property="og:title" content="KMU & Etablierte Unternehmen Österreich - Plan2Fund" />
        <meta property="og:description" content="Skaliere dein bestehendes Unternehmen mit strategischer Finanzierung für österreichische KMU." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://plan2fund.com/for/sme-austria" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="KMU Österreich - Plan2Fund" />
        <meta name="twitter:description" content="Geschäftsplanung für österreichische KMU und etablierte Unternehmen." />
        <link rel="canonical" href="https://plan2fund.com/for/sme-austria" />
        <link rel="alternate" hrefLang="en" href="https://plan2fund.com/for/sme" />
        <link rel="alternate" hrefLang="de" href="https://plan2fund.com/for/sme-austria" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ 
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "KMU & Etablierte Unternehmen Österreich - Plan2Fund",
              "description": "Geschäftsplanung für österreichische KMU und etablierte Unternehmen",
              "url": "https://plan2fund.com/for/sme-austria",
              "inLanguage": "de-AT",
              "about": {
                "@type": "Thing",
                "name": "SME Funding Austria",
                "description": "Förderprogramme für österreichische KMU"
              }
            })
          }}
        />
      </Head>
      
      <main>
        <HeroLite
          title="KMU & Etablierte Unternehmen Österreich"
          subtitle="Skaliere dein bestehendes Unternehmen mit strategischer Finanzierung und Expansionsplänen. Finde Wachstumsfinanzierung, Marktexpansion und Technologie-Upgrade-Möglichkeiten."
        />
        
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Förderprogramme für österreichische KMU</h2>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-xl font-semibold mb-2">KMU-Digitalisierungsbonus</h3>
                  <p className="text-gray-600">
                    Bis zu €12.000 für Digitalisierungsprojekte. 
                    Perfekt für Technologie-Upgrades und Prozessoptimierung.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-xl font-semibold mb-2">FFG Basisprogramm</h3>
                  <p className="text-gray-600">
                    Forschungs- und Entwicklungsprojekte mit bis zu €200.000 Förderung. 
                    Ideal für Innovation und Produktentwicklung.
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-6">
                  <h3 className="text-xl font-semibold mb-2">EU-Förderprogramme</h3>
                  <p className="text-gray-600">
                    Horizon Europe, COSME und andere EU-Programme für 
                    internationale Expansion und Innovation.
                  </p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-6">
                  <h3 className="text-xl font-semibold mb-2">Bankkredite & Garantien</h3>
                  <p className="text-gray-600">
                    Günstige Kredite mit staatlichen Garantien für 
                    Investitionen und Wachstumsfinanzierung.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-6">Vorteile für österreichische KMU</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <h4 className="font-semibold">Lokale Marktkenntnis</h4>
                    <p className="text-gray-600">Speziell für österreichische Geschäftspraktiken optimiert</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <h4 className="font-semibold">Schnelle Umsetzung</h4>
                    <p className="text-gray-600">Strategische Pläne in unter 30 Minuten erstellen</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <h4 className="font-semibold">Compliance</h4>
                    <p className="text-gray-600">Automatische Einhaltung österreichischer Standards</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <h4 className="font-semibold">Deutsche Sprache</h4>
                    <p className="text-gray-600">Vollständig auf Deutsch verfügbar</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <div>
                    <h4 className="font-semibold">Steuerliche Aspekte</h4>
                    <p className="text-gray-600">Berücksichtigung österreichischer Steuergesetze</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>
        
        <CTAStrip
          title="Bereit, dein KMU zu skalieren?"
          subtitle="Erstelle deinen Expansionsplan und finde die passenden Förderprogramme für dein österreichisches Unternehmen."
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
