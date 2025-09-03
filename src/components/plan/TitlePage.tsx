import React, { useState } from "react";

type TitlePageProps = {
  onUpdate: (data: TitlePageData) => void;
  initialData?: TitlePageData;
};

export type TitlePageData = {
  companyName: string;
  documentTitle: string;
  subtitle: string;
  date: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  logo?: string;
};

export default function TitlePage({ onUpdate, initialData }: TitlePageProps) {
  const [data, setData] = useState<TitlePageData>(
    initialData || {
      companyName: "",
      documentTitle: "Business Plan",
      subtitle: "",
      date: new Date().toLocaleDateString(),
      contact: {
        name: "",
        email: "",
        phone: "",
        address: ""
      }
    }
  );

  const handleChange = (field: string, value: string) => {
    const newData = { ...data };
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      (newData as any)[parent][child] = value;
    } else {
      (newData as any)[field] = value;
    }
    setData(newData);
    onUpdate(newData);
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Title Page</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Company Name</label>
          <input
            type="text"
            value={data.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Your Company Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Document Title</label>
          <input
            type="text"
            value={data.documentTitle}
            onChange={(e) => handleChange('documentTitle', e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Business Plan"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Subtitle</label>
          <input
            type="text"
            value={data.subtitle}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Optional subtitle"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="text"
            value={data.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Contact Information</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Contact Name</label>
              <input
                type="text"
                value={data.contact.name}
                onChange={(e) => handleChange('contact.name', e.target.value)}
                className="w-full border rounded p-2"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={data.contact.email}
                onChange={(e) => handleChange('contact.email', e.target.value)}
                className="w-full border rounded p-2"
                placeholder="john@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={data.contact.phone}
                onChange={(e) => handleChange('contact.phone', e.target.value)}
                className="w-full border rounded p-2"
                placeholder="+43 123 456 789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={data.contact.address}
                onChange={(e) => handleChange('contact.address', e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Vienna, Austria"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6 border-t pt-4">
        <h4 className="font-medium mb-3">Preview</h4>
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">{data.companyName || "Company Name"}</h1>
            <h2 className="text-xl font-semibold">{data.documentTitle}</h2>
            {data.subtitle && <p className="text-gray-600">{data.subtitle}</p>}
            <p className="text-sm text-gray-500">{data.date}</p>
            <div className="text-sm text-gray-600 space-y-1">
              {data.contact.name && <p>{data.contact.name}</p>}
              {data.contact.email && <p>{data.contact.email}</p>}
              {data.contact.phone && <p>{data.contact.phone}</p>}
              {data.contact.address && <p>{data.contact.address}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

