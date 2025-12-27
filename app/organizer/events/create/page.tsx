'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import { useRequireRole } from '@/contexts/AuthContext';
import { EventCategory, MyCSDCategory, MyCSDLevel } from '@/types';
import { getPointsForLevel } from '@/backend/utils';
import { ArrowLeft, Upload, Plus, X, Search, Lock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getProposalById, updateProposalStatus } from '@/backend/services/proposalService';
import { updateEventByRequestId } from '@/backend/services/eventService';
import { uploadEventBanner } from '@/backend/services/storageService';

// Validation schema
const eventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['sport', 'academic', 'cultural', 'social', 'competition', 'talk', 'workshop', 'other']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  venue: z.string().min(3, 'Venue is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(10000, 'Capacity too large'),
  participationFee: z.number().min(0, 'Fee cannot be negative'),
  hasMyCSD: z.boolean(),
  mycsdCategory: z.enum([
    'REKA CIPTA DAN INOVASI',
    'KEUSAHAWAN',
    'KEBUDAYAAN',
    'SUKAN/REKREASI/SOSIALISASI',
    'KEPIMPINAN'
  ]).optional(),
  mycsdLevel: z.enum(['antarabangsa', 'negeri_universiti', 'kampus']).optional(),
  // mycsdPoints removed: points are computed from level
  registrationDeadline: z.string().min(1, 'Registration deadline is required'),
  objectives: z.array(z.string()).min(1, 'Add at least one objective'),
}).refine(data => {
  if (data.hasMyCSD) {
    return data.mycsdCategory && data.mycsdLevel;
  }
  return true;
}, {
  message: 'MyCSD category, level, and points are required when MyCSD is enabled',
  path: ['mycsdCategory']
});

type EventFormData = z.infer<typeof eventSchema>;

export default function CreateEventPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireRole(['organizer'], '/');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [links, setLinks] = useState<{ title: string; url: string }[]>([]);
  const [secretKey, setSecretKey] = useState('');
  const [isProposalLoaded, setIsProposalLoaded] = useState(false);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      hasMyCSD: false,
      participationFee: 0,
      objectives: ['']
    }
  });

  const handleLoadProposal = async () => {
    if (!secretKey.trim()) {
      toast.error('Please enter a Secret Key');
      return;
    }

    setIsLoadingProposal(true);
    try {
      const proposal = await getProposalById(secretKey);
      if (!proposal) {
        toast.error('Invalid Secret Key or Proposal not found');
        return;
      }

      if (proposal.status !== 'approved') {
        toast.error('This proposal is not approved yet');
        return;
      }

      // Prefill form
      setValue('title', proposal.eventTitle);
      setValue('description', proposal.eventDescription);
      setValue('category', proposal.category as any);
      setValue('venue', proposal.proposedVenue);
      setValue('capacity', proposal.estimatedParticipants);
      setValue('startDate', proposal.proposedDate);
      
      setIsProposalLoaded(true);
      toast.success('Proposal loaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Error loading proposal');
    } finally {
      setIsLoadingProposal(false);
    }
  };

  const hasMyCSD = watch('hasMyCSD');

  // Handle objectives
  const addObjective = () => {
    const newObjectives = [...objectives, ''];
    setObjectives(newObjectives);
  };

  const removeObjective = (index: number) => {
    const newObjectives = objectives.filter((_, i) => i !== index);
    setObjectives(newObjectives);
    setValue('objectives', newObjectives);
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
    setValue('objectives', newObjectives);
  };

  // Handle links
  const addLink = () => {
    setLinks([...links, { title: '', url: '' }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: 'title' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    if (!isProposalLoaded) {
      toast.error('Please load a proposal first');
      return;
    }

    try {
      // Filter out empty objectives
      const validObjectives = objectives.filter(obj => obj.trim() !== '');
      
      // Filter out incomplete links
      const validLinks = links.filter(link => link.title.trim() && link.url.trim());

      let bannerUrl = '';
      if (bannerFile) {
        try {
          const path = `events/${secretKey}/${Date.now()}-${bannerFile.name}`;
          bannerUrl = await uploadEventBanner(bannerFile, path);
        } catch (error) {
          console.error('Error uploading banner:', error);
          toast.error('Failed to upload banner image');
          return;
        }
      }

      // Update event details
      await updateEventByRequestId(secretKey, {
        event_name: data.title,
        event_description: data.description,
        event_date: data.startDate,
        event_venue: data.venue,
        category: data.category,
        capacity: data.capacity,
        start_time: data.startTime,
        end_time: data.endTime,
        banner_image: bannerUrl || undefined,
        objectives: validObjectives,
        links: validLinks,
        has_mycsd: data.hasMyCSD,
        mycsd_category: data.mycsdCategory,
        mycsd_level: data.mycsdLevel,
        mycsd_points: getPointsForLevel(data.mycsdLevel),
      });

      // Update status to published
      await updateProposalStatus(secretKey, 'published');
      
      toast.success('Event published successfully!');
      router.push('/organizer/dashboard');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
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
              { label: 'Create Event' }
            ]}
          />

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/organizer/dashboard"
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Event Page</h1>
              <p className="text-gray-600">Fill in the details to create your event</p>
            </div>
          </div>

          {/* Secret Key Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-purple-600">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              Load Approved Proposal
            </h2>
            <p className="text-sm text-gray-600 mb-2">
              Enter the Secret Key from your approved proposal to publish your event.
            </p>
            <p className="text-sm text-gray-500 mb-4 italic">
              Note: You must submit a proposal and get it approved before you can create an event page.
            </p>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter Secret Key (e.g., 123e4567-e89b...)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  disabled={isProposalLoaded}
                />
              </div>
              <button
                type="button"
                onClick={handleLoadProposal}
                disabled={isLoadingProposal || isProposalLoaded}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoadingProposal ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {isProposalLoaded ? 'Loaded' : 'Load Proposal'}
              </button>
            </div>
          </div>

          {isProposalLoaded && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="e.g., HackUSM 2026 - National Hackathon"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('description')}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="Provide a detailed description of your event..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
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

                {/* Banner Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Banner
                  </label>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer relative overflow-hidden"
                    onClick={() => document.getElementById('banner-upload')?.click()}
                  >
                    {bannerPreview ? (
                      <div className="relative h-48 w-full">
                        <img 
                          src={bannerPreview} 
                          alt="Banner preview" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-white font-medium">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      </>
                    )}
                    <input 
                      id="banner-upload"
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleBannerChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Date & Time</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    {...register('startTime')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    {...register('endTime')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('registrationDeadline')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                  {errors.registrationDeadline && (
                    <p className="mt-1 text-sm text-red-600">{errors.registrationDeadline.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Venue & Capacity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Venue & Capacity</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('venue')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="e.g., School of Computer Sciences, USM"
                  />
                  {errors.venue && (
                    <p className="mt-1 text-sm text-red-600">{errors.venue.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('capacity', { valueAsNumber: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="100"
                  />
                  {errors.capacity && (
                    <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Participation Fee (RM)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('participationFee', { valueAsNumber: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    placeholder="0.00"
                  />
                  {errors.participationFee && (
                    <p className="mt-1 text-sm text-red-600">{errors.participationFee.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* MyCSD */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">MyCSD Points</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('hasMyCSD')}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    This event offers MyCSD points
                  </label>
                </div>

                {hasMyCSD && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-purple-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('mycsdCategory')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      >
                        <option value="">Select</option>
                        <option value="">Select</option>
                        <option value="REKA CIPTA DAN INOVASI">REKA CIPTA DAN INOVASI</option>
                        <option value="KEUSAHAWAN">KEUSAHAWAN</option>
                        <option value="KEBUDAYAAN">KEBUDAYAAN</option>
                        <option value="SUKAN/REKREASI/SOSIALISASI">SUKAN/REKREASI/SOSIALISASI</option>
                        <option value="KEPIMPINAN">KEPIMPINAN</option>
                      </select>
                      {errors.mycsdCategory && (
                        <p className="mt-1 text-sm text-red-600">{errors.mycsdCategory.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('mycsdLevel')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      >
                        <option value="">Select</option>
                        <option value="kampus">Kampus</option>
                        <option value="negeri_universiti">Negeri/Universiti</option>
                        <option value="antarabangsa">Antarabangsa</option>
                      </select>
                      {errors.mycsdLevel && (
                        <p className="mt-1 text-sm text-red-600">{errors.mycsdLevel.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Objectives */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Event Objectives</h2>
                <button
                  type="button"
                  onClick={addObjective}
                  className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Objective
                </button>
              </div>

              <div className="space-y-3">
                {objectives.map((obj, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => updateObjective(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder={`Objective ${index + 1}`}
                    />
                    {objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeObjective(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.objectives && (
                <p className="mt-2 text-sm text-red-600">{errors.objectives.message}</p>
              )}
            </div>

            {/* Additional Links (Optional) */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Additional Links</h2>
                <button
                  type="button"
                  onClick={addLink}
                  className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Link
                </button>
              </div>

              {links.length === 0 ? (
                <p className="text-sm text-gray-500">No links added yet</p>
              ) : (
                <div className="space-y-3">
                  {links.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) => updateLink(index, 'title', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                        placeholder="Link title"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                className="px-6 py-2 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Event'}
              </button>
            </div>
          </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
