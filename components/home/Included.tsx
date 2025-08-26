const items = [
  "✔ Structured, submission-ready business plan",
  "✔ Delivered as Google Doc or Word (PDF optional)",
  "✔ Includes a 1-Page Executive Summary",
  "✔ Optional NDA",
  "✔ Includes 1 free revision",
  "✔ Async: No calls required, but support available",
];

export default function Included() {
  return (
    <div className="py-12">
      <h2 className="text-2xl font-bold text-center mb-8">What’s Included</h2>
      <ul className="max-w-xl mx-auto space-y-3 text-gray-700">
        {items.map((i, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
