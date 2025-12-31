'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface EventGalleryProps {
    images: string[];
    title: string;
}

export default function EventGallery({ images, title }: EventGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    if (!images || images.length === 0) return null;

    return (
        <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                    <div
                        key={index}
                        className="relative w-full pt-[100%] rounded-lg overflow-hidden bg-white border border-gray-200 group cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                    >
                        <div className="absolute inset-0">
                            <Image
                                src={image}
                                alt={`${title} Gallery ${index + 1}`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2 bg-black bg-opacity-50 rounded-full"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <div className="relative w-full h-full max-h-[90vh]">
                            <Image
                                src={selectedImage}
                                alt="Full size preview"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
