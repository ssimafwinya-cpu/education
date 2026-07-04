export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-9 w-56" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24" />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="skeleton h-72 lg:col-span-2" />
        <div className="skeleton h-72" />
      </div>
    </div>
  );
}
