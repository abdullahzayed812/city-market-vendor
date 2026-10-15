import apiClient from './apiClient';
import type {
  ApiResponse,
  ProductDuplicateMatch,
  ProductSubmission,
  ProductSubmissionInput,
  SubmissionImageRules,
  SubmissionImageUploadResult,
} from '@city-market/shared';
import type { PickedImage } from './vendorService';

// Shown before the server's rules arrive (same as the server defaults)
export const DEFAULT_IMAGE_RULES: SubmissionImageRules = {
  formats: ['jpeg', 'png', 'webp'],
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  minWidth: 800,
  minHeight: 800,
  maxBytes: 5 * 1024 * 1024,
};

export const ProductSubmissionService = {
  getImageRules: async () => (await apiClient.get<ApiResponse<SubmissionImageRules>>('/media/submission-images/rules')).data.data!,

  // Stored privately by media-service; only the returned key goes into the proposal
  uploadImage: async (image: PickedImage, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('file', { uri: image.uri, type: image.type || 'image/jpeg', name: image.fileName || 'product.jpg' } as any);
    const response = await apiClient.post<ApiResponse<SubmissionImageUploadResult>>('/media/submission-images', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
      onUploadProgress: e => {
        if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100));
      },
    });
    return response.data.data!;
  },

  checkDuplicates: async (name: string, globalCategoryId?: string) =>
    (await apiClient.post<ApiResponse<{ matches: ProductDuplicateMatch[] }>>('/catalog/product-submissions/check-duplicates', { name, globalCategoryId })).data
      .data!.matches,

  create: async (input: ProductSubmissionInput) => (await apiClient.post<ApiResponse<ProductSubmission>>('/catalog/product-submissions', input)).data.data!,

  update: async (id: string, input: ProductSubmissionInput) =>
    (await apiClient.put<ApiResponse<ProductSubmission>>(`/catalog/product-submissions/${id}`, input)).data.data!,

  cancel: async (id: string) => (await apiClient.post<ApiResponse<ProductSubmission>>(`/catalog/product-submissions/${id}/cancel`)).data.data!,

  list: async (params: { status?: string; page?: number; limit?: number }) =>
    (await apiClient.get<ApiResponse<{ data: ProductSubmission[]; total: number; page: number; limit: number }>>('/catalog/product-submissions/mine', { params }))
      .data.data!,

  get: async (id: string) => (await apiClient.get<ApiResponse<ProductSubmission>>(`/catalog/product-submissions/${id}`)).data.data!,
};

// API error code -> translation key (falls back to the generic message)
export const submissionErrorKey = (error: any): string => {
  const code = error?.response?.data?.message;
  return code ? `product_submissions.errors.${code}` : 'product_submissions.errors.generic';
};
