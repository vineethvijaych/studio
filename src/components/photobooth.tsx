
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Printer, RefreshCw, VideoOff, Wind, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { filters, type FilterType } from '@/lib/filters';
import { useToast } from "@/hooks/use-toast"

const PHOTO_COUNT = 3;
const COUNTDOWN_TIME = 3;
const PHOTO_ASPECT_RATIO = 4 / 3;
const PHOTO_WIDTH = 640;
const PHOTO_HEIGHT = PHOTO_WIDTH / PHOTO_ASPECT_RATIO;
const COLLAGE_PADDING = 20;

export function PhotoBooth() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const photoCanvasRef = useRef<HTMLCanvasElement>(null);
    const collageCanvasRef = useRef<HTMLCanvasElement>(null);

    const [status, setStatus] = useState<'idle' | 'counting' | 'review' | 'error'>('idle');
    const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
    const [collageUrl, setCollageUrl] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<number>(0);
    const [activeFilter, setActiveFilter] = useState<FilterType>(filters[0]);
    const [error, setError] = useState<string | null>(null);
    const [isFlashing, setIsFlashing] = useState(false);

    const { toast } = useToast()

    const initCamera = useCallback(async () => {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: PHOTO_WIDTH },
                        height: { ideal: PHOTO_HEIGHT },
                        facingMode: "user" 
                    } 
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setStatus('idle');
                setError(null);
            } else {
                throw new Error("Your browser does not support camera access.");
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError("Could not access camera. Please check permissions and refresh.");
            setStatus('error');
            toast({
              title: "Camera Error",
              description: "Could not access camera. Please grant permission and refresh the page.",
              variant: "destructive",
            })
        }
    }, [toast]);

    useEffect(() => {
        initCamera();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [initCamera]);

    const createCollage = useCallback((photos: string[]) => {
        if (!collageCanvasRef.current) return;
        const canvas = collageCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const headerHeight = 80;
        const totalHeight = (PHOTO_HEIGHT * PHOTO_COUNT) + (COLLAGE_PADDING * (PHOTO_COUNT + 1)) + headerHeight;
        
        canvas.width = PHOTO_WIDTH + (COLLAGE_PADDING * 2);
        canvas.height = totalHeight;

        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Header
        ctx.fillStyle = '#f0f4ff'; // A light blueish background for header
        ctx.fillRect(0, 0, canvas.width, headerHeight);
        ctx.font = 'bold 36px Poppins';
        ctx.fillStyle = 'hsl(var(--primary))';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("BeachSnap", canvas.width / 2, headerHeight / 2);


        const imagePromises = photos.map(src => {
            return new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        });

        Promise.all(imagePromises).then(images => {
            images.forEach((img, index) => {
                const y = headerHeight + COLLAGE_PADDING + (index * (PHOTO_HEIGHT + COLLAGE_PADDING));
                ctx.drawImage(img, COLLAGE_PADDING, y, PHOTO_WIDTH, PHOTO_HEIGHT);
            });
            setCollageUrl(canvas.toDataURL('image/jpeg'));
            setStatus('review');
        }).catch(err => {
            console.error("Error creating collage:", err)
            setStatus('error');
            setError("Failed to create collage.");
        });

    }, []);

    const takePhoto = useCallback(() => {
        if (!videoRef.current || !photoCanvasRef.current) return null;
        
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 150);

        const video = videoRef.current;
        const canvas = photoCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.filter = activeFilter.style.filter || 'none';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        return canvas.toDataURL('image/jpeg');
    }, [activeFilter]);


    const startCaptureSequence = useCallback(async () => {
        setStatus('counting');
        setCapturedPhotos([]);
        const photos: string[] = [];

        for (let i = 0; i < PHOTO_COUNT; i++) {
            await new Promise<void>(resolve => {
                let count = COUNTDOWN_TIME;
                setCountdown(count);
                const interval = setInterval(() => {
                    count--;
                    setCountdown(count);
                    if (count === 0) {
                        clearInterval(interval);
                        
                        // Small pause before taking photo
                        setTimeout(() => {
                            const photoData = takePhoto();
                            if(photoData) photos.push(photoData);
                            
                            // Small pause after taking photo before next countdown
                            setTimeout(() => resolve(), 500); 
                        }, 200);
                    }
                }, 1000);
            });
        }
        setCapturedPhotos(photos);
        createCollage(photos);
    }, [takePhoto, createCollage]);

    const handlePrint = () => {
        window.print();
    };

    const handleReset = () => {
        setStatus('idle');
        setCapturedPhotos([]);
        setCollageUrl(null);
        setActiveFilter(filters[0]);
    };
    
    return (
        <Card className="w-full overflow-hidden shadow-2xl">
            <CardContent className="p-2">
                <div className="relative w-full bg-secondary" style={{ aspectRatio: `${PHOTO_WIDTH + COLLAGE_PADDING * 2}/${(PHOTO_HEIGHT * PHOTO_COUNT) + (COLLAGE_PADDING * (PHOTO_COUNT + 1)) + 80}` }}>
                    {status !== 'review' && (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover rounded-md"
                                style={{ ...activeFilter.style, transform: 'scaleX(-1)' }}
                            />
                             {isFlashing && (
                                <div className="absolute inset-0 bg-white opacity-80 animate-ping" style={{ animationDuration: '150ms' }}></div>
                            )}
                             {status === 'error' && (
                                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4 rounded-md">
                                    <VideoOff className="w-16 h-16 text-destructive mb-4" />
                                    <h3 className="text-xl font-semibold">Camera Error</h3>
                                    <p className="text-center mt-2">{error}</p>
                                </div>
                            )}
                            {status === 'counting' && countdown > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <div className="text-white font-bold text-9xl animate-ping" style={{ animationDuration: '1s' }}>
                                        {countdown}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {status === 'review' && collageUrl && (
                        <div className="printable-area bg-secondary rounded-md flex items-center justify-center h-full">
                            <img src={collageUrl} alt="Photo collage" className="w-auto h-full object-contain" />
                        </div>
                    )}

                    <canvas ref={photoCanvasRef} className="hidden" />
                    <canvas ref={collageCanvasRef} className="hidden" />
                </div>

                {status === 'idle' && (
                    <div className="mt-4">
                        <div className="mb-4">
                            <p className="text-center text-sm font-semibold text-muted-foreground mb-2">Choose a Filter</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {filters.map(filter => (
                                    <Button
                                        key={filter.id}
                                        variant={activeFilter.id === filter.id ? 'default' : 'secondary'}
                                        onClick={() => setActiveFilter(filter)}
                                        className="h-12 text-xs sm:text-sm"
                                    >
                                        {filter.icon}
                                        {filter.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <Button
                            onClick={startCaptureSequence}
                            size="lg"
                            className="w-full h-16 text-lg font-bold"
                            disabled={status !== 'idle'}
                        >
                            <Camera className="w-6 h-6 mr-3" />
                            Start
                        </Button>
                    </div>
                )}
                
                {status === 'review' && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                         <Button
                            onClick={handleReset}
                            variant="secondary"
                            size="lg"
                            className="h-14 text-md"
                        >
                            <RefreshCw className="w-5 h-5 mr-2" />
                            New Photos
                        </Button>
                        <Button
                            onClick={handlePrint}
                            size="lg"
                            className="h-14 text-md bg-accent text-accent-foreground hover:bg-accent/90"
                        >
                            <Printer className="w-5 h-5 mr-2" />
                            Print
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

    