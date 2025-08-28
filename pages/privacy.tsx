export default function Legal() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Privacy Policy
        </h1>
      </section>
      <p className="text-gray-700">
        In compliance with Austrian and EU law, Plan2Fund provides the following company information:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700">
        <li><b>Company Name:</b> Plan2Fund</li>
        <li><b>Business Address:</b> Vienna, Austria</li>
        <li><b>Email:</b> contact@plan2fund.com</li>
        <li><b>VAT ID:</b> [Placeholder VAT Number]</li>
        <li><b>Managing Director:</b> [Your Name Here]</li>
      </ul>
      <p className="text-gray-600 mt-6">
        Dispute resolution: Online dispute resolution platform provided by the European Commission at
        <a href="https://ec.europa.eu/consumers/odr" className="text-blue-600 hover:underline"> https://ec.europa.eu/consumers/odr</a>.
      </p>
    </main>
  );
}


