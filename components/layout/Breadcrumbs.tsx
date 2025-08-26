import Link from "next/link";
import { useRouter } from "next/router";

export default function Breadcrumbs() {
  const router = useRouter();
  const pathParts = router.asPath.split("/").filter(Boolean);

  return (
    <nav className="text-sm text-gray-500 mb-4">
      <Link href="/">Home</Link>
      {pathParts.map((part, i) => {
        const href = "/" + pathParts.slice(0, i + 1).join("/");
        return (
          <span key={i}>
            {" / "}
            <Link href={href}>{part}</Link>
          </span>
        );
      })}
    </nav>
  );
}
