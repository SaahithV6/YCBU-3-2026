import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0a0e14' }}
    >
      <SignIn
        appearance={{
          variables: {
            colorPrimary: '#00d4aa',
            colorBackground: '#1a2235',
            colorText: '#e8e0d0',
            colorInputBackground: '#1a2235',
          },
        }}
      />
    </div>
  )
}
