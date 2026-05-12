export type PollQuestion = {
  _id: string;
  prompt: string;
  required: boolean;
  options: { label: string }[];
};

export type Poll = {
  _id: string;
  slug: string;
  title: string;
  description: string;
  responseMode: "anonymous" | "authenticated" | "both";
  expiresAt: string;
  isPublished: boolean;
  questions: PollQuestion[];
};
