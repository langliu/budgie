import { createFileRoute } from '@tanstack/react-router'
import { RegisterForm } from '@/components/register-form'

export const Route = createFileRoute('/register')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <RegisterForm />
      </div>
    </div>
  )
}
