import { AxiosError } from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import {
  useFieldArray,
  useForm,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../api/client";

const questionSchema = z.object({
  prompt: z.string().min(3, "Question must be at least 3 characters"),
  required: z.boolean(),
  options: z
    .array(z.object({ label: z.string().min(1, "Option is required") }))
    .min(2)
    .max(10),
});

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(1000).optional(),
  responseMode: z.enum(["anonymous", "authenticated", "both"]),
  expiresAt: z.string().min(1, "Expiry is required"),
  questions: z.array(questionSchema).min(1),
});

type FormData = z.infer<typeof schema>;

const getApiError = (err: unknown) => {
  if (err instanceof AxiosError)
    return (err.response?.data as { message?: string })?.message ?? err.message;
  return "Failed to create poll";
};

function QuestionBlock({
  index,
  control,
  register,
  removeQuestion,
}: {
  index: number;
  control: Control<FormData>;
  register: UseFormRegister<FormData>;
  removeQuestion: (index: number) => void;
}) {
  const options = useFieldArray({
    control,
    name: `questions.${index}.options`,
  });

  return (
    <article className="pollSection questionBox">
      <div className="sectionHeadRow">
        <h3>Question {index + 1}</h3>
        <button
          type="button"
          className="danger ghost"
          onClick={() => removeQuestion(index)}
        >
          <MdDelete />
        </button>
      </div>

      <input
        placeholder="Enter your question"
        {...register(`questions.${index}.prompt`)}
      />

      <label className="optionRow checkboxRow">
        <input type="checkbox" {...register(`questions.${index}.required`)} />
        Required
      </label>

      <div className="stack">
        {options.fields.map((optionField, optionIndex) => (
          <div key={optionField.id} className="optionInputRow">
            <input
              placeholder={`Option ${optionIndex + 1}`}
              {...register(`questions.${index}.options.${optionIndex}.label`)}
            />
            {options.fields.length > 2 && (
              <button
                type="button"
                className="danger ghost"
                onClick={() => options.remove(optionIndex)}
              >
                <MdDelete />
              </button>
            )}
          </div>
        ))}
      </div>

      {options.fields.length < 10 && (
        <button
          type="button"
          className="ghost"
          onClick={() => options.append({ label: "" })}
        >
          <FaPlus /> Add option
        </button>
      )}
    </article>
  );
}

export default function CreatePollPage() {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      responseMode: "both",
      expiresAt: "",
      questions: [
        { prompt: "", required: true, options: [{ label: "" }, { label: "" }] },
      ],
    },
  });

  const questions = useFieldArray({ control, name: "questions" });

  const onSubmit = async (values: FormData) => {
    try {
      setSaving(true);
      setError("");
      await api.post("/polls", {
        ...values,
        expiresAt: new Date(values.expiresAt).toISOString(),
      });
      toast.success("Poll created successfully");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 600);
    } catch (err) {
      const msg = getApiError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const titleLength = watch("title")?.length ?? 0;
  const descriptionLength = watch("description")?.length ?? 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="stack createPollPage">
      <div className="poll-head">
        <h2 className="createTitle">Create a Poll</h2>
        <p className="muted">
          Set up your poll, add questions, and start collecting responses.
        </p>
      </div>
      {error && <p className="error">{error}</p>}

      <section className="pollSection">
        <h3>1. Basic Information</h3>
        <p className="muted">Give your poll a title and description</p>

        <div className="labelRow">
          <label>Title *</label>
          <span className="muted">{titleLength}/200</span>
        </div>
        <input placeholder="What do you want to ask?" {...register("title")} />
        {errors.title && <p className="error">{errors.title.message}</p>}

        <div className="labelRow">
          <label>Description</label>
          <span className="muted">{descriptionLength}/1000</span>
        </div>
        <textarea
          rows={4}
          placeholder="Add context for your respondents..."
          {...register("description")}
        />
      </section>

      <section className="pollSection">
        <h3>2. Settings</h3>
        <p className="muted">Configure response mode and expiry</p>
        <div className="setting-wrapper">
          <div className="wrapper">
            <div className="labelRow">
              <label>Response mode</label>
            </div>
            <select {...register("responseMode")}>
              <option value="both">Both anonymous + authenticated</option>
              <option value="anonymous">Anonymous only</option>
              <option value="authenticated">Authenticated only</option>
            </select>
          </div>
          <div className="wrapper">
            <div className="labelRow">
              <label>Expiry Date & Time *</label>
            </div>
            <input type="datetime-local" {...register("expiresAt")} />
            {errors.expiresAt && (
              <p className="error">{errors.expiresAt.message}</p>
            )}
          </div>
        </div>
      </section>

      <section className="pollSection">
        <div className="sectionHeadRow">
          <div>
            <h3>3. Questions</h3>
            <p className="muted">
              Single-choice questions with customizable options
            </p>
          </div>
          <button
            type="button"
            className="ghost"
            onClick={() =>
              questions.append({
                prompt: "",
                required: true,
                options: [{ label: "" }, { label: "" }],
              })
            }
          >
            <FaPlus /> Add Question
          </button>
        </div>

        <div className="stack">
          {questions.fields.map((field, index) => (
            <QuestionBlock
              key={field.id}
              index={index}
              control={control}
              register={register}
              removeQuestion={questions.remove}
            />
          ))}
        </div>
      </section>

      <button type="submit" disabled={saving} className="primaryAction btn">
        {saving ? "Creating..." : "Create Poll"}
      </button>
    </form>
  );
}
