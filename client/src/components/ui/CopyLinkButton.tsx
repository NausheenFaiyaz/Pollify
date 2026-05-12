import { useMemo } from "react";
import { toast } from "react-hot-toast";
import { FaCopy, FaLink } from "react-icons/fa";

export default function CopyLinkButton({ slug }: { slug: string }) {
  const url = useMemo(() => `${window.location.origin}/poll/${slug}`, [slug]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Poll link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <button type="button" className="btn btn-outline" onClick={() => void onCopy()}>
      <FaCopy /> Copy Link
      <span className="srOnly"><FaLink /></span>
    </button>
  );
}
