import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Data Found",
  description = "No record matched your current filter criteria or query parameters.",
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-aviation-850/40 rounded-xl border border-dashed border-aviation-700/60 my-4">
      <div className="p-3 bg-aviation-800 rounded-full text-aviation-sky mb-3">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-slate-200">{title}</h4>
      <p className="text-sm text-slate-400 mt-1 max-w-md">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
