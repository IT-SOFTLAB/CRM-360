'use client';

import { useEffect, useState } from 'react';
import { opportunityService } from '@/services/opportunity.service';

interface Opportunity {
  id: string;
  customerName: string;
  company: string;
}

interface Stage {
  id: string;
  name: string;
  opportunities?: Opportunity[];
}

export default function PipelineBoard() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPipeline();
  }, []);

  const loadPipeline = async () => {
    try {
      const data = await opportunityService.getPipelines();

      if (Array.isArray(data)) {
        setStages(data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="p-6">Loading pipeline...</p>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sales Pipeline</h1>

        <button
          onClick={loadPipeline}
          className="border rounded px-4 py-2 text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="min-w-[280px] rounded-lg border bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{stage.name}</h2>

              <span className="text-xs bg-gray-100 rounded-full px-2 py-1">
                {stage.opportunities?.length || 0}
              </span>
            </div>

            <div className="space-y-3">
              {stage.opportunities?.length ? (
                stage.opportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="rounded-md border p-3 hover:shadow-sm transition"
                  >
                    <p className="font-medium text-sm">
                      {opp.customerName}
                    </p>

                    <p className="text-xs text-gray-600 mt-1">
                      {opp.company}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No opportunities
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}