export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#F56A4D] to-[#f97316] flex items-center justify-center mx-auto animate-pulse">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-muted-foreground">Loading form...</p>
      </div>
    </div>
  );
}
