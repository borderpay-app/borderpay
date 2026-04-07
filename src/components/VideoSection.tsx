const VideoSection = () => {
  return (
    <section id="video" className="py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">Watch</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            The Border Pay story
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            See how we're solving cross-border payments for businesses on the island of Ireland.
          </p>
        </div>

        <div className="relative rounded-2xl border border-border overflow-hidden shadow-xl bg-background">
          <video
            controls
            playsInline
            preload="metadata"
            className="w-full"
            poster=""
          >
            <source
              src="https://pqjebmtxfmjvdrlvzkla.supabase.co/storage/v1/object/public/email-assets/videos%2Fborderpay-pitch.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
