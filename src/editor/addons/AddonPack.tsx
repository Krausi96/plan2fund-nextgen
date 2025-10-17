// ========= PLAN2FUND — ADD-ON PACK =========
// Add-on pack checkbox and information component


interface AddonPackProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function AddonPack({ enabled, onToggle }: AddonPackProps) {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Add-on Pack</h3>
          <p className="text-sm text-gray-600">
            Rush delivery + extra revision + provider form help
          </p>
          <div className="text-lg font-bold text-green-600">+€39</div>
        </div>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded"
          />
          <span className="text-sm font-medium">Enable Add-on Pack</span>
        </label>
      </div>

      {enabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
          <h4 className="font-medium text-blue-900">What's included:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Rush to first draft (target 3 business days)</li>
            <li>• One extra revision included</li>
            <li>• Provider form help (one standard form using your plan content)</li>
          </ul>
          <div className="text-xs text-blue-600 mt-2">
            Note: Not included: legal/visa advice, additional revisions, custom modelling, portal setup
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Decisions are made by the providers. Add-on pack can be added at any time before export.
      </div>
    </div>
  );
}
