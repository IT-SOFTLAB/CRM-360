"use client";

import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#A855F7",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

export default function AddStageModal({
  open,
  onClose,
  onCreate,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    color: "#3B82F6",
    isFinal: false,
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        color: "#3B82F6",
        isFinal: false,
      });
    }
  }, [open]);

  if (!open) return null;

const handleSubmit = async () => {
  if (!form.name.trim()) return;

  await onCreate({
    ...form,
    name: form.name.trim(),
  });

  onClose();
};
  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 text-red-500"
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-center justify-center z-50">

        <div className="bg-card rounded-2xl shadow-xl border border-border-crm w-[500px]">

          {/* Header */}

          <div className="flex justify-between items-center p-5 border-b border-border-crm">

            <div>

              <h2 className="font-bold text-lg text-black">

                Create New Stage

              </h2>

              <p className="text-xs text-muted-foreground text-blue-500">

                Add another stage into your retention pipeline.

              </p>

            </div>

            <button onClick={onClose}>

              <X size={20} />

            </button>

          </div>

          {/* Body */}

          <div className="p-6 space-y-6">

            <div>

              <label className="block text-sm font-medium mb-2 text-black">

                Stage Name

              </label>

              <input

                value={form.name}

                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }

                className="w-full border border-border-crm rounded-xl px-4 py-3 text-black"

                placeholder="Example: Proposal Sent"

              />

            </div>

            {/* Colors */}

            <div>

              <label className="block text-sm font-medium mb-3 text-gray-800">

                Stage Color

              </label>

              <div className="flex flex-wrap gap-3">

                {COLORS.map((color) => (

                  <button

                    key={color}

                    type="button"

                    onClick={() =>
                      setForm({
                        ...form,
                        color,
                      })
                    }

                    className={`w-9 h-9 rounded-full border-4 ${
                      form.color === color
                        ? "border-black"
                        : "border-transparent"
                    }`}

                    style={{
                      background: color,
                    }}

                  />

                ))}

              </div>

            </div>

            {/* Final Stage */}

            <div className="flex items-center gap-3">

             <label className="flex items-center gap-3 cursor-pointer text-black">

<input
type="checkbox"
checked={form.isFinal}
onChange={(e)=>
setForm({
...form,
isFinal:e.target.checked
})
}
/>

<span className="text-sm text-blue-900">
Final Stage
</span>

</label>

              <span className="text-blue-950">

                Mark as Final Stage

              </span>

            </div>

          </div>

          {/* Footer */}

          <div className="border-t border-border-crm p-5 flex justify-end gap-3 text-black">

            <button

              onClick={onClose}

              className="px-5 py-2 rounded-xl border border-black text-black"

            >

              Cancel

            </button>

         <button
    onClick={handleSubmit}
    disabled={!form.name.trim()}

              className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-xl flex items-center gap-2"

            >

              <Plus size={16} />

              Create Stage

            </button>

          </div>

        </div>

      </div>

    </>
  );
}