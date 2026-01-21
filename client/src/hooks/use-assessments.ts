import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateAssessmentInput } from "@shared/routes";

export function useAssessments() {
  // Not strictly needed for the user flow described, but good for admin lists if added later
  return useQuery({
    queryKey: [api.assessments.create.path], // Using create path as base key for lists usually
    enabled: false, // Don't fetch automatically for now
  });
}

export function useAssessment(id: number | null) {
  return useQuery({
    queryKey: [api.assessments.get.path, id],
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      const url = buildUrl(api.assessments.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch assessment");
      return api.assessments.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAssessmentInput) => {
      const res = await fetch(api.assessments.create.path, {
        method: api.assessments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.assessments.create.responses[400].parse(await res.json());
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create assessment");
      }
      
      return api.assessments.create.responses[201].parse(await res.json());
    },
    // We don't necessarily need to invalidate a list here since we just redirect to the result
  });
}
