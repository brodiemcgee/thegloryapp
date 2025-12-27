// Health view - sexual health resources and testing info

'use client';

export default function HealthView() {
  return (
    <div className="h-full w-full flex flex-col bg-hole-bg">
      {/* Header */}
      <div className="p-4 border-b border-hole-border">
        <h1 className="text-xl font-bold">Health</h1>
        <p className="text-sm text-hole-muted">Sexual health resources</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* PrEP Section */}
        <div className="bg-hole-surface rounded-lg p-4 border border-hole-border">
          <h2 className="font-semibold mb-2">PrEP Information</h2>
          <p className="text-sm text-hole-muted">
            Pre-exposure prophylaxis (PrEP) is a medication that can reduce your risk of getting HIV.
          </p>
        </div>

        {/* Testing Section */}
        <div className="bg-hole-surface rounded-lg p-4 border border-hole-border">
          <h2 className="font-semibold mb-2">Get Tested</h2>
          <p className="text-sm text-hole-muted">
            Regular STI testing is important for your health and the health of your partners.
          </p>
          <button className="mt-3 w-full py-2 bg-hole-accent text-white rounded-lg font-medium">
            Find Testing Near You
          </button>
        </div>

        {/* Resources Section */}
        <div className="bg-hole-surface rounded-lg p-4 border border-hole-border">
          <h2 className="font-semibold mb-2">Resources</h2>
          <ul className="text-sm text-hole-muted space-y-2">
            <li>• CDC Sexual Health Guidelines</li>
            <li>• Local LGBTQ+ Health Centers</li>
            <li>• Mental Health Support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
