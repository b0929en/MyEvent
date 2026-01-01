'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import { useRequireRole } from '@/contexts/AuthContext';
import { ArrowLeft, FileText, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createProposal } from '@/backend/services/proposalService';
import { getStudentByMatric } from '@/backend/services/userService';
import { uploadDocument } from '@/backend/services/storageService';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const proposalSchema = z.object({
  eventTitle: z.string().min(5, 'Title must be at least 5 characters'),
  eventDescription: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['sport', 'academic', 'cultural', 'social', 'competition', 'talk', 'workshop', 'other']),
  estimatedParticipants: z.number().min(1, 'Must have at least 1 participant'),
  proposedDate: z.string().min(1, 'Proposed date is required'),
  proposedVenue: z.string().min(3, 'Venue is required'),
  committeeMembers: z.array(z.object({
    matricNumber: z.string().min(1, 'Matric number is required'),
    name: z.string().min(1, 'Name is required'),
    position: z.string().min(1, 'Position is required'),
    email: z.string().optional(),
    phone: z.string().optional(),
    faculty: z.string().optional(),
  })).optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

// Define the keys for our documents
type DocKey = 'eventProposal' | 'budgetPlan' | 'riskAssessment' | 'supportingDocuments';

type DocumentsState = {
  [key in DocKey]: File | null;
};

const FileUploadField = ({
  label,
  field,
  description,
  documents,
  onFileChange
}: {
  label: string;
  field: DocKey;
  description: string;
  documents: DocumentsState;
  onFileChange: (field: DocKey, file: File | null) => void;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} <span className="text-red-500">*</span>
    </label>
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-500 transition-colors">
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <FileText className="w-10 h-10 text-gray-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-700 font-medium mb-1">{description}</p>
          <p className="text-xs text-gray-500 mb-2">PDF format, max 10MB</p>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => onFileChange(field, e.target.files?.[0] || null)}
            className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
        </div>
      </div>
      {documents[field] && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-green-600 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {documents[field]!.name}
          </p>
        </div>
      )}
    </div>
  </div>
);

export default function SubmitProposalPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireRole(['organizer'], '/');

  const [documents, setDocuments] = useState<DocumentsState>({
    eventProposal: null,
    budgetPlan: null,
    riskAssessment: null,
    supportingDocuments: null,
  });

  const {
    control, // Add control here
    register,
    handleSubmit,
    setValue, // Add setValue here
    formState: { errors, isSubmitting }
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      committeeMembers: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "committeeMembers"
  });

  // Helper to lookup student name
  const handleMatricBlur = async (index: number, matric: string) => {
    if (!matric) return;
    try {
      const student = await getStudentByMatric(matric);
      if (student) {
        setValue(`committeeMembers.${index}.name`, student.name || '');
        if (student.email) setValue(`committeeMembers.${index}.email`, student.email);
        if (student.faculty) setValue(`committeeMembers.${index}.faculty`, student.faculty);
        toast.success(`Student found: ${student.name}`);
      } else {
        toast.error('Student not found');
        setValue(`committeeMembers.${index}.name`, '');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error fetching student');
    }
  };

  const handleFileChange = (field: DocKey, file: File | null) => {
    setDocuments(prev => ({ ...prev, [field]: file }));
  };

  const onSubmit = async (data: ProposalFormData) => {
    if (!user) {
      toast.error('You must be logged in to submit a proposal');
      return;
    }

    // Validate required documents (supportingDocuments is optional in some flows, but let's assume required here based on your previous code)
    if (!documents.eventProposal || !documents.budgetPlan || !documents.riskAssessment || !documents.supportingDocuments) {
      toast.error('Please upload all required documents');
      return;
    }

    try {
      toast.info('Uploading documents...');

      // Upload all files in parallel
      const uploadPromises = (Object.keys(documents) as DocKey[]).map(async (key) => {
        const file = documents[key];
        if (!file) throw new Error(`Missing file: ${key}`);

        const path = `proposals/${user.id}/${Date.now()}-${key}-${file.name}`;
        const url = await uploadDocument(file, path);
        return { key, url };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Convert array back to object
      const documentsUrls = uploadedFiles.reduce((acc, curr) => {
        acc[curr.key] = curr.url;
        return acc;
      }, {} as Record<string, string>);

      const proposalData = {
        ...data,
        organizerId: user?.id,
        organizerName: user?.name,
        documents: documentsUrls, // Send URLs, not filenames
        status: 'pending',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createProposal(proposalData);

      toast.success('Proposal submitted successfully! Awaiting admin approval.');
      router.push('/organizer/dashboard');
    } catch (error: unknown) {
      console.error('Error submitting proposal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to submit proposal: ${errorMessage}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Organizer Dashboard', href: '/organizer/dashboard' },
              { label: 'Submit Proposal' }
            ]}
          />

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/organizer/dashboard"
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submit Event Proposal</h1>
              <p className="text-gray-600">Submit your proposal for admin review before creating the event</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Proposal Requirements</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• All 4 documents must be submitted in PDF format</li>
                  <li>• Admin will review your proposal within 3-5 working days</li>
                  <li>• Once approved, you can create the full event details</li>
                  <li>• Rejected proposals can be revised and resubmitted</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('eventTitle')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., HackUSM 2026 - National Hackathon"
                  />
                  {errors.eventTitle && (
                    <p className="mt-1 text-sm text-red-600">{errors.eventTitle.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('eventDescription')}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Brief description of your event..."
                  />
                  {errors.eventDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.eventDescription.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('category')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      <option value="sport">Sport</option>
                      <option value="academic">Academic</option>
                      <option value="cultural">Cultural</option>
                      <option value="social">Social</option>
                      <option value="competition">Competition</option>
                      <option value="talk">Talk</option>
                      <option value="workshop">Workshop</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Participants <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register('estimatedParticipants', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="100"
                    />
                    {errors.estimatedParticipants && (
                      <p className="mt-1 text-sm text-red-600">{errors.estimatedParticipants.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposed Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      {...register('proposedDate')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {errors.proposedDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.proposedDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposed Venue <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('proposedVenue')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Dewan Utama USM"
                    />
                    {errors.proposedVenue && (
                      <p className="mt-1 text-sm text-red-600">{errors.proposedVenue.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Required Documents */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Documents</h2>

              <div className="space-y-6">
                <FileUploadField
                  label="1. Event Proposal"
                  field="eventProposal"
                  description="Detailed event proposal including objectives, timeline, and expected outcomes"
                  documents={documents}
                  onFileChange={handleFileChange}
                />

                <FileUploadField
                  label="2. Budget Plan"
                  field="budgetPlan"
                  description="Comprehensive budget breakdown including income and expenses"
                  documents={documents}
                  onFileChange={handleFileChange}
                />

                <FileUploadField
                  label="3. Risk Assessment"
                  field="riskAssessment"
                  description="Safety and risk management plan for the event"
                  documents={documents}
                  onFileChange={handleFileChange}
                />

                <FileUploadField
                  label="4. Supporting Documents"
                  field="supportingDocuments"
                  description="Additional documents such as partnership agreements, venue bookings, etc."
                  documents={documents}
                  onFileChange={handleFileChange}
                />
              </div>
            </div>

            {/* Committee Members */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Committee Members</h2>
                <button
                  type="button"
                  onClick={() => append({ matricNumber: '', name: '', position: '' })}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Matric Number
                      </label>
                      <input
                        {...register(`committeeMembers.${index}.matricNumber`)}
                        onBlur={(e) => handleMatricBlur(index, e.target.value)}
                        placeholder="123456"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      />
                      {errors.committeeMembers?.[index]?.matricNumber && (
                        <p className="mt-1 text-xs text-red-600">{errors.committeeMembers[index]?.matricNumber?.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        {...register(`committeeMembers.${index}.name`)}
                        placeholder="Student Name"
                        readOnly
                        className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg text-gray-900 cursor-not-allowed"
                      />
                      {errors.committeeMembers?.[index]?.name && (
                        <p className="mt-1 text-xs text-red-600">{errors.committeeMembers[index]?.name?.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <input
                        {...register(`committeeMembers.${index}.position`)}
                        placeholder="e.g. Logistics Head"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      />
                      {errors.committeeMembers?.[index]?.position && (
                        <p className="mt-1 text-xs text-red-600">{errors.committeeMembers[index]?.position?.message}</p>
                      )}
                    </div>

                    {/* Hidden fields to preserve data without showing in UI */}
                    <input type="hidden" {...register(`committeeMembers.${index}.email`)} />
                    <input type="hidden" {...register(`committeeMembers.${index}.faculty`)} />

                    <div className="md:col-span-1 pt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {fields.length === 0 && (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                    <p>No committee members added yet.</p>
                    <p className="text-sm mt-1">Add members to track their contributions and MyCSD points.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-4">
              <Link
                href="/organizer/dashboard"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Uploading...' : 'Submit Proposal'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}