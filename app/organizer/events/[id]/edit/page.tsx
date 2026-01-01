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
import { Upload, Plus, X, Save, Loader2, Globe } from 'lucide-react';
import Link from 'next/link';

// Schema Validation
const eventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').optional(), // Added title
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['sport', 'academic', 'cultural', 'social', 'competition', 'talk', 'workshop', 'other'], {
    message: 'Category is required',
  }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  venue: z.string().min(3, 'Venue is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  participationFee: z.number().min(0, 'Fee cannot be negative'),
  registrationDeadline: z.string().optional(), // Made optional but recommended
  // MyCSD fields
  hasMyCSD: z.boolean(),
  mycsdCategory: z.string().optional(),
  mycsdLevel: z.string().optional(),

  objectives: z.array(z.string()).optional(), // Made optional
  bankAccountInfo: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  // Allow both organizer and admin
  const { user, isLoading: authLoading } = useRequireRole(['organizer', 'admin'], '/');

  const [isLoading, setIsLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState(''); // Read-only for organizers
  const [isPublished, setIsPublished] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [links, setLinks] = useState<{ title: string; url: string }[]>([]);
  const [galleryItems, setGalleryItems] = useState<{ url: string; file: File | null }[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      hasMyCSD: false,
      participationFee: 0,
      objectives: [''],
      startTime: '00:00',
      endTime: '23:59',
    }
  });

  const hasMyCSD = watch('hasMyCSD');
  const participationFee = watch('participationFee');

  // Register objectives field manually since it's a custom input list
  useEffect(() => {
    register('objectives');
  }, [register]);

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

        // Check ownership - Bypass for admin
        if (user && user.role !== 'admin' && event.organizerId !== user.organizationId) {
          toast.error('You do not have permission to edit this event');
          router.push('/organizer/dashboard');
          return;
        }

        if (['published', 'completed', 'cancelled'].includes(event.status)) {
          setIsPublished(true);
        }

        // Populate Form
        setEventTitle(event.title);
        setValue('title', event.title); // Initialize title in form for admins
        setValue('description', event.description);
        setValue('category', event.category);
        setValue('startDate', event.startDate);
        setValue('endDate', event.endDate);
        setValue('startTime', event.startTime);
        setValue('endTime', event.endTime);
        setValue('venue', event.venue);
        setValue('capacity', event.capacity);
        setValue('participationFee', event.participationFee);
        setValue('registrationDeadline', event.registrationDeadline);

        setValue('hasMyCSD', event.hasMyCSD);
        if (event.hasMyCSD) {
          setValue('mycsdCategory', event.mycsdCategory);
          setValue('mycsdLevel', event.mycsdLevel);
        }

        setObjectives(event.objectives || ['']);
        setValue('objectives', event.objectives || ['']);

        // Remove hidden links just in case, though backend should have handled it
        setLinks((event.links || []).filter(l => l.title !== '_REG_DEADLINE_' && l.title !== '_GALLERY_'));
        setGalleryItems((event.gallery || []).map(url => ({ url, file: null })));
        if (event.bannerImage) {
          setBannerPreview(event.bannerImage);
        }
        if (event.bankAccountInfo) setValue('bankAccountInfo', event.bankAccountInfo);
        if (event.paymentQrCode) setQrCodePreview(event.paymentQrCode);

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

  const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setQrCodeFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setQrCodePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Validate size
      const validFiles = files.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large (max 5MB)`);
          return false;
        }
        return true;
      });

      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryItems(prev => [...prev, { url: reader.result as string, file }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryItems(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      let bannerUrl = bannerPreview; // Use existing if no new file

      if (bannerFile) {
        const path = `events/${params.id}/${Date.now()}-${bannerFile.name}`;
        bannerUrl = await uploadEventBanner(bannerFile, path);
      }

      let qrCodeUrl = qrCodePreview;
      if (qrCodeFile) {
        const path = `events/${params.id}/payment-qr-${Date.now()}-${qrCodeFile.name}`;
        qrCodeUrl = await uploadEventBanner(qrCodeFile, path);
      }

      // Process Gallery
      const galleryUrls = await Promise.all(galleryItems.map(async (item) => {
        if (item.file) {
          const path = `events/${params.id}/gallery/${Date.now()}-${item.file.name}`;
          return await uploadEventBanner(item.file, path);
        }
        return item.url;
      }));

      const validObjectives = objectives.filter(o => o.trim() !== '');
      const validLinks = links.filter(l => l.title.trim() && l.url.trim());

      const sanitizeTime = (time: string) => time && time.length > 5 ? time.substring(0, 5) : time;

      await updateEvent(params.id as string, {
        event_name: isAdmin && data.title ? data.title : undefined, // Update title if admin
        event_description: data.description,
        event_date: data.startDate,
        end_date: data.endDate,
        start_time: sanitizeTime(data.startTime),
        end_time: sanitizeTime(data.endTime),
        event_venue: data.venue,
        category: data.category,
        capacity: data.capacity,
        participation_fee: data.participationFee,
        banner_image: bannerUrl || undefined,
        objectives: validObjectives,
        links: validLinks,
        registration_deadline: data.registrationDeadline,
        gallery: galleryUrls,
        has_mycsd: data.hasMyCSD,
        mycsd_category: data.mycsdCategory,
        mycsd_level: data.mycsdLevel,
        bank_account_info: data.bankAccountInfo || undefined,
        payment_qr_code: qrCodeUrl || undefined,
      });

      toast.success('Event updated successfully');
      if (user?.role === 'admin') {
        router.push('/admin/events');
      } else {
        router.push('/organizer/dashboard');
      }
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.error(error.message || 'Failed to update event');
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
  const disabledInputClass = "w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 font-medium shadow-none cursor-not-allowed";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="grow">
        <form onSubmit={handleSubmit(onSubmit, (errors) => {
          console.error('Validation Errors:', JSON.stringify(errors, null, 2));
          if (!errors.objectives) toast.error('Please fix the errors in the form');
        })} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

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

          {/* Event Title */}
          <div className="mb-8">
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Event Name {isAdmin ? '(Editable by Admin)' : '(Read Only)'}
              </label>
              <div className="relative">
                {isAdmin ? (
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full text-3xl md:text-4xl font-bold text-gray-900 border-none border-b-2 border-dashed border-gray-300 focus:border-purple-600 focus:ring-0 px-0 pb-3 bg-transparent"
                  />
                ) : (
                  <>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-400 select-none border-b-2 border-dashed border-gray-300 pb-3">
                      {eventTitle}
                    </h1>
                    <div className="absolute right-0 top-0 bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md opacity-70">
                      Read-only
                    </div>
                  </>
                )}
              </div>
              {!isAdmin && (
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block"></span>
                  To change the event name, please submit a new proposal or contact admin.
                </p>
              )}
            </div>

            {/* Editable Badges / MyCSD Settings */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('hasMyCSD')}
                  disabled={!isAdmin && isPublished}
                  className={`w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer ${!isAdmin && isPublished ? 'cursor-not-allowed opacity-60' : ''}`}
                />
                <label className={`ml-2 font-semibold text-gray-800 ${!isAdmin && isPublished ? 'text-gray-500' : ''}`}>Enable MyCSD</label>
              </div>

              {hasMyCSD && (
                <>
                  <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <select
                      {...register('mycsdCategory')}
                      disabled={!isAdmin && isPublished}
                      className={!isAdmin && isPublished ? disabledInputClass : "px-4 py-2 text-sm font-medium rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm text-gray-900"}
                    >
                      <option value="">Select Category</option>
                      <option value="Debat dan Pidato">Debat dan Pidato</option>
                      <option value="Khidmat Masyarakat">Khidmat Masyarakat</option>
                      <option value="Kebudayaan">Kebudayaan</option>
                      <option value="Kepimpinan">Kepimpinan</option>
                      <option value="Keusahawanan">Keusahawan</option>
                      <option value="Reka Cipta dan Inovasi">Reka Cipta dan Inovasi</option>
                      <option value="Sukan/Rekreasi/Sosialisasi">Sukan/Rekreasi/Sosialisasi</option>
                    </select>

                    <select
                      {...register('mycsdLevel')}
                      disabled={!isAdmin && isPublished}
                      className={!isAdmin && isPublished ? disabledInputClass : "px-4 py-2 text-sm font-medium rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm text-gray-900"}
                    >
                      <option value="">Select Level</option>
                      <option value="P.Pengajian / Desasiswa / Persatuan / Kelab">P.Pengajian / Desasiswa / Persatuan / Kelab</option>
                      <option value="Negeri / Universiti">Negeri / Universiti</option>
                      <option value="Kebangsaan / Antara University">Kebangsaan / Antara University</option>
                      <option value="Antarabangsa">Antarabangsa</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            {!isAdmin && isPublished && (
              <p className="text-xs text-orange-600 mt-2 font-medium">
                Event is published. MyCSD settings and participation fees are locked for organizers.
              </p>
            )}
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
                  disabled={!isAdmin && isPublished}
                  {...register('participationFee', { valueAsNumber: true })}
                  className={!isAdmin && isPublished ? disabledInputClass : inputClass}
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Start Date</label>
                <input
                  type="date"
                  {...register('startDate')}
                  disabled={!isAdmin}
                  className={!isAdmin ? disabledInputClass : inputClass}
                />
              </div>

              {/* Start Time */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Start Time</label>
                <input
                  type="time"
                  {...register('startTime')}
                  disabled={!isAdmin}
                  className={!isAdmin ? disabledInputClass : inputClass}
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">End Date</label>
                <input
                  type="date"
                  {...register('endDate')}
                  disabled={!isAdmin}
                  className={!isAdmin ? disabledInputClass : inputClass}
                />
              </div>

              {/* End Time */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">End Time</label>
                <input
                  type="time"
                  {...register('endTime')}
                  disabled={!isAdmin}
                  className={!isAdmin ? disabledInputClass : inputClass}
                />
              </div>

              {/* Registration Deadline - MOVED HERE */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Registration Deadline</label>
                <input
                  type="date"
                  {...register('registrationDeadline')}
                  disabled={!isAdmin}
                  className={!isAdmin ? disabledInputClass : inputClass}
                />
              </div>

              {/* Placeholder for grid balance */}
              <div className="hidden md:block"></div>

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

              {/* Alert for date changes */}
              <div className="md:col-span-2">
                {!isAdmin && (
                  <p className="text-sm text-gray-500 mt-2">
                    Please contact BHEPA to change event dates or registration deadline.
                  </p>
                )}
              </div>

              {/* Participation Fee */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Participation Fee (RM)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('participationFee', { valueAsNumber: true })}
                  disabled={!isAdmin && isPublished}
                  className={!isAdmin && isPublished ? disabledInputClass : inputClass}
                />
                {!isAdmin && (
                  <p className="text-xs text-gray-500 mt-1">Set to 0 for free events. Contact BHEPA to change.</p>
                )}
              </div>
              {/* Payment Details Section - Only show if fee > 0 */}
              {participationFee > 0 && (
                <div className="md:col-span-2 mt-4 space-y-6 pt-6 border-t border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">Bank Account Information</label>
                      <textarea
                        {...register('bankAccountInfo')}
                        rows={3}
                        disabled={!isAdmin && isPublished}
                        placeholder="Bank Name, Account Number, Account Holder Name"
                        className={!isAdmin && isPublished ? disabledInputClass : inputClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">Payment QR Code</label>
                      <div className="flex items-start gap-6">
                        <div
                          className={`
                            relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50
                            ${isAdmin || !isPublished ? 'cursor-pointer hover:border-purple-500 hover:bg-purple-50' : ''}
                          `}
                          onClick={() => (isAdmin || !isPublished) && document.getElementById('qr-upload')?.click()}
                        >
                          {qrCodePreview ? (
                            <Image
                              src={qrCodePreview}
                              alt="QR Code"
                              fill
                              className="object-contain p-2"
                            />
                          ) : (
                            <div className="text-center p-2">
                              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                              <span className="text-xs text-gray-500">Upload QR</span>
                            </div>
                          )}
                          {(isAdmin || !isPublished) && (
                            <input
                              id="qr-upload"
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleQrCodeChange}
                            />
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex-1">
                          <p>Upload a QR code (Touch 'n Go / DuitNow) for participants to scan and pay.</p>
                          <p className="mt-1 text-xs">Supported formats: JPG, PNG. Max size: 2MB.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

            {/* Gallery (Editable) */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Event Gallery
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
              </h2>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500 mb-4">
                  Upload photos from your event to showcase in the gallery. These will be visible to everyone on the event page.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {galleryItems.map((item, index) => (
                    <div key={index} className="relative w-full pt-[100%] rounded-lg overflow-hidden group border border-gray-200 bg-white">
                      <div className="absolute inset-0">
                        <Image
                          src={item.url}
                          alt={`Gallery ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                          onClick={() => setSelectedImage(item.url)}
                        />
                        <div className="absolute inset-0 bg-transparent group-hover:bg-black/30 transition-all flex items-center justify-center pointer-events-none">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeGalleryImage(index);
                            }}
                            className="bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 pointer-events-auto"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Upload Button */}
                  <div
                    className="relative w-full pt-[100%] rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                    onClick={() => document.getElementById('gallery-upload')?.click()}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Plus className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500 font-medium">Add Photo</span>
                    </div>
                  </div>
                </div>

                <input
                  id="gallery-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onClick={(e) => (e.currentTarget.value = '')}
                  onChange={handleGalleryUpload}
                />

                {/* Lightbox Modal */}
                {selectedImage && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
                    onClick={() => setSelectedImage(null)}
                  >
                    <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
                      >
                        <X className="w-8 h-8" />
                      </button>
                      <div className="relative w-full h-full">
                        <Image
                          src={selectedImage}
                          alt="Full size preview"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
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