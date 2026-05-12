import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../api/client";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  responseMode: z.enum(["anonymous", "authenticated", "both"]),
  expiresAt: z.string().min(1),
  questions: z.array(z.object({
    prompt: z.string().min(3),
    required: z.boolean(),
    options: z.array(z.object({ label: z.string().min(1) })).min(2),
  })).min(1),
});

type FormData = z.infer<typeof schema>;

export default function CreatePollPage() {
  const { control, register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      responseMode: "both",
      expiresAt: "",
      questions: [{ prompt: "", required: true, options: [{ label: "" }, { label: "" }] }],
    },
  });
  const q = useFieldArray({ control, name: "questions" });

  const onSubmit = async (values: FormData) => {
    await api.post("/polls", { ...values, expiresAt: new Date(values.expiresAt).toISOString() });
    window.location.href = "/dashboard";
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="stack">
      <h2>Create Poll</h2>
      <input placeholder="Poll title" {...register("title")} />
      <textarea placeholder="Description" {...register("description")} />
      <select {...register("responseMode")}>
        <option value="both">Both anonymous + authenticated</option>
        <option value="anonymous">Anonymous only</option>
        <option value="authenticated">Authenticated only</option>
      </select>
      <input type="datetime-local" {...register("expiresAt")} />

      {q.fields.map((field, index) => (
        <fieldset key={field.id} className="card">
          <input placeholder={`Question ${index + 1}`} {...register(`questions.${index}.prompt`)} />
          <label>
            <input type="checkbox" {...register(`questions.${index}.required`)} /> Required
          </label>
          <input placeholder="Option 1" {...register(`questions.${index}.options.0.label`)} />
          <input placeholder="Option 2" {...register(`questions.${index}.options.1.label`)} />
          <button type="button" onClick={() => q.remove(index)}>Remove Question</button>
        </fieldset>
      ))}

      <button type="button" onClick={() => q.append({ prompt: "", required: true, options: [{ label: "" }, { label: "" }] })}>
        Add Question
      </button>
      <button type="submit">Create Poll</button>
    </form>
  );
}
