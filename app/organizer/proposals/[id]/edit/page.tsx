'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import { useRequireRole } from '@/contexts/AuthContext';
import { ArrowLeft, FileText, AlertCircle, Save, Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import { getProposalById, updateProposal } from '@/backend/services/proposalService';
import { uploadDocument } from '@/backend/services/storageService';
import { toast } from 'sonner';
import { DocumentsInput } from '@/types';

const proposalSchema = z.object({
  eventTitle: z.string().min(5, 'Title must be at least 5 characters'),
  eventDescription: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['sport', 'academic', 'cultural', 'social', 'competition', 'talk', 'workshop', 'other']),
  estimatedParticipants: z.number().min(1, 'Must have at least 1 participant'),
  proposedDate: z.string().min(1, 'Proposed date is required'),
  proposedVenue: z.string().min(3, 'Venue is required'),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

// Document types
type DocKeys = 'eventProposal' | 'budgetPlan' | 'riskAssessment' | 'supportingDocuments';

export default function EditProposalPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireRole(['organizer'], '/');
  
  const [isLoading, setIsLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [status, setStatus] = useState('');
  
  // State for files: New files selected by user
  const [newFiles, setNewFiles] = useState<{ [key in DocKeys]: File | null }>({
    eventProposal: null,
    budgetPlan: null,
    riskAssessment: null,
    supportingDocuments: null,
  });

  // State for existing paths: URLs/Paths already in DB
  const [existingPaths, setExistingPaths] = useState<{ [key in DocKeys]: string | null }>({
    eventProposal: null,
    budgetPlan: null,
    riskAssessment: null,
    supportingDocuments: null,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
  });

  useEffect(() => {
    const fetchProposal = async () => {
      if (!params.id) return;
      try {
        const proposal = await getProposalById(params.id as string);
        if (!proposal) {
          toast.error('Proposal not found');
          router.push('/organizer/dashboard');
          return;
        }

        if (user && proposal.organizerId !== user.organizationId) {
          toast.error('Unauthorized');
          router.push('/organizer/dashboard');
          return;
        }

        // Prefill Form
        setValue('eventTitle', proposal.eventTitle);
        setValue('eventDescription', proposal.eventDescription);
        setValue('category', proposal.category as ProposalFormData['category']);
        setValue('estimatedParticipants', proposal.estimatedParticipants);
        setValue('proposedDate', proposal.proposedDate);
        setValue('proposedVenue', proposal.proposedVenue);

        setAdminNotes(proposal.adminNotes || '');
        setStatus(proposal.status);
        
        // Load existing paths
        setExistingPaths({
          eventProposal: proposal.documents.eventProposal || null,
          budgetPlan: proposal.documents.budgetPlan || null,
          riskAssessment: proposal.documents.riskAssessment || null,
          supportingDocuments: proposal.documents.supportingDocuments || null,
        });

      } catch (error) {
        console.error('Error fetching proposal:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchProposal();
  }, [params.id, user, router, setValue]);

  const handleFileChange = (key: DocKeys, file: File | null) => {
    setNewFiles(prev => ({ ...prev, [key]: file }));
  };

  const onSubmit = async (data: ProposalFormData) => {
    try {
      const updatedDocuments: DocumentsInput = { ...existingPaths };

      // Upload new files if they exist
      const uploadPromises = (Object.keys(newFiles) as DocKeys[]).map(async (key) => {
        const file = newFiles[key];
        if (file) {
          const path = `proposals/${params.id}/${key}-${Date.now()}-${file.name}`;
          const url = await uploadDocument(file, path);
          updatedDocuments[key] = url; // Update path
        }
      });

      await Promise.all(uploadPromises);

      // Verify we have all required docs (either existing or new)
      if (!updatedDocuments.eventProposal || !updatedDocuments.budgetPlan || !updatedDocuments.riskAssessment) {
         toast.error("Please ensure all required documents are uploaded.");
         return;
      }

      await updateProposal(params.id as string, {
        ...data,
        documents: updatedDocuments
      });

      toast.success('Proposal revised and resubmitted successfully!');
      router.push('/organizer/dashboard');
    } catch (error: unknown) {
      console.error('Update error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to resubmit: ' + errorMessage);
    }
  };

  const getFileName = (path: string | null) => {
    if (!path) return null;
    return path.split('/').pop();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  // Helper component for file upload input
  const FileUploadRow = ({ label, docKey, required = true }: { label: string, docKey: DocKeys, required?: boolean }) => (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors bg-gray-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{label} {required && <span className="text-red-500">*</span>}</p>
            {existingPaths[docKey] && !newFiles[docKey] && (
               <a href={existingPaths[docKey]!} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all block mt-1">
                 Current: {getFileName(existingPaths[docKey])}
               </a>
            )}
            {newFiles[docKey] && (
               <p className="text-xs text-green-600 mt-1 font-semibold">New: {newFiles[docKey]?.name}</p>
            )}
          </div>
        </div>
        
        <div className="relative">
          <input 
            type="file" 
            accept=".pdf"
            onChange={(e) => handleFileChange(docKey, e.target.files?.[0] || null)}
            className="hidden"
            id={`file-${docKey}`}
          />
          <label 
            htmlFor={`file-${docKey}`}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm"
          >
            <Upload className="w-4 h-4" />
            {existingPaths[docKey] || newFiles[docKey] ? 'Replace' : 'Upload'}
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/organizer/dashboard' },
              { label: 'Revise Proposal' }
            ]}
          />

          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/organizer/dashboard"
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Revise Proposal</h1>
              <p className="text-gray-600">Update your proposal based on admin feedback</p>
            </div>
          </div>

          {/* Admin Feedback Box */}
          {status === 'revision_needed' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8 shadow-sm">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-lg text-orange-900">Revision Requested</h3>
                  <p className="text-sm text-orange-800 mt-2 leading-relaxed">
                    {adminNotes || 'No specific notes provided.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input type="text" {...register('eventTitle')} className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                  {errors.eventTitle && <p className="text-red-500 text-xs mt-1">{errors.eventTitle.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea {...register('eventDescription')} rows={4} className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                  {errors.eventDescription && <p className="text-red-500 text-xs mt-1">{errors.eventDescription.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select {...register('category')} className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                      <option value="sport">Sport</option>
                      <option value="academic">Academic</option>
                      <option value="cultural">Cultural</option>
                      <option value="social">Social</option>
                      <option value="competition">Competition</option>
                      <option value="talk">Talk</option>
                      <option value="workshop">Workshop</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Participants</label>
                    <input type="number" {...register('estimatedParticipants', { valueAsNumber: true })} className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Date</label>
                    <input type="date" {...register('proposedDate')} className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                   </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Venue</label>
                    <input type="text" {...register('proposedVenue')} className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                   </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Documents</h2>
              <div className="space-y-3">
                 <FileUploadRow label="1. Event Proposal" docKey="eventProposal" />
                 <FileUploadRow label="2. Budget Plan" docKey="budgetPlan" />
                 <FileUploadRow label="3. Risk Assessment" docKey="riskAssessment" />
                 <FileUploadRow label="4. Supporting Documents" docKey="supportingDocuments" required={false} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/organizer/dashboard" className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save & Resubmit
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}