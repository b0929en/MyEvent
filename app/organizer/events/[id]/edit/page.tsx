'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import { useRequireRole } from '@/contexts/AuthContext';
import { getEventById, updateEvent } from '@/backend/services/eventService';
import { uploadEventBanner } from '@/backend/services/storageService';
import { toast } from 'sonner';
import { Upload, Plus, X, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Schema Validation
const eventSchema = z.object({
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['sport', 'academic', 'cultural', 'social', 'competition', 'talk', 'workshop', 'other']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  venue: z.string().min(3, 'Venue is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  participationFee: z.number().min(0, 'Fee cannot be negative'),
  // MyCSD fields
  hasMyCSD: z.boolean(),
  mycsdCategory: z.string().optional(),
  mycsdLevel: z.string().optional(),
  
  objectives: z.array(z.string()).min(1, 'Add at least one objective'),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireRole(['organizer'], '/');
  
  const [isLoading, setIsLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState(''); // Read-only
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [links, setLinks] = useState<{ title: string; url: string }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  const hasMyCSD = watch('hasMyCSD');

  useEffect(() => {
    const fetchEvent = async () => {
      if (!params.id) return;
      try {
        const event = await getEventById(params.id as string);
        if (!event) {
          toast.error('Event not found');
          router.push('/organizer/dashboard');
          return;
        }

        // Check ownership
        if (user && event.organizerId !== user.organizationId) {
          toast.error('You do not have permission to edit this event');
          router.push('/organizer/dashboard');
          return;
        }

        // Populate Form
        setEventTitle(event.title);
        setValue('description', event.description);
        setValue('category', event.category);
        setValue('startDate', event.startDate);
        setValue('endDate', event.endDate);
        setValue('startTime', event.startTime);
        setValue('endTime', event.endTime);
        setValue('venue', event.venue);
        setValue('capacity', event.capacity);
        setValue('participationFee', event.participationFee);
        
        setValue('hasMyCSD', event.hasMyCSD);
        if (event.hasMyCSD) {
            setValue('mycsdCategory', event.mycsdCategory);
            setValue('mycsdLevel', event.mycsdLevel);
        }

        setObjectives(event.objectives || ['']);
        setValue('objectives', event.objectives || ['']);
        
        setLinks(event.links || []);
        if (event.bannerImage) {
          setBannerPreview(event.bannerImage);
        }

      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Failed to load event details');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
        fetchEvent();
    }
  }, [params.id, user, router, setValue]);

  // Handlers
  const addObjective = () => {
    const newObjectives = [...objectives, ''];
    setObjectives(newObjectives);
  };
  const updateObjective = (index: number, value: string) => {
    const newObjs = [...objectives];
    newObjs[index] = value;
    setObjectives(newObjs);
    setValue('objectives', newObjs);
  };
  const removeObjective = (index: number) => {
    const newObjs = objectives.filter((_, i) => i !== index);
    setObjectives(newObjs);
    setValue('objectives', newObjs);
  };

  const addLink = () => setLinks([...links, { title: '', url: '' }]);
  const updateLink = (index: number, field: 'title' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };
  const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index));

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      let bannerUrl = bannerPreview; // Use existing if no new file
      
      if (bannerFile) {
        const path = `events/${params.id}/${Date.now()}-${bannerFile.name}`;
        bannerUrl = await uploadEventBanner(bannerFile, path);
      }

      const validObjectives = objectives.filter(o => o.trim() !== '');
      const validLinks = links.filter(l => l.title.trim() && l.url.trim());

      await updateEvent(params.id as string, {
        event_description: data.description,
        event_date: data.startDate,
        end_date: data.endDate,
        start_time: data.startTime,
        end_time: data.endTime,
        event_venue: data.venue,
        category: data.category,
        capacity: data.capacity,
        banner_image: bannerUrl || undefined,
        objectives: validObjectives,
        links: validLinks,
        has_mycsd: data.hasMyCSD,
        mycsd_category: data.mycsdCategory,
        mycsd_level: data.mycsdLevel,
      });

      toast.success('Event updated successfully');
      router.push('/organizer/dashboard');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // Shared Input Styles - Updated for better visibility
  const inputClass = "w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium placeholder-gray-500 transition-all shadow-sm";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="grow">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Breadcrumb & Header Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <Breadcrumb
              items={[
                { label: 'Dashboard', href: '/organizer/dashboard' },
                { label: 'Events', href: '/organizer/dashboard' },
                { label: 'Edit Event' }
              ]}
            />
            <div className="flex gap-3">
              <Link
                href="/organizer/dashboard"
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>

          {/* Event Banner (Editable) */}
          <div className="w-full h-75 md:h-100 relative mb-8 rounded-xl overflow-hidden bg-white shadow-md group border border-gray-200">
            {bannerPreview ? (
              <Image
                src={bannerPreview}
                alt="Event Banner"
                fill
                className="object-cover transition-opacity group-hover:opacity-75"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-r from-purple-500 via-purple-600 to-orange-500">
                <span className="text-white font-medium">No Banner Image</span>
              </div>
            )}
            
            {/* Overlay for upload */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 cursor-pointer" onClick={() => document.getElementById('banner-upload')?.click()}>
              <div className="bg-white/95 px-6 py-3 rounded-full flex items-center gap-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform backdrop-blur-sm">
                <Upload className="w-5 h-5 text-gray-800" />
                <span className="font-medium text-gray-800">Change Banner</span>
              </div>
            </div>
            <input 
              id="banner-upload" 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleBannerChange} 
            />
          </div>

          {/* Event Title (Read Only) & Badges */}
          <div className="mb-8">
            <div className="mb-6">
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Event Name (Read Only)</label>
               <div className="relative">
                 <h1 className="text-3xl md:text-4xl font-bold text-gray-400 select-none border-b-2 border-dashed border-gray-300 pb-3">
                   {eventTitle}
                 </h1>
                 <div className="absolute right-0 top-0 bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md opacity-70">
                   Read-only
                 </div>
               </div>
               <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block"></span>
                 To change the event name, please submit a new proposal or contact admin.
               </p>
            </div>

            {/* Editable Badges / MyCSD Settings */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
               <div className="flex items-center">
                 <input
                   type="checkbox"
                   {...register('hasMyCSD')}
                   className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                 />
                 <label className="ml-2 font-semibold text-gray-800">Enable MyCSD</label>
               </div>

               {hasMyCSD && (
                 <>
                   <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>
                   
                   <div className="flex flex-col md:flex-row gap-3">
                     <select 
                       {...register('mycsdCategory')}
                       className="px-4 py-2 text-sm font-medium rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm text-gray-900"
                     >
                       <option value="">Select Category</option>
                       <option value="REKA CIPTA DAN INOVASI">Reka Cipta & Inovasi</option>
                       <option value="KEUSAHAWAN">Keusahawan</option>
                       <option value="KEBUDAYAAN">Kebudayaan</option>
                       <option value="SUKAN/REKREASI/SOSIALISASI">Sukan & Rekreasi</option>
                       <option value="KEPIMPINAN">Kepimpinan</option>
                     </select>

                     <select 
                       {...register('mycsdLevel')}
                       className="px-4 py-2 text-sm font-medium rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm text-gray-900"
                     >
                       <option value="">Select Level</option>
                       <option value="kampus">Kampus</option>
                       <option value="negeri_universiti">Universiti</option>
                       <option value="antarabangsa">Antarabangsa</option>
                     </select>
                   </div>
                 </>
               )}
            </div>
          </div>

          {/* General Information Grid (Editable) */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-purple-600 pl-4 flex items-center">
              General Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Category</label>
                <select
                  {...register('category')}
                  className={inputClass}
                >
                  <option value="sport">Sport</option>
                  <option value="academic">Academic</option>
                  <option value="cultural">Cultural</option>
                  <option value="social">Social</option>
                  <option value="competition">Competition</option>
                  <option value="workshop">Workshop</option>
                  <option value="talk">Talk</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Fee */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Participation Fee (RM)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('participationFee', { valueAsNumber: true })}
                  className={inputClass}
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Start Date</label>
                <input
                  type="date"
                  {...register('startDate')}
                  className={inputClass}
                />
              </div>

              {/* Start Time */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Start Time</label>
                <input
                  type="time"
                  {...register('startTime')}
                  className={inputClass}
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">End Date</label>
                <input
                  type="date"
                  {...register('endDate')}
                  className={inputClass}
                />
              </div>

              {/* End Time */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">End Time</label>
                <input
                  type="time"
                  {...register('endTime')}
                  className={inputClass}
                />
              </div>

              {/* Venue */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Venue</label>
                <input
                  type="text"
                  {...register('venue')}
                  className={inputClass}
                />
              </div>

              {/* Capacity */}
              <div className="space-y-1.5 md:col-span-2">
                 <label className="text-sm font-bold text-gray-700">Total Capacity</label>
                 <input
                  type="number"
                  {...register('capacity', { valueAsNumber: true })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Description (Editable) */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-l-4 border-purple-600 pl-4">Description</h2>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <textarea
                {...register('description')}
                rows={8}
                className={`${inputClass} leading-relaxed`}
                placeholder="Describe your event in detail..."
              />
              {errors.description && <p className="text-red-600 text-sm mt-1 font-medium">{errors.description.message}</p>}
            </div>

            {/* Objectives List */}
            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Objectives</h3>
                <button
                  type="button"
                  onClick={addObjective}
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Objective
                </button>
              </div>
              <ul className="space-y-3">
                {objectives.map((obj, index) => (
                  <li key={index} className="flex gap-3 items-center group">
                    <span className="text-purple-300 font-bold text-xl">•</span>
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => updateObjective(index, e.target.value)}
                      className={inputClass}
                      placeholder="Enter event objective..."
                    />
                    <button 
                      type="button" 
                      onClick={() => removeObjective(index)} 
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-50 group-hover:opacity-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Links (Editable) */}
          <div className="mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-purple-600 pl-4">External Links</h2>
              <button
                type="button"
                onClick={addLink}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-sm font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Link
              </button>
            </div>
            
            {links.length === 0 ? (
              <div className="text-gray-500 italic ml-4 py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No external links added.
              </div>
            ) : (
              <div className="space-y-3">
                {links.map((link, index) => (
                  <div key={index} className="flex gap-3 items-center bg-gray-50 p-4 rounded-xl border border-gray-200 group hover:border-purple-200 transition-colors">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Title</label>
                      <input
                        type="text"
                        placeholder="e.g., WhatsApp Group"
                        value={link.title}
                        onChange={(e) => updateLink(index, 'title', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex-2 space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase">URL</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={link.url}
                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeLink(index)} 
                      className="mt-5 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </form>
      </main>
      <Footer />
    </div>
  );
}