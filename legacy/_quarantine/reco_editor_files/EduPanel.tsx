export default function EduPanel() {
  return (
    <aside className="w-full md:w-80 bg-blue-50 border rounded-lg p-4 text-sm text-blue-900">
      <h3 className="font-semibold mb-2">Tips</h3>
      <ul className="list-disc list-inside space-y-1">
        <li>Be specific about your product and market.</li>
        <li>Mention country, team size, and funding need.</li>
        <li>State timeline and key milestones.</li>
      </ul>
      <div className="mt-3">
        <h4 className="font-semibold">Funding readiness</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Have a basic financial plan</li>
          <li>Proof of company/registration (if applicable)</li>
          <li>Clear budget and use of funds</li>
        </ul>
      </div>
    </aside>
  )
}


