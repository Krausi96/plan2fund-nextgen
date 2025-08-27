import { useRouter } from "next/router";

export default function CartSummary() {
  const router = useRouter();
  const { plan } = router.query;

  const planDetails: Record<string, { name: string; price: string }> = {
    standard: { name: "Standard Plan", price: "€49" },
    premium: { name: "Premium Plan", price: "€99" },
  };

  const details = planDetails[plan as string] || planDetails.standard;

  return (
    <div className="p-4 border rounded bg-white shadow">
      <h2 className="text-lg font-bold mb-2">Your Selection</h2>
      <p className="text-gray-700">{details.name}</p>
      <p className="font-semibold">{details.price}</p>
    </div>
  );
}
