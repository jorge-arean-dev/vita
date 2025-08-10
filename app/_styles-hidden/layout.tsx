import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Style Guide | Vita',
  description: 'Explore and customize the application\'s visual styles',
}

export default function StylesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {children}
    </div>
  )
}
