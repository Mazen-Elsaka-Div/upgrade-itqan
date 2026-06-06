import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message: string
  retry: () => void
  isAr: boolean
}

export function ErrorState({ message, retry, isAr }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
      <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-foreground">
          {isAr ? 'حدث خطأ' : 'An error occurred'}
        </h3>
        <p className="text-muted-foreground max-w-sm text-balance">
          {message}
        </p>
      </div>
      <Button 
        onClick={retry} 
        variant="outline" 
        className="mt-4 active:scale-[0.96] rounded-lg transition-transform"
      >
        <RefreshCw className="w-4 h-4 me-2" />
        {isAr ? 'إعادة المحاولة' : 'Retry'}
      </Button>
    </div>
  )
}
