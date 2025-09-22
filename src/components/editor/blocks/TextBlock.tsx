import React from 'react';

interface TextBlockProps {
  data: {
    content: string;
    heading?: string;
  };
  onEdit: (data: any) => void;
  isSelected?: boolean;
}

export default function TextBlock({ data, onEdit, isSelected = false }: TextBlockProps) {
  return (
    <div className={`p-4 border rounded-lg ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      {data.heading && (
        <h3 className="text-lg font-semibold mb-2">{data.heading}</h3>
      )}
      <textarea
        value={data.content || ''}
        onChange={(e) => onEdit({ ...data, content: e.target.value })}
        className="w-full min-h-[100px] p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter your text content here..."
      />
    </div>
  );
}
