export default function Blobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <div className="absolute w-[380px] h-[380px] -top-20 -right-20 rounded-full bg-[rgba(34,85,40,0.35)] blur-[80px] animate-blob" />
      <div className="absolute w-[280px] h-[280px] bottom-[10%] -left-16 rounded-full bg-[rgba(34,85,40,0.22)] blur-[80px] animate-blob [animation-delay:-4s]" />
      <div className="absolute w-[200px] h-[200px] top-1/2 right-[20%] rounded-full bg-[rgba(74,222,128,0.08)] blur-[80px] animate-blob [animation-delay:-8s]" />
    </div>
  )
}